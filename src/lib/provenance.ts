// Data provenance — so the UI can always tell the user whether a number
// is a live observation, historical, a model output, a heuristic estimate,
// or demo/simulation. Never label fallback/demo data as "Live".

export type Provenance = "live" | "historical" | "model" | "heuristic" | "demo";

export const PROVENANCE_META: Record<Provenance, { label: string; tone: "ok" | "demand" | "brand" | "warn" | "neutral"; help: string }> = {
  live: { label: "Live", tone: "ok", help: "Live observation from an external source" },
  historical: { label: "Historical", tone: "demand", help: "Historical observation from an external source" },
  model: { label: "Model", tone: "brand", help: "Output of a trained model" },
  heuristic: { label: "Estimate", tone: "warn", help: "Transparent heuristic estimate, not yet independently validated" },
  demo: { label: "Demo data", tone: "neutral", help: "Illustrative simulation — not measured real-world data" },
};

export function freshness(retrievedAt?: string | null, staleAfterHours = 6): { stale: boolean; ageLabel: string } {
  if (!retrievedAt) return { stale: true, ageLabel: "unknown" };
  const ms = Date.now() - new Date(retrievedAt).getTime();
  if (Number.isNaN(ms)) return { stale: true, ageLabel: "unknown" };
  const mins = Math.max(0, Math.round(ms / 60000));
  const ageLabel = mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.round(mins / 60)}h ago` : `${Math.round(mins / 1440)}d ago`;
  return { stale: ms > staleAfterHours * 3600_000, ageLabel };
}
