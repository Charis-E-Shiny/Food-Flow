import { DEMAND_NODES } from "./mockData";
import { KOLAR_SCENARIO } from "./scenario";
import { transitLossFraction } from "@/lib/engine";

// ============================================================
// The quantity chain for the active batch — the single source of
// truth distinguishing PREDICTED → ALLOCATED → DISPATCHED → RECEIVED
// → VERIFIED-USED food. Used by both the Verify and Impact screens so
// projected (modeled) impact is never shown as measured.
//
// ⚠ Demo scenario. "received"/"verified" here come from a deterministic
// delivery state, not real receipts. In production these are reconciled
// from actual dispatch/weighbridge/recipient-confirmation records.
// ============================================================

export type ReconStatus = "received" | "in_transit" | "dispatched";

// Deterministic delivery state of the active Kolar rescue.
const RECON_STATUS: Record<string, ReconStatus> = {
  "dn-kolar-local": "received",
  "dn-community-kitchens": "received",
  "dn-blr-market": "in_transit",
  "dn-mysuru-processor": "dispatched",
};

export interface ReconLeg {
  nodeId: string;
  nodeName: string;
  allocatedT: number;
  dispatchedT: number; // left the source
  receivedT: number | null; // arrived (after transit loss); null if not yet
  verifiedUsedT: number | null; // confirmed by recipient; null if not yet
  discrepancyT: number | null; // allocated − received
  status: ReconStatus;
}

export const RECON: ReconLeg[] = KOLAR_SCENARIO.allocation.legs.map((leg) => {
  const node = DEMAND_NODES.find((n) => n.id === leg.nodeId)!;
  const status = RECON_STATUS[leg.nodeId] ?? "dispatched";
  const dispatchedT = leg.quantityT; // everything allocated has left the source
  const receivedT =
    status === "received"
      ? +(leg.quantityT * (node.usableAbsorptionPct / 100) * (1 - transitLossFraction(node.distanceKm))).toFixed(1)
      : null;
  // verified-used = recipient-confirmed usable quantity (== received for confirmed legs here)
  const verifiedUsedT = receivedT;
  return {
    nodeId: leg.nodeId,
    nodeName: leg.nodeName,
    allocatedT: leg.quantityT,
    dispatchedT,
    receivedT,
    verifiedUsedT,
    discrepancyT: receivedT != null ? +(leg.quantityT - receivedT).toFixed(1) : null,
    status,
  };
});

export const CHAIN = {
  predictedT: KOLAR_SCENARIO.forecast.predictedQuantityT,
  allocatedT: KOLAR_SCENARIO.allocation.allocatedT,
  dispatchedT: +RECON.reduce((a, r) => a + r.dispatchedT, 0).toFixed(1),
  receivedT: +RECON.reduce((a, r) => a + (r.receivedT ?? 0), 0).toFixed(1),
  verifiedUsedT: +RECON.reduce((a, r) => a + (r.verifiedUsedT ?? 0), 0).toFixed(1),
  verifiedLegs: RECON.filter((r) => r.receivedT != null).length,
  totalLegs: RECON.length,
};

// Impact assumptions — exposed in the UI so projections are auditable.
export const IMPACT_ASSUMPTIONS = [
  "Meals-equivalent ≈ 0.4 kg edible food per meal.",
  "Emissions ≈ 2.6 tCO₂e avoided per tonne of food loss averted.",
  "Farmer value = realized destination value − distress-sale value (₹6/kg).",
  "Projected figures assume the full allocation is delivered within the usable window.",
];
