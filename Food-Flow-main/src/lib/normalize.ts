// Data normalization helpers for ingested market/weather records.
// Handle inconsistent names, units and missing values robustly.

/** Agmarknet prices are published in ₹/quintal; convert to ₹/kg. */
export function quintalToKg(perQuintal: number | null | undefined): number | null {
  if (perQuintal == null || !Number.isFinite(perQuintal)) return null;
  return +(perQuintal / 100).toFixed(2);
}

/** Parse a possibly-dirty numeric string ("1,250", "₹18/kg", "NR") → number | null. */
export function parseNum(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/[^0-9.\-]/g, "");
  if (s === "" || s === "-" || s === ".") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Canonicalize a commodity/market name: trim, collapse spaces, title-case. */
export function canonName(v: unknown): string {
  return String(v ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Agmarknet arrival_date is "DD/MM/YYYY"; normalize to ISO "YYYY-MM-DD". */
export function isoDate(v: unknown): string | null {
  const s = String(v ?? "").trim();
  const dmy = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  const iso = s.match(/^\d{4}-\d{2}-\d{2}/);
  if (iso) return iso[0];
  return null;
}

export interface NormalizedMarketRecord {
  market: string;
  commodity: string;
  date: string | null;
  minKg: number | null;
  maxKg: number | null;
  modalKg: number | null;
}

/** Normalize a raw OGD/Agmarknet record (₹/quintal) into our ₹/kg schema. */
export function normalizeMarketRecord(rec: Record<string, unknown>): NormalizedMarketRecord {
  return {
    market: canonName(rec.market),
    commodity: canonName(rec.commodity),
    date: isoDate(rec.arrival_date),
    minKg: quintalToKg(parseNum(rec.min_price)),
    maxKg: quintalToKg(parseNum(rec.max_price)),
    modalKg: quintalToKg(parseNum(rec.modal_price)),
  };
}
