import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Factory, Gauge, Play, RotateCcw, Store, Target, Users } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Card, SectionTitle, Badge, Button, LinkButton, Meter } from "@/components/ui";
import { AllocationFlow } from "./AllocationFlow";
import { KOLAR_SCENARIO } from "@/data/scenario";
import { tonnes, hours, rupeesPerKg } from "@/lib/format";
import type { AllocationLeg, DemandNode } from "@/types";

type Phase = "idle" | "running" | "done";

const kindIcon: Record<DemandNode["kind"], typeof Store> = {
  market: Store,
  processor: Factory,
  community: Users,
};

export default function Optimization() {
  const { forecast, nodes, allocation, scoredNodes } = KOLAR_SCENARIO;
  const [phase, setPhase] = useState<Phase>("idle");
  const [activeStep, setActiveStep] = useState(-1);
  const timers = useRef<number[]>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);

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
          phase === "idle" ? (
            <Button size="lg" onClick={run}>
              <Play size={17} /> Optimize rescue
            </Button>
          ) : (
            <Button size="lg" variant="secondary" onClick={reset}>
              <RotateCcw size={16} /> Reset
            </Button>
          )
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
              {tonnes(forecast.predictedQuantityT)} of tomato is at risk in Kolar. Run the optimizer to
              place it across the four best destinations before the usable window closes.
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
