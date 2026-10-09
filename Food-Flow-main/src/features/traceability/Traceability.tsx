import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown, Clock, Loader2, MapPin, ShieldCheck, Truck } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Card, SectionTitle, Badge, LinkButton } from "@/components/ui";
import { BATCH } from "@/data/mockData";
import { KOLAR_SCENARIO } from "@/data/scenario";
import { tonnes } from "@/lib/format";
import type { TraceEvent, TraceStatus } from "@/types";
import { cn } from "@/lib/cn";

const statusMeta: Record<TraceStatus, { tone: "ok" | "warn" | "neutral"; icon: typeof Check; label: string }> = {
  complete: { tone: "ok", icon: Check, label: "Verified" },
  active: { tone: "warn", icon: Loader2, label: "In progress" },
  pending: { tone: "neutral", icon: Clock, label: "Pending" },
};

export default function Traceability() {
  return (
    <div>
      <PageHead
        eyebrow="06 · Trace"
        title="Chain of custody"
        sub="Where has it been? A tamper-evident record of each batch from forecast to recipient."
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Batch</div>
              <div className="font-mono text-xl font-bold tracking-tight text-ink">{BATCH.id}</div>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div>
                <div className="nums text-lg font-bold text-ink">{tonnes(BATCH.predictedT)}</div>
                <div className="text-[11px] text-ink-3">predicted</div>
              </div>
              <div>
                <div className="nums text-lg font-bold text-brand">
                  {tonnes(KOLAR_SCENARIO.allocation.allocatedT)}
                </div>
                <div className="text-[11px] text-ink-3">allocated</div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {KOLAR_SCENARIO.allocation.legs.map((l) => (
              <span key={l.nodeId} className="rounded-lg bg-surface-2 px-2.5 py-1 text-xs text-ink-2">
                {tonnes(l.quantityT)} → {l.nodeName.split(" ")[0]}
              </span>
            ))}
          </div>

          <SectionTitle className="mt-6" eyebrow="Chain of custody" title="Batch timeline" />
          <div className="mt-4">
            {BATCH.events.map((e, i) => (
              <TraceRow key={e.id} event={e} last={i === BATCH.events.length - 1} />
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <SectionTitle eyebrow="Verify" title="Batch record" sub="Scan or open to view this batch's chain of custody." />
            <div className="mt-4 flex items-center gap-4">
              <QrCode seed={BATCH.id} />
              <div className="text-sm">
                <div className="font-mono font-semibold text-ink">{BATCH.id}</div>
                <p className="mt-1 text-xs leading-relaxed text-ink-3">
                  Each event is hash-linked to the previous one. In production this writes to a
                  permissioned ledger; here it is a simulated tamper-evident chain.
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-brand">
                  <ShieldCheck size={14} /> Chain intact · {BATCH.events.filter((e) => e.status === "complete").length}/{BATCH.events.length} verified
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Truck size={16} className="text-demand" /> Live legs
            </div>
            <div className="mt-3 space-y-2">
              {KOLAR_SCENARIO.allocation.legs.map((l) => (
                <div key={l.nodeId} className="flex items-center justify-between rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm">
                  <span className="flex items-center gap-1.5 text-ink-2">
                    <MapPin size={13} className="text-ink-3" /> {l.nodeName.split(" ").slice(0, 2).join(" ")}
                  </span>
                  <span className="nums text-ink">{tonnes(l.quantityT)}</span>
                </div>
              ))}
            </div>
            <LinkButton to="/recipient" variant="secondary" size="sm" className="mt-4 w-full">
              Open recipient confirmations
            </LinkButton>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TraceRow({ event, last }: { event: TraceEvent; last: boolean }) {
  const [open, setOpen] = useState(false);
  const meta = statusMeta[event.status];
  const Icon = meta.icon;
  return (
    <div className="relative pl-9">
      {!last && <span className="absolute left-[14px] top-7 h-[calc(100%-1rem)] w-0.5 bg-line" />}
      <span
        className={cn(
          "absolute left-0 top-1 grid h-7 w-7 place-items-center rounded-full border-2 border-surface",
          event.status === "complete" && "bg-ok-soft text-ok",
          event.status === "active" && "bg-warn-soft text-warn",
          event.status === "pending" && "bg-surface-2 text-ink-3",
        )}
        style={{ boxShadow: "0 0 0 2px rgb(var(--c-line))" }}
      >
        <Icon size={14} className={event.status === "active" ? "animate-spin" : ""} />
      </span>
      <div className="pb-5">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <div>
            <div className="text-sm font-semibold text-ink">{event.label}</div>
            <div className="text-xs text-ink-3">
              {event.actor} · {event.location}
              {event.quantityT != null && <> · {tonnes(event.quantityT)}</>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="nums text-xs text-ink-3">{event.timestamp}</span>
            <ChevronDown size={14} className={cn("text-ink-3 transition-transform", open && "rotate-180")} />
          </div>
        </button>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-2 overflow-hidden rounded-lg border border-line bg-surface-2 p-3"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-3">Ledger record</span>
              <Badge tone={meta.tone} className="px-1.5 py-0.5 text-[10px]">{meta.label}</Badge>
            </div>
            <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-[11px] text-ink-2">
              <span className="text-ink-3">hash</span>
              <span className="truncate">{event.hash}</span>
              <span className="text-ink-3">actor</span>
              <span>{event.actor}</span>
              <span className="text-ink-3">geo</span>
              <span>{event.location}, Karnataka</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/** Deterministic QR-like glyph derived from the batch id (decorative). */
function QrCode({ seed }: { seed: string }) {
  const size = 11;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const cells: boolean[] = [];
  let state = h >>> 0;
  for (let i = 0; i < size * size; i++) {
    state = (Math.imul(state, 1103515245) + 12345) & 0x7fffffff;
    cells.push((state >> 8) % 100 < 48);
  }
  const isFinder = (r: number, c: number) => {
    const inBox = (br: number, bc: number) => r >= br && r < br + 3 && c >= bc && c < bc + 3;
    return inBox(0, 0) || inBox(0, size - 3) || inBox(size - 3, 0);
  };
  return (
    <div className="shrink-0 rounded-xl border border-line bg-white p-2.5" aria-label={`QR for batch ${seed}`}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-24 w-24">
        {cells.map((on, i) => {
          const r = Math.floor(i / size);
          const c = i % size;
          const show = isFinder(r, c) ? true : isFinder(r, c) === false && (on && !nearFinder(r, c, size));
          if (!show) return null;
          return <rect key={i} x={c} y={r} width={1} height={1} fill="rgb(var(--c-ink))" />;
        })}
      </svg>
    </div>
  );
}
function nearFinder(r: number, c: number, size: number) {
  const inBox = (br: number, bc: number) => r >= br && r < br + 4 && c >= bc && c < bc + 4;
  return inBox(0, 0) || inBox(0, size - 4) || inBox(size - 4, 0);
}
