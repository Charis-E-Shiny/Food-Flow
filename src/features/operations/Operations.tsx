import { motion } from "framer-motion";
import { Factory, MapPin, PackageCheck, Store, Truck, Users } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { StatTile } from "@/components/ui/StatTile";
import { SurplusMap, type Flow } from "@/components/map/SurplusMap";
import { FORECASTS, DEMAND_NODES } from "@/data/mockData";
import { KOLAR_SCENARIO } from "@/data/scenario";
import { tonnes, hours } from "@/lib/format";
import type { DemandNode } from "@/types";

const kindIcon: Record<DemandNode["kind"], typeof Store> = { market: Store, processor: Factory, community: Users };

// Deterministic shipment state for the active Kolar rescue.
const STATE: Record<string, { status: "Delivered" | "In transit" | "Dispatched"; progress: number }> = {
  "dn-kolar-local": { status: "Delivered", progress: 100 },
  "dn-community-kitchens": { status: "In transit", progress: 64 },
  "dn-blr-market": { status: "In transit", progress: 41 },
  "dn-mysuru-processor": { status: "Dispatched", progress: 12 },
};

const statusTone = { Delivered: "ok", "In transit": "warn", Dispatched: "demand" } as const;

export default function Operations() {
  const { forecast, allocation, nodes } = KOLAR_SCENARIO;
  const delivered = allocation.legs.filter((l) => STATE[l.nodeId]?.status === "Delivered").reduce((a, l) => a + l.quantityT, 0);
  const inTransit = allocation.legs.filter((l) => STATE[l.nodeId]?.status !== "Delivered").reduce((a, l) => a + l.quantityT, 0);
  const flows: Flow[] = allocation.legs.map((l) => ({ from: forecast.geo, to: nodes.find((n) => n.id === l.nodeId)!.geo, quantityT: l.quantityT }));

  return (
    <div>
      <PageHead eyebrow="05 · Route" title="Operations" sub="Is it moving? Live status of the active Kolar tomato rescue across all legs." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="In transit" value={inTransit} decimals={1} unit="T" icon={<Truck size={16} />} accent="warn" />
        <StatTile label="Delivered" value={delivered} decimals={1} unit="T" icon={<PackageCheck size={16} />} accent="brand" />
        <StatTile label="Legs active" value={allocation.legs.length} icon={<MapPin size={16} />} accent="demand" />
        <StatTile label="Batch" value={1} unit="KF-TOM-1026" countUp={false} icon={<Truck size={16} />} accent="brand" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="p-5">
          <SectionTitle eyebrow="Shipments" title="Legs in motion" />
          <div className="mt-4 space-y-3">
            {allocation.legs.map((leg) => {
              const st = STATE[leg.nodeId];
              const Icon = kindIcon[leg.kind];
              return (
                <div key={leg.nodeId} className="rounded-xl border border-line bg-surface p-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-demand-soft text-demand"><Icon size={14} /></span>
                      {leg.nodeName}
                    </span>
                    <Badge tone={statusTone[st.status]} dot>{st.status}</Badge>
                  </div>
                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-surface-2">
                    <motion.div className="h-full rounded-full bg-brand" initial={{ width: 0 }} animate={{ width: `${st.progress}%` }} transition={{ duration: 0.8 }} />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-ink-3">
                    <span className="nums">{tonnes(leg.quantityT)} · {leg.distanceKm} km</span>
                    <span className="nums">ETA {hours(leg.etaHours)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <SectionTitle eyebrow="Routes" title="Active corridors" />
          <div className="mt-4">
            <SurplusMap forecasts={FORECASTS.filter((f) => f.id === forecast.id)} demandNodes={DEMAND_NODES} showDemand flows={flows} selectedId={forecast.id} />
          </div>
        </Card>
      </div>
    </div>
  );
}
