import { useState } from "react";
import { Factory, Store, Users, Sprout } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Card, SectionTitle, Badge, Meter } from "@/components/ui";
import { SurplusMap, type Flow } from "@/components/map/SurplusMap";
import { FORECASTS, DEMAND_NODES, NATIONAL_DEMAND } from "@/data/mockData";
import { KOLAR_SCENARIO, PORTFOLIO } from "@/data/scenario";
import { tonnes } from "@/lib/format";
import type { DemandNode } from "@/types";

const kindMeta: Record<DemandNode["kind"], { icon: typeof Store; label: string }> = {
  market: { icon: Store, label: "Markets" },
  processor: { icon: Factory, label: "Processing" },
  community: { icon: Users, label: "Community" },
};

export default function NeedMap() {
  const [showSurplus, setShowSurplus] = useState(true);
  const [showDemand, setShowDemand] = useState(true);
  const [kinds, setKinds] = useState<Record<DemandNode["kind"], boolean>>({
    market: true,
    processor: true,
    community: true,
  });
  const [selected, setSelected] = useState<string | null>(KOLAR_SCENARIO.forecast.id);

  const allNodes = [...DEMAND_NODES, ...NATIONAL_DEMAND];
  const activeNodes = allNodes.filter((n) => kinds[n.kind]);
  const flows: Flow[] =
    selected && showDemand
      ? KOLAR_SCENARIO.allocation.legs
          .filter((l) => kinds[l.kind])
          .map((l) => {
            const node = DEMAND_NODES.find((n) => n.id === l.nodeId)!;
            return { from: KOLAR_SCENARIO.forecast.geo, to: node.geo, quantityT: l.quantityT };
          })
      : [];

  return (
    <div>
      <PageHead
        eyebrow="03 · Find Demand"
        title="Where food is needed"
        sub="Who needs the food? Demand and absorbable capacity mapped against surplus."
      />

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-4">
          <SectionTitle
            eyebrow="Supply ↔ need"
            title="Layered regional view"
            right={
              <div className="flex flex-wrap items-center gap-1.5">
                <LayerToggle active={showSurplus} onClick={() => setShowSurplus((v) => !v)} icon={<Sprout size={13} />}>
                  Surplus
                </LayerToggle>
                <LayerToggle active={showDemand} onClick={() => setShowDemand((v) => !v)} icon={<Users size={13} />}>
                  Demand
                </LayerToggle>
              </div>
            }
          />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(Object.keys(kindMeta) as DemandNode["kind"][]).map((k) => {
              const Icon = kindMeta[k].icon;
              return (
                <LayerToggle
                  key={k}
                  active={kinds[k] && showDemand}
                  onClick={() => setKinds((prev) => ({ ...prev, [k]: !prev[k] }))}
                  icon={<Icon size={13} />}
                  small
                >
                  {kindMeta[k].label}
                </LayerToggle>
              );
            })}
          </div>
          <div className="mt-4">
            <SurplusMap
              forecasts={FORECASTS}
              demandNodes={activeNodes}
              showSurplus={showSurplus}
              showDemand={showDemand}
              flows={flows}
              selectedId={selected ?? undefined}
              onSelect={(id) => setSelected((s) => (s === id ? null : id))}
            />
          </div>
          <p className="mt-3 text-[11px] text-ink-3">
            Select a surplus marker to preview the destinations its food could reach. Flow lines show
            the optimized allocation for the Kolar scenario.
          </p>
        </Card>

        <Card className="flex flex-col p-4">
          <SectionTitle eyebrow="Demand & capacity" title="Where food is needed" />
          <div className="mt-4 space-y-2.5">
            {activeNodes.map((n) => {
              const Icon = kindMeta[n.kind].icon;
              const needTone = n.needLabel === "Very High" ? "risk" : n.needLabel === "High" ? "warn" : "demand";
              return (
                <div key={n.id} className="rounded-xl border border-line bg-surface p-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <Icon size={15} className="text-demand" />
                      {n.name}
                    </span>
                    <Badge tone={needTone as "risk" | "warn" | "demand"} className="px-1.5 py-0.5 text-[10px]">
                      {n.needLabel}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-ink-3">
                    <span>absorbable capacity</span>
                    <span className="nums font-semibold text-ink">{tonnes(n.capacityT)}</span>
                  </div>
                  <Meter value={n.demandDeficit} tone="demand" className="mt-1.5" />
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-xl border border-demand/20 bg-demand-soft p-3 text-sm text-demand">
            Network absorbable capacity:{" "}
            <span className="nums font-bold">{tonnes(activeNodes.reduce((a, n) => a + n.capacityT, 0))}</span>{" "}
            against {tonnes(PORTFOLIO.predictedSurplusT)} predicted surplus across India.
          </div>
        </Card>
      </div>
    </div>
  );
}

function LayerToggle({
  active,
  onClick,
  icon,
  children,
  small,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-medium transition-colors " +
        (small ? "text-[11px] " : "text-xs ") +
        (active
          ? "border-brand/30 bg-brand-tint text-brand-strong"
          : "border-line bg-surface text-ink-3 hover:text-ink")
      }
      aria-pressed={active}
    >
      {icon}
      {children}
    </button>
  );
}
