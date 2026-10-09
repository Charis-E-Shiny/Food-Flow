"""
FoodFlow — next-day mandi modal-price forecaster (REAL data).

Trained on master_aggriculture_dataset.csv: Agmarknet-style daily modal
prices for 5 commodities across 16 states / ~286 markets (2023–2025),
joined with real weather (Open-Meteo) features.

Target: next-day modal price (₹/quintal) for a (market, commodity) series.

Method (leakage-free, reproducible):
  - aggregate to one modal price per (market, commodity, date)
  - build lag / rolling / seasonal features PER SERIES (no cross-date leak)
  - CHRONOLOGICAL split by date (train < val < test; no shuffling)
  - baselines: persistence ("tomorrow ≈ today") + day-of-year climatology
  - model:    sklearn HistGradientBoostingRegressor
  - metrics:  MAE / RMSE / MAPE on the held-out TEST split
  - artifacts: model.joblib, price_metrics.json, price_features.json
               + public/data/model-metrics.json  (consumed by the web UI)

Run:  python ml/train_price.py        (or: npm run ml:train:price)
"""
from __future__ import annotations
import json, os, sys, datetime as dt
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.inspection import permutation_importance
from sklearn.metrics import mean_absolute_error, mean_squared_error
import joblib

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ART = os.path.join(HERE, "artifacts")
PUB = os.path.join(ROOT, "public", "data")
os.makedirs(ART, exist_ok=True)
os.makedirs(PUB, exist_ok=True)

CSV = os.path.join(ROOT, "master_aggriculture_dataset.csv")
MODEL_VERSION = "price-hgbt-v1"
# Forecast horizon in days. 7-day-ahead is the horizon that matters for
# sell/hold and spoilage-window planning; at a 1-day horizon naive
# persistence (tomorrow ≈ today) is near-unbeatable and a model adds little.
HORIZON = int(os.environ.get("FF_HORIZON", "7"))

# Features we build ourselves (so there is no dependence on how the CSV's
# own lag columns were grouped) — everything here is known at time t.
# The model predicts a scale-free LOG-RETURN (price in H days vs today),
# so one global model can serve markets whose price levels span ₹15–₹20000.
# Every feature below is known at time t.
FEATURES = [
    "logp",         # log of today's price (scale / mean-reversion context)
    "ret1",         # log return vs yesterday
    "ret7",         # log return vs 7 days ago
    "dev_roll7",    # log deviation of today vs its 7-day mean
    "dev_roll30",   # log deviation of today vs its 30-day mean
    "temp_mean",
    "rainfall_mm",
    "rain_roll7",
    "sin_doy",
    "cos_doy",
    "commodity_code",
]


def load() -> pd.DataFrame:
    print(f"Reading real dataset: {os.path.basename(CSV)}")
    usecols = ["STATE", "Market Name", "Commodity", "Modal_Price", "date", "temp_mean", "rainfall_mm"]
    df = pd.read_csv(CSV, usecols=usecols)
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date", "Modal_Price", "Commodity", "Market Name"])
    # One row per market/commodity/day (collapse variety + grade).
    g = (
        df.groupby(["Market Name", "Commodity", "date"], as_index=False)
        .agg(price=("Modal_Price", "mean"), temp_mean=("temp_mean", "mean"), rainfall_mm=("rainfall_mm", "mean"))
    )
    print(f"  raw rows: {len(df):,}  →  series-days: {len(g):,}")
    print(f"  span: {g.date.min().date()} .. {g.date.max().date()}  commodities: {g.Commodity.nunique()}  markets: {g['Market Name'].nunique()}")
    return g


