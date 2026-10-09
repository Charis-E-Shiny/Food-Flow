import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// ============================================================
// Global data mode: Demo (default) vs. Live.
//
// Demo  — every number is the deterministic illustrative scenario.
// Live  — the two genuinely real sources activate: the ingested
//         Open-Meteo weather snapshot and the trained price model's
//         held-out metrics. We never label simulated data as Live.
//
// The choice is persisted per browser. Hooks that have a real source
// (useWeather, useModelMetrics) read this and only fetch in Live mode.
// ============================================================

const KEY = "foodflow.datamode.v1";

interface DataModeState {
  live: boolean;
  setLive: (v: boolean) => void;
  toggle: () => void;
}

const DataModeContext = createContext<DataModeState | null>(null);

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === "live";
  } catch {
    return false;
  }
}

export function DataModeProvider({ children }: { children: ReactNode }) {
  const [live, setLiveState] = useState<boolean>(read);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, live ? "live" : "demo");
    } catch {
      /* storage unavailable — mode stays in memory */
    }
  }, [live]);

  const value: DataModeState = {
    live,
    setLive: setLiveState,
    toggle: () => setLiveState((v) => !v),
  };
  return <DataModeContext.Provider value={value}>{children}</DataModeContext.Provider>;
}

export function useDataMode(): DataModeState {
  const ctx = useContext(DataModeContext);
  if (!ctx) throw new Error("useDataMode must be used within DataModeProvider");
  return ctx;
}
