import type { GeoPoint } from "@/types";
import india from "./india.states.json";

// ============================================================
// National (India) projection + REAL geographic geometry.
// State boundaries come from an open GADM-derived dataset
// (geohacker/india), simplified to ~79 KB. Cities and the map
// share one equirectangular projection, so markers always sit on
// the real geography. Map focuses on mainland (far island UTs
// dropped during simplification).
// ============================================================

const LON_MIN = 67;
const LON_SPAN = 31; // → 98
const LAT_MIN = 6;
const LAT_SPAN = 31; // → 37

export function project(lat: number, lon: number): GeoPoint {
  const x = ((lon - LON_MIN) / LON_SPAN) * 100;
  const y = ((LAT_MIN + LAT_SPAN - lat) / LAT_SPAN) * 100;
  return { x: +x.toFixed(2), y: +y.toFixed(2) };
}

/** Inverse of project(): 0–100 point → real [lat, lon] for map tiles. */
export function unproject(p: GeoPoint): [number, number] {
  const lon = (p.x / 100) * LON_SPAN + LON_MIN;
  const lat = LAT_MIN + LAT_SPAN - (p.y / 100) * LAT_SPAN;
  return [lat, lon];
}

const CITIES: Record<string, [number, number]> = {
  Kolar: [13.13, 78.13],
  Bengaluru: [12.97, 77.59],
  Mysuru: [12.3, 76.65],
  Hassan: [13.0, 76.1],
  Nashik: [20.0, 73.78],
  Agra: [27.18, 78.01],
  Jalandhar: [31.33, 75.58],
  Guntur: [16.31, 80.45],
  Hooghly: [22.9, 88.0],
  Nagpur: [21.15, 79.09],
  Anand: [22.56, 72.96],
  Shimla: [31.1, 77.17],
  Sangli: [16.85, 74.57],
  Kurnool: [15.83, 78.04],
  Pune: [18.52, 73.86],
  Indore: [22.72, 75.86],
  Solapur: [17.66, 75.9],
  Delhi: [28.61, 77.21],
  Mumbai: [19.08, 72.88],
  Chennai: [13.08, 80.27],
  Hyderabad: [17.38, 78.49],
  Kolkata: [22.57, 88.36],
};

export const CITY_GEO: Record<string, GeoPoint> = Object.fromEntries(
  Object.entries(CITIES).map(([k, [lat, lon]]) => [k, project(lat, lon)]),
);

type Ring = [number, number][];
function ringToPath(ring: Ring): string {
  let d = "";
  for (let i = 0; i < ring.length; i++) {
    const p = project(ring[i][1], ring[i][0]);
    d += `${i === 0 ? "M" : "L"}${p.x} ${p.y}`;
  }
  return d + "Z";
}

export interface StateShape {
  name: string;
  d: string;
}

// Precompute one SVG path per state (all its polygons/holes).
export const STATE_SHAPES: StateShape[] = (india as unknown as {
  features: { properties: { name: string }; geometry: { coordinates: Ring[][] } }[];
}).features.map((f) => ({
  name: f.properties.name,
  d: f.geometry.coordinates.map((poly) => poly.map((r) => ringToPath(r as Ring)).join(" ")).join(" "),
}));

// ------------------------------------------------------------
// Real India geometry for the Leaflet map (so the basemap can be
// masked to India only). GeoJSON rings are [lon,lat]; Leaflet wants
// [lat,lng]. We expose every state's OUTER ring as a [lat,lng] ring —
// their union is the national landmass used to punch a hole in the mask.
// ------------------------------------------------------------
export const INDIA_GEOJSON = india as unknown as Record<string, unknown>;

export const INDIA_OUTER_RINGS: [number, number][][] = (india as unknown as {
  features: { geometry: { coordinates: Ring[][] } }[];
}).features.flatMap((f) =>
  f.geometry.coordinates.map((poly) => (poly[0] as Ring).map(([lon, lat]) => [lat, lon] as [number, number])),
);

// A generous world rectangle (lat,lng) used as the mask's outer ring;
// India rings become holes so only India shows the basemap tiles.
export const WORLD_RING: [number, number][] = [
  [-85, -200],
  [-85, 200],
  [85, 200],
  [85, -200],
];
