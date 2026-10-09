import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Factory, MapPin, Search, Store, Users, X } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Card, Badge, Meter } from "@/components/ui";
import { ProvenanceBadge } from "@/components/ui/ProvenanceBadge";
import { Img } from "@/components/ui/Img";
import { COMMODITIES, DEMAND_NODES, NATIONAL_DEMAND, type Commodity } from "@/data/mockData";
import { commodityImage, demoPlaces } from "@/data/commodityDetail";
import { useMarketPrices, type PlacePrice } from "@/hooks/useMarketPrices";
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

// Small image/emoji tile — the "lil image" like the Predict cards.
function CommodityThumb({ c, size = "h-9 w-9" }: { c: Commodity; size?: string }) {
  const img = commodityImage(c.name);
  if (img) {
    return (
      <span className={cn("relative shrink-0 overflow-hidden rounded-lg", size)}>
        <Img src={img} alt={c.name} className="h-full w-full" />
      </span>
    );
  }
  return <span className={cn("grid shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-tint to-surface-2 text-base", size)}>{c.emoji}</span>;
}

// ---- Commodities price board ----
function Commodities() {
  const [group, setGroup] = useState<"all" | Commodity["group"]>("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Commodity | null>(null);
  const priceState = useMarketPrices();
  const live = priceState.status === "ready" ? priceState.data.commodities : null;

  const rows = COMMODITIES.filter((c) => (group === "all" || c.group === group) && c.name.toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name));
  const groups: Array<["all" | Commodity["group"], string]> = [["all", "All"], ["Vegetable", "Vegetables"], ["Fruit", "Fruits"]];
  const liveCount = live ? rows.filter((c) => live[c.name]).length : 0;

  // Effective price/trend/provenance for a commodity given the current mode.
  const view = (c: Commodity) => {
    const real = live?.[c.name];
    return real
      ? { price: real.modalPricePerKg, trend: real.trend7dPct, real: true }
      : { price: c.price, trend: c.trend, real: false };
  };

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

      {liveCount > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-ok/30 bg-ok-soft px-3 py-2 text-xs text-ink-2">
          <ProvenanceBadge kind="historical" note="dataset" />
          Live data on — {liveCount} commodities show real modal prices from the agriculture dataset ({priceState.status === "ready" ? priceState.data.span.to : ""}).
        </div>
      )}

      <Card className="overflow-hidden p-0">
        <div className="hidden grid-cols-[1.8fr_0.8fr_0.9fr_0.9fr_0.8fr] gap-3 border-b border-line bg-surface-2 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-3 sm:grid">
          <span>Commodity</span>
          <span className="text-right">Modal price</span>
          <span className="text-right">7-day</span>
          <span className="text-right">Arrivals</span>
          <span className="text-right">Status</span>
        </div>
        {rows.map((c) => {
          const v = view(c);
          const up = v.trend > 0;
          const flat = v.trend === 0;
          return (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className="grid w-full grid-cols-2 items-center gap-2 border-b border-line px-4 py-2.5 text-left text-sm transition-colors last:border-b-0 hover:bg-surface-2 sm:grid-cols-[1.8fr_0.8fr_0.9fr_0.9fr_0.8fr]"
            >
              <span className="flex items-center gap-2.5">
                <CommodityThumb c={c} />
                <span>
                  <span className="flex items-center gap-1.5 font-semibold text-ink">{c.name}{v.real && <span className="h-1.5 w-1.5 rounded-full bg-ok" title="Real dataset price" />}</span>
                  <span className="block text-[11px] text-ink-3">{c.group}</span>
                </span>
              </span>
              <span className="nums text-right font-semibold text-ink">{rupeesPerKg(v.price)}</span>
              <span className={cn("nums flex items-center justify-end gap-0.5 text-right font-medium", flat ? "text-ink-3" : up ? "text-ok" : "text-risk")}>
                {!flat && (up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />)}
                {up ? "+" : ""}{v.trend}%
              </span>
              <span className="nums hidden text-right text-ink-2 sm:block">{c.arrivalsT}T</span>
              <span className="flex justify-end">
                {c.watch ? <Badge tone="warn" dot className="px-1.5 py-0.5 text-[10px]">Surplus watch</Badge> : <span className="text-[11px] text-ink-3">—</span>}
              </span>
            </button>
          );
        })}
      </Card>
      <p className="mt-3 text-[11px] text-ink-3">
        {rows.length} commodities · {liveCount > 0 ? "real dataset prices where available, else illustrative" : "Agmarknet-style modal prices, illustrative — toggle Live data for real dataset prices"}. Tap a commodity for prices by place.
      </p>

      {selected && (
        <CommodityDetail
          c={selected}
          realPlaces={live?.[selected.name]?.places ?? null}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ---- Commodity detail drawer: change place → see that place's price ----
function CommodityDetail({ c, realPlaces, onClose }: { c: Commodity; realPlaces: PlacePrice[] | null; onClose: () => void }) {
  const places = useMemo<PlacePrice[]>(() => realPlaces ?? demoPlaces(c), [c, realPlaces]);
  const [placeIdx, setPlaceIdx] = useState(0);
  const sel = places[placeIdx] ?? places[0];
  const isReal = !!realPlaces;
  const base = isReal ? sel.pricePerKg : c.price;
  const delta = +(sel.pricePerKg - base).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto flex h-full w-full max-w-md flex-col overflow-y-auto bg-surface shadow-pop">
        <div className="relative h-36 w-full shrink-0">
          {commodityImage(c.name) ? (
            <Img src={commodityImage(c.name)!} alt={c.name} className="h-full w-full" />
          ) : (
            <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-tint to-surface-2 text-6xl">{c.emoji}</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent" />
          <button onClick={onClose} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-surface/90 text-ink-2 shadow-card hover:text-ink" aria-label="Close">
            <X size={17} />
          </button>
          <div className="absolute bottom-3 left-4 flex items-center gap-2">
            <span className="text-2xl leading-none">{c.emoji}</span>
            <div>
              <div className="text-lg font-bold tracking-tight text-ink">{c.name}</div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-2">{c.group}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-3">Price by place</span>
            <ProvenanceBadge kind={isReal ? "historical" : "demo"} note={isReal ? "dataset" : undefined} />
          </div>

          {/* Place selector */}
          <label className="mt-2 block">
            <span className="mb-1 flex items-center gap-1.5 text-xs text-ink-2"><MapPin size={12} /> Market / place</span>
            <select
              value={placeIdx}
              onChange={(e) => setPlaceIdx(Number(e.target.value))}
              className="h-11 w-full cursor-pointer rounded-xl border border-line-strong bg-surface px-3 text-sm font-medium text-ink outline-none focus:border-brand"
            >
              {places.map((p, i) => (
                <option key={`${p.market}-${i}`} value={i}>{p.market} · {p.state}</option>
              ))}
            </select>
          </label>

          {/* Selected place price */}
          <div className="mt-4 rounded-2xl border border-line bg-surface-2 p-4">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs text-ink-3">{sel.market}, {sel.state}</div>
                <div className="nums mt-1 text-3xl font-extrabold tracking-tight text-ink">{rupeesPerKg(sel.pricePerKg)}</div>
              </div>
              <div className="text-right text-xs text-ink-3">
                {isReal ? <>as of {sel.date}</> : "illustrative"}
                {!isReal && (
                  <div className={cn("nums mt-1 font-semibold", delta >= 0 ? "text-ok" : "text-risk")}>
                    {delta >= 0 ? "+" : ""}{delta} vs modal
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* All places list */}
          <div className="mt-4 overflow-hidden rounded-xl border border-line">
            <div className="flex items-center justify-between bg-surface-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
              <span>All places{isReal ? "" : " (illustrative)"}</span><span>₹/kg</span>
            </div>
            {places.map((p, i) => (
              <button
                key={`${p.market}-${i}`}
                onClick={() => setPlaceIdx(i)}
                className={cn("flex w-full items-center justify-between border-t border-line px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2", i === placeIdx && "bg-brand-tint/40")}
              >
                <span className="text-ink-2">{p.market} <span className="text-ink-3">· {p.state}</span></span>
                <span className="nums font-semibold text-ink">{rupeesPerKg(p.pricePerKg)}</span>
              </button>
            ))}
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-ink-3">
            {isReal
              ? `Real per-market modal prices from master_aggriculture_dataset.csv.`
              : `Illustrative prices. Toggle Live data (top bar) to see real dataset prices where available.`}
          </p>
        </div>
      </div>
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
