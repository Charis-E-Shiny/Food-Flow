"""
Export a compact, web-facing slice of REAL prices from
master_aggriculture_dataset.csv for the live UI:

  public/data/market-prices.json

For each commodity present in the dataset we emit the latest per-market
modal price (₹/kg = ₹/quintal ÷ 100), a national modal (mean of markets),
a 7-day trend, and a per-place table that powers the marketplace's
"change place → see that place's price" view. Real data only — no
fabrication; commodities not in the dataset simply aren't included.

Run:  python ml/export_prices.py      (or: npm run ml:export:prices)
"""
from __future__ import annotations
import json, os, datetime as dt
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CSV = os.path.join(ROOT, "master_aggriculture_dataset.csv")
OUT = os.path.join(ROOT, "public", "data", "market-prices.json")
MAX_PLACES = 16


def main():
    df = pd.read_csv(CSV, usecols=["STATE", "district", "Market Name", "Commodity", "Modal_Price", "date"])
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date", "Modal_Price", "Commodity", "Market Name"])
    df = df[df["Modal_Price"] > 0]

    out = {
        "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "source": "master_aggriculture_dataset.csv — Agmarknet-style daily modal prices",
        "unit": "INR/kg",
        "span": {"from": str(df.date.min().date()), "to": str(df.date.max().date())},
        "commodities": {},
    }

    for commodity, sub in df.groupby("Commodity"):
        latest = sub["date"].max()
        # Each market's most-recent modal price.
        sub = sub.sort_values("date")
        last = sub.groupby("Market Name").tail(1)
        last = last.sort_values("date", ascending=False)

        national = round(float(sub[sub.date == latest]["Modal_Price"].mean()) / 100, 1)
        prior = latest - pd.Timedelta(days=7)
        prior_window = sub[(sub.date >= prior - pd.Timedelta(days=1)) & (sub.date <= prior + pd.Timedelta(days=1))]
        prior_mean = float(prior_window["Modal_Price"].mean()) / 100 if len(prior_window) else national
        trend = round((national - prior_mean) / prior_mean * 100, 1) if prior_mean else 0.0

        places = []
        for _, row in last.head(MAX_PLACES).iterrows():
            places.append({
                "state": str(row["STATE"]).title(),
                "market": str(row["Market Name"]),
                "pricePerKg": round(float(row["Modal_Price"]) / 100, 1),
                "date": str(row["date"].date()),
            })
        places.sort(key=lambda p: p["pricePerKg"], reverse=True)

        out["commodities"][str(commodity)] = {
            "latestDate": str(latest.date()),
            "modalPricePerKg": national,
            "trend7dPct": trend,
            "marketCount": int(sub["Market Name"].nunique()),
            "places": places,
        }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(out, open(OUT, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    print(f"Wrote {OUT}")
    for c, v in out["commodities"].items():
        print(f"  {c:8s} ₹{v['modalPricePerKg']}/kg  trend {v['trend7dPct']:+}%  {len(v['places'])} places  ({v['marketCount']} markets)")


if __name__ == "__main__":
    main()
