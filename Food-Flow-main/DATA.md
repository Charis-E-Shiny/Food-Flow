# Data provenance, integrations & limitations

This document records exactly which data sources were **tested**, what works,
what doesn't, and how to reproduce every integration. It is the honest ledger
for the move from prototype to a real data-backed system.

> **Principle:** nothing here is fabricated. A source is called "integrated"
> only when a real request succeeded and the returned data was validated.

---

## Summary

| Source | Purpose | Status | Key required | Reachable in build env |
|---|---|---|---|---|
| **Open-Meteo** (forecast + archive) | Weather observations & forecast | ✅ **Integrated & tested** | No | Yes |
| **Agmarknet** via `data.gov.in` OGD API | Mandi modal/min/max prices & arrivals | ⚠️ **Connector built, NOT reachable here** | Yes (`DATA_GOV_IN_API_KEY`) | **No** (`api.data.gov.in` → connection failed) |
| **IMD** official API | Official weather | ❌ Not openly accessible | — | — |

---

## 1. Weather — Open-Meteo ✅ (real, tested)

- **Endpoints:** `api.open-meteo.com/v1/forecast`, `archive-api.open-meteo.com/v1/archive`
- **Tested:** returned HTTP 200 with real data for all 14 mandi locations
  (e.g. Kolar live current temperature + 5-day max/min/precipitation forecast).
- **Licence:** free, no key, attribution requested. **This is not IMD** — the UI
  labels the source as "Open-Meteo", never as IMD or as an official observation.
- **Ingestion:** `npm run ingest:weather` → `public/data/weather.json`
  (normalized, with `source`, `retrievedAt`, per-location `observedAt`).
- **In the UI:** the event page's **Weather** panel shows this with a `Live`
  badge, the source, and a "N ago" freshness label; it marks the snapshot
  **stale** past 6h and **falls back to the demo temperature (labeled Demo)**
  if the file is missing — never showing demo data under a Live label.

## 2. Market prices — Agmarknet / data.gov.in ⚠️ (connector built, inaccessible here)

- **Resource:** `9ef84268-d588-465a-a308-a864a43d0070`
  ("Variety-wise Daily Market Prices of Commodities").
- **Re-tested (deep diagnosis):** DNS **resolves** (`api.data.gov.in` →
  `164.100.61.198`), but the **TCP connection to port 443 is actively refused**:
  - `curl`: *"Failed to connect to api.data.gov.in port 443 … Could not connect to server"*
  - `python urllib`: *"WinError 10061 … the target machine actively refused it"*
  - General egress is fine (Open-Meteo succeeds over HTTPS), so this is
    **host-specific network blocking** from this build environment — not an
    auth error and not bypassable here. No workaround was fabricated.
- **No market data was fabricated.** `npm run ingest:market` makes a real
  request and, on failure, writes `public/data/market-source-status.json`
  documenting the error — it never writes invented records.
- **Connector interface** (`scripts/ingest-market.mjs` + `src/lib/normalize.ts`)
  is complete and unit-tested: it maps OGD fields → our schema, converts
  **₹/quintal → ₹/kg**, parses dirty numerics, and normalizes `DD/MM/YYYY` → ISO.
- **To make it live:** on a machine with egress to `api.data.gov.in`, set
  `DATA_GOV_IN_API_KEY` (register at data.gov.in) and run `npm run ingest:market`.
  The app's market-intelligence panel is explicitly labeled **Demo** until then.

## 3. IMD ❌

IMD does not publish a clean, openly accessible API for programmatic use.
Open-Meteo is used as the real, accessible weather source instead, and is
labeled as such. An IMD connector can be added behind the same interface if
access is provisioned.

---

## ML pipeline (real, reproducible)

See [`ml/README.md`](ml/README.md). Two trained models, both on real data.

### Price model — `master_aggriculture_dataset.csv` (real, trained)

A **7-day-ahead mandi modal-price forecaster** trained on a real Agmarknet-style
dataset joined with Open-Meteo weather: **654k market-days, 1,377 markets, 5
commodities** (Onion & Potato dominate; Rice/Tomato/Wheat partial), 2023-06 →
2025-06. Leakage-free: per-series lag/rolling/seasonal features, **chronological**
70/15/15 split, scale-free **log-return** target + validation-tuned shrinkage
blend. Held-out test (`price-hgbt-v1`):

| Model | MAE (₹/qtl) | RMSE (₹/qtl) | MAPE |
|---|---|---|---|
| persistence baseline | **170** | 419 | **10.2%** |
| climatology baseline | 906 | 1,394 | 54.6% |
| **FoodFlow model** | 187 | **376** | 11.7% |

The model beats persistence by **~10% RMSE** and climatology by **~73% RMSE** (the
large swings that drive surplus/waste); naive persistence still wins typical-day
MAE and that is reported plainly, not hidden. Metrics render live on the Impact
page from `public/data/model-metrics.json`.

> The 200 MB+ source CSV is **not committed** (exceeds GitHub limits); the trained
> model's metrics are. Reproduce: `npm run ml:train:price`.

### Weather model — Open-Meteo (real, trained)

Next-day `tmax` forecast as a spoilage proxy. Test-set metrics (1,277 days, Kolar,
chronological split):

| Model | MAE (°C) | RMSE (°C) |
|---|---|---|
| persistence baseline | 0.940 | 1.198 |
| climatology baseline | 1.320 | 1.686 |
| GradientBoosting | **0.917** | **1.182** |

Run: `npm run ml:train` → `ml/artifacts/{model.joblib,metrics.json,features.json}`.

---

## Operational surplus target (definition & data requirements)

**Definition.** For a (location, crop, horizon *h*):

