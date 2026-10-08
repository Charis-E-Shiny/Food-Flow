import type { Batch, DemandNode, FarmCluster, Recipient, SurplusForecast } from "@/types";
import { CITY_GEO } from "./geo";

// ============================================================
// FoodFlow mock-data engine.
//
// ⚠ DEMO DATA — illustrative scenario. These numbers describe how
// the production system would behave; they are not measured
// real-world results and no ML model was trained to produce them.
// All values are deterministic and hand-authored so the same
// scenario renders identically every time (no Math.random).
// ============================================================

export const DISCLAIMER =
  "Demo data — illustrative scenario. Figures model how FoodFlow would operate; they are not measured outcomes.";

export const FARM_CLUSTERS: FarmCluster[] = [
  { id: "fc-kolar", name: "Kolar Belt", district: "Kolar, Karnataka", geo: CITY_GEO.Kolar, farmers: 1240, dominantCrop: "Tomato" },
  { id: "fc-nashik", name: "Nashik Onion Belt", district: "Nashik, Maharashtra", geo: CITY_GEO.Nashik, farmers: 2150, dominantCrop: "Onion" },
  { id: "fc-agra", name: "Agra Potato Belt", district: "Agra, Uttar Pradesh", geo: CITY_GEO.Agra, farmers: 1880, dominantCrop: "Potato" },
  { id: "fc-hooghly", name: "Hooghly Fields", district: "Hooghly, West Bengal", geo: CITY_GEO.Hooghly, farmers: 1620, dominantCrop: "Potato" },
  { id: "fc-jalandhar", name: "Doaba Belt", district: "Jalandhar, Punjab", geo: CITY_GEO.Jalandhar, farmers: 990, dominantCrop: "Potato" },
  { id: "fc-guntur", name: "Guntur Gardens", district: "Guntur, Andhra Pradesh", geo: CITY_GEO.Guntur, farmers: 1340, dominantCrop: "Cabbage" },
  { id: "fc-nagpur", name: "Nagpur Orchards", district: "Nagpur, Maharashtra", geo: CITY_GEO.Nagpur, farmers: 760, dominantCrop: "Mango" },
  { id: "fc-anand", name: "Anand Groves", district: "Anand, Gujarat", geo: CITY_GEO.Anand, farmers: 880, dominantCrop: "Banana" },
  { id: "fc-shimla", name: "Shimla Orchards", district: "Shimla, Himachal Pradesh", geo: CITY_GEO.Shimla, farmers: 540, dominantCrop: "Apple" },
  { id: "fc-sangli", name: "Sangli Vineyards", district: "Sangli, Maharashtra", geo: CITY_GEO.Sangli, farmers: 710, dominantCrop: "Grapes" },
  { id: "fc-kurnool", name: "Kurnool Chilli Belt", district: "Kurnool, Andhra Pradesh", geo: CITY_GEO.Kurnool, farmers: 1180, dominantCrop: "Chilli" },
  { id: "fc-pune", name: "Pune Market Gardens", district: "Pune, Maharashtra", geo: CITY_GEO.Pune, farmers: 820, dominantCrop: "Cauliflower" },
  { id: "fc-indore", name: "Malwa Pea Belt", district: "Indore, Madhya Pradesh", geo: CITY_GEO.Indore, farmers: 660, dominantCrop: "Peas" },
  { id: "fc-solapur", name: "Solapur Orchards", district: "Solapur, Maharashtra", geo: CITY_GEO.Solapur, farmers: 590, dominantCrop: "Pomegranate" },
];

// ---- Forecasts -------------------------------------------------
// The canonical demo scenario is KOLAR / TOMATO. Factor
// contributions sum exactly to the waste-risk score (87).

