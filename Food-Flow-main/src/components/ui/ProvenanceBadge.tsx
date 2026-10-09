import { Badge } from "./index";
import { PROVENANCE_META, type Provenance } from "@/lib/provenance";

export function ProvenanceBadge({ kind, note, className }: { kind: Provenance; note?: string; className?: string }) {
  const m = PROVENANCE_META[kind];
  return (
    <span title={m.help} className="inline-flex">
      <Badge tone={m.tone} dot={kind === "live"} className={className}>
        {m.label}
        {note ? ` · ${note}` : ""}
      </Badge>
    </span>
  );
}
