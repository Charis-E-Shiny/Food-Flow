import { describe, it, expect } from "vitest";
import { quintalToKg, parseNum, canonName, isoDate, normalizeMarketRecord } from "@/lib/normalize";

describe("normalization", () => {
  it("converts ₹/quintal to ₹/kg", () => {
    expect(quintalToKg(1800)).toBe(18);
    expect(quintalToKg(null)).toBeNull();
    expect(quintalToKg(Number.NaN)).toBeNull();
  });

  it("parses dirty numeric values", () => {
    expect(parseNum("1,250")).toBe(1250);
    expect(parseNum("₹18/kg")).toBe(18);
    expect(parseNum("NR")).toBeNull();
    expect(parseNum("-")).toBeNull();
    expect(parseNum(42)).toBe(42);
    expect(parseNum(null)).toBeNull();
  });

  it("canonicalizes names", () => {
    expect(canonName("  TOMATO  local ")).toBe("Tomato Local");
    expect(canonName(undefined)).toBe("");
  });

  it("normalizes dates to ISO", () => {
    expect(isoDate("08/10/2026")).toBe("2026-10-08");
    expect(isoDate("2026-10-08")).toBe("2026-10-08");
    expect(isoDate("garbage")).toBeNull();
  });

  it("normalizes a full Agmarknet record with missing values", () => {
    const n = normalizeMarketRecord({
      market: "kolar ",
      commodity: "Tomato",
      arrival_date: "08/10/2026",
      min_price: "1,500",
      max_price: "2,000",
      modal_price: "NR",
    });
    expect(n).toEqual({
      market: "Kolar",
      commodity: "Tomato",
      date: "2026-10-08",
      minKg: 15,
      maxKg: 20,
      modalKg: null,
    });
  });
});
