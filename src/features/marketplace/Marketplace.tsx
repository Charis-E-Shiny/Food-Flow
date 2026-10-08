import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Factory, MapPin, Search, Store, Users } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Card, Badge, Meter } from "@/components/ui";
import { COMMODITIES, DEMAND_NODES, NATIONAL_DEMAND, type Commodity } from "@/data/mockData";
import { tonnes, rupeesPerKg } from "@/lib/format";
import type { DemandNode } from "@/types";
import { cn } from "@/lib/cn";

const ORGS = [...DEMAND_NODES, ...NATIONAL_DEMAND].filter((n, i, a) => a.findIndex((m) => m.id === n.id) === i);

export default function Marketplace() {
  const [tab, setTab] = useState<"commodities" | "orgs">("commodities");

  return (
    <div>
      <PageHead
        eyebrow="Tool · Market"
        title="Market"
        sub="Live mandi prices across every commodity, plus the buyers and organizations in the network."
        actions={
          <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1">
            <TabBtn active={tab === "commodities"} onClick={() => setTab("commodities")}>Commodities</TabBtn>
            <TabBtn active={tab === "orgs"} onClick={() => setTab("orgs")}>Buyers & Orgs</TabBtn>
          </div>
        }
      />
      {tab === "commodities" ? <Commodities /> : <Organizations />}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors", active ? "bg-brand text-white" : "text-ink-2 hover:text-ink")}>
      {children}
    </button>
  );
}

// ---- Commodities price board ----
function Commodities() {
  const [group, setGroup] = useState<"all" | Commodity["group"]>("all");
  const [q, setQ] = useState("");
  const rows = COMMODITIES.filter((c) => (group === "all" || c.group === group) && c.name.toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name));
  const groups: Array<["all" | Commodity["group"], string]> = [["all", "All"], ["Vegetable", "Vegetables"], ["Fruit", "Fruits"]];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1">
          {groups.map(([k, l]) => (
            <button key={k} onClick={() => setGroup(k)} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-colors", group === k ? "bg-brand-tint text-brand-strong" : "text-ink-2 hover:text-ink")}>
              {l}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search commodity" className="h-9 w-48 rounded-xl border border-line-strong bg-surface pl-9 pr-3 text-sm text-ink outline-none focus:border-brand" />
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="hidden grid-cols-[1.6fr_0.8fr_0.9fr_0.9fr_0.8fr] gap-3 border-b border-line bg-surface-2 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-3 sm:grid">
          <span>Commodity</span>
          <span className="text-right">Modal price</span>
          <span className="text-right">7-day</span>
          <span className="text-right">Arrivals</span>
          <span className="text-right">Status</span>
        </div>
        {rows.map((c) => {
          const up = c.trend > 0;
          const flat = c.trend === 0;
          return (
            <div key={c.id} className="grid grid-cols-2 items-center gap-2 border-b border-line px-4 py-2.5 text-sm last:border-b-0 hover:bg-surface-2 sm:grid-cols-[1.6fr_0.8fr_0.9fr_0.9fr_0.8fr]">
              <span className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-base">{c.emoji}</span>
                <span>
                  <span className="block font-semibold text-ink">{c.name}</span>
                  <span className="block text-[11px] text-ink-3">{c.group}</span>
                </span>
              </span>
              <span className="nums text-right font-semibold text-ink">{rupeesPerKg(c.price)}</span>
              <span className={cn("nums flex items-center justify-end gap-0.5 text-right font-medium", flat ? "text-ink-3" : up ? "text-ok" : "text-risk")}>
                {!flat && (up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />)}
                {up ? "+" : ""}{c.trend}%
              </span>
              <span className="nums hidden text-right text-ink-2 sm:block">{c.arrivalsT}T</span>
              <span className="flex justify-end">
                {c.watch ? <Badge tone="warn" dot className="px-1.5 py-0.5 text-[10px]">Surplus watch</Badge> : <span className="text-[11px] text-ink-3">—</span>}
              </span>
            </div>
          );
        })}
      </Card>
      <p className="mt-3 text-[11px] text-ink-3">{rows.length} commodities · Agmarknet-style modal prices, illustrative.</p>
    </div>
  );
}

// ---- Organizations directory ----
const kindMeta: Record<DemandNode["kind"], { icon: typeof Store; label: string }> = {
  market: { icon: Store, label: "Market" },
  processor: { icon: Factory, label: "Processor" },
  community: { icon: Users, label: "Community" },
};

function Organizations() {
  const [filter, setFilter] = useState<"all" | DemandNode["kind"]>("all");
  const rows = ORGS.filter((n) => filter === "all" || n.kind === filter).sort((a, b) => b.capacityT - a.capacityT);
  const filters: Array<["all" | DemandNode["kind"], string]> = [["all", "All"], ["market", "Markets"], ["processor", "Processors"], ["community", "Community"]];

  return (
    <div>
      <div className="mb-3 flex items-center gap-1 rounded-xl border border-line bg-surface p-1 w-fit">
        {filters.map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-colors", filter === k ? "bg-brand-tint text-brand-strong" : "text-ink-2 hover:text-ink")}>
            {l}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((n) => {
          const Icon = kindMeta[n.kind].icon;
          const needTone = n.needLabel === "Very High" ? "risk" : n.needLabel === "High" ? "warn" : "demand";
          return (
            <Card key={n.id} interactive className="p-4">
              <div className="flex items-start justify-between">
                <span className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-demand-soft text-demand"><Icon size={18} /></span>
                  <span>
                    <span className="block text-sm font-semibold text-ink">{n.name}</span>
                    <span className="flex items-center gap-1 text-[11px] text-ink-3"><MapPin size={11} /> {n.district}</span>
                  </span>
                </span>
                <Badge tone="neutral" className="px-1.5 py-0.5 text-[10px]">{kindMeta[n.kind].label}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <div className="nums text-xl font-bold text-ink">{tonnes(n.capacityT)}</div>
                  <div className="text-[11px] text-ink-3">absorbable capacity</div>
                </div>
                <div>
                  <div className="nums text-xl font-bold text-ink">{rupeesPerKg(n.priceEquivalentPerKg)}</div>
                  <div className="text-[11px] text-ink-3">realized value</div>
                </div>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-ink-2">Need</span>
                  <Badge tone={needTone as "risk" | "warn" | "demand"} className="px-1.5 py-0.5 text-[10px]">{n.needLabel}</Badge>
                </div>
                <Meter value={n.demandDeficit} tone="demand" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
