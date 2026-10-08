import { useMemo } from "react";
import { GeoJSON, MapContainer, Marker, Polygon, Polyline, TileLayer, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/cn";
import { unproject, INDIA_GEOJSON, INDIA_OUTER_RINGS, WORLD_RING } from "@/data/geo";
import { CROP_META } from "@/data/images";
import type { DemandNode, GeoPoint, RiskBand, SurplusForecast } from "@/types";
import { tonnes } from "@/lib/format";

// ============================================================
// Real tiled geographic map (Leaflet + OpenStreetMap/CARTO tiles).
// Keeps the same props the rest of the app already passes. No API
// key required for the default CARTO Positron basemap; set
// VITE_MAPTILER_KEY to switch to a keyed provider.
// ============================================================

export interface Flow {
  from: GeoPoint;
  to: GeoPoint;
  quantityT: number;
}

const bandColor: Record<RiskBand, string> = {
  stable: "rgb(32,122,72)",
  emerging: "rgb(199,122,10)",
  high: "rgb(196,59,46)",
};
const DEMAND = "rgb(45,107,143)";

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY as string | undefined;
const TILES = MAPTILER_KEY
  ? {
      url: `https://api.maptiler.com/maps/dataviz-light/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`,
      attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; OpenStreetMap contributors',
    }
  : {
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
    };

function surplusIcon(f: SurplusForecast, selected: boolean) {
  const c = bandColor[f.band];
  const pulse = f.band === "high"
    ? `<span style="position:absolute;left:50%;top:50%;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:999px;background:${c};opacity:.35" class="animate-pulse-ring"></span>`
    : "";
  const ring = selected ? `box-shadow:0 0 0 3px ${c},0 6px 16px rgba(20,30,20,.35)` : "box-shadow:0 4px 12px rgba(20,30,20,.28)";
  const size = selected ? 34 : 28;
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="position:relative">${pulse}<div style="position:relative;width:${size}px;height:${size}px;border-radius:999px;background:#fff;border:2.5px solid ${c};${ring};display:grid;place-items:center;font-size:${selected ? 16 : 14}px">${CROP_META[f.crop].emoji}</div></div>`,
  });
}

function demandIcon() {
  return L.divIcon({
    className: "",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    html: `<div style="width:12px;height:12px;background:${DEMAND};border:2px solid #fff;border-radius:3px;transform:rotate(45deg);box-shadow:0 2px 6px rgba(20,30,20,.3)"></div>`,
  });
}

// quadratic curve points between two latlngs for a nicer route arc
function curve(a: [number, number], b: [number, number]): [number, number][] {
  const mid: [number, number] = [(a[0] + b[0]) / 2 + Math.abs(b[1] - a[1]) * 0.12, (a[1] + b[1]) / 2];
  const pts: [number, number][] = [];
  for (let t = 0; t <= 1.0001; t += 0.1) {
    const lat = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * mid[0] + t * t * b[0];
    const lng = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * mid[1] + t * t * b[1];
    pts.push([lat, lng]);
  }
  return pts;
}

export function SurplusMap({
  forecasts,
  demandNodes = [],
  showSurplus = true,
  showDemand = false,
  selectedId,
  onSelect,
  flows = [],
  className,
  aspect = "aspect-square",
  scrollZoom = true,
}: {
  forecasts: SurplusForecast[];
  demandNodes?: DemandNode[];
  showSurplus?: boolean;
  showDemand?: boolean;
  selectedId?: string;
  onSelect?: (id: string) => void;
  flows?: Flow[];
  className?: string;
  aspect?: string;
  scrollZoom?: boolean;
}) {
  const curves = useMemo(() => flows.map((fl) => curve(unproject(fl.from), unproject(fl.to))), [flows]);
  // World rectangle with India punched out as holes → everything outside
  // India is dimmed, so the map reads as India-only.
  const maskRings = useMemo(() => [WORLD_RING, ...INDIA_OUTER_RINGS], []);

  return (
    <div className={cn("relative isolate w-full overflow-hidden rounded-2xl border border-line", aspect, className)}>
      <MapContainer
        center={[22.9, 80.2]}
        zoom={4.7}
        minZoom={4.3}
        maxZoom={9}
        maxBounds={[
          [6, 67],
          [37, 98],
        ]}
        maxBoundsViscosity={1}
        zoomControl
        scrollWheelZoom={scrollZoom}
        attributionControl
        className="h-full w-full"
        style={{ background: "rgb(var(--c-surface-2))" }}
      >
        <TileLayer url={TILES.url} attribution={TILES.attribution} />

        {/* Dim everything outside India */}
        <Polygon
          positions={maskRings}
          pathOptions={{ stroke: false, fillColor: "rgb(236,239,234)", fillOpacity: 0.78, fillRule: "evenodd", interactive: false }}
        />
        {/* Real state boundaries */}
        <GeoJSON
          data={INDIA_GEOJSON as any}
          style={{ color: "rgb(120,132,116)", weight: 0.7, opacity: 0.55, fill: false, interactive: false } as any}
        />

        {curves.map((pts, i) => (
          <Polyline key={i} positions={pts} pathOptions={{ color: "rgb(27,94,63)", weight: 2 + (flows[i].quantityT / 15) * 3, opacity: 0.7, dashArray: "6 8", lineCap: "round" }} />
        ))}

        {showSurplus &&
          forecasts.map((f) => (
            <Marker
              key={f.id}
              position={unproject(f.geo)}
              icon={surplusIcon(f, selectedId === f.id)}
              eventHandlers={onSelect ? { click: () => onSelect(f.id) } : undefined}
            >
              <Tooltip direction="top" offset={[0, -14]} opacity={1} className="ff-tip">
                <div style={{ minWidth: 150 }}>
                  <div style={{ fontWeight: 700 }}>{f.location} · {f.crop}</div>
                  <div style={{ color: "#4a5049" }}>{tonnes(f.predictedQuantityT)} · {f.district.split(",")[1]?.trim() ?? ""}</div>
                  <div style={{ marginTop: 2 }}>Waste risk <b style={{ color: bandColor[f.band] }}>{f.wasteRisk}</b></div>
                </div>
              </Tooltip>
            </Marker>
          ))}

        {showDemand &&
          demandNodes.map((n) => (
            <Marker key={n.id} position={unproject(n.geo)} icon={demandIcon()}>
              <Tooltip direction="top" offset={[0, -8]} opacity={1} className="ff-tip">
                <div style={{ minWidth: 150 }}>
                  <div style={{ fontWeight: 700 }}>{n.name}</div>
                  <div style={{ color: "#4a5049" }}>Capacity {tonnes(n.capacityT)}</div>
                  <div style={{ color: DEMAND }}>Need: {n.needLabel}</div>
                </div>
              </Tooltip>
            </Marker>
          ))}
      </MapContainer>

      <Legend showDemand={showDemand} />
    </div>
  );
}

function Legend({ showDemand }: { showDemand: boolean }) {
  const items: Array<[string, string]> = [
    ["Stable", bandColor.stable],
    ["Emerging", bandColor.emerging],
    ["High risk", bandColor.high],
  ];
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-line bg-surface/92 px-2.5 py-1.5 text-[11px] text-ink-2 shadow-card backdrop-blur">
      {items.map(([label, color]) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          {label}
        </span>
      ))}
      {showDemand && (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rotate-45 rounded-[1px]" style={{ background: DEMAND }} />
          Demand / capacity
        </span>
      )}
    </div>
  );
}
