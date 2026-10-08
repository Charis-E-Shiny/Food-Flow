import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:5190";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

// Seed a sandbox session so protected routes render.
const SESSION = JSON.stringify({
  name: "Ravi Kumar",
  email: "ops@freshroots.in",
  org: "FreshRoots FPO",
  role: "Operations",
  initials: "RK",
});

const shots = [
  { path: "/", file: "landing.png", wait: 2500 },
  { path: "/dashboard", file: "overview.png", wait: 4500 },
  { path: "/predict", file: "predict.png", wait: 3000 },
  { path: "/risk", file: "risk.png", wait: 2500 },
  { path: "/optimize", file: "optimize.png", wait: 3500 },
  { path: "/map", file: "network-map.png", wait: 5000 },
  { path: "/impact", file: "impact.png", wait: 3500 },
  { path: "/simulator", file: "simulator.png", wait: 2500 },
  { path: "/marketplace", file: "market.png", wait: 2500 },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
await ctx.addInitScript((s) => {
  try {
    localStorage.setItem("foodflow.session.v1", s);
  } catch {}
}, SESSION);

const page = await ctx.newPage();
for (const s of shots) {
  await page.goto(BASE + s.path, { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(s.wait);
  await page.screenshot({ path: `${OUT}/${s.file}` });
  console.log("captured", s.file);
}
await browser.close();
console.log("done");
