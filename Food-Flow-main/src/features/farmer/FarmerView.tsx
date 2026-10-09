import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Factory, Store, Sun, TrendingUp, Users } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Card, Badge } from "@/components/ui";
import { KOLAR_SCENARIO } from "@/data/scenario";
import { rupeesPerKg, tonnes } from "@/lib/format";

export default function FarmerView() {
  const { forecast, allocation } = KOLAR_SCENARIO;
  const topLeg = allocation.legs[0];

  return (
    <div>
      <PageHead
        eyebrow="Tool · Farmer View"
        title="Farmer View"
        sub="FoodFlow from a grower's perspective — one crop, one clear recommended action."
      />

      <div className="flex justify-center">
        <div className="w-full max-w-sm">
          {/* phone frame */}
          <div className="rounded-[2rem] border-[6px] border-ink/90 bg-canvas p-3 shadow-pop">
            <div className="mx-auto mb-3 h-1.5 w-20 rounded-full bg-ink/20" />

            <div className="space-y-3 px-1 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-ink-3">Kolar Belt · today</div>
                  <div className="text-lg font-bold text-ink">Namaste, Ravi 👋</div>
                </div>
                <Badge tone="risk" dot>Action needed</Badge>
              </div>

              {/* Crop card */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-ink">🍅 {forecast.crop}</span>
                  <span className="text-xs text-ink-3">2.0 acre · Kolar</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <PriceCell label="Today's price" value={rupeesPerKg(forecast.sellNowPrice)} />
                  <PriceCell
                    label="72h forecast"
                    value={rupeesPerKg(forecast.priceIfHeld)}
                    trend
                  />
                </div>

                <div className="mt-3 flex items-center justify-between rounded-xl border border-risk/20 bg-risk-soft px-3 py-2">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-risk">
                    <Sun size={15} /> Spoilage risk
                  </span>
                  <span className="text-sm font-bold text-risk">High</span>
                </div>
              </Card>

              {/* Recommendation */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-brand bg-brand-tint p-4"
              >
                <div className="text-[11px] font-semibold uppercase tracking-wide text-brand">
                  FoodFlow recommends
                </div>
                <div className="mt-1 text-xl font-extrabold text-brand-strong">
                  Redirect {tonnes(topLeg.quantityT)}
                </div>
                <p className="mt-1 text-sm text-brand-strong/80">
                  Holding for ₹{forecast.priceIfHeld}/kg risks spoilage — you'd realize only about
                  ₹{forecast.spoilageAdjustedValue}/kg. Redirecting now protects your value.
                </p>

                <div className="mt-3 space-y-1.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-strong/70">
                    Best destinations
                  </div>
                  {allocation.legs.slice(0, 3).map((l) => (
                    <div
                      key={l.nodeId}
                      className="flex items-center justify-between rounded-lg bg-surface/70 px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2 text-ink">
                        {l.kind === "market" ? <Store size={14} className="text-demand" /> : l.kind === "processor" ? <Factory size={14} className="text-demand" /> : <Users size={14} className="text-demand" />}
                        {l.nodeName.split(" ").slice(0, 2).join(" ")}
                      </span>
                      <span className="nums font-semibold text-ink">{tonnes(l.quantityT)}</span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/optimize"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-strong"
                >
                  View best option <ArrowRight size={16} />
                </Link>
              </motion.div>

              <p className="px-1 text-center text-[11px] text-ink-3">
                Demo data · prices are simulated for this prototype.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceCell({ label, value, trend }: { label: string; value: string; trend?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3">
      <div className="text-[11px] text-ink-3">{label}</div>
      <div className="mt-0.5 flex items-center gap-1">
        <span className="nums text-lg font-bold text-ink">{value}</span>
        {trend && <TrendingUp size={14} className="text-warn" />}
      </div>
    </div>
  );
}
