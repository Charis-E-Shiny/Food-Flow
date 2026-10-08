import { describe, it, expect } from "vitest";
import {
  optimizeAllocation,
  allocateNearestFeasible,
  allocateGreedyValue,
  evaluateAllocation,
  type OptInput,
} from "@/lib/optimizer";

// ============================================================
// Allocation benchmark + regression (prompt item 5).
// Evaluate the optimizer vs (A) nearest-feasible and (B) greedy-value
// baselines across varied supply / capacity / distance / price /
// spoilage scenarios. Assert constraints (conservation, no capacity
// violations) for every strategy, and that the optimizer's objective
// is >= both baselines (it is globally optimal for the concave
// objective). Prints a summary table.
// ============================================================

type Scenario = { name: string; supply: number; window: number; dests: OptInput[] };

const D = (id: string, capacityT: number, pricePerKg: number, absorptionPct: number, transportCostPerT: number, distanceKm: number, kind: OptInput["kind"] = "market"): OptInput =>
  ({ id, name: id, kind, capacityT, pricePerKg, absorptionPct, transportCostPerT, distanceKm });

const SCENARIOS: Scenario[] = [
  {
    name: "canonical (Kolar)",
    supply: 15.2,
    window: 72,
    dests: [D("blr", 4, 19, 99, 1800, 65), D("mys", 5, 17, 92, 3200, 120, "processor"), D("kol", 3, 16, 80, 900, 25), D("com", 3.2, 15, 100, 1600, 70, "community")],
  },
  { name: "supply << capacity", supply: 3, window: 72, dests: [D("a", 10, 20, 95, 1500, 40), D("b", 10, 18, 95, 2000, 90)] },
  { name: "supply >> capacity", supply: 50, window: 72, dests: [D("a", 4, 20, 95, 1500, 40), D("b", 5, 18, 95, 2000, 90)] },
  { name: "near but low value vs far high value", supply: 8, window: 72, dests: [D("near", 5, 10, 70, 500, 10), D("far", 5, 30, 99, 4000, 150)] },
  { name: "tight spoilage window", supply: 10, window: 24, dests: [D("near", 6, 18, 90, 1200, 20), D("far", 6, 22, 95, 3500, 160)] },
  { name: "high transport cost dominates", supply: 6, window: 120, dests: [D("a", 4, 16, 90, 6000, 200), D("b", 4, 15, 95, 800, 15)] },
  { name: "single destination", supply: 7, window: 72, dests: [D("only", 5, 18, 90, 1500, 50)] },
];

describe("allocation benchmark (optimizer vs baselines)", () => {
  const rows: Record<string, unknown>[] = [];

  for (const s of SCENARIOS) {
    it(`${s.name}: constraints hold & optimizer ≥ baselines`, () => {
      const nearest = allocateNearestFeasible(s.supply, s.dests);
      const greedy = allocateGreedyValue(s.supply, s.dests, s.window);
      const opt = optimizeAllocation(s.supply, s.dests, s.window);
      const optLegs = opt.legs.map((l) => ({ nodeId: l.nodeId, quantityT: l.quantityT }));

      const eN = evaluateAllocation(nearest, s.dests, s.supply, s.window);
      const eG = evaluateAllocation(greedy, s.dests, s.supply, s.window);
      const eO = evaluateAllocation(optLegs, s.dests, s.supply, s.window);

      // constraints hold for ALL strategies
      for (const e of [eN, eG, eO]) {
        expect(e.capacityViolations).toBe(0);
        expect(e.conservationOK).toBe(true);
        expect(e.allocatedT).toBeCloseTo(Math.min(s.supply, s.dests.reduce((a, d) => a + d.capacityT, 0)), 1);
      }
      // optimizer is globally optimal for the concave objective
      expect(eO.objectiveValue).toBeGreaterThanOrEqual(eN.objectiveValue);
      expect(eO.objectiveValue).toBeGreaterThanOrEqual(eG.objectiveValue);

      rows.push({
        scenario: s.name,
        supply: s.supply,
        nearest_obj: eN.objectiveValue,
        greedy_obj: eG.objectiveValue,
        optimizer_obj: eO.objectiveValue,
        "opt_vs_best_base_%": pctGain(eO.objectiveValue, Math.max(eN.objectiveValue, eG.objectiveValue)),
        residualSupplyT: eO.residualSupplyT,
        unfilledCapT: eO.unfilledCapacityT,
      });
    });
  }

  it("prints the benchmark table", () => {
    // eslint-disable-next-line no-console
    console.table(rows);
    expect(rows.length).toBe(SCENARIOS.length);
  });
});

function pctGain(opt: number, base: number): number {
  if (base <= 0) return opt > 0 ? 100 : 0;
  return Math.round(((opt - base) / base) * 1000) / 10;
}
