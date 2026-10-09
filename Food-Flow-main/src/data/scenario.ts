import {
  calculateAllocation,
  calculateCounterfactual,
  calculateDestinationScore,
  calculateFoodFlowScore,
  calculatePotentialWasteAvoided,
  calculateSpoilageRisk,
} from "@/lib/engine";
import type { DemandNode, ImpactMetric, SurplusForecast } from "@/types";
import { CANONICAL_FORECAST_ID, DEMAND_NODES, FORECASTS, getForecast } from "./mockData";
import { demandNodesFor } from "./destinations";

// ============================================================
// Canonical scenario bundle.
// Everything downstream (Command Center KPIs, Optimization,
// Counterfactual, Impact, Demo) reads from ONE computed object so
// no two screens can disagree. Computed once, memoized by module.
// ============================================================

export function buildScenario(forecast: SurplusForecast, nodes: DemandNode[]) {
  const allocation = calculateAllocation(forecast, nodes);
  const counterfactual = calculateCounterfactual(forecast, allocation, nodes);
  const scoredNodes = nodes.map((n) => ({ node: n, score: calculateDestinationScore(n) }));
  return {
    forecast,
    nodes,
    scoredNodes,
    allocation,
    counterfactual,
    wasteAvoidedT: calculatePotentialWasteAvoided(counterfactual),
    spoilageRisk: calculateSpoilageRisk(forecast.spoilageWindowHours, forecast.temperatureC),
    foodflowScore: calculateFoodFlowScore(forecast),
  };
}

export type Scenario = ReturnType<typeof buildScenario>;

export const KOLAR_SCENARIO = buildScenario(getForecast(CANONICAL_FORECAST_ID)!, DEMAND_NODES);

// Build the full scenario for ANY forecast, using destinations priced to
// that crop. The canonical event returns the calibrated Kolar bundle.
export function scenarioFor(forecast: SurplusForecast): Scenario {
  if (forecast.id === CANONICAL_FORECAST_ID) return KOLAR_SCENARIO;
  return buildScenario(forecast, demandNodesFor(forecast));
}

// Portfolio-level KPIs for the Command Center, derived from the
// full forecast board (not just the canonical event).
export const PORTFOLIO = (() => {
  const predictedSurplusT = +FORECASTS.reduce((a, f) => a + f.predictedQuantityT, 0).toFixed(1);
  const tonnesAtRiskT = +FORECASTS.filter((f) => f.band !== "stable")
    .reduce((a, f) => a + f.predictedQuantityT * (f.wasteRisk / 100), 0)
    .toFixed(1);
  return {
    predictedSurplusT,
    tonnesAtRiskT,
    redirectedT: KOLAR_SCENARIO.counterfactual.withFoodflow.redirectedT,
    wasteAvoidedT: KOLAR_SCENARIO.counterfactual.foodPreservedT,
    activeInterventions: FORECASTS.filter((f) => f.band === "high").length,
    highRiskEvents: FORECASTS.filter((f) => f.band === "high").length,
  };
})();

// Impact metrics derived from the computed scenario — guaranteed to
// agree with the Optimization and Counterfactual screens.
export const IMPACT_METRICS: ImpactMetric[] = (() => {
  const cf = KOLAR_SCENARIO.counterfactual;
  return [
    { id: "im-preserved", label: "Food preserved", value: cf.foodPreservedT, unit: "tonnes", deltaLabel: "vs. do-nothing baseline", sdg: 2 },
    { id: "im-redirected", label: "Food redirected", value: cf.withFoodflow.redirectedT, unit: "tonnes", deltaLabel: "within usable window", sdg: 12 },
    { id: "im-waste", label: "Waste avoided", value: KOLAR_SCENARIO.wasteAvoidedT, unit: "tonnes", deltaLabel: "−79% vs baseline", sdg: 12 },
    { id: "im-value", label: "Farmer value protected", value: cf.farmerValueProtected, unit: "₹", deltaLabel: "realized vs. distress sale", sdg: 2 },
    { id: "im-meals", label: "Meals-equivalent", value: cf.mealsEquivalent, unit: "meals", deltaLabel: "from preserved food", sdg: 2 },
    { id: "im-emissions", label: "Emissions avoided", value: cf.emissionsAvoidedT, unit: "tCO₂e", deltaLabel: "decomposition + reroute", sdg: 13 },
  ];
})();
