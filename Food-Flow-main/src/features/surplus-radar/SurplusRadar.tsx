import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Thermometer, TrendingDown, TrendingUp, Clock, Timer } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Card, Badge, Meter, bandTone, bandLabel } from "@/components/ui";
import { FORECASTS } from "@/data/mockData";
import { Img } from "@/components/ui/Img";
import { CROP_META } from "@/data/images";
import { calculateSpoilageRisk } from "@/lib/engine";
import { marketSeries } from "@/data/market";
import { tonnes, hours, pct, rupeesPerKg } from "@/lib/format";
import type { RiskBand, SurplusForecast } from "@/types";

type Filter = "all" | RiskBand;

export default function SurplusRadar() {
  const [filter, setFilter] = useState<Filter>("all");
  const shown = FORECASTS.filter((f) => filter === "all" || f.band === filter).sort(
    (a, b) => b.wasteRisk - a.wasteRisk,
  );

  const filters: Array<[Filter, string]> = [
    ["all", "All"],
    ["high", "High risk"],
    ["emerging", "Emerging"],
    ["stable", "Stable"],
  ];

  return (
    <div>
      <PageHead
        eyebrow="01 · Predict"
        title="Surplus forecast"
        sub="Where will surplus happen? Ranked predictions across India's producing regions."
        actions={
          <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1">
            {filters.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors " +
                  (filter === key ? "bg-brand-tint text-brand-strong" : "text-ink-2 hover:text-ink")
                }
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((f) => (
          <ForecastCard key={f.id} f={f} />
        ))}
      </div>
    </div>
  );
}

function ForecastCard({ f }: { f: SurplusForecast }) {
  const spoilage = calculateSpoilageRisk(f.spoilageWindowHours, f.temperatureC);
  const riskColor = f.band === "high" ? "risk" : f.band === "emerging" ? "warn" : "ok";
  const market = marketSeries(f);
  const spark = market.price.map((p) => p.price).filter((v): v is number => v != null);

  return (
    <Card interactive className="flex flex-col overflow-hidden p-0">
      <div className="relative h-28 w-full">
        <Img src={CROP_META[f.crop].image} alt={`${f.crop} harvest`} className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/35 to-transparent" />
        <div className="absolute left-4 top-4">
          <Badge tone={bandTone[f.band]} dot>{bandLabel[f.band]}</Badge>
        </div>
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-2">{f.district}</div>
            <div className="flex items-center gap-1.5 text-lg font-bold tracking-tight text-ink">
              <span className="text-xl leading-none">{CROP_META[f.crop].emoji}</span>
              {f.location} · {f.crop}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
      <div className="flex items-end justify-between">
        <div>
          <div className="nums text-3xl font-extrabold tracking-tight text-ink">
            {tonnes(f.predictedQuantityT)}
          </div>
          <div className="text-xs text-ink-3">predicted surplus</div>
        </div>
        <div className="text-right">
          <div className="nums text-3xl font-extrabold" style={{ color: `rgb(var(--c-${riskColor}))` }}>
            {f.wasteRisk}
          </div>
          <div className="text-xs text-ink-3">waste risk / 100</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <Metric icon={<Clock size={14} />} label="Forecast horizon" value={hours(f.horizonHours)} />
        <Metric icon={<Timer size={14} />} label="Usable window" value={hours(f.spoilageWindowHours)} />
        <Metric
          icon={f.arrivalChangePct >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          label="Arrivals"
          value={pct(f.arrivalChangePct, true)}
          tone={f.arrivalChangePct > 20 ? "risk" : "ink"}
        />
        <Metric
          icon={f.demandChangePct >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          label="Demand"
          value={pct(f.demandChangePct, true)}
          tone={f.demandChangePct < 0 ? "risk" : "ink"}
        />
        <Metric icon={<Thermometer size={14} />} label="Temperature" value={`${f.temperatureC}°C`} />
        <Metric label="Confidence" value={`${f.confidence}%`} icon={<span className="text-xs">◇</span>} />
      </div>

      {/* Mandi price strip */}
      <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-surface-2 px-3 py-2">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-ink-3">Modal price · today</div>
          <div className="nums text-sm font-bold text-ink">{rupeesPerKg(market.todayPrice)}</div>
        </div>
        <Sparkline points={spark} />
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wide text-ink-3">Volatility</div>
          <div className={"nums text-sm font-bold " + (market.volatility > 55 ? "text-risk" : market.volatility > 30 ? "text-warn" : "text-ok")}>{market.volatility}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-ink-2">Spoilage risk</span>
          <span className="nums font-semibold text-ink">{spoilage}/100</span>
        </div>
        <Meter value={spoilage} tone={spoilage > 65 ? "risk" : spoilage > 40 ? "warn" : "ok"} />
      </div>

      {/* Explainable factors */}
      <div className="mt-4 border-t border-line pt-3">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
          Why flagged
        </div>
        <div className="flex flex-wrap gap-1.5">
          {f.factors
            .slice()
            .sort((a, b) => b.contribution - a.contribution)
            .slice(0, 3)
            .map((factor) => (
              <span
                key={factor.id}
                className="inline-flex items-center gap-1 rounded-lg bg-surface-2 px-2 py-1 text-[11px] text-ink-2"
              >
                {factor.label}
                <span className="nums font-semibold text-ink">+{factor.contribution}</span>
              </span>
            ))}
        </div>
      </div>

      <Link
        to={`/event/${f.id}`}
        className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-brand transition-all hover:gap-2"
      >
        Open surplus event <ArrowRight size={15} />
      </Link>
      </div>
    </Card>
  );
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const w = 72;
  const h = 24;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${((i / (points.length - 1)) * w).toFixed(1)} ${(h - ((p - min) / span) * h).toFixed(1)}`)
    .join(" ");
  const down = points[points.length - 1] < points[0];
  const color = down ? "rgb(var(--c-risk))" : "rgb(var(--c-ok))";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-6 w-20" preserveAspectRatio="none" aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Metric({
  icon,
  label,
  value,
  tone = "ink",
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  tone?: "ink" | "risk";
}) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-2.5 py-2">
      <div className="flex items-center gap-1 text-[11px] text-ink-3">
        {icon}
        {label}
      </div>
      <div className={"nums mt-0.5 text-sm font-semibold " + (tone === "risk" ? "text-risk" : "text-ink")}>
        {value}
      </div>
    </div>
  );
}
