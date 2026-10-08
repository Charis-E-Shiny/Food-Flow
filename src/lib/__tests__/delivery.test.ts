import { describe, it, expect } from "vitest";
import { CHAIN, RECON } from "@/data/delivery";

describe("delivery quantity chain (predicted → … → verified-used)", () => {
  it("is monotonically non-increasing down the chain", () => {
    expect(CHAIN.predictedT).toBeGreaterThanOrEqual(CHAIN.allocatedT);
    expect(CHAIN.allocatedT).toBeGreaterThanOrEqual(CHAIN.dispatchedT);
    expect(CHAIN.dispatchedT).toBeGreaterThanOrEqual(CHAIN.receivedT);
    expect(CHAIN.receivedT).toBeGreaterThanOrEqual(CHAIN.verifiedUsedT);
  });

  it("per-leg: allocated ≥ dispatched ≥ received, discrepancy = allocated − received", () => {
    for (const r of RECON) {
      expect(r.allocatedT).toBeGreaterThanOrEqual(r.dispatchedT - 1e-6);
      if (r.receivedT != null) {
        expect(r.dispatchedT).toBeGreaterThanOrEqual(r.receivedT - 1e-6);
        expect(r.discrepancyT).toBeCloseTo(+(r.allocatedT - r.receivedT).toFixed(1), 1);
      } else {
        expect(r.discrepancyT).toBeNull();
      }
    }
  });

  it("leg sums reconcile with chain totals", () => {
    const disp = +RECON.reduce((a, r) => a + r.dispatchedT, 0).toFixed(1);
    const recv = +RECON.reduce((a, r) => a + (r.receivedT ?? 0), 0).toFixed(1);
    expect(disp).toBeCloseTo(CHAIN.dispatchedT, 1);
    expect(recv).toBeCloseTo(CHAIN.receivedT, 1);
    expect(CHAIN.verifiedLegs).toBe(RECON.filter((r) => r.receivedT != null).length);
  });

  it("received never exceeds the predicted quantity", () => {
    expect(CHAIN.receivedT).toBeLessThanOrEqual(CHAIN.predictedT);
  });
});
