import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sprout, Users } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Card } from "@/components/ui";
import { SurplusMap } from "@/components/map/SurplusMap";
import { FORECASTS, DEMAND_NODES, NATIONAL_DEMAND } from "@/data/mockData";
import { PORTFOLIO } from "@/data/scenario";
import { tonnes } from "@/lib/format";

export default function NetworkMap() {
  const navigate = useNavigate();
  const [surplus, setSurplus] = useState(true);
  const [demand, setDemand] = useState(true);
  const capacity = [...DEMAND_NODES, ...NATIONAL_DEMAND].reduce((a, n) => a + n.capacityT, 0);

  return (
    <div>
      <PageHead
        eyebrow="Tool · Network Map"
        title="Network map"
        sub="Explore surplus, demand and active routes across India. Zoom and drag to navigate."
        actions={
          <div className="flex items-center gap-1.5">
            <Toggle active={surplus} onClick={() => setSurplus((v) => !v)} icon={<Sprout size={13} />}>Surplus</Toggle>
            <Toggle active={demand} onClick={() => setDemand((v) => !v)} icon={<Users size={13} />}>Demand</Toggle>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat value={tonnes(PORTFOLIO.predictedSurplusT)} label="predicted surplus" />
        <Stat value={`${FORECASTS.length}`} label="active forecasts" />
        <Stat value={tonnes(capacity)} label="demand capacity" />
        <Stat value={`${PORTFOLIO.highRiskEvents}`} label="high-risk events" />
      </div>

      <Card className="mt-4 p-3">
        <SurplusMap
          forecasts={FORECASTS}
          demandNodes={[...DEMAND_NODES, ...NATIONAL_DEMAND]}
          showSurplus={surplus}
          showDemand={demand}
          aspect="aspect-square sm:aspect-[16/10]"
          onSelect={(id) => navigate(`/event/${id}`)}
        />
      </Card>
    </div>
  );
}

function Toggle({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors " +
        (active ? "border-brand/30 bg-brand-tint text-brand-strong" : "border-line bg-surface text-ink-3 hover:text-ink")
      }
    >
      {icon}
      {children}
    </button>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Card className="p-4">
      <div className="nums text-xl font-bold text-ink">{value}</div>
      <div className="text-xs text-ink-3">{label}</div>
    </Card>
  );
}
