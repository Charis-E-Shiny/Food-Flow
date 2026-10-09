import { CloudRain, Droplets, Thermometer } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui";
import { ProvenanceBadge } from "@/components/ui/ProvenanceBadge";
import { useWeather } from "@/hooks/useWeather";
import { useDataMode } from "@/lib/dataMode";
import { freshness } from "@/lib/provenance";
import type { SurplusForecast } from "@/types";

// Real weather for this mandi (Open-Meteo), with honest provenance and
// loading / error / stale / fallback states. Falls back to the demo
// temperature ONLY when live data is unavailable — and labels it as demo.
export function WeatherPanel({ forecast }: { forecast: SurplusForecast }) {
  const w = useWeather();
  const { live } = useDataMode();

  if (w.status === "loading") {
    return (
      <Card className="p-5">
        <SectionTitle eyebrow="Weather" title="Local conditions" />
        <div className="mt-4 flex items-center gap-2 text-sm text-ink-3">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line-strong border-t-brand" /> Loading live weather…
        </div>
      </Card>
    );
  }

  const loc = w.status === "ready" ? w.byId.get(forecast.id) : undefined;
  const hasLive = !!loc && loc.current.tempC != null;

  if (!hasLive) {
    // Honest fallback — clearly demo, never labeled live.
    return (
      <Card className="p-5">
        <SectionTitle
          eyebrow="Weather"
          title="Local conditions"
          right={<ProvenanceBadge kind="demo" />}
        />
        <div className="mt-4 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-surface-2 text-ink-2"><Thermometer size={20} /></span>
          <div>
            <div className="nums text-2xl font-bold text-ink">{forecast.temperatureC}°C</div>
            <div className="text-xs text-ink-3">scenario temperature · {live ? "live feed unavailable" : "demo mode"}</div>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-ink-3">
          {live ? (
            <>Run <code className="rounded bg-surface-2 px-1">npm run ingest:weather</code> to populate live Open-Meteo data.</>
          ) : (
            <>Switch to <b>Live data</b> in the top bar to load real Open-Meteo weather.</>
          )}
        </p>
      </Card>
    );
  }

  const source = w.status === "ready" ? w.source : "Open-Meteo";
  const fresh = freshness(w.status === "ready" ? w.retrievedAt : null);
  return (
    <Card className="p-5">
      <SectionTitle
        eyebrow="Weather"
        title="Local conditions"
        right={<ProvenanceBadge kind="live" note={`${source} · ${fresh.ageLabel}`} />}
      />
      <div className="mt-4 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-ok-soft text-ok"><Thermometer size={20} /></span>
        <div>
          <div className="nums text-2xl font-bold text-ink">{loc!.current.tempC}°C</div>
          <div className="flex items-center gap-2 text-xs text-ink-3">
            {loc!.current.humidity != null && <span className="inline-flex items-center gap-1"><Droplets size={12} /> {loc!.current.humidity}%</span>}
            <span>observed {loc!.observedAt?.replace("T", " ")}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2">
        {loc!.forecast.slice(0, 5).map((d) => (
          <div key={d.date} className="rounded-lg border border-line bg-surface-2 p-2 text-center">
            <div className="text-[10px] text-ink-3">{d.date.slice(5)}</div>
            <div className="nums text-sm font-semibold text-ink">{Math.round(d.tmax)}°</div>
            <div className="nums text-[11px] text-ink-3">{Math.round(d.tmin)}°</div>
            {d.precipMm > 0 && (
              <div className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] text-demand"><CloudRain size={10} /> {d.precipMm}</div>
            )}
          </div>
        ))}
      </div>
      {fresh.stale && (
        <p className="mt-3 text-[11px] text-warn">Snapshot is stale — re-run <code className="rounded bg-surface-2 px-1">npm run ingest:weather</code>.</p>
      )}
    </Card>
  );
}
