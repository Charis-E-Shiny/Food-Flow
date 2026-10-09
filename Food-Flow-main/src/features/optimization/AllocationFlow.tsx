import { AnimatePresence, motion } from "framer-motion";
import { Factory, Sprout, Store, Users } from "lucide-react";
import type { AllocationLeg, DemandNode } from "@/types";
import { tonnes } from "@/lib/format";

// Branching allocation diagram: one source → N destinations, with
// animated flowing particles whose stroke weight reflects tonnage.
// Purpose-built for clarity (replaces generic map flow lines).

const kindIcon: Record<DemandNode["kind"], typeof Store> = {
  market: Store,
  processor: Factory,
  community: Users,
};

type Phase = "idle" | "running" | "done";

const SRC = { x: 15, y: 50 };

export function AllocationFlow({
  legs,
  total,
  phase,
  activeStep,
  sourceLabel,
  sourceSub,
}: {
  legs: AllocationLeg[];
  total: number;
  phase: Phase;
  activeStep: number;
  sourceLabel: string;
  sourceSub: string;
}) {
  const n = legs.length;
  const destY = (i: number) => (n === 1 ? 50 : 12 + (i * (76)) / (n - 1));
  const flowing = phase !== "idle";

  return (
    <div className="relative h-[340px] w-full sm:h-[380px]">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          {legs.map((leg, i) => {
            const y = destY(i);
            const d = `M ${SRC.x} ${SRC.y} C ${SRC.x + 24} ${SRC.y}, ${64 - 24} ${y}, 64 ${y}`;
            return <path key={leg.nodeId} id={`flowpath-${i}`} d={d} fill="none" />;
          })}
        </defs>

        {legs.map((leg, i) => {
          const revealed = phase === "done" || (phase === "running" && activeStep >= i);
          const w = 0.6 + (leg.quantityT / total) * 5;
          return (
            <g key={leg.nodeId} opacity={revealed ? 1 : 0.18} style={{ transition: "opacity 0.4s" }}>
              <use href={`#flowpath-${i}`} stroke="rgb(var(--c-brand))" strokeOpacity={0.18} strokeWidth={w} />
              {revealed && flowing && (
                <>
                  <use
                    href={`#flowpath-${i}`}
                    stroke="rgb(var(--c-brand))"
                    strokeOpacity={0.5}
                    strokeWidth={w}
                    strokeLinecap="round"
                    strokeDasharray="1.5 3"
                    style={{ animation: "flow-dash 0.8s linear infinite" }}
                  />
                  {[0, 0.5].map((off) => (
                    <circle key={off} r={Math.max(0.9, w * 0.5)} fill="rgb(var(--c-brand))">
                      <animateMotion dur="2.2s" begin={`${off * 2.2}s`} repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
                        <mpath href={`#flowpath-${i}`} />
                      </animateMotion>
                    </circle>
                  ))}
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* Source node */}
      <div className="absolute left-[2%] top-1/2 w-[26%] -translate-y-1/2">
        <div className="rounded-2xl border-2 border-brand bg-brand-tint p-3 text-center shadow-card">
          <span className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-brand text-white">
            <Sprout size={18} />
          </span>
          <div className="mt-2 nums text-lg font-extrabold text-brand-strong">{tonnes(total)}</div>
          <div className="text-[11px] font-semibold text-brand-strong">{sourceLabel}</div>
          <div className="text-[10px] text-brand-strong/70">{sourceSub}</div>
        </div>
      </div>

      {/* Destination nodes */}
      {legs.map((leg, i) => {
        const Icon = kindIcon[leg.kind];
        const revealed = phase === "done" || (phase === "running" && activeStep >= i);
        return (
          <div
            key={leg.nodeId}
            className="absolute right-[2%] w-[36%] -translate-y-1/2"
            style={{ top: `${destY(i)}%` }}
          >
            <motion.div
              animate={{
                opacity: revealed ? 1 : 0.4,
                borderColor: phase === "running" && activeStep === i ? "rgb(var(--c-brand))" : "rgb(var(--c-line))",
                y: 0,
              }}
              className="rounded-xl border bg-surface p-2.5 shadow-card"
            >
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-demand-soft text-demand">
                  <Icon size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-semibold text-ink">{leg.nodeName}</div>
                  <div className="text-[10px] text-ink-3">{leg.distanceKm} km</div>
                </div>
                <AnimatePresence>
                  {revealed && (
                    <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} className="text-right">
                      <div className="nums text-sm font-bold text-ink">{tonnes(leg.quantityT)}</div>
                      <div className="nums text-[10px] text-brand">score {leg.score}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
