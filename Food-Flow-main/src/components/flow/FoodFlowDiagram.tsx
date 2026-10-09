import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

// ============================================================
// THE FOODFLOW — the signature visualization.
//   PREDICTED SURPLUS → ASSESS → OPTIMIZE
//        ↙   ↓   ↘  MARKET / PROCESSOR / COMMUNITY
//        ↘   ↓   ↙
//            VERIFIED → IMPACT
// Animates stage-by-stage when `animate` flips true.
// ============================================================

type Stage = 0 | 1 | 2 | 3 | 4 | 5;

const NODE = "rounded-xl border px-3 py-2 text-center";

function FlowNode({
  active,
  done,
  title,
  sub,
  tone = "brand",
  className,
}: {
  active: boolean;
  done: boolean;
  title: string;
  sub?: string;
  tone?: "brand" | "demand" | "warn" | "ink";
  className?: string;
}) {
  const tones = {
    brand: "border-brand/30 bg-brand-tint text-brand-strong",
    demand: "border-demand/30 bg-demand-soft text-demand",
    warn: "border-warn/30 bg-warn-soft text-warn",
    ink: "border-line bg-surface text-ink",
  };
  return (
    <motion.div
      initial={false}
      animate={{
        opacity: active || done ? 1 : 0.32,
        scale: active ? 1.04 : 1,
        boxShadow: active ? "0 8px 24px -8px rgb(27 94 63 / 0.35)" : "0 0 0 rgb(0 0 0 / 0)",
      }}
      transition={{ duration: 0.4 }}
      className={cn(NODE, tones[tone], className)}
    >
      <div className="text-[13px] font-semibold leading-tight">{title}</div>
      {sub && <div className="mt-0.5 text-[11px] opacity-80">{sub}</div>}
    </motion.div>
  );
}

function Connector({ active, vertical }: { active: boolean; vertical?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        vertical ? "h-6 w-full" : "h-full w-6",
      )}
      aria-hidden
    >
      <svg
        viewBox={vertical ? "0 0 10 24" : "0 0 24 10"}
        preserveAspectRatio="none"
        className={vertical ? "h-6 w-2.5" : "h-2.5 w-6"}
      >
        <line
          x1={vertical ? 5 : 0}
          y1={vertical ? 0 : 5}
          x2={vertical ? 5 : 24}
          y2={vertical ? 24 : 5}
          className={active ? "stroke-brand" : "stroke-line-strong"}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeDasharray={active ? "2 4" : "0"}
          style={active ? { animation: "flow-dash 0.9s linear infinite" } : undefined}
        />
      </svg>
    </div>
  );
}

export function FoodFlowDiagram({ stage = 5 }: { stage?: Stage }) {
  const at = (s: Stage) => stage === s;
  const past = (s: Stage) => stage > s;
  const reached = (s: Stage) => stage >= s;

  return (
    <div className="mx-auto w-full max-w-md select-none">
      <FlowNode
        active={at(0)}
        done={past(0)}
        title="Predicted surplus"
        sub="15.2T · Kolar Tomato · 72h"
      />
      <Connector active={reached(1)} vertical />
      <FlowNode active={at(1)} done={past(1)} title="Assess" sub="Waste risk 87 · window 3 days" tone="warn" />
      <Connector active={reached(2)} vertical />
      <FlowNode active={at(2)} done={past(2)} title="Optimize" sub="4 destinations · score 85" />

      <div className="my-1 flex items-stretch justify-center gap-2">
        <Connector active={reached(3)} />
        <Connector active={reached(3)} vertical />
        <Connector active={reached(3)} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <FlowNode active={at(3)} done={past(3)} title="Market" sub="4.0T" tone="demand" />
        <FlowNode active={at(3)} done={past(3)} title="Processor" sub="5.0T" tone="demand" />
        <FlowNode active={at(3)} done={past(3)} title="Community" sub="3.2T" tone="demand" />
      </div>

      <div className="my-1 flex items-stretch justify-center gap-2">
        <Connector active={reached(4)} />
        <Connector active={reached(4)} vertical />
        <Connector active={reached(4)} />
      </div>

      <FlowNode active={at(4)} done={past(4)} title="Verified" sub="Batch KF-TOM-1026 · ledger" tone="ink" />
      <Connector active={reached(5)} vertical />
      <FlowNode active={at(5)} done={false} title="Impact" sub="6.9T preserved · 17.3K meals" />
    </div>
  );
}
