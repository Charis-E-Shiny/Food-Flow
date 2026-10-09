// Centralized imagery. Stable Unsplash photo URLs (agriculture,
// markets, logistics, food). Components use <Img> which falls back
// to a gradient if a URL fails to load, so the UI never breaks.

const U = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

export const IMG = {
  heroFields: U("1500937386664-56d1dfef3854", 1600), // green terraced fields
  tomatoes: U("1592924357228-91a4daadcfea", 1000), // tomato harvest crates
  mandiMarket: U("1488459716781-31db52582fe9", 1000), // produce market
  logistics: U("1601584115197-04ecc0da31d7", 1000), // cargo truck
  communityKitchen: U("1593113598332-cd288d649433", 1000), // meals / serving
  farmerField: U("1625246333195-78d9c38ad449", 1000), // farmer in field
  onions: U("1518977676601-b53f82aba655", 1000), // onions
  cratesWarehouse: U("1607301405390-d831c242f59b", 1000), // warehouse crates
  dashboardAbstract: U("1551288049-bebda4e38f71", 1400), // analytics
  aerialFarm: U("1574323347407-f5e1ad6d020b", 1400), // aerial farmland
  portraitA: U("1500648767791-00dcc994a43e", 300), // operations lead
  portraitB: U("1494790108377-be9c29b29330", 300), // FPO coordinator
} as const;

export type ImgKey = keyof typeof IMG;

import type { Crop } from "@/types";

// Per-crop emoji badge (crisp, unambiguous, zero network cost) plus a
// representative photo for larger spots. Photos fall back to a
// gradient via <Img> if a URL ever fails.
export const CROP_META: Record<Crop, { emoji: string; image: string }> = {
  Tomato: { emoji: "🍅", image: U("1592924357228-91a4daadcfea", 800) },
  Onion: { emoji: "🧅", image: U("1518977676601-b53f82aba655", 800) },
  Potato: { emoji: "🥔", image: U("1590005354167-6da97870c757", 800) },
  Mango: { emoji: "🥭", image: U("1553279768-865429fa0078", 800) },
  Banana: { emoji: "🍌", image: U("1571771894821-ce9b6c11b08e", 800) },
  Cabbage: { emoji: "🥬", image: U("1594282486552-05b4d80fbb9f", 800) },
  Chilli: { emoji: "🌶️", image: U("1583119022894-919a68a3d0e3", 800) },
  Grapes: { emoji: "🍇", image: U("1528821128474-27f963b062bf", 800) },
  Cauliflower: { emoji: "🥦", image: U("1568584711271-6c929fb49b60", 800) },
  Peas: { emoji: "🫛", image: U("1587334274328-64186a80aeee", 800) },
  Pomegranate: { emoji: "🍎", image: U("1541344999736-83eca272f6fc", 800) },
  Apple: { emoji: "🍎", image: U("1524593166156-312f362cada0", 800) },
};
