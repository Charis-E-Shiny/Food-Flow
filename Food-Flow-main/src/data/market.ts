import type { SurplusForecast } from "@/types";

// ============================================================
// Market-intelligence layer (Agmarknet-style, simulated).
// Deterministic per forecast via a seeded PRNG — the same event
// always yields the same series (no Math.random at call time).
// Models: historical modal price, price forecast + confidence band,
// mandi arrivals trend, volatility, anomaly detection, nearby-market
// comparison and a seasonality read.
//
// ⚠ Illustrative. In production these come from the Agmarknet feed
// + an ML forecaster; here they are generated to demonstrate the UI.
// ============================================================

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Real nearby mandi towns per producing region (adds authenticity).
export const NEARBY: Record<string, string[]> = {
  Kolar: ["Chintamani", "Mulbagal", "Srinivaspur", "KGF"],
  Nashik: ["Lasalgaon", "Pimpalgaon", "Yeola", "Manmad"],
  Agra: ["Firozabad", "Mathura", "Etmadpur", "Fatehabad"],
  Hooghly: ["Tarakeswar", "Singur", "Arambagh", "Dhaniakhali"],
  Jalandhar: ["Phillaur", "Nakodar", "Kapurthala", "Nurmahal"],
  Guntur: ["Tenali", "Mangalagiri", "Sattenapalli", "Narasaraopet"],
  Nagpur: ["Kalmeshwar", "Katol", "Saoner", "Umred"],
  Anand: ["Nadiad", "Petlad", "Borsad", "Khambhat"],
  Shimla: ["Theog", "Rohru", "Kotkhai", "Narkanda"],
  Sangli: ["Tasgaon", "Miraj", "Palus", "Kavathe"],
  Kurnool: ["Nandyal", "Adoni", "Yemmiganur", "Dhone"],
  Pune: ["Khed", "Junnar", "Manchar", "Shirur"],
  Indore: ["Mhow", "Depalpur", "Sanwer", "Dewas"],
  Solapur: ["Pandharpur", "Barshi", "Akkalkot", "Mangalvedha"],
};

export interface PricePoint {
  label: string;
  price: number | null; // historical modal ₹/kg
  fc: number | null; // forecast mean
  lo: number | null;
  hi: number | null;
}
export interface ArrivalPoint {
  label: string;
  t: number;
}
export interface NearbyMarket {
  name: string;
  price: number;
  delta: number;
}
export interface MarketSeries {
  price: PricePoint[];
  arrivals: ArrivalPoint[];
  todayPrice: number;
  volatility: number; // 0–100
  anomaly: { flag: boolean; label: string };
  nearby: NearbyMarket[];
  seasonality: string;
  forecastDirection: "up" | "down" | "flat";
}

const cache = new Map<string, MarketSeries>();

export function marketSeries(f: SurplusForecast): MarketSeries {
  const hit = cache.get(f.id);
  if (hit) return hit;
  const r = rng(hash(f.id));
  const HIST = 14;
  const fcDays = Math.max(2, Math.min(5, Math.round(f.horizonHours / 24)));

  // History: glut pressure pulls price down from ~22% above today to today.
  const start = f.sellNowPrice * 1.22;
  const priceHist: PricePoint[] = [];
  const rawPrices: number[] = [];
  for (let i = 0; i < HIST; i++) {
    const t = i / (HIST - 1);
    const mean = start + (f.sellNowPrice - start) * t;
    const noise = (r() - 0.5) * f.sellNowPrice * 0.07;
    const price = Math.max(1, +(mean + noise).toFixed(1));
    rawPrices.push(price);
    priceHist.push({ label: `D-${HIST - 1 - i}`, price, fc: null, lo: null, hi: null });
  }
  // bridge point carries both the last actual and the forecast start
  priceHist[HIST - 1].fc = f.sellNowPrice;
  priceHist[HIST - 1].price = f.sellNowPrice;

  const fc: PricePoint[] = [];
  for (let j = 1; j <= fcDays; j++) {
    const t = j / fcDays;
    const mean = f.sellNowPrice + (f.priceIfHeld - f.sellNowPrice) * t;
    const spread = 2 + j * 1.5;
    fc.push({
      label: `+${j}d`,
      price: null,
      fc: +mean.toFixed(1),
      hi: +(mean + spread).toFixed(1),
      lo: +Math.max(f.spoilageAdjustedValue - 1, mean - spread * 1.3).toFixed(1),
    });
  }
  const price = [...priceHist, ...fc];

  // Arrivals: rising into the surge, today reflects arrivalChange.
  const arrivals: ArrivalPoint[] = [];
  const baseArr = (f.predictedQuantityT / HIST) * 1.6;
  for (let i = 0; i < HIST; i++) {
    const t = i / (HIST - 1);
    const ramp = 0.7 + 0.6 * t;
    const noise = 1 + (r() - 0.5) * 0.18;
    arrivals.push({ label: `D-${HIST - 1 - i}`, t: +(baseArr * ramp * noise).toFixed(1) });
  }

  // Volatility from historical daily returns (scaled 0–100).
  let sq = 0;
  for (let i = 1; i < rawPrices.length; i++) {
    const ret = (rawPrices[i] - rawPrices[i - 1]) / rawPrices[i - 1];
    sq += ret * ret;
  }
  const std = Math.sqrt(sq / (rawPrices.length - 1));
  const volatility = Math.round(Math.min(100, std * 520));

  // Anomaly from the arrivals surge (σ above seasonal norm).
  const sigma = f.arrivalChangePct / 11;
  const anomaly =
    f.arrivalChangePct >= 25
      ? { flag: true, label: `Arrivals +${sigma.toFixed(1)}σ above seasonal norm` }
      : f.arrivalChangePct >= 18
        ? { flag: true, label: `Arrivals +${sigma.toFixed(1)}σ — watch` }
        : { flag: false, label: "No arrival anomaly detected" };

  const names = NEARBY[f.location] ?? [`${f.location} East`, `${f.location} West`, `${f.location} North`, `${f.location} South`];
  const nearby: NearbyMarket[] = names.map((name) => {
    const off = +( (r() - 0.45) * f.sellNowPrice * 0.18 ).toFixed(1);
    const p = Math.max(1, +(f.sellNowPrice + off).toFixed(1));
    return { name, price: p, delta: +(p - f.sellNowPrice).toFixed(1) };
  });

  const dir = f.priceIfHeld > f.sellNowPrice + 0.5 ? "up" : f.priceIfHeld < f.sellNowPrice - 0.5 ? "down" : "flat";
  const seasonality = f.band === "high" ? "Peak-arrival window" : f.band === "emerging" ? "Arrivals building" : "Off-peak / steady";

  const series: MarketSeries = {
    price,
    arrivals,
    todayPrice: f.sellNowPrice,
    volatility,
    anomaly,
    nearby,
    seasonality,
    forecastDirection: dir as MarketSeries["forecastDirection"],
  };
  cache.set(f.id, series);
  return series;
}
