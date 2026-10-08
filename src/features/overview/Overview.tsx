import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, ArrowUpRight, Boxes, PackageCheck, Sprout, TrendingDown } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Card, SectionTitle, Badge, bandTone, bandLabel } from "@/components/ui";
import { StatTile } from "@/components/ui/StatTile";
import { SurplusMap } from "@/components/map/SurplusMap";
import { FORECASTS, DEMAND_NODES, NATIONAL_DEMAND, ALERTS } from "@/data/mockData";
import { PORTFOLIO } from "@/data/scenario";
import { CROP_META } from "@/data/images";
import { tonnes, hours } from "@/lib/format";
import type { SurplusForecast } from "@/types";

export default function Overview() {
  const navigate = useNavigate();
  const capacity = [...DEMAND_NODES, ...NATIONAL_DEMAND].reduce((a, n) => a + n.capacityT, 0);
  const top = [...FORECASTS].filter((f) => f.band !== "stable").sort((a, b) => b.wasteRisk - a.wasteRisk).slice(0, 4);

  return (
    <div>
      <PageHead
        eyebrow="00 · Overview"
        title="Network overview"
        sub="What's happening across the FoodFlow network right now."
        actions={
          <Link to="/predict" className="inline-flex items-center gap-1.5 rounded-xl border border-line-strong bg-surface px-4 py-2 text-sm font-semibold text-ink hover:bg-surface-2">
            Start a prediction <ArrowRight size={15} />
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile label="Predicted surplus" value={PORTFOLIO.predictedSurplusT} decimals={1} unit="T" icon={<Sprout size={16} />} accent="brand" hint="next 7 days" />
        <StatTile label="Food at risk" value={PORTFOLIO.tonnesAtRiskT} decimals={1} unit="T" icon={<AlertTriangle size={16} />} accent="risk" hint="risk-weighted" />
        <StatTile label="Active rescues" value={PORTFOLIO.activeInterventions} icon={<Boxes size={16} />} accent="warn" hint="high-risk events" />
        <StatTile label="Demand capacity" value={capacity} decimals={0} unit="T" icon={<PackageCheck size={16} />} accent="demand" hint="network-wide" />
        <StatTile label="Preserved / event" value={PORTFOLIO.wasteAvoidedT} decimals={1} unit="T" icon={<TrendingDown size={16} />} accent="brand" hint="vs baseline" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-4">
          <SectionTitle
            eyebrow="Network"
            title="Surplus & demand map"
            right={<Link to="/map" className="text-xs font-semibold text-brand hover:underline">Open full map →</Link>}
          />
          <div className="mt-4">
            <SurplusMap
              forecasts={FORECASTS}
              demandNodes={[...DEMAND_NODES, ...NATIONAL_DEMAND]}
              showDemand
              aspect="aspect-square sm:aspect-[5/4]"
              onSelect={(id) => navigate(`/event/${id}`)}
            />
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <SectionTitle
              eyebrow="Act now"
              title="Top predictions"
              right={<Link to="/risk" className="text-xs font-semibold text-brand hover:underline">View all →</Link>}
            />
            <div className="mt-3 space-y-2">
              {top.map((f) => (
                <PredRow key={f.id} f={f} onClick={() => navigate(`/event/${f.id}`)} />
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <SectionTitle eyebrow="Signals" title="Critical alerts" />
            <div className="mt-3 space-y-2">
              {ALERTS.slice(0, 3).map((a) => (
                <div key={a.id} className="flex items-start gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-risk" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink">{a.title}</div>
                    <div className="text-[11px] text-ink-3">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PredRow({ f, onClick }: { f: SurplusForecast; onClick: () => void }) {
  const tone = f.band === "high" ? "risk" : f.band === "emerging" ? "warn" : "ok";
  return (
    <button onClick={onClick} className="group flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-2.5 text-left transition-all hover:border-line-strong hover:shadow-card">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-lg">{CROP_META[f.crop].emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-ink">{f.location}</span>
          <Badge tone={bandTone[f.band]} className="px-1.5 py-0.5 text-[10px]">{bandLabel[f.band]}</Badge>
        </div>
        <div className="nums mt-0.5 text-xs text-ink-2">{f.crop} · {tonnes(f.predictedQuantityT)} · {hours(f.horizonHours)}</div>
      </div>
      <div className="text-right">
        <div className="nums text-lg font-bold" style={{ color: `rgb(var(--c-${tone}))` }}>{f.wasteRisk}</div>
        <div className="text-[9px] text-ink-3">risk</div>
      </div>
      <ArrowUpRight size={15} className="shrink-0 text-ink-3 transition-colors group-hover:text-brand" />
    </button>
  );
}
