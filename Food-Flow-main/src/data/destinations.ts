import type { DemandNode, GeoPoint, SurplusForecast } from "@/types";
import { CANONICAL_FORECAST_ID, DEMAND_NODES } from "./mockData";
import { NEARBY, hash, rng } from "./market";

// ============================================================
// Per-forecast demand destinations.
//
// The canonical Kolar/Tomato event keeps its hand-calibrated nodes
// (so the invariant scores 92/81/73/95 and the 4/5/3/3.2T plan are
// preserved). Every OTHER forecast gets its own four destinations,
// generated deterministically (seeded by forecast id) with prices
// anchored to THAT crop's price level — so the optimizer, greedy
// baseline and realized-value ₹ differ per commodity instead of
// always showing the tomato numbers.
// ============================================================

const cache = new Map<string, DemandNode[]>();

export function demandNodesFor(f: SurplusForecast): DemandNode[] {
  if (f.id === CANONICAL_FORECAST_ID) return DEMAND_NODES;
  const hit = cache.get(f.id);
  if (hit) return hit;

  const r = rng(hash(f.id + ":nodes"));
  const towns = NEARBY[f.location] ?? [`${f.location} North`, `${f.location} South`, `${f.location} East`, `${f.location} West`];
  const anchor = f.sellNowPrice; // today's ₹/kg for this crop
  const held = f.priceIfHeld; // best realizable ₹/kg
  const cap = f.predictedQuantityT; // weights sum to ~1.05 → small residual
  const near = (dx: number, dy: number): GeoPoint => ({ x: +(f.geo.x + dx).toFixed(2), y: +(f.geo.y + dy).toFixed(2) });
  const jit = (lo: number, hi: number) => +(lo + r() * (hi - lo)).toFixed(0);

  const dMarket = jit(60, 180);
  const dProc = jit(90, 210);
  const dLocal = jit(14, 38);
  const dComm = jit(35, 85);

  const nodes: DemandNode[] = [
    {
      id: `${f.id}-dn-market`,
      name: `${towns[0]} Wholesale Market`,
      district: towns[0],
      geo: near(3, -2),
      kind: "market",
      capacityT: +(cap * 0.3).toFixed(1),
      demandDeficit: jit(85, 97),
      distanceKm: dMarket,
      transportCostPerT: Math.round(dMarket * 26),
      priceEquivalentPerKg: Math.round(held),
      needLabel: "High",
      usableAbsorptionPct: jit(92, 98),
    },
    {
      id: `${f.id}-dn-processor`,
      name: `${towns[1]} Processing Unit`,
      district: towns[1],
      geo: near(-3, 3),
      kind: "processor",
      capacityT: +(cap * 0.3).toFixed(1),
      demandDeficit: jit(80, 90),
      distanceKm: dProc,
      transportCostPerT: Math.round(dProc * 28),
      priceEquivalentPerKg: Math.round(anchor),
      needLabel: "High",
      usableAbsorptionPct: jit(86, 93),
    },
    {
      id: `${f.id}-dn-local`,
      name: `${f.location} Local Market`,
      district: f.location,
      geo: near(1, 1),
      kind: "market",
      capacityT: +(cap * 0.22).toFixed(1),
      demandDeficit: jit(58, 74),
      distanceKm: dLocal,
      transportCostPerT: Math.round(dLocal * 32),
      priceEquivalentPerKg: Math.max(1, Math.round(anchor * 0.9)),
      needLabel: "Medium",
      usableAbsorptionPct: jit(76, 84),
    },
    {
      id: `${f.id}-dn-community`,
      name: `${towns[2] ?? f.location} Community Kitchens`,
      district: towns[2] ?? f.location,
      geo: near(-2, -3),
      kind: "community",
      capacityT: +(cap * 0.23).toFixed(1),
      demandDeficit: jit(95, 100),
      distanceKm: dComm,
      transportCostPerT: Math.round(dComm * 24),
      priceEquivalentPerKg: Math.max(1, Math.round(anchor * 0.82)),
      needLabel: "Very High",
      usableAbsorptionPct: 100,
    },
  ];

  cache.set(f.id, nodes);
  return nodes;
}
