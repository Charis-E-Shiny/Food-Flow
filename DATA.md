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
- **Tested from this environment:** `GET api.data.gov.in/...` → **HTTP 000
  (connection failed)**. `data.gov.in` (the website) resolves, but the **API
  host `api.data.gov.in` is not reachable** from the build environment.
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

See [`ml/README.md`](ml/README.md). Because Agmarknet history is unreachable
here, the pipeline is demonstrated on **real Open-Meteo history** (next-day
`tmax` forecast). It is **data-source agnostic** — swap `fetch_series()` for
Agmarknet modal prices to get a price forecaster. **No price/surplus model is
claimed as trained.**

**Actual test-set metrics** (1,277 days, Kolar, chronological split):

| Model | MAE (°C) | RMSE (°C) |
|---|---|---|
| persistence baseline | 0.940 | 1.198 |
| climatology baseline | 1.320 | 1.686 |
| GradientBoosting | **0.917** | **1.182** |

Run: `npm run ml:train` → `ml/artifacts/{model.joblib,metrics.json,features.json}`.

---

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
