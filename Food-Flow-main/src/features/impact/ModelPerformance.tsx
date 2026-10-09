import { Activity, Database, Info, Radio, TrendingDown } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui";
import { ProvenanceBadge } from "@/components/ui/ProvenanceBadge";
import { useModelMetrics, type ModelMetrics } from "@/hooks/useModelMetrics";
import { useDataMode } from "@/lib/dataMode";

// Real held-out test metrics from the price forecaster trained on
// master_aggriculture_dataset.csv. Honest framing: the model's genuine win
// is on RMSE (the large price swings that drive surplus & waste); naive
// persistence stays strong on typical-day MAE and we show it plainly.

const FEATURE_LABEL: Record<string, string> = {
  logp: "Price level",
  ret1: "1-day return",
  ret7: "7-day return",
  dev_roll7: "Dev. vs 7-day mean",
  dev_roll30: "Dev. vs 30-day mean",
  temp_mean: "Mean temp",
  rainfall_mm: "Rainfall",
  rain_roll7: "Rainfall (7d)",
  sin_doy: "Seasonality (sin)",
  cos_doy: "Seasonality (cos)",
  commodity_code: "Commodity",
};

const fmtInt = (n: number) => n.toLocaleString("en-IN");
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export function ModelPerformance() {
  const state = useModelMetrics();
  const { setLive } = useDataMode();

  return (
    <Card className="p-5">
      <SectionTitle
        eyebrow="Trained model · real data"
        title="Price-forecast model performance"
        sub="A 7-day-ahead mandi modal-price forecaster, trained on a real Agmarknet-style dataset and scored on a chronological, held-out test set it never saw during training."
        right={<ProvenanceBadge kind="model" note="held-out test" />}
      />
      {state.status === "demo" && (
        <div className="mt-4 flex flex-col items-start gap-3 rounded-xl border border-dashed border-line-strong bg-surface-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2.5">
            <Radio size={16} className="mt-0.5 shrink-0 text-ink-3" />
            <p className="text-sm text-ink-2">
              <b className="text-ink">Demo mode.</b> The real trained-model metrics load only in{" "}
              <b>Live data</b> mode — kept honest, so simulated and real numbers never mix.
            </p>
          </div>
          <button
            onClick={() => setLive(true)}
            className="shrink-0 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand-strong"
          >
            Switch to Live data
          </button>
        </div>
      )}
      {state.status === "loading" && <Skeleton />}
      {state.status === "error" && (
        <p className="mt-4 text-sm text-ink-2">
          Metrics unavailable. Run <code className="rounded bg-surface-2 px-1">npm run ml:train:price</code> to
          generate <code className="rounded bg-surface-2 px-1">public/data/model-metrics.json</code>.
        </p>
      )}
      {state.status === "ready" && <Body d={state.data} />}
    </Card>
  );
}

