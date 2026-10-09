import { useEffect, useState } from "react";
import { useDataMode } from "@/lib/dataMode";

// Loads ml/artifacts/price_metrics.json (mirrored to public/data/model-metrics.json
// by `npm run ml:train:price`). These are REAL held-out test metrics from the
// price forecaster trained on master_aggriculture_dataset.csv — never fabricated.
// Explicit loading / error states so the UI never shows numbers it doesn't have.

export interface ModelMetricSet {
  mae: number;
  rmse: number;
  mape: number;
}
export interface ModelMetrics {
  model_version: string;
  task: string;
  horizon_days: number;
  dataset: string;
  trained_at: string;
  span: { from: string; to: string };
  coverage: { commodities: number; markets: number; series_days: number };
  split: { train: number; val: number; test: number; test_from: string };
  features: string[];
  metrics_test: {
    baseline_persistence: ModelMetricSet;
    baseline_climatology: ModelMetricSet;
    model_gbt: ModelMetricSet;
  };
  blend_weight: number;
  model_vs_persistence_mae_improvement_pct: number;
  model_vs_persistence_rmse_improvement_pct: number;
  feature_importance: { feature: string; importance: number }[];
  per_commodity_mae: { commodity: string; mae: number; baseline_mae: number; improvement_pct: number; n: number }[];
}

type State =
  | { status: "loading" }
  | { status: "demo" }
  | { status: "error" }
  | { status: "ready"; data: ModelMetrics };

let cache: State | null = null;

export function useModelMetrics(): State {
  const { live } = useDataMode();
  const [state, setState] = useState<State>(cache ?? { status: "loading" });

  useEffect(() => {
    if (!live) {
      setState({ status: "demo" });
      return;
    }
    if (cache) {
      setState(cache);
      return;
    }
    let alive = true;
    fetch(`${import.meta.env.BASE_URL}data/model-metrics.json`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d: ModelMetrics) => {
        if (!alive) return;
        const next: State = { status: "ready", data: d };
        cache = next;
        setState(next);
      })
      .catch(() => {
        if (!alive) return;
        const next: State = { status: "error" };
        cache = next;
        setState(next);
      });
    return () => {
      alive = false;
    };
  }, [live]);

  return state;
}
