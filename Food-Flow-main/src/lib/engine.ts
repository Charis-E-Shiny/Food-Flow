import type {
  AllocationLeg,
  AllocationResult,
  CounterfactualState,
  DemandNode,
  SurplusForecast,
} from "@/types";

// ============================================================
// FoodFlow decision-engine simulation.
//
// These are deterministic, explainable PROTOTYPE functions — a
// transparent stand-in for the production models. Each is pure and
// side-effect free, and the architecture is deliberately shaped so
// a trained model (demand forecaster, spoilage model, allocation
// solver) can replace the body of any single function later without
// touching the UI. No function uses randomness.
// ============================================================

/** Waste-risk score = sum of simulated factor contributions (0–100). */
export function calculateSurplusRisk(forecast: SurplusForecast): number {
  const sum = forecast.factors.reduce((a, f) => a + f.contribution, 0);
  return clamp(Math.round(sum), 0, 100);
}

/**
 * Spoilage risk (0–100) from usable window and heat load. Shorter
 * windows and higher temperatures push risk up non-linearly.
 */
export function calculateSpoilageRisk(spoilageWindowHours: number, temperatureC: number): number {
  const windowFactor = clamp(100 - (spoilageWindowHours / 72) * 55, 0, 100);
  const heatFactor = clamp((temperatureC - 18) * 3.4, 0, 100);
  return clamp(Math.round(windowFactor * 0.62 + heatFactor * 0.38), 0, 100);
}

const NEED_WEIGHT: Record<DemandNode["needLabel"], number> = {
  "Very High": 100,
  High: 80,
  Medium: 55,
  Low: 35,
};

/** Proximity score (0–100) — closer destinations score higher. */
export function proximityScore(distanceKm: number): number {
  return clamp(100 - distanceKm * 0.6, 0, 100);
}

/**
 * Destination suitability (0–100). A weighted blend — deliberately
 * NOT price-maximizing. It balances demand pull, absorption
 * certainty, acuteness of need, and proximity.
 *
 *   score = 0.40·demandPull + 0.34·absorption + 0.14·need + 0.12·proximity
 */
export function calculateDestinationScore(node: DemandNode): number {
  const raw =
    0.4 * node.demandDeficit +
    0.34 * node.usableAbsorptionPct +
    0.14 * NEED_WEIGHT[node.needLabel] +
    0.12 * proximityScore(node.distanceKm);
  return clamp(Math.round(raw), 0, 100);
}

export function etaHours(distanceKm: number): number {
  // avg 30 km/h effective + 2h dispatch & handling buffer
  return distanceKm / 30 + 2;
}

/** In-transit + handling loss as a fraction of a leg (longer haul → more loss). */
export function transitLossFraction(distanceKm: number): number {
  return clamp(distanceKm / 1440, 0, 0.1);
}

const DISTRESS_PRICE_PER_KG = 6; // what a crashed local market returns under a glut

/**
 * Allocation solver (greedy by suitability, capacity-bounded).
 * Places available tonnage into the highest-scoring destinations
 * first, up to each destination's absorbable capacity, until the
 * surplus is exhausted. Deterministic and order-stable.
 */
export function calculateAllocation(
  forecast: SurplusForecast,
  nodes: DemandNode[],
): AllocationResult {
  const ranked = [...nodes]
    .map((n) => ({ n, score: calculateDestinationScore(n) }))
    .sort((a, b) => b.score - a.score || a.n.distanceKm - b.n.distanceKm);

  let remaining = forecast.predictedQuantityT;
  const legs: AllocationLeg[] = [];

  for (const { n, score } of ranked) {
    if (remaining <= 0.001) break;
    const q = Math.min(n.capacityT, remaining);
    remaining = +(remaining - q).toFixed(2);
    legs.push({
      nodeId: n.id,
      nodeName: n.name,
      kind: n.kind,
      quantityT: +q.toFixed(1),
      score,
      distanceKm: n.distanceKm,
      etaHours: +etaHours(n.distanceKm).toFixed(2),
    });
  }

  const allocatedT = +legs.reduce((a, l) => a + l.quantityT, 0).toFixed(1);
  const avgScore = legs.length
    ? Math.round(legs.reduce((a, l) => a + l.score * l.quantityT, 0) / allocatedT)
    : 0;

  return {
    forecastId: forecast.id,
    totalAvailableT: forecast.predictedQuantityT,
    legs,
    allocatedT,
    residualT: +(forecast.predictedQuantityT - allocatedT).toFixed(1),
    avgScore,
  };
}

