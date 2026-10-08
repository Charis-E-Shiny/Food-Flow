import { describe, it, expect } from "vitest";
import { optimizeAllocation, objectiveOf, type OptInput } from "@/lib/optimizer";

const DESTS: OptInput[] = [
  { id: "a", name: "Market A", kind: "market", capacityT: 4, pricePerKg: 19, absorptionPct: 99, transportCostPerT: 1800, distanceKm: 65 },
  { id: "b", name: "Processor B", kind: "processor", capacityT: 5, pricePerKg: 17, absorptionPct: 92, transportCostPerT: 3200, distanceKm: 120 },
  { id: "c", name: "Local C", kind: "market", capacityT: 3, pricePerKg: 16, absorptionPct: 80, transportCostPerT: 900, distanceKm: 25 },
  { id: "d", name: "Community D", kind: "community", capacityT: 3.2, pricePerKg: 15, absorptionPct: 100, transportCostPerT: 1600, distanceKm: 70 },
];
const WINDOW = 72;

describe("allocation optimizer", () => {
  it("conserves quantity: Σ allocated = min(supply, total capacity)", () => {
    const r = optimizeAllocation(15.2, DESTS, WINDOW);
    const totalCap = DESTS.reduce((a, d) => a + d.capacityT, 0);
    expect(r.allocatedT).toBeCloseTo(Math.min(15.2, totalCap), 1);
    expect(r.residualT).toBeCloseTo(15.2 - r.allocatedT, 1);
  });

  it("never exceeds any destination capacity", () => {
    const r = optimizeAllocation(15.2, DESTS, WINDOW);
    for (const leg of r.legs) {
      const cap = DESTS.find((d) => d.id === leg.nodeId)!.capacityT;
      expect(leg.quantityT).toBeLessThanOrEqual(cap + 1e-6);
    }
  });

  it("does not allocate the same tonne twice (sum of legs = allocatedT)", () => {
    const r = optimizeAllocation(15.2, DESTS, WINDOW);
    const sum = +r.legs.reduce((a, l) => a + l.quantityT, 0).toFixed(1);
    expect(sum).toBe(r.allocatedT);
  });

  it("handles supply below total capacity (partial fill, no residual beyond supply)", () => {
    const r = optimizeAllocation(5, DESTS, WINDOW);
    expect(r.allocatedT).toBeCloseTo(5, 1);
    expect(r.residualT).toBeCloseTo(0, 1);
  });

  it("handles supply above total capacity (caps at capacity, leaves residual)", () => {
    const totalCap = DESTS.reduce((a, d) => a + d.capacityT, 0);
    const r = optimizeAllocation(100, DESTS, WINDOW);
    expect(r.allocatedT).toBeCloseTo(totalCap, 1);
    expect(r.residualT).toBeGreaterThan(0);
  });

  it("achieves an objective value >= the greedy-by-capacity baseline", () => {
    const supply = 15.2;
    const opt = optimizeAllocation(supply, DESTS, WINDOW);
    // Baseline: greedy fill by descending price (ignores diminishing returns).
    const ranked = [...DESTS].sort((a, b) => b.pricePerKg - a.pricePerKg);
    let rem = supply;
    const base: { nodeId: string; quantityT: number }[] = [];
    for (const d of ranked) {
      const q = Math.min(d.capacityT, rem);
      rem -= q;
      base.push({ nodeId: d.id, quantityT: q });
    }
    const optObj = opt.objectiveValue;
    const baseObj = objectiveOf(base, DESTS, WINDOW);
    expect(optObj).toBeGreaterThanOrEqual(baseObj);
  });

  it("returns zero allocation when supply is zero", () => {
    const r = optimizeAllocation(0, DESTS, WINDOW);
    expect(r.allocatedT).toBe(0);
    expect(r.legs.length).toBe(0);
  });
});
