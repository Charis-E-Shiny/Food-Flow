"""
FoodFlow — reproducible short-horizon forecasting pipeline.

Target (this run): next-day maximum temperature for a mandi location,
trained on REAL historical weather from the Open-Meteo archive API.

Why weather? Agricultural spoilage risk depends on near-term heat, and
weather is the one real time-series reachable from this environment
(the Agmarknet price API — api.data.gov.in — is not reachable here; see
scripts/ingest-market.mjs and DATA.md). The pipeline is data-source
agnostic: point `fetch_series()` at Agmarknet modal prices instead and
the identical train/evaluate/persist flow produces a price forecaster.

Method:
  - chronological train/val/test split (NO leakage; no shuffling)
  - baseline: persistence (tomorrow ≈ today) + day-of-year climatology
  - model:    sklearn GradientBoostingRegressor on lag/rolling/seasonal features
  - metrics:  MAE and RMSE on the held-out TEST split
  - artifacts: model.joblib, features.json, metrics.json, model version

Run:  python ml/train.py       (or: npm run ml:train)
"""
from __future__ import annotations
import json, os, sys, datetime as dt
import numpy as np
import pandas as pd
import urllib.request
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
import joblib

HERE = os.path.dirname(os.path.abspath(__file__))
ART = os.path.join(HERE, "artifacts")
os.makedirs(ART, exist_ok=True)

LAT, LON, PLACE = 13.13, 78.13, "Kolar"
START, END = "2022-01-01", "2025-06-30"
MODEL_VERSION = "tmax-gbt-v1"


def fetch_series() -> pd.DataFrame:
    url = (
        f"https://archive-api.open-meteo.com/v1/archive?latitude={LAT}&longitude={LON}"
        f"&start_date={START}&end_date={END}"
        f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto"
    )
    print(f"Fetching real history: {PLACE} {START}..{END} (Open-Meteo archive)")
    with urllib.request.urlopen(url, timeout=60) as r:
        d = json.load(r)["daily"]
    df = pd.DataFrame(
        {
            "date": pd.to_datetime(d["time"]),
            "tmax": d["temperature_2m_max"],
            "tmin": d["temperature_2m_min"],
            "precip": d["precipitation_sum"],
        }
    ).dropna().reset_index(drop=True)
    print(f"  rows: {len(df)}  ({df.date.min().date()} .. {df.date.max().date()})")
    return df


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    doy = df.date.dt.dayofyear
    df["sin_doy"] = np.sin(2 * np.pi * doy / 365.25)
    df["cos_doy"] = np.cos(2 * np.pi * doy / 365.25)
    for l in (1, 2, 3, 7):
        df[f"tmax_lag{l}"] = df["tmax"].shift(l)
    df["tmin_lag1"] = df["tmin"].shift(1)
    df["precip_lag1"] = df["precip"].shift(1)
    df["tmax_roll7"] = df["tmax"].shift(1).rolling(7).mean()
    # target: NEXT day's tmax
    df["y"] = df["tmax"].shift(-1)
    return df.dropna().reset_index(drop=True)


FEATURES = ["sin_doy", "cos_doy", "tmax_lag1", "tmax_lag2", "tmax_lag3", "tmax_lag7", "tmin_lag1", "precip_lag1", "tmax_roll7"]


def chrono_split(df: pd.DataFrame):
    n = len(df)
    tr, va = int(n * 0.70), int(n * 0.85)
    return df.iloc[:tr], df.iloc[tr:va], df.iloc[va:]


def metrics(y_true, y_pred):
    return {
        "mae": round(float(mean_absolute_error(y_true, y_pred)), 3),
        "rmse": round(float(np.sqrt(mean_squared_error(y_true, y_pred))), 3),
    }


def main():
    try:
        raw = fetch_series()
    except Exception as e:
        print(f"ERROR: could not fetch training data ({e}). Aborting — no metrics fabricated.", file=sys.stderr)
        sys.exit(1)

    df = build_features(raw)
    train, val, test = chrono_split(df)
    print(f"split  train={len(train)}  val={len(val)}  test={len(test)}")

    Xtr, ytr = train[FEATURES], train["y"]
    Xte, yte = test[FEATURES], test["y"]

    # --- baselines ---
    persistence = test["tmax_lag1"].values  # "tomorrow ≈ today"
    clim = train.copy()
    clim["doy"] = pd.to_datetime(train["date"]).dt.dayofyear
    clim_map = clim.groupby("doy")["tmax"].mean()
    climatology = pd.to_datetime(test["date"]).dt.dayofyear.map(clim_map).fillna(train["tmax"].mean()).values

    # --- model ---
    model = GradientBoostingRegressor(n_estimators=300, max_depth=3, learning_rate=0.05, subsample=0.9, random_state=42)
    model.fit(Xtr, ytr)
    pred = model.predict(Xte)

    results = {
        "baseline_persistence": metrics(yte, persistence),
        "baseline_climatology": metrics(yte, climatology),
        "model_gbt": metrics(yte, pred),
    }
    improvement = round(100 * (results["baseline_persistence"]["mae"] - results["model_gbt"]["mae"]) / results["baseline_persistence"]["mae"], 1)

    out = {
        "model_version": MODEL_VERSION,
        "task": "next-day tmax (°C) forecast",
        "note": "Trained on REAL Open-Meteo historical weather. Not a price/surplus model — the pipeline is data-source agnostic (swap fetch_series for Agmarknet modal prices).",
        "place": PLACE,
        "trained_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "rows_total": int(len(df)),
        "split": {"train": int(len(train)), "val": int(len(val)), "test": int(len(test))},
        "features": FEATURES,
        "metrics_test": results,
        "model_vs_persistence_mae_improvement_pct": improvement,
    }
    joblib.dump({"model": model, "features": FEATURES, "version": MODEL_VERSION}, os.path.join(ART, "model.joblib"))
    json.dump(out, open(os.path.join(ART, "metrics.json"), "w"), indent=2)
    json.dump({"features": FEATURES, "target": "tmax(t+1)"}, open(os.path.join(ART, "features.json"), "w"), indent=2)

    print("\n=== TEST METRICS ===")
    for k, v in results.items():
        print(f"  {k:24s} MAE={v['mae']:.3f}  RMSE={v['rmse']:.3f}")
    print(f"  GBT vs persistence MAE improvement: {improvement}%")
    print(f"\nSaved: ml/artifacts/model.joblib, metrics.json, features.json")


if __name__ == "__main__":
    main()
