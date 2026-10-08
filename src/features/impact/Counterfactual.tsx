import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card, SectionTitle, Badge, Button } from "@/components/ui";
import { KOLAR_SCENARIO } from "@/data/scenario";
import { tonnes, rupees, compact } from "@/lib/format";

// Counterfactual: contrast the do-nothing baseline with a
// FoodFlow-coordinated intervention. All figures are model
// simulation — labeled as such.

type Mode = "without" | "with";

export function Counterfactual({ embedded = false }: { embedded?: boolean }) {
  const [mode, setMode] = useState<Mode>("without");
  const cf = KOLAR_SCENARIO.counterfactual;

  const bars =
    mode === "without"
      ? [
          { label: "Conventional absorption", value: cf.withoutFoodflow.conventionalAbsorptionT, tone: "demand" as const },
          { label: "High-risk / lost", value: cf.withoutFoodflow.highRiskT, tone: "risk" as const },
        ]
      : [
          { label: "Redirected within window", value: cf.withFoodflow.redirectedT, tone: "brand" as const },
          { label: "Residual risk", value: cf.withFoodflow.residualRiskT, tone: "warn" as const },
        ];

  return (
    <Card className={embedded ? "p-5" : "p-6"}>
      <SectionTitle
        eyebrow="Counterfactual simulator"
        title="What changes because FoodFlow intervened"
        sub="Illustrative model — contrasting the do-nothing baseline with a coordinated intervention."
        right={
          <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1">
            {(["without", "with"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors " +
                  (mode === m ? "bg-brand text-white" : "text-ink-2 hover:text-ink")
                }
              >
                {m === "without" ? "Without FoodFlow" : "With FoodFlow"}
              </button>
            ))}
          </div>
        }
      />

      <div className="mt-5 grid gap-5 md:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-ink-2">{tonnes(cf.predictedT)} predicted surplus</span>
            <Badge tone={mode === "without" ? "risk" : "brand"} dot>
              {mode === "without" ? "Baseline" : "Intervention"}
            </Badge>
          </div>
          {/* Stacked composition bar */}
          <div className="flex h-12 w-full overflow-hidden rounded-xl border border-line">
            {bars.map((b) => {
              const fill = { brand: "bg-brand", risk: "bg-risk", warn: "bg-warn", demand: "bg-demand" }[b.tone];
              return (
                <motion.div
                  key={b.label}
                  className={fill + " flex items-center justify-center"}
                  initial={{ width: 0 }}
                  animate={{ width: `${(b.value / cf.predictedT) * 100}%` }}
                  transition={{ duration: 0.7 }}
                >
                  <span className="nums px-1 text-xs font-bold text-white">{tonnes(b.value)}</span>
                </motion.div>
              );
            })}
          </div>
          <div className="mt-3 space-y-1.5">
            {bars.map((b) => {
              const dot = { brand: "bg-brand", risk: "bg-risk", warn: "bg-warn", demand: "bg-demand" }[b.tone];
              return (
                <div key={b.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-ink-2">
                    <span className={"h-2.5 w-2.5 rounded-full " + dot} />
                    {b.label}
                  </span>
                  <span className="nums font-semibold text-ink">{tonnes(b.value)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-brand/25 bg-brand-tint p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand">
            <Sparkles size={13} /> Net effect of intervention
          </div>
          <div className="mt-3 space-y-3">
            <Delta label="Potential food preserved" value={tonnes(cf.foodPreservedT)} />
            <Delta label="Farmer value protected" value={rupees(cf.farmerValueProtected)} />
            <Delta label="Meals-equivalent" value={compact(cf.mealsEquivalent)} />
            <Delta label="Emissions avoided" value={`${cf.emissionsAvoidedT} tCO₂e`} />
          </div>
        </div>
      </div>

      {!embedded && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-xs text-ink-3">
          Model simulation · illustrative scenario. Not a measurement of real-world outcomes.
        </div>
      )}
      {embedded && (
        <Button variant="ghost" size="sm" className="mt-4">
          Full impact breakdown <ArrowRight size={14} />
        </Button>
      )}
    </Card>
  );
}

function Delta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-brand-strong/80">{label}</span>
      <span className="nums text-lg font-extrabold text-brand-strong">{value}</span>
    </div>
  );
}