export const FORECASTS: SurplusForecast[] = [
  {
    id: "sf-kolar-tomato",
    clusterId: "fc-kolar",
    location: "Kolar",
    district: "Kolar, Karnataka",
    geo: CITY_GEO.Kolar,
    crop: "Tomato",
    predictedQuantityT: 15.2,
    horizonHours: 72,
    wasteRisk: 87,
    spoilageWindowHours: 72,
    arrivalChangePct: 38,
    demandChangePct: -12,
    temperatureC: 32,
    confidence: 84,
    band: "high",
    priceIfHeld: 22,
    spoilageAdjustedValue: 15,
    sellNowPrice: 18,
    factors: [
      { id: "arrivals", label: "Arrivals surge", contribution: 31, detail: "Mandi arrivals forecast +38% vs seasonal norm as three taluks peak together." },
      { id: "demand", label: "Demand contraction", contribution: 18, detail: "Local wholesale demand softening −12% on a holiday-week dip." },
      { id: "temp", label: "Temperature", contribution: 15, detail: "32°C ambient accelerates ripening and shortens the usable window." },
      { id: "shelf", label: "Shelf life", contribution: 13, detail: "Field-ripened tomato holds ~3 days before grade loss without cold chain." },
      { id: "capacity", label: "Local capacity", contribution: 10, detail: "Nearby cold storage near capacity; limited local absorption headroom." },
    ],
  },
  {
    id: "sf-nashik-onion",
    clusterId: "fc-nashik",
    location: "Nashik",
    district: "Nashik, Maharashtra",
    geo: CITY_GEO.Nashik,
    crop: "Onion",
    predictedQuantityT: 20.0,
    horizonHours: 96,
    wasteRisk: 74,
    spoilageWindowHours: 240,
    arrivalChangePct: 34,
    demandChangePct: -9,
    temperatureC: 29,
    confidence: 78,
    band: "high",
    priceIfHeld: 24,
    spoilageAdjustedValue: 19,
    sellNowPrice: 18,
    factors: [
      { id: "arrivals", label: "Arrivals surge", contribution: 26, detail: "Lasalgaon and Pimpalgaon mandis peak together, +34% arrivals." },
      { id: "demand", label: "Demand contraction", contribution: 14, detail: "Export parity weak this week; domestic pull soft." },
      { id: "temp", label: "Temperature", contribution: 12, detail: "29°C with humidity raises rot risk in open stacks." },
      { id: "shelf", label: "Shelf life", contribution: 12, detail: "Uncured lots won't hold the usual onion window." },
      { id: "capacity", label: "Local capacity", contribution: 10, detail: "Ventilated chawls near full across the belt." },
    ],
  },
  {
    id: "sf-agra-potato",
    clusterId: "fc-agra",
    location: "Agra",
    district: "Agra, Uttar Pradesh",
    geo: CITY_GEO.Agra,
    crop: "Potato",
    predictedQuantityT: 14.6,
    horizonHours: 60,
    wasteRisk: 81,
    spoilageWindowHours: 120,
    arrivalChangePct: 31,
    demandChangePct: -15,
    temperatureC: 30,
    confidence: 82,
    band: "high",
    priceIfHeld: 16,
    spoilageAdjustedValue: 11,
    sellNowPrice: 13,
    factors: [
      { id: "arrivals", label: "Arrivals surge", contribution: 27, detail: "Cold-store unloading wave hits the mandi at once." },
      { id: "demand", label: "Demand contraction", contribution: 18, detail: "Chip processors fully contracted; spot demand thin." },
      { id: "temp", label: "Temperature", contribution: 14, detail: "Early-summer heat accelerates sprouting post-storage." },
      { id: "shelf", label: "Shelf life", contribution: 12, detail: "Lots already aged in storage; limited runway." },
      { id: "capacity", label: "Local capacity", contribution: 10, detail: "District cold stores at 91% utilization." },
    ],
  },
  {
    id: "sf-hooghly-potato",
    clusterId: "fc-hooghly",
    location: "Hooghly",
    district: "Hooghly, West Bengal",
    geo: CITY_GEO.Hooghly,
    crop: "Potato",
    predictedQuantityT: 16.8,
    horizonHours: 72,
    wasteRisk: 76,
    spoilageWindowHours: 150,
    arrivalChangePct: 29,
    demandChangePct: -11,
    temperatureC: 31,
    confidence: 80,
    band: "high",
    priceIfHeld: 17,
    spoilageAdjustedValue: 12,
    sellNowPrice: 13,
    factors: [
      { id: "arrivals", label: "Arrivals surge", contribution: 25, detail: "Simultaneous lifting across Hooghly and Bardhaman." },
      { id: "demand", label: "Demand contraction", contribution: 16, detail: "Inter-state movement curbs depress outbound demand." },
      { id: "temp", label: "Temperature", contribution: 13, detail: "Humid 31°C raises decay in field-heat lots." },
      { id: "shelf", label: "Shelf life", contribution: 12, detail: "Table potato with a tightening usable window." },
      { id: "capacity", label: "Local capacity", contribution: 10, detail: "State cold chain near saturation." },
    ],
  },
  {
    id: "sf-jalandhar-potato",
    clusterId: "fc-jalandhar",
    location: "Jalandhar",
    district: "Jalandhar, Punjab",
    geo: CITY_GEO.Jalandhar,
    crop: "Potato",
    predictedQuantityT: 9.2,
    horizonHours: 120,
    wasteRisk: 58,
    spoilageWindowHours: 180,
    arrivalChangePct: 19,
    demandChangePct: -5,
    temperatureC: 24,
    confidence: 74,
    band: "emerging",
    priceIfHeld: 15,
    spoilageAdjustedValue: 12,
    sellNowPrice: 12,
    factors: [
      { id: "arrivals", label: "Arrivals surge", contribution: 18, detail: "Doaba belt lifting ahead of schedule." },
      { id: "demand", label: "Demand", contribution: 12, detail: "Seed-grade demand steady; ware demand slackening." },
      { id: "temp", label: "Temperature", contribution: 8, detail: "Cooler climate slows spoilage — more runway." },
      { id: "shelf", label: "Shelf life", contribution: 12, detail: "Good keeping quality this season." },
      { id: "capacity", label: "Local capacity", contribution: 8, detail: "Storage has moderate headroom." },
    ],
  },
  {
    id: "sf-guntur-cabbage",
    clusterId: "fc-guntur",
    location: "Guntur",
    district: "Guntur, Andhra Pradesh",
    geo: CITY_GEO.Guntur,
    crop: "Cabbage",
    predictedQuantityT: 7.4,
    horizonHours: 108,
    wasteRisk: 61,
    spoilageWindowHours: 168,
    arrivalChangePct: 22,
    demandChangePct: -7,
    temperatureC: 33,
    confidence: 75,
    band: "emerging",
    priceIfHeld: 14,
    spoilageAdjustedValue: 10,
    sellNowPrice: 12,
    factors: [
      { id: "arrivals", label: "Arrivals surge", contribution: 20, detail: "Winter crop flush arriving in volume." },
      { id: "demand", label: "Demand contraction", contribution: 12, detail: "Local retail already well supplied." },
      { id: "temp", label: "Temperature", contribution: 14, detail: "33°C wilts heads quickly without cold chain." },
      { id: "shelf", label: "Shelf life", contribution: 9, detail: "Leafy brassica — short tolerance." },
      { id: "capacity", label: "Local capacity", contribution: 6, detail: "Minimal cold storage in the belt." },
    ],
  },
  {
    id: "sf-nagpur-mango",
    clusterId: "fc-nagpur",
    location: "Nagpur",
    district: "Nagpur, Maharashtra",
    geo: CITY_GEO.Nagpur,
    crop: "Mango",
    predictedQuantityT: 7.3,
    horizonHours: 144,
    wasteRisk: 52,
    spoilageWindowHours: 96,
    arrivalChangePct: 17,
    demandChangePct: 3,
    temperatureC: 34,
    confidence: 71,
    band: "emerging",
    priceIfHeld: 40,
    spoilageAdjustedValue: 35,
    sellNowPrice: 36,
    factors: [
      { id: "arrivals", label: "Arrivals", contribution: 16, detail: "Orchard flush concentrated over a few days." },
      { id: "demand", label: "Demand", contribution: 10, detail: "Premium demand healthy but price-sensitive." },
      { id: "temp", label: "Temperature", contribution: 10, detail: "34°C hastens ripening post-harvest." },
      { id: "shelf", label: "Shelf life", contribution: 10, detail: "Ripe fruit — short, unforgiving window." },
      { id: "capacity", label: "Local capacity", contribution: 6, detail: "Packhouse throughput is the bottleneck." },
    ],
  },
  {
    id: "sf-anand-banana",
    clusterId: "fc-anand",
    location: "Anand",
    district: "Anand, Gujarat",
    geo: CITY_GEO.Anand,
    crop: "Banana",
    predictedQuantityT: 6.6,
    horizonHours: 168,
    wasteRisk: 34,
    spoilageWindowHours: 120,
    arrivalChangePct: 9,
    demandChangePct: 6,
    temperatureC: 32,
    confidence: 69,
    band: "stable",
    priceIfHeld: 20,
    spoilageAdjustedValue: 18,
    sellNowPrice: 17,
    factors: [
      { id: "arrivals", label: "Arrivals", contribution: 12, detail: "Steady bunch maturity, no major spike." },
      { id: "demand", label: "Demand", contribution: 8, detail: "Ripening-chamber demand absorbs most volume." },
      { id: "temp", label: "Temperature", contribution: 6, detail: "Managed within chamber tolerances." },
      { id: "shelf", label: "Shelf life", contribution: 5, detail: "Controlled ripening extends usable window." },
      { id: "capacity", label: "Local capacity", contribution: 3, detail: "Chambers have spare capacity." },
    ],
  },
  {
    id: "sf-shimla-apple",
    clusterId: "fc-shimla",
    location: "Shimla",
    district: "Shimla, Himachal Pradesh",
    geo: CITY_GEO.Shimla,
    crop: "Apple",
    predictedQuantityT: 12.0,
    horizonHours: 120,
    wasteRisk: 63,
    spoilageWindowHours: 168,
    arrivalChangePct: 24,
    demandChangePct: -6,
    temperatureC: 22,
    confidence: 77,
    band: "emerging",
    priceIfHeld: 72,
    spoilageAdjustedValue: 64,
    sellNowPrice: 60,
    factors: [
      { id: "arrivals", label: "Arrivals surge", contribution: 22, detail: "Peak picking across upper Shimla belt." },
      { id: "demand", label: "Demand", contribution: 12, detail: "Plains demand steady but transit is the bottleneck." },
      { id: "temp", label: "Temperature", contribution: 9, detail: "Cool climate aids holding — more runway." },
      { id: "shelf", label: "Shelf life", contribution: 12, detail: "CA-store grade holds; field-pack lots do not." },
      { id: "capacity", label: "Local capacity", contribution: 8, detail: "CA storage near full for the season." },
    ],
  },
  {
    id: "sf-sangli-grapes",
    clusterId: "fc-sangli",
    location: "Sangli",
    district: "Sangli, Maharashtra",
    geo: CITY_GEO.Sangli,
    crop: "Grapes",
    predictedQuantityT: 8.8,
    horizonHours: 84,
    wasteRisk: 69,
    spoilageWindowHours: 96,
    arrivalChangePct: 26,
    demandChangePct: -8,
    temperatureC: 33,
    confidence: 76,
    band: "emerging",
    priceIfHeld: 55,
    spoilageAdjustedValue: 44,
    sellNowPrice: 46,
    factors: [
      { id: "arrivals", label: "Arrivals surge", contribution: 24, detail: "Export-grade bunches maturing together." },
      { id: "demand", label: "Demand contraction", contribution: 14, detail: "Export container slots short this week." },
      { id: "temp", label: "Temperature", contribution: 15, detail: "33°C risks berry shrivel without pre-cooling." },
      { id: "shelf", label: "Shelf life", contribution: 10, detail: "Table grape — short, unforgiving window." },
      { id: "capacity", label: "Local capacity", contribution: 6, detail: "Pre-cooling capacity is the constraint." },
    ],
  },
  {
    id: "sf-kurnool-chilli",
    clusterId: "fc-kurnool",
    location: "Kurnool",
    district: "Kurnool, Andhra Pradesh",
    geo: CITY_GEO.Kurnool,
    crop: "Chilli",
    predictedQuantityT: 6.2,
    horizonHours: 108,
    wasteRisk: 57,
    spoilageWindowHours: 144,
    arrivalChangePct: 21,
    demandChangePct: -6,
    temperatureC: 35,
    confidence: 74,
    band: "emerging",
    priceIfHeld: 95,
    spoilageAdjustedValue: 78,
    sellNowPrice: 82,
    factors: [
      { id: "arrivals", label: "Arrivals surge", contribution: 20, detail: "Green chilli flush ahead of drying demand." },
      { id: "demand", label: "Demand", contribution: 11, detail: "Fresh-market pull softer than drying intake." },
      { id: "temp", label: "Temperature", contribution: 14, detail: "35°C accelerates wilting of fresh pods." },
      { id: "shelf", label: "Shelf life", contribution: 7, detail: "Fresh green chilli — limited holding." },
      { id: "capacity", label: "Local capacity", contribution: 5, detail: "Drying yards have some headroom." },
    ],
  },
  {
    id: "sf-pune-cauliflower",
    clusterId: "fc-pune",
    location: "Pune",
    district: "Pune, Maharashtra",
    geo: CITY_GEO.Pune,
    crop: "Cauliflower",
    predictedQuantityT: 7.0,
    horizonHours: 96,
    wasteRisk: 54,
    spoilageWindowHours: 120,
    arrivalChangePct: 19,
    demandChangePct: -7,
    temperatureC: 30,
    confidence: 73,
    band: "emerging",
    priceIfHeld: 18,
    spoilageAdjustedValue: 13,
    sellNowPrice: 14,
    factors: [
      { id: "arrivals", label: "Arrivals surge", contribution: 18, detail: "Peri-urban gardens flushing together." },
      { id: "demand", label: "Demand contraction", contribution: 12, detail: "City retail already well supplied." },
      { id: "temp", label: "Temperature", contribution: 10, detail: "Warm days yellow the curds quickly." },
      { id: "shelf", label: "Shelf life", contribution: 8, detail: "Short tolerance without cold storage." },
      { id: "capacity", label: "Local capacity", contribution: 6, detail: "Limited pack-house throughput." },
    ],
  },
  {
    id: "sf-indore-peas",
    clusterId: "fc-indore",
    location: "Indore",
    district: "Indore, Madhya Pradesh",
    geo: CITY_GEO.Indore,
    crop: "Peas",
    predictedQuantityT: 5.5,
    horizonHours: 132,
    wasteRisk: 47,
    spoilageWindowHours: 150,
    arrivalChangePct: 16,
    demandChangePct: -4,
    temperatureC: 26,
    confidence: 71,
    band: "emerging",
    priceIfHeld: 34,
    spoilageAdjustedValue: 29,
    sellNowPrice: 30,
    factors: [
      { id: "arrivals", label: "Arrivals", contribution: 16, detail: "Malwa belt green-pea harvest ramping." },
      { id: "demand", label: "Demand", contribution: 9, detail: "Freezing-plant intake near contracted volume." },
      { id: "temp", label: "Temperature", contribution: 8, detail: "Mild temperatures slow quality loss." },
      { id: "shelf", label: "Shelf life", contribution: 9, detail: "Shelled peas lose sweetness fast." },
      { id: "capacity", label: "Local capacity", contribution: 5, detail: "Cold chain has moderate headroom." },
    ],
  },
  {
    id: "sf-solapur-pomegranate",
    clusterId: "fc-solapur",
    location: "Solapur",
    district: "Solapur, Maharashtra",
    geo: CITY_GEO.Solapur,
    crop: "Pomegranate",
    predictedQuantityT: 4.8,
    horizonHours: 168,
    wasteRisk: 38,
    spoilageWindowHours: 216,
    arrivalChangePct: 10,
    demandChangePct: 5,
    temperatureC: 34,
    confidence: 69,
    band: "stable",
    priceIfHeld: 90,
    spoilageAdjustedValue: 84,
    sellNowPrice: 82,
    factors: [
      { id: "arrivals", label: "Arrivals", contribution: 14, detail: "Steady bhagwa harvest, no sharp spike." },
      { id: "demand", label: "Demand", contribution: 8, detail: "Premium and export demand healthy." },
      { id: "temp", label: "Temperature", contribution: 7, detail: "Thick rind tolerates heat well." },
      { id: "shelf", label: "Shelf life", contribution: 6, detail: "Excellent keeping quality — long window." },
      { id: "capacity", label: "Local capacity", contribution: 3, detail: "Pack-houses have spare capacity." },
    ],
  },
];