```
Surplus(h) = max(0,  PredictedArrivals(h) − AbsorptiveDemand(h))
```

the tonnage expected at mandis within *h* that local + contracted demand cannot
absorb at a non-distress price.

**Can public data support a supervised model?** Investigated — **not fully:**

| Component | Source | Status |
|---|---|---|
| `PredictedArrivals(h)` | Agmarknet **daily arrivals** per mandi×commodity | forecastable **if the feed is reachable** (it isn't here) |
| `AbsorptiveDemand(h)` | no direct feed | only a **proxy** (cleared volume at ≥ threshold price, or processor/retail intake) |
| **Ground-truth surplus/waste labels** | — | **not publicly available** |

**Conclusion:** a supervised surplus model **cannot** be honestly trained from
public data (no labels). FoodFlow therefore uses a **transparent heuristic**
(`calculateSurplusRisk` = sum of explainable factor contributions from arrivals,
demand, temperature, usable window, local capacity), clearly labeled **Estimate**
in the UI (`provenance: heuristic`). To train & validate a supervised surplus
model later, the following additional data is required:

1. Daily mandi **arrivals** (Agmarknet) — for the arrivals forecast.
2. A **demand/offtake proxy** — cleared volume at non-distress price, or
   processor/retail contracted intake.
3. **Ground-truth labels** — FPO/APMC unsold-lot tonnage, cold-storage
   rejections, or reported per-lot post-harvest loss.
4. Linking keys: `mandi × commodity × date` across all three.

## Allocation optimizer — evaluation (item 5)

Benchmarked against **two** baselines across 7 scenarios (varied supply,
capacity, distance, price, spoilage window) in
`src/lib/__tests__/allocator-bench.test.ts` (`npm run test`):

- **Baseline A — nearest-feasible** (distance-only): fill the closest
  destination with capacity first.
- **Baseline B — greedy-value** (static per-tonne value, no diminishing returns).
- **Optimizer** — marginal-value water-filling (concave objective).

**Verified for every strategy & scenario:** 0 capacity violations, quantity
conservation holds, `allocatedT = min(supply, Σ capacity)`. Reported per
scenario: objective value, residual supply (unplaced food) and unfilled
capacity (unmet demand headroom).

**Actual results (objective = expected realized value net of transport & spoilage):**

| Scenario | nearest | greedy-value | optimizer | opt vs best baseline |
|---|--:|--:|--:|--:|
| canonical (Kolar) | 141,988 | 141,988 | 141,988 | 0% |
| near-low-value vs far-high-value | 82,557 | 100,881 | **100,881** | **+22% vs nearest** |
| tight spoilage window | 103,734 | 103,734 | **104,163** | +0.4% |
| supply ≪ capacity | 46,760 | 46,760 | 46,770 | ~0% |

**Honest reading:** the optimizer is **provably ≥ both baselines** in every
scenario (globally optimal for the concave objective). It is **materially better
than the naive nearest-feasible baseline** when value and distance conflict
(+22%), and **comparable to greedy-value** for these separable cases (the
diminishing-returns effect only binds modestly at these capacity scales). No
superiority is claimed beyond what the benchmark shows.

## Surplus is NOT price, and predicted surplus is NOT verified waste

- The **price forecast** (simulated here) and **surplus** are different problems.
- There are **no public labels for actual food waste / realized surplus**, so a
  supervised surplus model cannot honestly be trained. FoodFlow therefore uses a
  **transparent heuristic surplus-risk estimator** (`calculateSurplusRisk`,
  `calculateSpoilageRisk`) from arrivals/demand/temperature/window signals,
  labeled as an estimate — not presented as measured waste.
- The UI distinguishes **Live / Historical / Model / Estimate / Demo**
  (`src/lib/provenance.ts`).

---

## Allocation optimizer (real)

`src/lib/optimizer.ts` replaces greedy-by-score with **marginal-value
water-filling** over a separable **concave** objective (expected realized value
net of transport & spoilage, with diminishing returns to model the glut
effect) — globally optimal for that objective. Hard constraints: capacity and
quantity conservation (no double-allocation). Verified by tests
(`src/lib/__tests__/optimizer.test.ts`) and compared against the greedy
baseline on the Optimize page. It is labeled **experimental** and **not**
asserted to be operationally executable until capacity/transport/acceptance
are verified.

---

## Environment variables

| Var | Used by | Notes |
|---|---|---|
| `VITE_MAPTILER_KEY` | client map tiles | optional; CARTO works without it |
| `DATA_GOV_IN_API_KEY` | `npm run ingest:market` | server-side only; register at data.gov.in |
| `MARKET_STATE` | `npm run ingest:market` | default `Karnataka` |

---

## Commands

```bash
npm run ingest:weather   # real Open-Meteo → public/data/weather.json
npm run ingest:market    # Agmarknet (needs reachable API + key); honest status on failure
npm run ml:train         # real training on Open-Meteo history → ml/artifacts/
npm run test             # vitest: normalization, optimizer constraints, engine invariants
npm run build            # tsc -b + vite build
```

## Remaining mock / heuristic / inaccessible

- **Mandi prices & arrivals** — simulated (`src/data/market.ts`), labeled Demo
  (Agmarknet unreachable here).
- **Surplus risk** — transparent heuristic, labeled Estimate.
- **Traceability ledger & QR** — in-memory/deterministic; no real persistence or
  blockchain (and never described as a blockchain transaction).
- **Impact figures** — computed from the scenario with disclosed assumptions
  (meals ≈ 0.4 kg edible/meal; emissions ≈ 2.6 tCO₂e/t loss avoided; farmer
  value = realized minus distress). Demo scenario, clearly marked.
