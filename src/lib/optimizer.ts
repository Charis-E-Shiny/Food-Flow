import type { AllocationLeg, DemandNode, SurplusForecast } from "@/types";
import { etaHours } from "./engine";

// ============================================================
// Allocation optimizer (real optimization, not greedy-by-score).
//
// Objective: MAXIMIZE expected realized value, net of transport and
// spoilage, across destinations — subject to hard constraints:
//   • capacity:      0 ≤ x_i ≤ capacity_i
//   • conservation:  Σ x_i = min(supply, Σ capacity_i)   (no double-allocation)
//
// Value per destination has DIMINISHING RETURNS (flooding one market
// depresses its realized price — the glut effect), which is what makes
// this genuinely different from, and better than, greedy-by-score:
//
//   realizedValue_i(x) = base_i · ( x − k·x²/(2·cap_i) )
//   base_i   = price_i · 1000 · absorption_i · freshnessRetained_i   [₹/T]
//   marginal_i(q) = base_i·(1 − k·q/cap_i) − transportCost_i          [₹/T]
//
// For a separable CONCAVE objective with capacity bounds, allocating
// each marginal unit to the destination with the highest current
// marginal value is GLOBALLY OPTIMAL (water-filling). We discretize in
// small units and do exactly that.
// ============================================================

const SATURATION_K = 0.5; // marginal value falls to 50% as a destination fills
const UNIT = 0.1; // tonnes per allocation step

export interface OptInput {
  id: string;
  name: string;
  kind: DemandNode["kind"];
  capacityT: number;
  pricePerKg: number;
  absorptionPct: number; // 0–100
  transportCostPerT: number;
  distanceKm: number;
}

export interface OptResult {
  legs: AllocationLeg[];
  allocatedT: number;
  residualT: number;
  objectiveValue: number; // ₹ expected realized value net of transport
}

function freshnessRetained(distanceKm: number, usableWindowHours: number): number {
  // fraction of value retained given transit time vs usable window
  const transit = etaHours(distanceKm);
  return clamp(1 - (transit / usableWindowHours) * 0.6, 0.4, 1);
}

function baseValuePerT(d: OptInput, usableWindowHours: number): number {
  return d.pricePerKg * 1000 * (d.absorptionPct / 100) * freshnessRetained(d.distanceKm, usableWindowHours);
}

function marginal(d: OptInput, allocated: number, usableWindowHours: number): number {
  const base = baseValuePerT(d, usableWindowHours);
  const sat = 1 - (SATURATION_K * allocated) / d.capacityT;
  return base * Math.max(0, sat) - d.transportCostPerT;
}

/** Realized value (₹) of placing `x` tonnes at destination d (integral of marginal, incl. transport). */
export function realizedValue(d: OptInput, x: number, usableWindowHours: number): number {
  const base = baseValuePerT(d, usableWindowHours);
  const value = base * (x - (SATURATION_K * x * x) / (2 * d.capacityT));
  return value - d.transportCostPerT * x;
}

export function optimizeAllocation(
  supplyT: number,
  dests: OptInput[],
  usableWindowHours: number,
): OptResult {
  const alloc = new Map<string, number>(dests.map((d) => [d.id, 0]));
  let remaining = supplyT;
  const totalCap = dests.reduce((a, d) => a + d.capacityT, 0);
  const target = Math.min(supplyT, totalCap);

  // Water-filling on marginal value.
  let guard = Math.ceil(target / UNIT) + 10;
  while (remaining > 1e-9 && guard-- > 0) {
    let best: OptInput | null = null;
    let bestMv = 0; // only allocate while marginal value is positive
    for (const d of dests) {
      const q = alloc.get(d.id)!;
      if (q >= d.capacityT - 1e-9) continue;
      const mv = marginal(d, q, usableWindowHours);
      if (mv > bestMv) {
        bestMv = mv;
        best = d;
      }
    }
    if (!best) break; // no positive-value destination with capacity left
    const step = Math.min(UNIT, remaining, best.capacityT - alloc.get(best.id)!);
    alloc.set(best.id, +(alloc.get(best.id)! + step).toFixed(6));
    remaining = +(remaining - step).toFixed(6);
  }

  const legs: AllocationLeg[] = dests
    .map((d) => {
      const q = +(alloc.get(d.id) ?? 0).toFixed(1);
      return {
        nodeId: d.id,
        nodeName: d.name,
        kind: d.kind,
        quantityT: q,
        score: Math.round(clamp((marginal(d, 0, usableWindowHours) / (baseValuePerT(d, usableWindowHours) || 1)) * 100, 0, 100)),
        distanceKm: d.distanceKm,
        etaHours: +etaHours(d.distanceKm).toFixed(2),
      };
    })
    .filter((l) => l.quantityT > 0)
    .sort((a, b) => b.quantityT - a.quantityT);

  const allocatedT = +legs.reduce((a, l) => a + l.quantityT, 0).toFixed(1);
  const objectiveValue = Math.round(
    dests.reduce((a, d) => a + realizedValue(d, alloc.get(d.id) ?? 0, usableWindowHours), 0),
  );

  return {
    legs,
    allocatedT,
    residualT: +(supplyT - allocatedT).toFixed(1),
    objectiveValue,
  };
}

/** Objective value of an arbitrary allocation (for baseline comparison). */
export function objectiveOf(
  legs: { nodeId: string; quantityT: number }[],
  dests: OptInput[],
  usableWindowHours: number,
): number {
  const byId = new Map(dests.map((d) => [d.id, d]));
  return Math.round(
    legs.reduce((a, l) => {
      const d = byId.get(l.nodeId);
      return d ? a + realizedValue(d, l.quantityT, usableWindowHours) : a;
    }, 0),
  );
}

/** Adapt the app's forecast + demand nodes to optimizer inputs. */
export function toOptInputs(nodes: DemandNode[]): OptInput[] {
  return nodes.map((n) => ({
    id: n.id,
    name: n.name,
    kind: n.kind,
    capacityT: n.capacityT,
    pricePerKg: n.priceEquivalentPerKg,
    absorptionPct: n.usableAbsorptionPct,
    transportCostPerT: n.transportCostPerT,
    distanceKm: n.distanceKm,
  }));
}

export function runOptimizer(forecast: SurplusForecast, nodes: DemandNode[]): OptResult {
  return optimizeAllocation(forecast.predictedQuantityT, toOptInputs(nodes), forecast.spoilageWindowHours);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