export const CANONICAL_FORECAST_ID = "sf-kolar-tomato";

export function getForecast(id: string): SurplusForecast | undefined {
  return FORECASTS.find((f) => f.id === id);
}

// ---- Demand / recipient nodes for the Kolar scenario ----------
// Field values are calibrated so calculateDestinationScore() (in
// lib/engine) yields the canonical suitability scores 92/81/73/95.

export const DEMAND_NODES: DemandNode[] = [
  {
    id: "dn-blr-market",
    name: "Bengaluru Wholesale Market",
    district: "Bengaluru",
    geo: CITY_GEO.Bengaluru,
    kind: "market",
    capacityT: 4,
    demandDeficit: 100,
    distanceKm: 65,
    transportCostPerT: 1800,
    priceEquivalentPerKg: 19,
    needLabel: "High",
    usableAbsorptionPct: 99,
  },
  {
    id: "dn-mysuru-processor",
    name: "Mysuru Processing Facility",
    district: "Mysuru",
    geo: CITY_GEO.Mysuru,
    kind: "processor",
    capacityT: 5,
    demandDeficit: 88,
    distanceKm: 120,
    transportCostPerT: 3200,
    priceEquivalentPerKg: 17,
    needLabel: "High",
    usableAbsorptionPct: 92,
  },
  {
    id: "dn-kolar-local",
    name: "Kolar Local Market",
    district: "Kolar",
    geo: CITY_GEO.Kolar,
    kind: "market",
    capacityT: 3,
    demandDeficit: 70,
    distanceKm: 25,
    transportCostPerT: 900,
    priceEquivalentPerKg: 16,
    needLabel: "Medium",
    usableAbsorptionPct: 80,
  },
  {
    id: "dn-community-kitchens",
    name: "Community Kitchens Network",
    district: "Bengaluru Rural",
    geo: { x: (CITY_GEO.Bengaluru.x + CITY_GEO.Kolar.x) / 2, y: (CITY_GEO.Bengaluru.y + CITY_GEO.Kolar.y) / 2 - 4 },
    kind: "community",
    capacityT: 3.2,
    demandDeficit: 100,
    distanceKm: 70,
    transportCostPerT: 1600,
    priceEquivalentPerKg: 15,
    needLabel: "Very High",
    usableAbsorptionPct: 100,
  },
];