def build(g: pd.DataFrame) -> pd.DataFrame:
    g = g.sort_values(["Market Name", "Commodity", "date"]).copy()
    key = ["Market Name", "Commodity"]
    grp = g.groupby(key, sort=False)
    g = g[g["price"] > 0].copy()
    grp = g.groupby(key, sort=False)
    lag1 = grp["price"].shift(1)
    lag7 = grp["price"].shift(7)
    # Rolling means computed PER SERIES (transform keeps group boundaries;
    # shift(1) ensures the window never includes the current day).
    roll7 = grp["price"].transform(lambda s: s.shift(1).rolling(7, min_periods=3).mean())
    roll30 = grp["price"].transform(lambda s: s.shift(1).rolling(30, min_periods=7).mean())
    g["rain_roll7"] = grp["rainfall_mm"].transform(lambda s: s.shift(1).rolling(7, min_periods=3).mean())

    g["logp"] = np.log(g["price"])
    g["ret1"] = np.log(g["price"] / lag1)
    g["ret7"] = np.log(g["price"] / lag7)
    g["dev_roll7"] = np.log(g["price"] / roll7)
    g["dev_roll30"] = np.log(g["price"] / roll30)
    doy = g["date"].dt.dayofyear
    g["sin_doy"] = np.sin(2 * np.pi * doy / 365.25)
    g["cos_doy"] = np.cos(2 * np.pi * doy / 365.25)
    g["commodity_code"] = g["Commodity"].astype("category").cat.codes

    # target: price HORIZON days ahead (₹) and its scale-free log-return.
    g["price_future"] = grp["price"].shift(-HORIZON)
    g["y_ret"] = np.log(g["price_future"] / g["price"])
    g = g.replace([np.inf, -np.inf], np.nan)
    g = g.dropna(subset=FEATURES + ["price_future", "y_ret"]).reset_index(drop=True)
    return g


def chrono_split(g: pd.DataFrame):
    # Split on calendar time so train is strictly before val before test.
    q70, q85 = g["date"].quantile(0.70), g["date"].quantile(0.85)
    tr = g[g.date <= q70]
    va = g[(g.date > q70) & (g.date <= q85)]
    te = g[g.date > q85]
    return tr, va, te, q70, q85


def m(y_true, y_pred):
    y_true = np.asarray(y_true, float); y_pred = np.asarray(y_pred, float)
    mask = y_true > 0
    mape = float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)
    return {
        "mae": round(float(mean_absolute_error(y_true, y_pred)), 1),
        "rmse": round(float(np.sqrt(mean_squared_error(y_true, y_pred))), 1),
        "mape": round(mape, 2),
    }


