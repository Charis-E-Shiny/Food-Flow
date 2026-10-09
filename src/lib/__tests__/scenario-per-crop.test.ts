import { describe, it, expect } from "vitest";
import { scenarioFor } from "@/data/scenario";
import { FORECASTS, getForecast, CANONICAL_FORECAST_ID } from "@/data/mockData";
import { runOptimizer } from "@/lib/optimizer";

// Guards the "optimize always shows tomato" bug: each forecast must build
// its own scenario with crop-specific destinations, allocation and value.
describe("per-crop scenarios", () => {
  it("canonical event stays the calibrated Kolar bundle", () => {
    const s = scenarioFor(getForecast(CANONICAL_FORECAST_ID)!);
    expect(s.allocation.allocatedT).toBeCloseTo(15.2, 1);
    // Calibrated invariant: 95 (community) / 92 (Bengaluru) / 81 / 73.
    const scores = s.scoredNodes.map((n) => n.score).sort((a, b) => b - a);
    expect(scores).toEqual([95, 92, 81, 73]);
  });

  it("different crops yield different destinations and objective value", () => {
    const tomato = scenarioFor(getForecast("sf-kolar-tomato")!);
    const apple = scenarioFor(getForecast("sf-shimla-apple")!);
    const onion = scenarioFor(getForecast("sf-nashik-onion")!);

    // Destination node ids must differ (not all reusing the Kolar set).
    expect(apple.nodes.map((n) => n.id)).not.toEqual(tomato.nodes.map((n) => n.id));

    // Realized-value objective must differ across crops (prices differ).
    const vT = runOptimizer(tomato.forecast, tomato.nodes).objectiveValue;
    const vA = runOptimizer(apple.forecast, apple.nodes).objectiveValue;
    const vO = runOptimizer(onion.forecast, onion.nodes).objectiveValue;
    expect(vA).not.toBe(vT);
    expect(vO).not.toBe(vT);
    // Apple (~₹60-72/kg) should realize far more value than tomato (~₹18/kg).
    expect(vA).toBeGreaterThan(vT);
  });

  it("every forecast allocates its full predicted quantity (capacity ≥ supply)", () => {
    for (const f of FORECASTS) {
      const s = scenarioFor(f);
      expect(s.allocation.allocatedT).toBeCloseTo(f.predictedQuantityT, 0);
    }
  });
});