// National demand hubs — shown on the Food Need Map to convey the
// pan-India network. Not part of the Kolar allocation set (surplus
// is routed regionally), so they are display-only metadata.
export const NATIONAL_DEMAND: DemandNode[] = [
  { id: "nd-delhi", name: "Azadpur Mandi, Delhi", district: "Delhi", geo: CITY_GEO.Delhi, kind: "market", capacityT: 40, demandDeficit: 95, distanceKm: 1300, transportCostPerT: 9800, priceEquivalentPerKg: 21, needLabel: "High", usableAbsorptionPct: 96 },
  { id: "nd-mumbai", name: "Vashi APMC, Mumbai", district: "Maharashtra", geo: CITY_GEO.Mumbai, kind: "market", capacityT: 35, demandDeficit: 92, distanceKm: 980, transportCostPerT: 8200, priceEquivalentPerKg: 22, needLabel: "High", usableAbsorptionPct: 95 },
  { id: "nd-chennai", name: "Koyambedu Market, Chennai", district: "Tamil Nadu", geo: CITY_GEO.Chennai, kind: "market", capacityT: 28, demandDeficit: 86, distanceKm: 290, transportCostPerT: 4200, priceEquivalentPerKg: 20, needLabel: "Medium", usableAbsorptionPct: 94 },
  { id: "nd-hyderabad", name: "Hyderabad Processing Cluster", district: "Telangana", geo: CITY_GEO.Hyderabad, kind: "processor", capacityT: 22, demandDeficit: 84, distanceKm: 500, transportCostPerT: 5600, priceEquivalentPerKg: 18, needLabel: "High", usableAbsorptionPct: 93 },
  { id: "nd-kolkata", name: "Kolkata Community Network", district: "West Bengal", geo: CITY_GEO.Kolkata, kind: "community", capacityT: 18, demandDeficit: 98, distanceKm: 1500, transportCostPerT: 10200, priceEquivalentPerKg: 15, needLabel: "Very High", usableAbsorptionPct: 99 },
];

