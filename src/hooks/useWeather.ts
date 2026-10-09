import { useEffect, useState } from "react";
import { useDataMode } from "@/lib/dataMode";

// Loads the ingested weather snapshot (public/data/weather.json) produced
// by `npm run ingest:weather` (real Open-Meteo data). Exposes explicit
// loading / error / no-data states so the UI never silently shows demo
// data as if it were live. Only fetches in Live mode; in Demo mode it
// returns "demo" so consumers show the clearly-labeled scenario values.

export interface WeatherLocation {
  id: string;
  name: string;
  current: { tempC: number | null; humidity: number | null };
  observedAt: string | null;
  forecast: { date: string; tmax: number; tmin: number; precipMm: number }[];
}
interface WeatherFile {
  source: string;
  sourceUrl: string;
  retrievedAt: string;
  locations: WeatherLocation[];
}
type State =
  | { status: "loading" }
  | { status: "demo" }
  | { status: "error" }
  | { status: "ready"; source: string; retrievedAt: string; byId: Map<string, WeatherLocation> };

let cache: State | null = null;

export function useWeather(): State {
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
    fetch(`${import.meta.env.BASE_URL}data/weather.json`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d: WeatherFile) => {
        if (!alive) return;
        const next: State = {
          status: "ready",
          source: d.source,
          retrievedAt: d.retrievedAt,
          byId: new Map(d.locations.map((l) => [l.id, l])),
        };
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
