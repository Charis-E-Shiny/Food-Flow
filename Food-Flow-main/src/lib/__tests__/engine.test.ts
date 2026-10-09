import { describe, it, expect } from "vitest";
import {
  calculateAllocation,
  calculateCounterfactual,
  calculateDestinationScore,
  calculateSpoilageRisk,
  transitLossFraction,
} from "@/lib/engine";
import { getForecast, DEMAND_NODES, CANONICAL_FORECAST_ID } from "@/data/mockData";

const forecast = getForecast(CANONICAL_FORECAST_ID)!;

describe("decision engine — canonical invariants", () => {
  it("destination scores match the documented values", () => {
    const byId = Object.fromEntries(DEMAND_NODES.map((n) => [n.id, calculateDestinationScore(n)]));
    expect(byId["dn-blr-market"]).toBe(92);
    expect(byId["dn-mysuru-processor"]).toBe(81);
    expect(byId["dn-kolar-local"]).toBe(73);
    expect(byId["dn-community-kitchens"]).toBe(95);
  });

  it("allocation conserves quantity and respects capacity", () => {
    const a = calculateAllocation(forecast, DEMAND_NODES);
    expect(a.allocatedT).toBeCloseTo(15.2, 1);
    const sum = +a.legs.reduce((s, l) => s + l.quantityT, 0).toFixed(1);
    expect(sum).toBe(a.allocatedT);
    for (const leg of a.legs) {
      const cap = DEMAND_NODES.find((n) => n.id === leg.nodeId)!.capacityT;
      expect(leg.quantityT).toBeLessThanOrEqual(cap + 1e-6);
    }
  });

  it("counterfactual preserves the quantity identity", () => {
    const a = calculateAllocation(forecast, DEMAND_NODES);
    const cf = calculateCounterfactual(forecast, a, DEMAND_NODES);
    expect(cf.withFoodflow.redirectedT + cf.withFoodflow.residualRiskT).toBeCloseTo(cf.predictedT, 1);
    expect(cf.foodPreservedT).toBeCloseTo(cf.withFoodflow.redirectedT - cf.withoutFoodflow.conventionalAbsorptionT, 1);
  });

  it("spoilage risk increases with temperature and shorter windows", () => {
    expect(calculateSpoilageRisk(72, 32)).toBeGreaterThan(calculateSpoilageRisk(72, 20));
    expect(calculateSpoilageRisk(24, 30)).toBeGreaterThan(calculateSpoilageRisk(240, 30));
  });

  it("transit loss is bounded and grows with distance", () => {
    expect(transitLossFraction(25)).toBeLessThan(transitLossFraction(120));
    expect(transitLossFraction(100000)).toBeLessThanOrEqual(0.1);
  });
});