// ---- Traceability batch for the Kolar scenario ----------------

export const BATCH: Batch = {
  id: "KF-TOM-1026",
  forecastId: CANONICAL_FORECAST_ID,
  crop: "Tomato",
  predictedT: 15.2,
  events: [
    { id: "t1", label: "Forecast raised", actor: "FoodFlow Engine", location: "Kolar", quantityT: 15.2, timestamp: "Today 05:40", status: "complete", hash: "0x9f12…a3e7" },
    { id: "t2", label: "Farmer cluster confirmed", actor: "Kolar Belt FPO", location: "Kolar", quantityT: 15.2, timestamp: "Today 06:12", status: "complete", hash: "0x4c88…17bd" },
    { id: "t3", label: "Collection aggregated", actor: "Collection Center 3", location: "Kolar", quantityT: 15.2, timestamp: "Today 07:55", status: "complete", hash: "0xa1d0…9f42" },
    { id: "t4", label: "Allocation optimized", actor: "FoodFlow Engine", location: "Kolar", quantityT: 15.2, timestamp: "Today 08:10", status: "complete", hash: "0x77be…c201" },
    { id: "t5", label: "In transit — Bengaluru leg", actor: "Fleet KA-05", location: "Hoskote Road", quantityT: 4.0, timestamp: "Today 09:30", status: "active", hash: "0x2e55…b8aa" },
    { id: "t6", label: "Recipient confirmation", actor: "Community Kitchens", location: "Whitefield", quantityT: 3.2, timestamp: "ETA Today 12:30", status: "pending", hash: "pending" },
  ],
};

