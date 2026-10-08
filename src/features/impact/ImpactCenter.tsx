import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronRight, Info, Leaf, Recycle, Wheat } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { StatTile } from "@/components/ui/StatTile";
import { Counterfactual } from "./Counterfactual";
import { ModelPerformance } from "./ModelPerformance";
import { IMPACT_METRICS } from "@/data/scenario";
import { IMPACT_TREND } from "@/data/mockData";
import { CHAIN, IMPACT_ASSUMPTIONS } from "@/data/delivery";
import { compact, tonnes } from "@/lib/format";
import type { ImpactMetric } from "@/types";

const STAGES: { key: keyof typeof CHAIN; label: string }[] = [
  { key: "predictedT", label: "Predicted" },
  { key: "allocatedT", label: "Allocated" },
  { key: "dispatchedT", label: "Dispatched" },
  { key: "receivedT", label: "Received" },
  { key: "verifiedUsedT", label: "Verified-used" },
];

const OUTCOMES = [
  { title: "Food security", icon: Wheat, body: "Surplus routed to community kitchens and food banks inside the usable window — edible food reaches people instead of landfill." },
  { title: "Less waste", icon: Recycle, body: "Allocation optimization minimizes avoidable loss across the chain by clearing volume before grade loss." },
  { title: "Lower emissions", icon: Leaf, body: "Avoided decomposition and shorter, smarter routing cut the carbon footprint of food loss." },
];

export default function ImpactCenter() {
  return (
    <div>
      <PageHead
        eyebrow="08 · Measure Impact"
        title="Impact"
        sub="What difference did we make? Every metric answers what changed because FoodFlow intervened."
      />

      {/* Quantity chain — distinguishes measured stages from projection */}
      <Card className="p-5">
        <SectionTitle
          eyebrow="Quantity chain · batch KF-TOM-1026"
          title="Predicted → allocated → dispatched → received → verified-used"
          sub="Only received & verified-used are confirmed. Impact below is projected from the allocation plan, not measured."
          right={<Badge tone="neutral">{CHAIN.verifiedLegs}/{CHAIN.totalLegs} legs verified</Badge>}
        />
        <div className="mt-4 flex flex-wrap items-stretch gap-2">
          {STAGES.map((s, i) => {
            const confirmed = s.key === "receivedT" || s.key === "verifiedUsedT";
            return (
              <div key={s.key} className="flex items-center gap-2">
                <div className={"rounded-xl border px-4 py-2.5 text-center " + (confirmed ? "border-ok/30 bg-ok-soft" : "border-line bg-surface-2")}>
                  <div className="nums text-lg font-bold text-ink">{tonnes(CHAIN[s.key] as number)}</div>
                  <div className="text-[11px] text-ink-3">{s.label}{confirmed ? " ✓" : ""}</div>
                </div>
                {i < STAGES.length - 1 && <ChevronRight size={16} className="shrink-0 text-ink-3" />}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Projected impact metrics */}
      <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-ink">
        Projected impact
        <Badge tone="warn" className="px-1.5 py-0.5 text-[10px]">Projection · model simulation</Badge>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {IMPACT_METRICS.map((m) => (
          <ImpactTile key={m.id} m={m} />
        ))}
      </div>

      {/* Assumptions disclosure */}
      <Card className="mt-4 p-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-3">
          <Info size={13} /> Assumptions behind these figures
        </div>
        <ul className="mt-2 grid gap-1.5 text-sm text-ink-2 sm:grid-cols-2">
          {IMPACT_ASSUMPTIONS.map((a) => (
            <li key={a} className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-3" />{a}</li>
          ))}
        </ul>
      </Card>

      {/* Trained price-forecast model — real data, held-out metrics */}
      <div className="mt-4">
        <ModelPerformance />
      </div>

      {/* Counterfactual */}
      <div className="mt-4">
        <Counterfactual />
      </div>

      {/* Trend + SDG */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-5">
          <SectionTitle
            eyebrow="Pilot trajectory"
            title="Preserved vs. waste, by month"
            sub="Cumulative tonnes preserved rising as waste falls across the pilot."
            right={<Badge tone="neutral">6-month pilot</Badge>}
          />
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={IMPACT_TREND} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPreserved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--c-brand))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="rgb(var(--c-brand))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gWaste" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--c-risk))" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="rgb(var(--c-risk))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--c-line))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "rgb(var(--c-ink-3))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "rgb(var(--c-ink-3))" }} axisLine={false} tickLine={false} unit="T" width={44} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="preserved" name="Preserved" stroke="rgb(var(--c-brand))" strokeWidth={2.5} fill="url(#gPreserved)" />
                <Area type="monotone" dataKey="waste" name="Waste" stroke="rgb(var(--c-risk))" strokeWidth={2} fill="url(#gWaste)" strokeDasharray="4 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-ink-2">
            <Legend color="rgb(var(--c-brand))" label="Tonnes preserved" />
            <Legend color="rgb(var(--c-risk))" label="Tonnes wasted" dashed />
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle eyebrow="Why it matters" title="What the numbers deliver" />
          <div className="mt-4 space-y-3">
            {OUTCOMES.map((o) => {
              const Icon = o.icon;
              return (
                <div key={o.title} className="flex gap-3 rounded-xl border border-line bg-surface-2 p-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand text-white">
                    <Icon size={18} />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-ink">{o.title}</div>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-2">{o.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ImpactTile({ m }: { m: ImpactMetric }) {
  const isCurrency = m.unit === "₹";
  const accent = m.sdg === 13 ? "demand" : m.sdg === 12 ? "brand" : "warn";
  return (
    <StatTile
      label={m.label}
      value={m.value}
      decimals={m.unit === "tonnes" || m.unit === "tCO₂e" ? 1 : 0}
      prefix={isCurrency ? "₹" : undefined}
      unit={m.unit === "₹" ? undefined : m.unit === "tonnes" ? "T" : m.unit === "tCO₂e" ? "tCO₂e" : m.unit === "meals" ? "meals" : m.unit}
      delta={m.deltaLabel}
      deltaTone="ink-3"
      accent={accent as "brand" | "warn" | "demand"}
      hint=""
    />
  );
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-surface p-3 text-xs shadow-pop">
      <div className="mb-1 font-semibold text-ink">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-ink-2">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="nums font-semibold text-ink">{compact(p.value)}T</span>
        </div>
      ))}
    </div>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-0.5 w-4"
        style={{ background: dashed ? "none" : color, borderTop: dashed ? `2px dashed ${color}` : undefined }}
      />
      {label}
    </span>
  );
}
