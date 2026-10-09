import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Factory, Gauge, Play, RotateCcw, Store, Target, Users } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Card, SectionTitle, Badge, Button, LinkButton, Meter } from "@/components/ui";
import { AllocationFlow } from "./AllocationFlow";
import { scenarioFor, type Scenario } from "@/data/scenario";
import { FORECASTS, CANONICAL_FORECAST_ID, getForecast } from "@/data/mockData";
import { CROP_META } from "@/data/images";
import { runOptimizer, objectiveOf, toOptInputs } from "@/lib/optimizer";
import { tonnes, hours, rupeesPerKg, rupees } from "@/lib/format";
import type { AllocationLeg, DemandNode } from "@/types";

type Phase = "idle" | "running" | "done";

const kindIcon: Record<DemandNode["kind"], typeof Store> = {
  market: Store,
  processor: Factory,
  community: Users,
};

export default function Optimization() {
  const [params, setParams] = useSearchParams();
  const selectedId = getForecast(params.get("event") ?? "")?.id ?? CANONICAL_FORECAST_ID;
  const scenario = useMemo<Scenario>(() => scenarioFor(getForecast(selectedId)!), [selectedId]);
  const { forecast, nodes, allocation, scoredNodes } = scenario;

  const [phase, setPhase] = useState<Phase>("idle");
  const [activeStep, setActiveStep] = useState(-1);
  const timers = useRef<number[]>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);

  // Reset the animation whenever the selected event changes.
  useEffect(() => {
    clear();
    setPhase("idle");
    setActiveStep(-1);
  }, [selectedId]);

  const selectEvent = (id: string) => setParams(id === CANONICAL_FORECAST_ID ? {} : { event: id }, { replace: true });

  const run = () => {
    clear();
    setPhase("running");
    setActiveStep(-1);
    allocation.legs.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setActiveStep(i), 450 + i * 650));
    });
    timers.current.push(window.setTimeout(() => setPhase("done"), 450 + allocation.legs.length * 650 + 500));
  };

  const reset = () => {
    clear();
    setPhase("idle");
    setActiveStep(-1);
  };

  return (
    <div>
      <PageHead
        eyebrow="04 · Optimize"
        title="Allocation engine"
        sub="Where should it go? Multi-destination optimization that balances urgency, capacity, demand and distance — not just price."
        actions={
          <div className="flex items-center gap-2">
            <EventPicker selectedId={forecast.id} onSelect={selectEvent} />
            {phase === "idle" ? (
              <Button size="lg" onClick={run}>
                <Play size={17} /> Optimize rescue
              </Button>
            ) : (
              <Button size="lg" variant="secondary" onClick={reset}>
                <RotateCcw size={16} /> Reset
              </Button>
            )}
          </div>
        }
      />

      {/* Flow canvas */}
      <Card className="p-4 sm:p-5">
        <SectionTitle
          eyebrow="Allocation flow"
          title="Where the surplus goes"
          right={
            phase === "running" ? (
              <Badge tone="warn" dot>Optimizing…</Badge>
            ) : phase === "done" ? (
              <Badge tone="ok" dot>Solved · score {allocation.avgScore}</Badge>
            ) : (
              <Badge tone="neutral">Ready</Badge>
            )
          }
        />
        <AllocationFlow
          legs={allocation.legs}
          total={allocation.totalAvailableT}
          phase={phase}
          activeStep={activeStep}
          sourceLabel={`${forecast.location} ${forecast.crop}`}
          sourceSub={`window ${hours(forecast.spoilageWindowHours)}`}
        />
        {phase === "idle" && (
          <div className="mt-2 flex flex-col items-center gap-3 border-t border-line pt-4 text-center">
            <p className="max-w-lg text-sm text-ink-2">
              {tonnes(forecast.predictedQuantityT)} of {forecast.crop.toLowerCase()} is at risk in {forecast.location}. Run the optimizer to
              place it across the best destinations before the usable window closes.
            </p>
            <Button size="lg" onClick={run}>
              <Target size={17} /> Optimize rescue
            </Button>
          </div>
        )}
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        {/* Candidate scoring */}
        <Card className="p-5">
          <SectionTitle eyebrow="Candidate destinations" title="Scored on suitability" />
          <div className="mt-4 space-y-2.5">
            {scoredNodes.map(({ node, score }, i) => {
              const Icon = kindIcon[node.kind];
              const revealed = phase === "done" || (phase === "running" && activeStep >= i);
              return (
                <motion.div
                  key={node.id}
                  animate={{ borderColor: phase === "running" && activeStep === i ? "rgb(var(--c-brand))" : "rgb(var(--c-line))" }}
                  className="rounded-xl border bg-surface p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-demand-soft text-demand">
                      <Icon size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink">{node.name}</div>
                      <div className="flex items-center gap-1.5 text-xs text-ink-3">
                        <span>cap {tonnes(node.capacityT)}</span>·<span>{node.distanceKm} km</span>·
                        <span>need {node.needLabel}</span>
                      </div>
                    </div>
                    <AnimatePresence>
                      {revealed && (
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-right">
                          <div className="nums text-lg font-bold text-brand">{score}</div>
                          <div className="text-[10px] text-ink-3">score</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {revealed && <Meter value={score} className="mt-2.5" />}
                </motion.div>
              );
            })}
          </div>
        </Card>

        {/* Result / explanation */}
        <AnimatePresence mode="wait">
          {phase === "done" ? (
            <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-5">
                <SectionTitle
                  eyebrow="Recommended allocation"
                  title={`${tonnes(allocation.allocatedT)} across ${allocation.legs.length} destinations`}
                  right={
                    <div className="text-right">
                      <div className="nums text-2xl font-extrabold text-brand">{allocation.avgScore}</div>
                      <div className="text-[10px] text-ink-3">optimization score</div>
                    </div>
                  }
                />
                <div className="mt-4 space-y-2">
                  {allocation.legs.map((leg, i) => (
                    <AllocationBar key={leg.nodeId} leg={leg} total={allocation.totalAvailableT} delay={i * 0.1} nodes={nodes} />
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
                  <Stat label="Allocated" value={tonnes(allocation.allocatedT)} />
                  <Stat label="Residual" value={tonnes(allocation.residualT)} />
                  <Stat label="Avg score" value={String(allocation.avgScore)} />
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="explain" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Gauge size={16} className="text-brand" /> How the optimizer decides
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">
                  The engine does <strong className="text-ink">not</strong> simply pick the highest
                  price. It maximizes a suitability score that balances:
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {["quantity", "recipient capacity", "demand deficit", "perishability", "urgency", "distance", "transport cost", "absorption certainty"].map((t) => (
                    <span key={t} className="rounded-lg bg-surface-2 px-2.5 py-1 text-xs text-ink-2">{t}</span>
                  ))}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink-2">
                  It then fills the highest-scoring destinations first, up to each destination's
                  absorbable capacity, until the surplus is cleared.
                </p>
                <Button size="lg" onClick={run} className="mt-4 w-full" disabled={phase === "running"}>
                  <Target size={17} /> {phase === "running" ? "Optimizing…" : "Run optimization"}
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4">
        <OptimizerComparison scenario={scenario} />
      </div>

      {phase === "done" && (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-5 sm:flex-row">
          <p className="text-sm text-ink-2">Allocation generated. Create a traceable batch and follow it to delivery.</p>
          <div className="flex gap-2">
            <LinkButton to="/trace" variant="secondary">Generate batch <ArrowRight size={15} /></LinkButton>
            <LinkButton to="/impact">See impact <ArrowRight size={15} /></LinkButton>
          </div>
        </div>
      )}
    </div>
  );
}

// Event picker — choose which surplus event to optimize. Defaults to the
// canonical Kolar tomato; any other crop rebuilds the whole scenario with
// destinations priced to that commodity.
function EventPicker({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  const current = getForecast(selectedId)!;
  return (
    <label className="relative inline-flex items-center">
      <span className="pointer-events-none absolute left-3 text-base">{CROP_META[current.crop].emoji}</span>
      <select
        aria-label="Select surplus event to optimize"
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
        className="h-11 cursor-pointer rounded-xl border border-line-strong bg-surface pl-9 pr-8 text-sm font-medium text-ink outline-none transition-colors hover:bg-surface-2 focus:border-brand"
      >
        {FORECASTS.map((f) => (
          <option key={f.id} value={f.id}>
            {f.crop} · {f.location}
          </option>
        ))}
      </select>
    </label>
  );
}

function AllocationBar({ leg, total, delay, nodes }: { leg: AllocationLeg; total: number; delay: number; nodes: DemandNode[] }) {
  const node = nodes.find((n) => n.id === leg.nodeId)!;
  const Icon = kindIcon[leg.kind];
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium text-ink">
          <Icon size={15} className="text-demand" />
          {leg.nodeName}
        </span>
        <span className="nums font-bold text-ink">{tonnes(leg.quantityT)}</span>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-surface">
        <motion.div className="h-full rounded-full bg-brand" initial={{ width: 0 }} animate={{ width: `${(leg.quantityT / total) * 100}%` }} transition={{ duration: 0.8, delay }} />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-ink-3">
        <span>ETA {hours(leg.etaHours)} · {leg.distanceKm} km · {rupeesPerKg(node.priceEquivalentPerKg)}</span>
        <span className="nums">score {leg.score}</span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="nums text-lg font-bold text-ink">{value}</div>
      <div className="text-[11px] text-ink-3">{label}</div>
    </div>
  );
}

// Real optimizer (marginal-value / diminishing-returns) vs the greedy
// baseline, scored on the same objective: expected realized value net of
// transport and spoilage.
function OptimizerComparison({ scenario }: { scenario: Scenario }) {
  const { forecast, nodes, allocation } = scenario;
  const opt = runOptimizer(forecast, nodes);
  const inputs = toOptInputs(nodes);
  const baseObj = objectiveOf(allocation.legs, inputs, forecast.spoilageWindowHours);
  const optObj = opt.objectiveValue;
  const delta = optObj - baseObj;
  const pct = baseObj ? Math.round((delta / baseObj) * 1000) / 10 : 0;

  return (
    <Card className="p-5">
      <SectionTitle
        eyebrow="Optimizer"
        title="Optimizer vs. greedy baseline"
        sub="Same objective — expected realized value net of transport & spoilage. The optimizer models diminishing returns (glut effect), so it spreads volume instead of flooding the top market."
        right={<Badge tone={delta >= 0 ? "ok" : "risk"} dot>{delta >= 0 ? "+" : ""}{pct}% objective</Badge>}
      />
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Plan title="Greedy baseline" subtitle="fill highest score first" legs={allocation.legs} obj={baseObj} />
        <Plan title="Optimizer (experimental)" subtitle="marginal-value water-filling" legs={opt.legs} obj={optObj} highlight />
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-ink-3">
        Both respect capacity and conserve quantity (tested). The optimizer is experimental and not yet operationally executable —
        destination capacity, transport availability and acceptance must be verified before dispatch.
      </p>
    </Card>
  );
}

function Plan({ title, subtitle, legs, obj, highlight }: { title: string; subtitle: string; legs: AllocationLeg[]; obj: number; highlight?: boolean }) {
  const total = legs.reduce((a, l) => a + l.quantityT, 0);
  return (
    <div className={"rounded-2xl border p-4 " + (highlight ? "border-brand/30 bg-brand-tint/50" : "border-line bg-surface")}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-ink">{title}</div>
          <div className="text-[11px] text-ink-3">{subtitle}</div>
        </div>
        <div className="text-right">
          <div className="nums text-lg font-extrabold text-ink">{rupees(obj)}</div>
          <div className="text-[10px] text-ink-3">expected value</div>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        {legs.map((l) => (
          <div key={l.nodeId} className="flex items-center justify-between text-xs">
            <span className="truncate text-ink-2">{l.nodeName}</span>
            <span className="nums font-semibold text-ink">{tonnes(l.quantityT)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-line pt-1.5 text-xs font-semibold">
          <span className="text-ink-2">Allocated</span>
          <span className="nums text-ink">{tonnes(+total.toFixed(1))}</span>
        </div>
      </div>
    </div>
  );
}