// ---- Recipients (NGO / processor incoming view) ---------------

export const RECIPIENTS: Recipient[] = [
  { id: "rc-ck", name: "Community Kitchens Network", type: "Community Kitchen", incomingCrop: "Tomato", incomingT: 3.2, etaHours: 4.33, usableWindowHours: 52, status: "accepted" },
  { id: "rc-blr", name: "Bengaluru Wholesale Market", type: "Market", incomingCrop: "Tomato", incomingT: 4.0, etaHours: 4.17, usableWindowHours: 44, status: "offered" },
  { id: "rc-proc", name: "Mysuru Processing Facility", type: "Processor", incomingCrop: "Tomato", incomingT: 5.0, etaHours: 6.0, usableWindowHours: 96, status: "offered" },
  { id: "rc-fb", name: "Hopebridge Food Bank", type: "Food Bank", incomingCrop: "Potato", incomingT: 2.1, etaHours: 2.5, usableWindowHours: 120, status: "received" },
];

// ---- Commodity price board (full market, not only surplus crops) ----
export interface Commodity {
  id: string;
  name: string;
  emoji: string;
  group: "Vegetable" | "Fruit";
  price: number; // modal ₹/kg
  trend: number; // 7-day % change
  arrivalsT: number; // today's mandi arrivals (tonnes)
  watch: boolean; // under active FoodFlow surplus watch
}

