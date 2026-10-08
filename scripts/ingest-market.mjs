// Market-price ingestion — Agmarknet via the data.gov.in Open Government
// Data (OGD) API ("Variety-wise Daily Market Prices of Commodities",
// resource 9ef84268-d588-465a-a308-a864a43d0070).
//
// Requires a data.gov.in API key:  set DATA_GOV_IN_API_KEY in .env
// Run:  npm run ingest:market
// Output on success: public/data/market.json (normalized records)
// Output on failure: public/data/market-source-status.json (honest status)
//
// This script makes a REAL request and records exactly what happened. It
// never fabricates records. If the host is unreachable or the key is
// missing/invalid, it writes a status file and exits non-zero.

import { mkdirSync, writeFileSync } from "node:fs";

const RESOURCE = "9ef84268-d588-465a-a308-a864a43d0070";
// data.gov.in publishes a public sample key for testing; a registered key
// is recommended for real use.
const KEY = process.env.DATA_GOV_IN_API_KEY || "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b";
const STATE = process.env.MARKET_STATE || "Karnataka";

function normalize(rec) {
  // Map the OGD field names to our schema; coerce numeric prices.
  const num = (v) => {
    const n = Number(String(v).replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : null;
  };
  return {
    state: rec.state,
    district: rec.district,
    market: rec.market,
    commodity: rec.commodity,
    variety: rec.variety ?? null,
    grade: rec.grade ?? null,
    arrivalDate: rec.arrival_date ?? null,
    minPrice: num(rec.min_price), // ₹/quintal as published
    maxPrice: num(rec.max_price),
    modalPrice: num(rec.modal_price),
    unit: "₹/quintal",
  };
}

async function main() {
  mkdirSync("public/data", { recursive: true });
  const url =
    `https://api.data.gov.in/resource/${RESOURCE}` +
    `?api-key=${KEY}&format=json&limit=200&filters%5Bstate.keyword%5D=${encodeURIComponent(STATE)}`;
  const checkedAt = new Date().toISOString();

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 25000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const records = (data.records ?? []).map(normalize);
    if (!records.length) throw new Error("No records returned");
    const out = {
      source: "Agmarknet via data.gov.in (OGD)",
      sourceUrl: "https://data.gov.in/catalog/variety-wise-daily-market-prices-commodities",
      resource: RESOURCE,
      state: STATE,
      retrievedAt: checkedAt,
      count: records.length,
      records,
    };
    writeFileSync("public/data/market.json", JSON.stringify(out, null, 2));
    console.log(`Wrote public/data/market.json — ${records.length} records for ${STATE} @ ${checkedAt}`);
  } catch (e) {
    const status = {
      source: "Agmarknet via data.gov.in (OGD)",
      resource: RESOURCE,
      accessible: false,
      checkedAt,
      error: String(e.message || e),
      note:
        "The data.gov.in API host was not reachable / returned no data from this environment. " +
        "No market records were fabricated. Provide network egress to api.data.gov.in and a valid " +
        "DATA_GOV_IN_API_KEY, then re-run `npm run ingest:market`.",
      requires: ["Outbound HTTPS access to api.data.gov.in", "A registered data.gov.in API key (DATA_GOV_IN_API_KEY)"],
    };
    writeFileSync("public/data/market-source-status.json", JSON.stringify(status, null, 2));
    console.error(`Agmarknet NOT ingested: ${status.error}. Wrote market-source-status.json (no data fabricated).`);
    process.exit(2);
  }
}

main();
