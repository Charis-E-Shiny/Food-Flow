import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Target, TrendingUp } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Card, SectionTitle, Badge, bandTone, bandLabel, LinkButton } from "@/components/ui";
import { getForecast, CANONICAL_FORECAST_ID } from "@/data/mockData";
import { CROP_META } from "@/data/images";
import { MarketIntelligence } from "./MarketIntelligence";
import { WeatherPanel } from "./WeatherPanel";
import { rupeesPerKg, tonnes, hours } from "@/lib/format";
import type { SurplusForecast } from "@/types";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const f = getForecast(id ?? "");

  if (!f) {
    return (
      <div className="py-20 text-center">
        <p className="text-ink-2">Surplus event not found.</p>
        <LinkButton to="/command" variant="secondary" className="mt-4">
          Back to Command Center
        </LinkButton>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink"
      >
        <ArrowLeft size={15} /> Back
      </button>

      <PageHead
        title={`${CROP_META[f.crop].emoji} ${f.location} ${f.crop} Surplus`}
        sub={`${f.district} · forecast horizon ${hours(f.horizonHours)} · confidence ${f.confidence}%`}
        actions={
          <Badge tone={bandTone[f.band]} dot className="px-3 py-1.5 text-sm">
            {bandLabel[f.band]}
          </Badge>
        }
      />

      {/* A. Overview */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <OverviewTile value={tonnes(f.predictedQuantityT)} label="Predicted surplus" accent="brand" />
        <OverviewTile value={hours(f.horizonHours)} label="Time to intervention" accent="warn" />
        <OverviewTile value={`${f.wasteRisk}/100`} label="Waste risk" accent="risk" />
      </div>

      {/* Live weather (real) + market intelligence (simulated) */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <WeatherPanel forecast={f} />
        <MarketIntelligence forecast={f} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        {/* B. Why flagged */}
        <Card className="p-5">
          <SectionTitle
            eyebrow="Explainability"
            title="Why FoodFlow flagged this"
            sub="Simulated factor contributions to the waste-risk score. They sum to the score — not model weights."
          />
          <div className="mt-5 space-y-3.5">
            {f.factors
              .slice()
              .sort((a, b) => b.contribution - a.contribution)
              .map((factor, i) => (
                <div key={factor.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">{factor.label}</span>
                    <span className="nums font-semibold text-ink">+{factor.contribution}</span>
                  </div>
                  <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
                    <motion.div
                      className="h-full rounded-full bg-brand"
                      initial={{ width: 0 }}
                      animate={{ width: `${(factor.contribution / f.wasteRisk) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.1 * i }}
                      style={{ background: i === 0 ? "rgb(var(--c-risk))" : i < 2 ? "rgb(var(--c-warn))" : "rgb(var(--c-brand))" }}
                    />
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-3">{factor.detail}</p>
                </div>
              ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-surface-2 px-4 py-2.5">
            <span className="text-sm font-medium text-ink-2">Total waste-risk score</span>
            <span className="nums text-lg font-bold text-risk">{f.wasteRisk}/100</span>
          </div>
        </Card>

        <div className="space-y-4">
          {/* C. Timeline */}
          <Card className="p-5">
            <SectionTitle eyebrow="Window" title="Intervention timeline" />
            <Timeline forecast={f} />
          </Card>

          {/* D. Price vs usable value */}
          <Card className="p-5">
            <SectionTitle
              eyebrow="Signature concept"
              title="Price vs. usable value"
              sub="Highest predicted price ≠ highest realized value."
            />
            <PriceValue forecast={f} />
          </Card>
        </div>
      </div>

      {/* E. Harvest Decision Engine */}
      <div className="mt-4">
        <HarvestDecision forecast={f} />
      </div>

      {/* CTA */}
      <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-2xl border border-brand/25 bg-brand-tint p-5 sm:flex-row">
        <div>
          <div className="text-base font-semibold text-brand-strong">Ready to act on this event</div>
          <p className="text-sm text-brand-strong/80">
            Run the allocation optimizer to place this surplus across the best destinations.
          </p>
        </div>
        <LinkButton to={f.id === CANONICAL_FORECAST_ID ? "/optimize" : "/optimize"} size="lg">
          <Target size={18} /> Optimize rescue <ArrowRight size={16} />
        </LinkButton>
      </div>
    </div>
  );
}

function OverviewTile({ value, label, accent }: { value: string; label: string; accent: "brand" | "warn" | "risk" }) {
  const bar = { brand: "bg-brand", warn: "bg-warn", risk: "bg-risk" }[accent];
  return (
    <Card className="relative overflow-hidden p-5">
      <span className={`absolute left-0 top-5 h-10 w-1 rounded-r-full ${bar}`} />
      <div className="nums pl-3 text-3xl font-extrabold tracking-tight text-ink">{value}</div>
      <div className="pl-3 text-sm text-ink-2">{label}</div>
    </Card>
  );
}

function Timeline({ forecast }: { forecast: SurplusForecast }) {
  const steps = [
    { t: 0, label: "Today", note: "Forecast raised" },
    { t: 24, label: "+24h", note: "Confirm & aggregate" },
    { t: 48, label: "+48h", note: "Dispatch window" },
    { t: forecast.horizonHours, label: `+${forecast.horizonHours}h`, note: "Intervention deadline" },
    { t: forecast.spoilageWindowHours, label: "Window closes", note: "Grade loss", end: true },
  ];
  const max = Math.max(...steps.map((s) => s.t));
  return (
    <div className="mt-5">
      <div className="relative ml-1">
        <div className="absolute left-[7px] top-1 h-[calc(100%-0.5rem)] w-0.5 bg-line" />
        <div className="space-y-4">
          {steps.map((s, i) => (
            <div key={i} className="relative flex items-start gap-3 pl-6">
              <span
                className={
                  "absolute left-0 top-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface " +
                  (s.end ? "bg-risk" : i === 0 ? "bg-brand" : "bg-warn")
                }
                style={{ boxShadow: "0 0 0 2px rgb(var(--c-line))" }}
              />
              <div className="flex flex-1 items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-ink">{s.label}</div>
                  <div className="text-xs text-ink-3">{s.note}</div>
                </div>
                <div className="nums text-xs text-ink-3">{Math.round((s.t / max) * 100)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PriceValue({ forecast }: { forecast: SurplusForecast }) {
  const loss = forecast.priceIfHeld - forecast.spoilageAdjustedValue;
  const lossPct = Math.round((loss / forecast.priceIfHeld) * 100);
  const rows = [
    { label: "Expected price if held", value: forecast.priceIfHeld, tone: "ink-3", note: "nominal ₹/kg in 72h" },
    { label: "Spoilage-adjusted value", value: forecast.spoilageAdjustedValue, tone: "risk", note: "what you actually realize" },
  ];
  const maxV = forecast.priceIfHeld;
  return (
    <div className="mt-4">
      {rows.map((r) => (
        <div key={r.label} className="mb-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-2">{r.label}</span>
            <span className={"nums font-bold " + (r.tone === "risk" ? "text-risk" : "text-ink")}>
              {rupeesPerKg(r.value)}
            </span>
          </div>
          <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-surface-2">
            <motion.div
              className={"h-full rounded-full " + (r.tone === "risk" ? "bg-risk" : "bg-ink-3")}
              initial={{ width: 0 }}
              animate={{ width: `${(r.value / maxV) * 100}%` }}
              transition={{ duration: 0.9 }}
            />
          </div>
          <div className="mt-0.5 text-[11px] text-ink-3">{r.note}</div>
        </div>
      ))}
      <div className="mt-3 rounded-xl border border-warn/25 bg-warn-soft p-3 text-sm text-ink">
        <span className="font-semibold text-warn">−{lossPct}% value erosion</span> if the lot is held
        for a higher nominal price. The highest predicted price is not the highest realized value.
      </div>
    </div>
  );
}

// ---- Harvest Decision Engine --------------------------------------
function HarvestDecision({ forecast }: { forecast: SurplusForecast }) {
  const redirectEquivalent = Math.round((forecast.sellNowPrice + forecast.spoilageAdjustedValue) / 2);
  const recommended: "sellNow" | "hold" | "redirect" = forecast.band === "stable" ? "sellNow" : "redirect";

  const options = [
    {
      key: "sellNow" as const,
      title: "Sell now",
      price: forecast.sellNowPrice,
      risk: "Low",
      riskTone: "ok" as const,
      realized: forecast.sellNowPrice,
      note: "Clears limited local volume during a glut",
    },
    {
      key: "hold" as const,
      title: "Hold",
      price: forecast.priceIfHeld,
      risk: "High",
      riskTone: "risk" as const,
      realized: forecast.spoilageAdjustedValue,
      note: "Higher nominal price, spoilage erodes realized value",
    },
    {
      key: "redirect" as const,
      title: "Redirect",
      price: redirectEquivalent,
      risk: "Low",
      riskTone: "ok" as const,
      realized: redirectEquivalent,
      note: "Spread across destinations, high absorption certainty",
    },
  ];

  const reason =
    recommended === "redirect"
      ? "Waiting for a higher nominal price increases expected spoilage risk beyond the value gained. Redirecting clears the full volume within the usable window at a reliable realized value."
      : "Demand is stable and spoilage risk is low — a direct sale realizes the best value with minimal coordination.";

  return (
    <Card className="p-5">
      <SectionTitle
        eyebrow="Harvest decision engine"
        title="Sell now · Hold · Redirect"
        sub="Decision-support simulation comparing realized value, not nominal price."
        right={<Badge tone="brand" dot>Recommends {options.find((o) => o.key === recommended)!.title}</Badge>}
      />
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {options.map((o) => {
          const isRec = o.key === recommended;
          return (
            <div
              key={o.key}
              className={
                "relative rounded-2xl border p-4 transition-all " +
                (isRec ? "border-brand bg-brand-tint/60 shadow-lift" : "border-line bg-surface")
              }
            >
              {isRec && (
                <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  <Check size={11} /> Recommended
                </span>
              )}
              <div className="text-sm font-semibold text-ink">{o.title}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="nums text-2xl font-extrabold text-ink">{rupeesPerKg(o.price)}</span>
                {o.key === "hold" && <span className="text-[11px] text-ink-3">nominal</span>}
              </div>
              <div className="mt-3 space-y-1.5 text-xs">
                <Row label="Spoilage risk">
                  <Badge tone={o.riskTone} className="px-1.5 py-0.5 text-[10px]">
                    {o.risk}
                  </Badge>
                </Row>
                <Row label="Realized value">
                  <span className={"nums font-semibold " + (o.key === "hold" ? "text-risk" : "text-ink")}>
                    {rupeesPerKg(o.realized)}
                  </span>
                </Row>
              </div>
              <p className="mt-3 border-t border-line pt-2 text-[11px] leading-relaxed text-ink-3">
                {o.note}
              </p>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-start gap-2 rounded-xl border border-brand/25 bg-brand-tint px-4 py-3 text-sm text-brand-strong">
        <TrendingUp size={16} className="mt-0.5 shrink-0" />
        <span>{reason}</span>
      </div>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-3">{label}</span>
      {children}
    </div>
  );
}