export const COMMODITIES: Commodity[] = [
  { id: "c-tomato", name: "Tomato", emoji: "🍅", group: "Vegetable", price: 18, trend: -12, arrivalsT: 412, watch: true },
  { id: "c-onion", name: "Onion", emoji: "🧅", group: "Vegetable", price: 24, trend: 6, arrivalsT: 865, watch: true },
  { id: "c-potato", name: "Potato", emoji: "🥔", group: "Vegetable", price: 13, trend: -8, arrivalsT: 740, watch: true },
  { id: "c-cabbage", name: "Cabbage", emoji: "🥬", group: "Vegetable", price: 12, trend: -5, arrivalsT: 188, watch: true },
  { id: "c-cauliflower", name: "Cauliflower", emoji: "🥦", group: "Vegetable", price: 14, trend: -6, arrivalsT: 164, watch: true },
  { id: "c-brinjal", name: "Brinjal", emoji: "🍆", group: "Vegetable", price: 22, trend: 3, arrivalsT: 132, watch: false },
  { id: "c-okra", name: "Okra", emoji: "🌿", group: "Vegetable", price: 28, trend: 4, arrivalsT: 96, watch: false },
  { id: "c-peas", name: "Green Peas", emoji: "🫛", group: "Vegetable", price: 30, trend: -4, arrivalsT: 121, watch: true },
  { id: "c-carrot", name: "Carrot", emoji: "🥕", group: "Vegetable", price: 26, trend: 2, arrivalsT: 108, watch: false },
  { id: "c-beetroot", name: "Beetroot", emoji: "🧆", group: "Vegetable", price: 20, trend: 1, arrivalsT: 54, watch: false },
  { id: "c-spinach", name: "Spinach", emoji: "🥬", group: "Vegetable", price: 16, trend: 7, arrivalsT: 72, watch: false },
  { id: "c-chilli", name: "Green Chilli", emoji: "🌶️", group: "Vegetable", price: 82, trend: -6, arrivalsT: 88, watch: true },
  { id: "c-capsicum", name: "Capsicum", emoji: "🫑", group: "Vegetable", price: 40, trend: 2, arrivalsT: 67, watch: false },
  { id: "c-ginger", name: "Ginger", emoji: "🫚", group: "Vegetable", price: 95, trend: 9, arrivalsT: 44, watch: false },
  { id: "c-garlic", name: "Garlic", emoji: "🧄", group: "Vegetable", price: 110, trend: 12, arrivalsT: 51, watch: false },
  { id: "c-cucumber", name: "Cucumber", emoji: "🥒", group: "Vegetable", price: 18, trend: -3, arrivalsT: 119, watch: false },
  { id: "c-pumpkin", name: "Pumpkin", emoji: "🎃", group: "Vegetable", price: 14, trend: 0, arrivalsT: 83, watch: false },
  { id: "c-bottlegourd", name: "Bottle Gourd", emoji: "🥒", group: "Vegetable", price: 16, trend: -2, arrivalsT: 76, watch: false },
  { id: "c-bittergourd", name: "Bitter Gourd", emoji: "🥒", group: "Vegetable", price: 34, trend: 3, arrivalsT: 41, watch: false },
  { id: "c-radish", name: "Radish", emoji: "🥬", group: "Vegetable", price: 12, trend: -4, arrivalsT: 63, watch: false },
  { id: "c-coriander", name: "Coriander", emoji: "🌿", group: "Vegetable", price: 40, trend: 15, arrivalsT: 38, watch: false },
  { id: "c-beans", name: "Beans", emoji: "🫛", group: "Vegetable", price: 38, trend: 1, arrivalsT: 57, watch: false },
  { id: "c-mango", name: "Mango", emoji: "🥭", group: "Fruit", price: 40, trend: -3, arrivalsT: 146, watch: true },
  { id: "c-banana", name: "Banana", emoji: "🍌", group: "Fruit", price: 17, trend: 6, arrivalsT: 203, watch: true },
  { id: "c-grapes", name: "Grapes", emoji: "🍇", group: "Fruit", price: 46, trend: -8, arrivalsT: 98, watch: true },
  { id: "c-pomegranate", name: "Pomegranate", emoji: "🍎", group: "Fruit", price: 82, trend: 5, arrivalsT: 61, watch: true },
  { id: "c-apple", name: "Apple", emoji: "🍎", group: "Fruit", price: 60, trend: -6, arrivalsT: 112, watch: true },
  { id: "c-orange", name: "Orange", emoji: "🍊", group: "Fruit", price: 48, trend: 2, arrivalsT: 89, watch: false },
  { id: "c-papaya", name: "Papaya", emoji: "🍈", group: "Fruit", price: 22, trend: 1, arrivalsT: 74, watch: false },
  { id: "c-guava", name: "Guava", emoji: "🍐", group: "Fruit", price: 30, trend: 4, arrivalsT: 52, watch: false },
  { id: "c-watermelon", name: "Watermelon", emoji: "🍉", group: "Fruit", price: 14, trend: -5, arrivalsT: 167, watch: false },
  { id: "c-sapota", name: "Sapota", emoji: "🟤", group: "Fruit", price: 36, trend: 3, arrivalsT: 29, watch: false },
];