function Body({ d }: { d: ModelMetrics }) {
  const { metrics_test: mt } = d;
  const rmseLift = d.model_vs_persistence_rmse_improvement_pct;
  const climLift = Math.round((1 - mt.model_gbt.rmse / mt.baseline_climatology.rmse) * 100);
  const maxR = Math.max(mt.baseline_persistence.rmse, mt.baseline_climatology.rmse, mt.model_gbt.rmse);

  const bars: { label: string; rmse: number; model?: boolean }[] = [
    { label: "FoodFlow model", rmse: mt.model_gbt.rmse, model: true },
    { label: "Naive (today → +7d)", rmse: mt.baseline_persistence.rmse },
    { label: "Seasonal climatology", rmse: mt.baseline_climatology.rmse },
  ];
  const topFeatures = d.feature_importance.filter((f) => f.importance > 0).slice(0, 5);

  return (
    <div className="mt-4">
      {/* Dataset provenance strip */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-xs text-ink-2">
        <span className="inline-flex items-center gap-1.5 font-medium text-ink">
          <Database size={13} className="text-brand" /> master_aggriculture_dataset.csv
        </span>
        <span>{fmtInt(d.coverage.series_days)} market-days</span>
        <span>{fmtInt(d.coverage.markets)} markets</span>
        <span>{d.coverage.commodities} commodities</span>
        <span>{fmtDate(d.span.from)} → {fmtDate(d.span.to)}</span>
        <span className="text-ink-3">v{d.model_version}</span>
      </div>

      {/* Headline stats */}
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Head icon={<TrendingDown size={15} />} value={`${rmseLift}%`} label="Lower RMSE vs. naive forecast" tone="ok" />
        <Head icon={<TrendingDown size={15} />} value={`${climLift}%`} label="Lower RMSE vs. climatology" tone="ok" />
        <Head icon={<Activity size={15} />} value={`±₹${Math.round(mt.model_gbt.mae)}`} label="Typical error / quintal (MAE)" tone="brand" />
        <Head icon={<Activity size={15} />} value={`${mt.model_gbt.mape}%`} label="Mean abs. % error (MAPE)" tone="brand" />
      </div>

      {/* RMSE comparison bars */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ink-3">
          <span>Forecast error on held-out test set</span>
          <span>RMSE ₹/quintal · lower is better</span>
        </div>
        <div className="space-y-2">
          {bars.map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <div className="w-40 shrink-0 text-right text-xs text-ink-2">{b.label}</div>
              <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-surface-2">
                <div
                  className={"h-full rounded-md " + (b.model ? "bg-brand" : "bg-ink-3/40")}
                  style={{ width: `${(b.rmse / maxR) * 100}%` }}
                />
                <span className={"absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold " + (b.model ? "text-white" : "text-ink-2")} style={b.model ? undefined : { right: "auto", left: `calc(${(b.rmse / maxR) * 100}% + 6px)` }}>
                  ₹{fmtInt(Math.round(b.rmse))}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Per-commodity */}
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">Test error by commodity (model vs. naive)</div>
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-[11px] uppercase tracking-wide text-ink-3">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Commodity</th>
                  <th className="px-3 py-2 text-right font-semibold">Model MAE</th>
                  <th className="px-3 py-2 text-right font-semibold">Naive MAE</th>
                  <th className="px-3 py-2 text-right font-semibold">Test days</th>
                </tr>
              </thead>
              <tbody>
                {d.per_commodity_mae.map((c) => (
                  <tr key={c.commodity} className="border-t border-line">
                    <td className="px-3 py-2 font-medium text-ink">{c.commodity}</td>
                    <td className="nums px-3 py-2 text-right text-ink">₹{fmtInt(c.mae)}</td>
                    <td className="nums px-3 py-2 text-right text-ink-2">₹{fmtInt(c.baseline_mae)}</td>
                    <td className="nums px-3 py-2 text-right text-ink-3">{fmtInt(c.n)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feature importance */}
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">What drives the forecast (permutation importance)</div>
          <div className="space-y-2">
            {topFeatures.map((f) => {
              const max = topFeatures[0].importance || 1;
              return (
                <div key={f.feature} className="flex items-center gap-3">
                  <div className="w-36 shrink-0 text-right text-xs text-ink-2">{FEATURE_LABEL[f.feature] ?? f.feature}</div>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-demand" style={{ width: `${Math.max(6, (f.importance / max) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Honest method note */}
      <div className="mt-4 flex gap-2 rounded-xl border border-line bg-surface-2 p-3 text-xs leading-relaxed text-ink-2">
        <Info size={14} className="mt-0.5 shrink-0 text-ink-3" />
        <p>
          Chronological 70/15/15 split — the model trains only on data before {fmtDate(d.split.test_from)} and is
          scored after it (no leakage, no shuffling). Baselines: <b>naive persistence</b> (price in 7 days ≈ today) and
          day-of-year <b>climatology</b>. The model’s edge is on <b>RMSE</b> — the large gluts and crashes that drive
          surplus and waste — where it beats both baselines. On typical-day <b>MAE</b>, 7-day persistence is a strong
          baseline (±₹{Math.round(mt.baseline_persistence.mae)} vs. the model’s ±₹{Math.round(mt.model_gbt.mae)}); we
          report it plainly rather than cherry-pick. Reproduce with{" "}
          <code className="rounded bg-surface px-1">npm run ml:train:price</code>.
        </p>
      </div>
    </div>
  );
}

function Head({ icon, value, label, tone }: { icon: React.ReactNode; value: string; label: string; tone: "ok" | "brand" }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-3.5">
      <div className={"inline-flex items-center gap-1.5 text-xs font-semibold " + (tone === "ok" ? "text-ok" : "text-brand")}>
        {icon}
      </div>
      <div className="nums mt-1 text-2xl font-bold tracking-tight text-ink">{value}</div>
      <div className="mt-0.5 text-[11px] leading-snug text-ink-3">{label}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="mt-4 space-y-3">
      <div className="h-10 animate-pulse rounded-xl bg-surface-2" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