/** FoodFlow composite score for a forecast — urgency × opportunity. */
export function calculateFoodFlowScore(forecast: SurplusForecast): number {
  const urgency = forecast.wasteRisk;
  const horizonPenalty = clamp((forecast.horizonHours / 168) * 20, 0, 20);
  const scale = clamp((forecast.predictedQuantityT / 20) * 100, 0, 100);
  return clamp(Math.round(urgency * 0.6 + scale * 0.25 - horizonPenalty + 20), 0, 100);
}

/**
 * Counterfactual: contrast the do-nothing baseline against a
 * FoodFlow-coordinated intervention. Absorption certainty < 100%
 * means a small residual remains even with intervention.
 */
export function calculateCounterfactual(
  forecast: SurplusForecast,
  allocation: AllocationResult,
  nodes: DemandNode[],
): CounterfactualState {
  const predictedT = forecast.predictedQuantityT;

  // Baseline: conventional channels absorb a share; the rest is at
  // high risk and largely lost.
  const conventionalAbsorptionT = +(predictedT * 0.43).toFixed(1); // 6.5T @ 15.2
  const highRiskT = +(predictedT - conventionalAbsorptionT).toFixed(1); // 8.7T

  // Intervention: redirected tonnage discounted by (a) each
  // destination's absorption certainty and (b) in-transit/handling
  // loss over the corridor, yielding the effectively-preserved volume.
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const effective = allocation.legs.reduce((a, leg) => {
    const node = nodeById.get(leg.nodeId);
    const cert = node ? node.usableAbsorptionPct / 100 : 0.9;
    const keep = 1 - transitLossFraction(leg.distanceKm);
    return a + leg.quantityT * cert * keep;
  }, 0);
  const redirectedT = +effective.toFixed(1); // ≈ 13.4T
  const residualRiskT = +(predictedT - redirectedT).toFixed(1); // ≈ 1.8T

  const foodPreservedT = +(redirectedT - conventionalAbsorptionT).toFixed(1); // ≈ 6.9T
  const farmerValueProtected = calculateFarmerValue(allocation, nodes);
  const mealsEquivalent = calculateMealsEquivalent(foodPreservedT);
  const emissionsAvoidedT = +(foodPreservedT * 2.6).toFixed(1); // ~2.6 tCO2e / t food loss avoided

  return {
    predictedT,
    withoutFoodflow: {
      highRiskT,
      conventionalAbsorptionT,
      wasteT: highRiskT,
    },
    withFoodflow: {
      redirectedT,
      residualRiskT,
      wasteT: residualRiskT,
    },
    foodPreservedT,
    farmerValueProtected,
    mealsEquivalent,
    emissionsAvoidedT,
  };
}

/**
 * Farmer value protected (₹): realized value of the redirected lots
 * at their destination prices, minus the distress value the same
 * tonnage would fetch dumped into a glutted local market.
 */
export function calculateFarmerValue(allocation: AllocationResult, nodes: DemandNode[]): number {
  const priceById = new Map(nodes.map((n) => [n.id, n.priceEquivalentPerKg]));
  const realized = allocation.legs.reduce(
    (a, leg) => a + leg.quantityT * 1000 * (priceById.get(leg.nodeId) ?? 0),
    0,
  );
  const distress = allocation.allocatedT * 1000 * DISTRESS_PRICE_PER_KG;
  return Math.round((realized - distress) / 100) * 100;
}

/** Meals-equivalent from preserved food (~0.4 kg edible / meal). */
export function calculateMealsEquivalent(preservedTonnes: number): number {
  return Math.round((preservedTonnes * 1000) / 0.4 / 100) * 100;
}

/** Potential waste avoided (tonnes) given the computed counterfactual. */
export function calculatePotentialWasteAvoided(cf: CounterfactualState): number {
  return +(cf.withoutFoodflow.wasteT - cf.withFoodflow.wasteT).toFixed(1);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
