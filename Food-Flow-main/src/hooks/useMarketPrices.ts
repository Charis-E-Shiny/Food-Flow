import { useEffect, useState } from "react";
import { useDataMode } from "@/lib/dataMode";

// Loads public/data/market-prices.json — REAL per-market modal prices
// sliced from master_aggriculture_dataset.csv by `npm run ml:export:prices`.
// Only fetched in Live mode; Demo mode returns "demo" so the marketplace
// shows its illustrative board instead. Never labels demo data as real.

export interface PlacePrice {
  state: string;
  market: string;
  pricePerKg: number;
  date: string;
}
export interface CommodityPrices {
  latestDate: string;
  modalPricePerKg: number;
  trend7dPct: number;
  marketCount: number;
  places: PlacePrice[];
}
export interface MarketPrices {
  generatedAt: string;
  source: string;
  unit: string;
  span: { from: string; to: string };
  commodities: Record<string, CommodityPrices>;
}

type State =
  | { status: "loading" }
  | { status: "demo" }
  | { status: "error" }
  | { status: "ready"; data: MarketPrices };

let cache: State | null = null;

export function useMarketPrices(): State {
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
    fetch(`${import.meta.env.BASE_URL}data/market-prices.json`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d: MarketPrices) => {
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
