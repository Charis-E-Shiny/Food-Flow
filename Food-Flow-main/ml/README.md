# FoodFlow — ML pipeline

A **reproducible, leakage-free** short-horizon forecasting pipeline. Two trained
models live here:

| Script | Target | Data | Run |
|---|---|---|---|
| [`train_price.py`](train_price.py) | **7-day-ahead mandi modal price** (₹/quintal) | `master_aggriculture_dataset.csv` — real Agmarknet-style prices + Open-Meteo weather | `npm run ml:train:price` |
| [`train.py`](train.py) | next-day max temperature (spoilage proxy) | real Open-Meteo archive | `npm run ml:train` |

---

## Price model (`train_price.py`) — trained on the real dataset

Forecasts the **modal price 7 days out** for a `(market, commodity)` series — the
horizon that matters for sell/hold and spoilage-window decisions.

- **Data:** `master_aggriculture_dataset.csv` (not committed — 200 MB+; see
  [`../DATA.md`](../DATA.md)). 654k market-days, **1,377 markets, 5 commodities**
  (Onion & Potato dominate; Rice/Tomato/Wheat partial), 2023-06 → 2025-06.
- **Leakage control:** one price per market/commodity/day; lag, rolling and
  seasonal features built **per series**; **chronological** 70/15/15 split (train
  strictly before test).
- **Scale-free modelling:** the model predicts a **log-return** (price in 7 days
  vs today), so one global model serves markets spanning ₹15–₹20,000; predictions
  are reconstructed to ₹ and scored in ₹.
- **Model:** `HistGradientBoostingRegressor` (`absolute_error` loss), plus a
  **forecast-combination shrinkage** `w` tuned on validation (`w=0` ≡ persistence,
  so the blend can never do worse than naive).
- **Baselines:** naive **persistence** (price in 7d ≈ today) and day-of-year
  **climatology**.

### Actual held-out test results (`price-hgbt-v1`)

| Model | MAE (₹/qtl) | RMSE (₹/qtl) | MAPE |
|---|---|---|---|
| Baseline — persistence | **170** | 419 | **10.2%** |
| Baseline — climatology | 906 | 1,394 | 54.6% |
| **FoodFlow model** | 187 | **376** | 11.7% |

The model's genuine win is on **RMSE: −10% vs persistence and −73% vs
climatology** — it anticipates the large gluts/crashes that drive surplus and
waste, which is exactly FoodFlow's use case. On typical-day **MAE**, 7-day
persistence is a strong baseline and we **report that honestly** rather than
cherry-pick. These numbers are rendered live on the in-app **Impact** page from
`public/data/model-metrics.json`.

---

## Weather model (`train.py`)

Forecasts **next-day maximum temperature** for a mandi location, trained on
**real** historical weather from the [Open-Meteo archive](https://open-meteo.com/).

> **Why also weather?** Agricultural spoilage risk depends on near-term heat, so
> a short-horizon temperature forecast complements the price model. This was the
> first real time-series reachable from the build environment, before the price
> dataset was added.

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
