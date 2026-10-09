// Real weather ingestion — Open-Meteo (free, no key, CORS-enabled).
// Fetches current conditions + a short daily forecast for every mandi
// location and writes a normalized snapshot with full provenance.
//
// Run:  npm run ingest:weather
// Output: public/data/weather.json  (loaded by the app at runtime)
//
// Source: https://open-meteo.com/  (NOT IMD; labeled accordingly in UI)

import { mkdirSync, writeFileSync } from "node:fs";

const LOCATIONS = [
  { id: "sf-kolar-tomato", name: "Kolar", lat: 13.13, lon: 78.13 },
  { id: "sf-nashik-onion", name: "Nashik", lat: 20.0, lon: 73.78 },
  { id: "sf-agra-potato", name: "Agra", lat: 27.18, lon: 78.01 },
  { id: "sf-hooghly-potato", name: "Hooghly", lat: 22.9, lon: 88.0 },
  { id: "sf-jalandhar-potato", name: "Jalandhar", lat: 31.33, lon: 75.58 },
  { id: "sf-guntur-cabbage", name: "Guntur", lat: 16.31, lon: 80.45 },
  { id: "sf-nagpur-mango", name: "Nagpur", lat: 21.15, lon: 79.09 },
  { id: "sf-anand-banana", name: "Anand", lat: 22.56, lon: 72.96 },
  { id: "sf-shimla-apple", name: "Shimla", lat: 31.1, lon: 77.17 },
  { id: "sf-sangli-grapes", name: "Sangli", lat: 16.85, lon: 74.57 },
  { id: "sf-kurnool-chilli", name: "Kurnool", lat: 15.83, lon: 78.04 },
  { id: "sf-pune-cauliflower", name: "Pune", lat: 18.52, lon: 73.86 },
  { id: "sf-indore-peas", name: "Indore", lat: 22.72, lon: 75.86 },
  { id: "sf-solapur-pomegranate", name: "Solapur", lat: 17.66, lon: 75.9 },
];

const BASE = "https://api.open-meteo.com/v1/forecast";

async function fetchOne(loc) {
  const url =
    `${BASE}?latitude=${loc.lat}&longitude=${loc.lon}` +
    `&current=temperature_2m,relative_humidity_2m` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&forecast_days=5&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${loc.name}: HTTP ${res.status}`);
  const d = await res.json();
  return {
    id: loc.id,
    name: loc.name,
    lat: loc.lat,
    lon: loc.lon,
    observedAt: d.current?.time ?? null,
    current: {
      tempC: d.current?.temperature_2m ?? null,
      humidity: d.current?.relative_humidity_2m ?? null,
    },
    forecast: (d.daily?.time ?? []).map((date, i) => ({
      date,
      tmax: d.daily.temperature_2m_max[i],
      tmin: d.daily.temperature_2m_min[i],
      precipMm: d.daily.precipitation_sum[i],
    })),
  };
}

async function main() {
  mkdirSync("public/data", { recursive: true });
  const out = { source: "Open-Meteo", sourceUrl: "https://open-meteo.com", kind: "forecast", retrievedAt: new Date().toISOString(), note: "Live weather forecast. Open-Meteo is not IMD; labeled accordingly in the UI.", locations: [] };
  let ok = 0;
  for (const loc of LOCATIONS) {
    try {
      out.locations.push(await fetchOne(loc));
      ok++;
      process.stdout.write(`  ✓ ${loc.name}\n`);
    } catch (e) {
      process.stdout.write(`  ✗ ${loc.name} — ${e.message}\n`);
    }
    await new Promise((r) => setTimeout(r, 250)); // be polite to the API
  }
  writeFileSync("public/data/weather.json", JSON.stringify(out, null, 2));
  console.log(`\nWrote public/data/weather.json — ${ok}/${LOCATIONS.length} locations @ ${out.retrievedAt}`);
  if (ok === 0) process.exit(1);
}

main();
