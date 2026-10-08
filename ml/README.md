# FoodFlow — ML pipeline

A **reproducible, leakage-free** short-horizon forecasting pipeline.

## What it does (this run)

Forecasts **next-day maximum temperature** for a mandi location, trained on
**real** historical weather from the [Open-Meteo archive](https://open-meteo.com/).

> **Why weather, not price?** Agricultural spoilage risk depends on near-term
> heat, and weather is the one real time-series reachable from the build
> environment. The **Agmarknet price API (`api.data.gov.in`) is not reachable
> here** (see [`../DATA.md`](../DATA.md)), so no price history could be fetched.
> The pipeline is **data-source agnostic** — point `fetch_series()` at
> Agmarknet modal prices and the identical train → evaluate → persist flow
> produces a price forecaster. **No price/surplus model is claimed as trained.**

## Method

- **Chronological** train/val/test split (70/15/15) — no shuffling, no leakage.
- **Baselines:** persistence (“tomorrow ≈ today”) and day-of-year climatology.
- **Model:** `sklearn.GradientBoostingRegressor` on lag, rolling-mean and
  seasonal (sin/cos day-of-year) features.
- **Metrics:** MAE and RMSE on the held-out **test** split.
- **Artifacts:** `artifacts/model.joblib`, `metrics.json`, `features.json`.

## Run

```bash
pip install pandas numpy scikit-learn joblib
python ml/train.py            # or: npm run ml:train
```

## Actual test-set results (real data, 1,277 days, Kolar)

| Model | MAE (°C) | RMSE (°C) |
|---|---|---|
| Baseline — persistence | 0.940 | 1.198 |
| Baseline — climatology | 1.320 | 1.686 |
| **GradientBoosting** | **0.917** | **1.182** |

GBT improves MAE **2.4%** over persistence and clearly beats climatology.
Persistence is a strong baseline for 1-day temperature, so the gain is modest
and honestly reported — the value is a **validated, reproducible pipeline**, not
an inflated accuracy claim.

## Swapping in Agmarknet (production)

1. Make `api.data.gov.in` reachable and set `DATA_GOV_IN_API_KEY`.
2. Replace `fetch_series()` with a loader over ingested market records
   (`public/data/market.json` from `npm run ingest:market`).
3. Set the target to next-day **modal price** (or arrivals). Re-run.
