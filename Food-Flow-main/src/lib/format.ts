// Formatting helpers. All currency is INR; all mass is metric tonnes.

export function tonnes(n: number, digits = 1): string {
  return `${n.toFixed(digits)}T`;
}

export function rupees(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function rupeesPerKg(n: number): string {
  return `₹${n.toFixed(0)}/kg`;
}

export function pct(n: number, withSign = false): string {
  const s = withSign && n > 0 ? "+" : "";
  return `${s}${Math.round(n)}%`;
}

export function hours(h: number): string {
  if (h >= 24) {
    const d = Math.floor(h / 24);
    const r = Math.round(h % 24);
    return r ? `${d}d ${r}h` : `${d}d`;
  }
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  return mins ? `${whole}h ${mins}m` : `${whole}h`;
}

/** Compact large counts: 12,400 → "12.4K". */
export function compact(n: number): string {
  return new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}