// ---- Predictive alerts (notification feed) --------------------
export type AlertKind = "rise" | "fall" | "risk" | "weather" | "demand";

export interface Alert {
  id: string;
  kind: AlertKind;
  title: string; // minimal: subject + delta + where + when
  detail: string; // revealed on expand
  time: string;
}

export const ALERTS: Alert[] = [
  { id: "a1", kind: "rise", title: "Onion ↑ ~12% · Nashik · 48h", detail: "Arrivals easing as the glut clears; modal price expected to firm over the next two days. Hold-and-grade lots may benefit.", time: "2m ago" },
  { id: "a2", kind: "risk", title: "Tomato · Kolar · waste risk 87", detail: "15.2T surplus forming within 72h on a +38% arrivals surge and softening local demand. Intervention window is closing.", time: "22m ago" },
  { id: "a3", kind: "fall", title: "Potato ↓ ~8% · Agra · 60h", detail: "Cold-store unloading wave lifting arrivals +31% while processor intake is fully contracted. Expect spot prices to ease.", time: "1h ago" },
  { id: "a4", kind: "demand", title: "Demand spike · Bengaluru market", detail: "Wholesale pull up sharply for the week — strong absorption headroom for redirected tomato lots.", time: "2h ago" },
  { id: "a5", kind: "weather", title: "Rain forecast · Nashik · dispatch risk", detail: "Showers likely over the next 36h may slow onion dispatch. Consider pre-cooling and earlier pickup slots.", time: "3h ago" },
  { id: "a6", kind: "rise", title: "Grapes ↑ ~9% · Sangli · 72h", detail: "Export container slots freeing up; firmer realized value likely for pre-cooled, export-grade bunches.", time: "5h ago" },
];

// Monthly trend used on the Impact Center (deterministic series).
export const IMPACT_TREND = [
  { month: "May", preserved: 18, waste: 41 },
  { month: "Jun", preserved: 24, waste: 36 },
  { month: "Jul", preserved: 31, waste: 33 },
  { month: "Aug", preserved: 44, waste: 28 },
  { month: "Sep", preserved: 52, waste: 24 },
  { month: "Oct", preserved: 61, waste: 19 },
];
