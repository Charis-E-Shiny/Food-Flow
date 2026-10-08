// ============================================================
// FoodFlow domain model
// Entities and their relationships. Everything in the app is
// derived from these shapes — no ad-hoc inline data structures.
// ============================================================

export type RiskBand = "stable" | "emerging" | "high";
export type NodeKind = "surplus" | "market" | "processor" | "community" | "transit";
export type Crop =
  | "Tomato"
  | "Potato"
  | "Onion"
  | "Mango"
  | "Cabbage"
  | "Banana"
  | "Chilli"
  | "Grapes"
  | "Cauliflower"
  | "Peas"
  | "Pomegranate"
  | "Apple";

/** Geographic point in the stylized Karnataka projection (0–100 space). */
export interface GeoPoint {
  x: number;
  y: number;
}

export interface FarmCluster {
  id: string;
  name: string;
  district: string;
  geo: GeoPoint;
  farmers: number;
  dominantCrop: Crop;
}

export interface Mandi {
  id: string;
  name: string;
  district: string;
  geo: GeoPoint;
}

/** A single explainability factor behind a forecast (simulated contribution). */
export interface Factor {
  id: string;
  label: string;
  contribution: number; // points toward the waste-risk score
  detail: string;
}

export interface SurplusForecast {
  id: string;
  clusterId: string;
  location: string;
  district: string;
  geo: GeoPoint;
  crop: Crop;
  predictedQuantityT: number; // tonnes
  horizonHours: number;
  wasteRisk: number; // 0–100
  spoilageWindowHours: number;
  arrivalChangePct: number; // vs seasonal norm
  demandChangePct: number;
  temperatureC: number;
  factors: Factor[];
  confidence: number; // 0–100
  band: RiskBand;
  // value economics (₹/kg)
  priceIfHeld: number;
  spoilageAdjustedValue: number;
  sellNowPrice: number;
}

export interface DemandNode {
  id: string;
  name: string;
  district: string;
  geo: GeoPoint;
  kind: Exclude<NodeKind, "surplus" | "transit">;
  capacityT: number; // absorbable tonnes for the active window
  demandDeficit: number; // 0–100, how acute the unmet need is
  distanceKm: number; // from the active surplus event
  transportCostPerT: number; // ₹ per tonne
  priceEquivalentPerKg: number; // realized ₹/kg equivalent at this destination
  needLabel: "Very High" | "High" | "Medium" | "Low";
  usableAbsorptionPct: number; // certainty food is actually used, 0–100
}

export interface AllocationLeg {
  nodeId: string;
  nodeName: string;
  kind: DemandNode["kind"];
  quantityT: number;
  score: number; // destination suitability 0–100
  distanceKm: number;
  etaHours: number;
}

export interface AllocationResult {
  forecastId: string;
  totalAvailableT: number;
  legs: AllocationLeg[];
  allocatedT: number;
  residualT: number;
  avgScore: number;
}

export type TraceStatus = "complete" | "active" | "pending";

export interface TraceEvent {
  id: string;
  label: string;
  actor: string;
  location: string;
  quantityT?: number;
  timestamp: string; // human label, e.g. "Today 06:12"
  status: TraceStatus;
  hash: string; // simulated ledger hash
}

export interface Batch {
  id: string;
  forecastId: string;
  crop: Crop;
  predictedT: number;
  events: TraceEvent[];
}

export interface Recipient {
  id: string;
  name: string;
  type: "Community Kitchen" | "Food Bank" | "Processor" | "Market";
  incomingCrop: Crop;
  incomingT: number;
  etaHours: number;
  usableWindowHours: number;
  status: "offered" | "accepted" | "received";
}

export interface ImpactMetric {
  id: string;
  label: string;
  value: number;
  unit: string;
  deltaLabel: string;
  sdg: 2 | 12 | 13;
}

export interface CounterfactualState {
  predictedT: number;
  withoutFoodflow: { highRiskT: number; conventionalAbsorptionT: number; wasteT: number };
  withFoodflow: { redirectedT: number; residualRiskT: number; wasteT: number };
  foodPreservedT: number;
  farmerValueProtected: number; // ₹
  mealsEquivalent: number;
  emissionsAvoidedT: number; // tCO2e
}
