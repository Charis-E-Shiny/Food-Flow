import type { Crop } from "@/types";
import type { Commodity } from "./mockData";
import type { PlacePrice } from "@/hooks/useMarketPrices";
import { CROP_META } from "./images";
import { hash, rng } from "./market";

// ============================================================
// Marketplace commodity detail helpers.
//   • commodityImage(): the "lil image" (same photos as Predict) when a
//     commodity maps to a known crop; otherwise null → emoji tile.
//   • demoPlaces(): deterministic illustrative per-place prices for the
//     place selector in Demo mode (and for commodities not in the real
//     dataset). Live mode uses the REAL places from market-prices.json.
// ============================================================

// Commodity name → crop photo (reuses Predict's CROP_META imagery).
const NAME_TO_CROP: Record<string, Crop> = {
  Tomato: "Tomato",
  Onion: "Onion",
  Potato: "Potato",
  Cabbage: "Cabbage",
  Cauliflower: "Cauliflower",
  "Green Peas": "Peas",
  "Green Chilli": "Chilli",
  Mango: "Mango",
  Banana: "Banana",
  Grapes: "Grapes",
  Pomegranate: "Pomegranate",
  Apple: "Apple",
};

export function commodityImage(name: string): string | null {
  const crop = NAME_TO_CROP[name];
  return crop ? CROP_META[crop].image : null;
}

// Major Indian wholesale markets used for the illustrative place selector.
const DEMO_MARKETS: Array<[string, string]> = [
  ["Azadpur", "Delhi"],
  ["Vashi APMC", "Maharashtra"],
  ["Koyambedu", "Tamil Nadu"],
  ["Bowenpally", "Telangana"],
  ["Sealdah", "West Bengal"],
  ["Gultekdi", "Maharashtra"],
  ["Jamalpur", "Gujarat"],
  ["Yeshwanthpur", "Karnataka"],
  ["Dubagga", "Uttar Pradesh"],
  ["Muhana", "Rajasthan"],
  ["Kalamna", "Maharashtra"],
  ["Choithram", "Madhya Pradesh"],
];

/** Deterministic illustrative per-place prices around the commodity's modal price. */
export function demoPlaces(c: Commodity): PlacePrice[] {
  const r = rng(hash(c.id + ":places"));
  return DEMO_MARKETS.map(([market, state]) => {
    const off = (r() - 0.45) * c.price * 0.22;
    const price = Math.max(1, +(c.price + off).toFixed(1));
    return { market, state, pricePerKg: price, date: "illustrative" };
  }).sort((a, b) => b.pricePerKg - a.pricePerKg);
}