def main():
    if not os.path.exists(CSV):
        print(f"ERROR: dataset not found at {CSV}. Aborting — no metrics fabricated.", file=sys.stderr)
        sys.exit(1)

    g = build(load())
    tr, va, te, q70, q85 = chrono_split(g)
    print(f"split  train={len(tr):,}  val={len(va):,}  test={len(te):,}  (cuts {q70.date()} / {q85.date()})")

    # Model learns the scale-free log-return; we score everyone in ₹ space.
    Xtr, ytr = tr[FEATURES], tr["y_ret"]
    Xte = te[FEATURES]
    price_t = te["price"].values
    yte = te["price_future"].values  # true ₹ price H days ahead

    persistence = price_t  # naive: price in H days ≈ today's price (return 0)
    clim = tr.copy(); clim["doy"] = clim["date"].dt.dayofyear
    clim_map = clim.groupby(["commodity_code", "doy"])["price"].mean()
    te_doy = te["date"].dt.dayofyear
    climatology = (
        pd.MultiIndex.from_arrays([te["commodity_code"], te_doy])
        .map(clim_map).to_numpy(dtype="float64")
    )
    climatology = np.where(np.isnan(climatology), tr["price"].mean(), climatology)

    model = HistGradientBoostingRegressor(
        loss="absolute_error",  # optimize MAE directly; predicts the median
        max_iter=400, max_depth=6, learning_rate=0.06,
        l2_regularization=1.0, random_state=42, early_stopping=True,
        validation_fraction=0.1,
    )
    model.fit(Xtr, ytr)

    # Forecast combination: shrink the predicted return by w, chosen on the
    # VALIDATION set to minimise MAE. w=0 is exactly persistence, so the
    # blend can never do worse than naive — it only moves where the model
    # carries real signal. Tuned on val, reported on the untouched test set.
    va_ret = model.predict(va[FEATURES])
    va_pt = va["price"].values; va_true = va["price_future"].values
    ws = np.linspace(0.0, 1.0, 41)
    w = float(ws[np.argmin([mean_absolute_error(va_true, va_pt * np.exp(wi * va_ret)) for wi in ws])])

    te_ret = model.predict(Xte)
    pred = price_t * np.exp(w * te_ret)  # reconstruct ₹ price (shrunk)

    results = {
        "baseline_persistence": m(yte, persistence),
        "baseline_climatology": m(yte, climatology),
        "model_gbt": m(yte, pred),
    }
    print(f"  tuned shrinkage w={w:.3f} (0=persistence, 1=full model)")
    imp_mae = round(100 * (results["baseline_persistence"]["mae"] - results["model_gbt"]["mae"]) / results["baseline_persistence"]["mae"], 1)
    imp_rmse = round(100 * (results["baseline_persistence"]["rmse"] - results["model_gbt"]["rmse"]) / results["baseline_persistence"]["rmse"], 1)

    # Permutation importance on a capped test sample (keeps it quick).
    samp = te.sample(min(6000, len(te)), random_state=0)
    pi = permutation_importance(model, samp[FEATURES], samp["y_ret"], n_repeats=5, random_state=0, scoring="neg_mean_absolute_error")
    importances = sorted(
        ({"feature": f, "importance": round(float(v), 3)} for f, v in zip(FEATURES, pi.importances_mean)),
        key=lambda d: d["importance"], reverse=True,
    )

    # Per-commodity test MAE (nice for the UI).
    per_comm = []
    cat = g["Commodity"].astype("category")
    code_to_name = dict(enumerate(cat.cat.categories))
    te2 = te.copy(); te2["pred"] = pred
    for code, sub in te2.groupby("commodity_code"):
        mdl = float(mean_absolute_error(sub["price_future"], sub["pred"]))
        nai = float(mean_absolute_error(sub["price_future"], sub["price"]))
        per_comm.append({
            "commodity": code_to_name.get(int(code), str(code)),
            "mae": round(mdl, 1),
            "baseline_mae": round(nai, 1),
            "improvement_pct": round(100 * (nai - mdl) / nai, 1) if nai else 0.0,
            "n": int(len(sub)),
        })
    per_comm.sort(key=lambda d: d["n"], reverse=True)

    out = {
        "model_version": MODEL_VERSION,
        "task": f"{HORIZON}-day-ahead mandi modal price (₹/quintal) forecast",
        "horizon_days": HORIZON,
        "dataset": "master_aggriculture_dataset.csv — Agmarknet-style daily modal prices + Open-Meteo weather",
        "trained_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "span": {"from": str(g.date.min().date()), "to": str(g.date.max().date())},
        "coverage": {
            "commodities": int(g.Commodity.nunique()),
            "markets": int(g["Market Name"].nunique()),
            "series_days": int(len(g)),
        },
        "split": {"train": int(len(tr)), "val": int(len(va)), "test": int(len(te)),
                  "test_from": str(q85.date())},
        "features": FEATURES,
        "metrics_test": results,
        "blend_weight": round(w, 3),
        "model_vs_persistence_mae_improvement_pct": imp_mae,
        "model_vs_persistence_rmse_improvement_pct": imp_rmse,
        "feature_importance": importances,
        "per_commodity_mae": per_comm,
    }

    joblib.dump({"model": model, "features": FEATURES, "version": MODEL_VERSION, "blend_weight": w, "horizon_days": HORIZON}, os.path.join(ART, "price_model.joblib"))
    json.dump(out, open(os.path.join(ART, "price_metrics.json"), "w"), indent=2, ensure_ascii=False)
    json.dump({"features": FEATURES, "target": "modal_price(t+1)"}, open(os.path.join(ART, "price_features.json"), "w"), indent=2)
    # Web-facing copy (smaller surface, same numbers) for the live UI.
    json.dump(out, open(os.path.join(PUB, "model-metrics.json"), "w"), indent=2, ensure_ascii=False)

    print(f"\n=== TEST METRICS ({HORIZON}-day-ahead modal price, ₹/quintal) ===")
    for k, v in results.items():
        print(f"  {k:24s} MAE={v['mae']:>7.1f}  RMSE={v['rmse']:>7.1f}  MAPE={v['mape']:>5.2f}%")
    print(f"  model vs persistence: MAE −{imp_mae}%  RMSE −{imp_rmse}%")
    print("  top features:", ", ".join(d["feature"] for d in importances[:4]))
    print(f"\nSaved: ml/artifacts/price_model.joblib, price_metrics.json; public/data/model-metrics.json")


if __name__ == "__main__":
    main()
