import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, Target } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Card, Badge, Meter, bandTone, bandLabel } from "@/components/ui";
import { FORECASTS } from "@/data/mockData";
import { calculateSpoilageRisk } from "@/lib/engine";
import { CROP_META } from "@/data/images";
import { tonnes, hours, pct } from "@/lib/format";
import type { RiskBand, SurplusForecast } from "@/types";
import { cn } from "@/lib/cn";

type Filter = "all" | RiskBand;

export default function RiskBoard() {
  const [filter, setFilter] = useState<Filter>("all");
  const rows = FORECASTS.filter((f) => filter === "all" || f.band === filter).sort((a, b) => b.wasteRisk - a.wasteRisk);
  const filters: Array<[Filter, string]> = [
    ["all", "All"],
    ["high", "High"],
    ["emerging", "Emerging"],
    ["stable", "Stable"],
  ];

  return (
    <div>
      <PageHead
        eyebrow="02 · Assess Risk"
        title="Risk board"
        sub="How serious is it? Events ranked by waste risk — open any row for the reasoning."
        actions={
          <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1">
            {filters.map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-colors", filter === k ? "bg-brand-tint text-brand-strong" : "text-ink-2 hover:text-ink")}>
                {l}
              </button>
            ))}
          </div>
        }
      />

      <Card className="overflow-hidden p-0">
        {/* column header */}
        <div className="hidden grid-cols-[1.6fr_0.7fr_0.7fr_1.1fr_auto] gap-3 border-b border-line bg-surface-2 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-3 sm:grid">
          <span>Event</span>
          <span className="text-right">Surplus</span>
          <span className="text-right">Window</span>
          <span>Waste risk</span>
          <span />
        </div>
        {rows.map((f) => (
          <RiskRow key={f.id} f={f} />
        ))}
      </Card>
    </div>
  );
}

function RiskRow({ f }: { f: SurplusForecast }) {
  const [open, setOpen] = useState(false);
  const tone = f.band === "high" ? "risk" : f.band === "emerging" ? "warn" : "ok";
  const spoilage = calculateSpoilageRisk(f.spoilageWindowHours, f.temperatureC);

  return (
    <div className="border-b border-line last:border-b-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="grid w-full grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-left hover:bg-surface-2 sm:grid-cols-[1.6fr_0.7fr_0.7fr_1.1fr_auto]"
      >
        <span className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-lg">{CROP_META[f.crop].emoji}</span>
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-ink">{f.location} · {f.crop}</span>
              <Badge tone={bandTone[f.band]} className="hidden px-1.5 py-0.5 text-[10px] sm:inline-flex">{bandLabel[f.band]}</Badge>
            </span>
            <span className="truncate text-[11px] text-ink-3">{f.district}</span>
          </span>
        </span>
        <span className="nums hidden text-right text-sm font-semibold text-ink sm:block">{tonnes(f.predictedQuantityT)}</span>
        <span className="nums hidden text-right text-sm text-ink-2 sm:block">{hours(f.spoilageWindowHours)}</span>
        <span className="hidden items-center gap-2 sm:flex">
          <Meter value={f.wasteRisk} tone={tone as "risk" | "warn" | "ok"} className="flex-1" />
          <span className="nums w-7 text-right text-sm font-bold" style={{ color: `rgb(var(--c-${tone}))` }}>{f.wasteRisk}</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="nums text-lg font-bold sm:hidden" style={{ color: `rgb(var(--c-${tone}))` }}>{f.wasteRisk}</span>
          <ChevronDown size={16} className={cn("text-ink-3 transition-transform", open && "rotate-180")} />
        </span>
      </button>

      {open && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden bg-surface-2/60">
          <div className="grid gap-5 px-4 py-4 sm:grid-cols-[1.3fr_1fr]">
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-3">Why this risk</div>
              <div className="space-y-2.5">
                {f.factors.slice().sort((a, b) => b.contribution - a.contribution).map((factor, i) => (
                  <div key={factor.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-ink">{factor.label}</span>
                      <span className="nums font-semibold text-ink">+{factor.contribution}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface">
                      <div className="h-full rounded-full" style={{ width: `${(factor.contribution / f.wasteRisk) * 100}%`, background: i === 0 ? "rgb(var(--c-risk))" : i < 2 ? "rgb(var(--c-warn))" : "rgb(var(--c-brand))" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="grid grid-cols-2 gap-2">
                <Fact label="Arrivals" value={pct(f.arrivalChangePct, true)} />
                <Fact label="Demand" value={pct(f.demandChangePct, true)} />
                <Fact label="Temperature" value={`${f.temperatureC}°C`} />
                <Fact label="Spoilage risk" value={`${spoilage}/100`} />
                <Fact label="Horizon" value={hours(f.horizonHours)} />
                <Fact label="Confidence" value={`${f.confidence}%`} />
              </div>
              <div className="mt-3 flex gap-2">
                <Link to={`/event/${f.id}`} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line-strong bg-surface px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-2">
                  Open event <ArrowRight size={14} />
                </Link>
                <Link to="/optimize" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-strong">
                  <Target size={14} /> Optimize
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-2.5 py-1.5">
      <div className="text-[10px] text-ink-3">{label}</div>
      <div className="nums text-sm font-semibold text-ink">{value}</div>
    </div>
  );
}
