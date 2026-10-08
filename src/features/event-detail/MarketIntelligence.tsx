import {
  Area,
  AreaChart,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, TrendingUp } from "lucide-react";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { ProvenanceBadge } from "@/components/ui/ProvenanceBadge";
import { marketSeries } from "@/data/market";
import type { SurplusForecast } from "@/types";
import { rupeesPerKg } from "@/lib/format";

export function MarketIntelligence({ forecast }: { forecast: SurplusForecast }) {
  const m = marketSeries(forecast);
  const volTone = m.volatility > 55 ? "risk" : m.volatility > 30 ? "warn" : "ok";
  const volLabel = m.volatility > 55 ? "High" : m.volatility > 30 ? "Moderate" : "Low";
  const maxNearby = Math.max(...m.nearby.map((n) => n.price), m.todayPrice);

  return (
    <Card className="p-5">
      <SectionTitle
        eyebrow="Market intelligence"
        title="Mandi price & arrivals"
        sub="Agmarknet-style modal price, forecast and arrivals. Simulated — the Agmarknet API is not reachable in this build (see DATA.md)."
        right={
          <div className="flex items-center gap-1.5">
            <Badge tone={m.forecastDirection === "up" ? "ok" : m.forecastDirection === "down" ? "risk" : "neutral"} dot>
              {m.forecastDirection === "up" ? "firming" : m.forecastDirection === "down" ? "easing" : "flat"}
            </Badge>
            <ProvenanceBadge kind="demo" />
          </div>
        }
      />

      {/* signal chips */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Chip label="Today modal" value={rupeesPerKg(m.todayPrice)} />
        <Chip label="Volatility" value={`${m.volatility} · ${volLabel}`} tone={volTone} />
        <Chip label="Seasonality" value={m.seasonality} />
        <Chip label="Anomaly" value={m.anomaly.flag ? "Detected" : "None"} tone={m.anomaly.flag ? "risk" : "ok"} />
      </div>

      {m.anomaly.flag && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-risk/20 bg-risk-soft px-3 py-2 text-sm text-risk">
          <AlertTriangle size={15} /> {m.anomaly.label}
        </div>
      )}

      {/* price chart */}
      <div className="mt-5">
        <div className="mb-1 flex items-center gap-4 text-[11px] text-ink-2">
          <Leg color="rgb(var(--c-brand))" label="Modal price" />
          <Leg color="rgb(var(--c-brand))" dashed label="Forecast" />
          <Leg color="rgb(var(--c-ink-3))" dotted label="Confidence range" />
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={m.price} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="mPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--c-brand))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="rgb(var(--c-brand))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "rgb(var(--c-ink-3))" }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 11, fill: "rgb(var(--c-ink-3))" }} axisLine={false} tickLine={false} width={40} unit="" />
              <Tooltip content={<PriceTip />} />
              <Area type="monotone" dataKey="price" stroke="rgb(var(--c-brand))" strokeWidth={2.4} fill="url(#mPrice)" connectNulls dot={false} name="Modal" />
              <Line type="monotone" dataKey="hi" stroke="rgb(var(--c-ink-3))" strokeWidth={1} strokeDasharray="2 3" dot={false} connectNulls name="High" />
              <Line type="monotone" dataKey="lo" stroke="rgb(var(--c-ink-3))" strokeWidth={1} strokeDasharray="2 3" dot={false} connectNulls name="Low" />
              <Line type="monotone" dataKey="fc" stroke="rgb(var(--c-brand))" strokeWidth={2.2} strokeDasharray="5 3" dot={false} connectNulls name="Forecast" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {/* arrivals */}
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
            <Activity size={13} /> Mandi arrivals (t/day)
          </div>
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={m.arrivals} margin={{ top: 6, right: 6, left: -26, bottom: 0 }}>
                <defs>
                  <linearGradient id="mArr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--c-warn))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="rgb(var(--c-warn))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" hide />
                <YAxis tick={{ fontSize: 10, fill: "rgb(var(--c-ink-3))" }} axisLine={false} tickLine={false} width={34} />
                <Tooltip content={<ArrTip />} />
                <Area type="monotone" dataKey="t" stroke="rgb(var(--c-warn))" strokeWidth={2} fill="url(#mArr)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-warn">
            <TrendingUp size={13} /> arrivals {forecast.arrivalChangePct >= 0 ? "+" : ""}{forecast.arrivalChangePct}% vs seasonal norm
          </div>
        </div>

        {/* nearby comparison */}
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-3">Nearby markets</div>
          <div className="space-y-1.5">
            {m.nearby.map((n) => (
              <div key={n.name} className="flex items-center gap-2 text-sm">
                <span className="w-24 shrink-0 truncate text-ink-2">{n.name}</span>
                <div className="relative h-5 flex-1 overflow-hidden rounded bg-surface-2">
                  <div className="h-full rounded bg-brand-soft/60" style={{ width: `${(n.price / maxNearby) * 100}%` }} />
                </div>
                <span className="nums w-12 shrink-0 text-right font-semibold text-ink">{rupeesPerKg(n.price)}</span>
                <span className={"nums flex w-12 shrink-0 items-center justify-end gap-0.5 text-xs " + (n.delta >= 0 ? "text-ok" : "text-risk")}>
                  {n.delta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {Math.abs(n.delta).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-ink-3">Δ vs {forecast.location} modal ({rupeesPerKg(m.todayPrice)})</p>
        </div>
      </div>
    </Card>
  );
}

function Chip({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "ok" | "warn" | "risk" }) {
  const tones = { neutral: "text-ink", ok: "text-ok", warn: "text-warn", risk: "text-risk" };
  return (
    <div className="rounded-xl border border-line bg-surface-2 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-ink-3">{label}</div>
      <div className={"text-sm font-semibold " + tones[tone]}>{value}</div>
    </div>
  );
}

function Leg({ color, label, dashed, dotted }: { color: string; label: string; dashed?: boolean; dotted?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-0 w-4" style={{ borderTop: `2px ${dotted ? "dotted" : dashed ? "dashed" : "solid"} ${color}` }} />
      {label}
    </span>
  );
}

function PriceTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const p = payload.find((x: any) => x.value != null);
  const fc = payload.find((x: any) => x.dataKey === "fc" && x.value != null);
  return (
    <div className="rounded-lg border border-line bg-surface p-2.5 text-xs shadow-pop">
      <div className="mb-0.5 font-semibold text-ink">{label}</div>
      {payload.find((x: any) => x.dataKey === "price" && x.value != null) && (
        <div className="text-ink-2">Modal <span className="nums font-semibold text-ink">{rupeesPerKg(payload.find((x: any) => x.dataKey === "price").value)}</span></div>
      )}
      {fc && <div className="text-ink-2">Forecast <span className="nums font-semibold text-brand">{rupeesPerKg(fc.value)}</span></div>}
      {!p && null}
    </div>
  );
}
function ArrTip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs shadow-pop">
      <span className="nums font-semibold text-ink">{payload[0].value}T</span> <span className="text-ink-3">/ day</span>
    </div>
  );
}
