import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Gauge,
  LineChart,
  MapPin,
  Menu,
  Route,
  ShieldCheck,
  Thermometer,
  TrendingUp,
  X,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Badge } from "@/components/ui";
import { Img } from "@/components/ui/Img";
import { SurplusMap } from "@/components/map/SurplusMap";
import { IMG, CROP_META } from "@/data/images";
import { FORECASTS, NATIONAL_DEMAND } from "@/data/mockData";
import type { Crop } from "@/types";
import { KOLAR_SCENARIO, PORTFOLIO } from "@/data/scenario";
import { tonnes } from "@/lib/format";

const NAV_LINKS = [
  ["Platform", "#platform"],
  ["Network", "#network"],
];

const CROPS: Crop[] = [
  "Tomato", "Onion", "Potato", "Mango", "Banana", "Cabbage",
  "Chilli", "Grapes", "Cauliflower", "Peas", "Pomegranate", "Apple",
];

export default function Landing() {
  const f = KOLAR_SCENARIO.forecast;
  const [menu, setMenu] = useState(false);

  return (
    <div className="min-h-screen bg-canvas">
      {/* ---- Top nav ---- */}
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-ink-2 md:flex">
            {NAV_LINKS.map(([label, href]) => (
              <a key={label} href={href} className="hover:text-ink">
                {label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Link to="/login" className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-2 hover:text-ink">
              Sign in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand-strong"
            >
              Start free <ArrowRight size={15} />
            </Link>
          </div>
          <button className="rounded-lg p-2 text-ink-2 md:hidden" onClick={() => setMenu((v) => !v)} aria-label="Menu">
            {menu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {menu && (
          <div className="border-t border-line bg-surface px-5 py-3 md:hidden">
            {NAV_LINKS.map(([label, href]) => (
              <a key={label} href={href} onClick={() => setMenu(false)} className="block py-2 text-sm text-ink-2">
                {label}
              </a>
            ))}
            <div className="mt-2 flex gap-2">
              <Link to="/login" className="flex-1 rounded-xl border border-line-strong py-2 text-center text-sm font-semibold text-ink">Sign in</Link>
              <Link to="/signup" className="flex-1 rounded-xl bg-brand py-2 text-center text-sm font-semibold text-white">Start free</Link>
            </div>
          </div>
        )}
      </header>

      {/* ---- Hero ---- */}
      <section className="bg-field">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <Badge tone="brand" dot className="mb-5">
              Predictive food-allocation platform · live across India
            </Badge>
            <h1 className="text-[42px] font-extrabold leading-[1.04] tracking-tight text-ink sm:text-[56px]">
              Predict surplus.
              <br />
              Prevent waste.
              <br />
              <span className="text-brand">Route food where it's needed.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-2">
              FoodFlow forecasts where agricultural surplus will occur, scores its urgency and
              perishability, and optimizes where it should go — before the usable window closes.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/signup"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-6 text-[15px] font-semibold text-white shadow-card transition-all hover:bg-brand-strong active:scale-[0.98]"
              >
                Start free <ArrowRight size={18} />
              </Link>
              <a
                href="#platform"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-line-strong bg-surface px-6 text-[15px] font-semibold text-ink transition-colors hover:bg-surface-2"
              >
                Explore the platform
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-3">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={15} className="text-brand" /> No card required</span>
              <span className="inline-flex items-center gap-1.5"><Route size={15} className="text-brand" /> Predict → Optimize → Verify → Measure</span>
            </div>
          </div>

          {/* live-looking surplus intelligence card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-pop">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-risk opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-risk" />
                  </span>
                  Surplus intelligence · live
                </div>
              </div>

              <div className="mt-4 flex items-stretch gap-4">
                <Img src={IMG.tomatoes} alt="Tomato harvest in crates" className="h-24 w-24 shrink-0 rounded-xl" />
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-ink-3">{f.district}</div>
                      <div className="text-xl font-bold tracking-tight text-ink">{f.crop}</div>
                    </div>
                    <div className="text-right">
                      <div className="nums text-2xl font-extrabold text-ink">{tonnes(f.predictedQuantityT)}</div>
                      <div className="text-[11px] text-ink-3">predicted surplus</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <MiniStat icon={<Clock size={12} />} label="Horizon" value={`${f.horizonHours}h`} />
                    <MiniStat icon={<TrendingUp size={12} />} label="Arrivals" value={`+${f.arrivalChangePct}%`} />
                    <MiniStat icon={<Thermometer size={12} />} label="Temp" value={`${f.temperatureC}°`} />
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-risk/20 bg-risk-soft p-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-risk">
                    <AlertTriangle size={14} /> Waste risk
                  </span>
                  <span className="nums text-lg font-bold text-risk">{f.wasteRisk}/100</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/60">
                  <motion.div className="h-full rounded-full bg-risk" initial={{ width: 0 }} animate={{ width: `${f.wasteRisk}%` }} transition={{ duration: 1, delay: 0.3 }} />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-xl bg-brand-tint p-2.5">
                  <div className="nums text-base font-bold text-brand-strong">{tonnes(KOLAR_SCENARIO.allocation.allocatedT)}</div>
                  <div className="text-brand-strong/70">routed to 4 destinations</div>
                </div>
                <div className="rounded-xl bg-surface-2 p-2.5">
                  <div className="nums text-base font-bold text-ink">{tonnes(KOLAR_SCENARIO.counterfactual.foodPreservedT)}</div>
                  <div className="text-ink-3">preserved vs. doing nothing</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---- Trust strip ---- */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-7">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-ink-3">
            Built for the people who move food
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold text-ink-2">
            {["FPOs & Cooperatives", "Mandis & APMCs", "Processors", "Cold-chain operators", "Food banks & NGOs"].map((t) => (
              <span key={t} className="opacity-80">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Crop variety strip ---- */}
      <section className="border-b border-line bg-canvas">
        <div className="mx-auto max-w-6xl px-5 py-6">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-sm font-semibold text-ink">
              Tracking {CROPS.length} crops across 11 states
            </p>
            <p className="text-xs text-ink-3">Each with its own perishability, pricing and demand profile</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {CROPS.map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink-2">
                <span className="text-base leading-none">{CROP_META[c].emoji}</span>
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Platform / feature sections ---- */}
      <section id="platform" className="mx-auto max-w-6xl space-y-16 px-5 py-20">
        <Feature
          eyebrow="Predict"
          title="A pre-surplus intervention layer"
          body="Existing systems react once food is already surplus. FoodFlow forecasts where surplus will occur 48–96 hours ahead, estimates the quantity at risk, and scores the usable window — so you act while there's still value to protect."
          points={["Arrivals & demand forecasting", "Spoilage-window scoring", "Explainable risk factors"]}
          img={IMG.onions}
          imgAlt="Onions drying at a market yard"
          icon={<LineChart size={18} />}
        />
        <Feature
          reverse
          eyebrow="Optimize"
          title="Multi-destination allocation, not a single handoff"
          body="The optimizer places surplus across markets, processors and community kitchens at once — balancing capacity, demand deficit, perishability, distance and absorption certainty. It maximizes realized value, not the highest nominal price."
          points={["Capacity-aware routing", "Realized-value optimization", "Live allocation scoring"]}
          img={IMG.logistics}
          imgAlt="Refrigerated transport on the move"
          icon={<Gauge size={18} />}
        />
        <Feature
          eyebrow="Verify & measure"
          title="Every batch traced to the plate"
          body="Each redirected lot gets a tamper-evident record from forecast to recipient confirmation — then FoodFlow measures exactly what changed: food preserved, farmer value protected, meals served, emissions avoided."
          points={["Chain-of-custody ledger", "Recipient confirmation", "Counterfactual impact"]}
          img={IMG.communityKitchen}
          imgAlt="Prepared meals being served"
          icon={<ShieldCheck size={18} />}
        />
      </section>

      {/* ---- Thesis contrast ---- */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-3">Reactive food rescue</div>
            <p className="mt-3 text-lg font-semibold text-ink">“Where can today's surplus go?”</p>
            <ul className="mt-4 space-y-2 text-sm text-ink-2">
              {["Triggered after food is already surplus", "Scrambles for any taker", "Value and freshness already eroding", "Single-destination handoff"].map((t) => (
                <li key={t} className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-3" />{t}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-brand/30 bg-brand-tint p-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-brand">FoodFlow · predictive</div>
            <p className="mt-3 text-lg font-semibold text-brand-strong">“Where will surplus occur, and where should it go first?”</p>
            <ul className="mt-4 space-y-2 text-sm text-brand-strong/90">
              {["Forecasts surplus 48–96h ahead", "Scores urgency & usable window", "Optimizes across many destinations", "Verifies delivery, measures impact"].map((t) => (
                <li key={t} className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---- National network ---- */}
      <section id="network" className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Live across India</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">A national surplus network</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
              FoodFlow continuously forecasts across producing regions — from Nashik onions to Agra
              and Hooghly potatoes to Kolar tomatoes — and maps them against demand in India's largest
              consumption and processing hubs.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <NetStat value={tonnes(PORTFOLIO.predictedSurplusT)} label="predicted surplus" />
              <NetStat value={`${FORECASTS.length}`} label="active forecasts" />
              <NetStat value={`${PORTFOLIO.highRiskEvents}`} label="high-risk events" />
            </div>
            <Link to="/signup" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:gap-2.5 transition-all">
              Explore the command center <ArrowRight size={15} />
            </Link>
          </div>
          <div className="rounded-2xl border border-line bg-canvas p-3 shadow-card">
            <SurplusMap forecasts={FORECASTS} demandNodes={NATIONAL_DEMAND} showDemand scrollZoom={false} aspect="aspect-[4/3]" />
            <div className="flex items-center justify-between px-2 py-2 text-xs text-ink-3">
              <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> Surplus events & demand hubs</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-ok" /> Live</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---- CTA band (themed, no photo) ---- */}
      <section className="px-5 py-16">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-brand/20 bg-brand-tint">
          {/* subtle themed texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.5]"
            style={{
              backgroundImage:
                "radial-gradient(30rem 30rem at 85% -20%, rgb(var(--c-brand-soft) / 0.45), transparent 60%), radial-gradient(22rem 22rem at 0% 120%, rgb(var(--c-warn-soft)), transparent 60%)",
            }}
            aria-hidden
          />
          <div className="relative grid items-center gap-8 px-8 py-14 sm:px-12 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-brand-strong sm:text-4xl">
                Route surplus before it becomes waste
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-brand-strong/80">
                Open a workspace and follow a real surplus event from forecast to verified impact in
                under two minutes.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link to="/signup" className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-6 text-[15px] font-semibold text-white shadow-card transition-all hover:bg-brand-strong active:scale-[0.98]">
                  Start free <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="inline-flex h-12 items-center gap-2 rounded-xl border border-brand/30 bg-surface px-6 text-[15px] font-semibold text-brand-strong hover:bg-surface-2">
                  Sign in
                </Link>
              </div>
            </div>
            {/* themed stat panel instead of a photo */}
            <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
              <CtaStat value={tonnes(PORTFOLIO.predictedSurplusT)} label="surplus forecast across India" />
              <CtaStat value={tonnes(KOLAR_SCENARIO.counterfactual.foodPreservedT)} label="preserved per intervention" />
              <CtaStat value={`${FORECASTS.length}`} label="live events, 11 states" />
            </div>
          </div>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="border-t border-line bg-canvas">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-ink-3">
              Predictive food-allocation infrastructure for agricultural surplus.
            </p>
          </div>
          <FooterCol title="Product" links={["Platform", "Command Center", "Optimization", "Traceability"]} />
          <FooterCol title="Company" links={["About", "Careers", "Contact", "Press"]} />
          <FooterCol title="Resources" links={["Documentation", "Field guide", "Security", "Status"]} />
        </div>
        <div className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-5 text-xs text-ink-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>© {new Date().getFullYear()} FoodFlow, Inc. All rights reserved.</span>
              <span className="hidden sm:inline text-line-strong">·</span>
              <span className="cursor-default hover:text-ink">Privacy</span>
              <span className="cursor-default hover:text-ink">Terms</span>
              <span className="cursor-default hover:text-ink">Security</span>
            </div>
            <div className="flex flex-col gap-0.5 sm:items-end">
              <span>Sandbox environment · illustrative simulation data, not measured outcomes.</span>
              <span className="text-ink-3/80">
                Map data © GADM / geohacker. Photography via{" "}
                <a href="https://unsplash.com" className="underline hover:text-ink" target="_blank" rel="noreferrer">Unsplash</a>
                {" "}(CC).
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  eyebrow,
  title,
  body,
  points,
  img,
  imgAlt,
  icon,
  reverse,
}: {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  img: string;
  imgAlt: string;
  icon: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className={"grid items-center gap-8 lg:grid-cols-2 " + (reverse ? "lg:[&>*:first-child]:order-2" : "")}>
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-tint px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-strong">
          {icon} {eyebrow}
        </div>
        <h2 className="mt-3 text-[28px] font-bold leading-tight tracking-tight text-ink">{title}</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{body}</p>
        <ul className="mt-5 space-y-2">
          {points.map((p) => (
            <li key={p} className="flex items-center gap-2.5 text-sm font-medium text-ink">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-brand text-white">
                <ArrowRight size={12} />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>
      <Img src={img} alt={imgAlt} className="aspect-[4/3] w-full rounded-2xl border border-line shadow-card" />
    </div>
  );
}

function CtaStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-brand/15 bg-surface/80 p-4 backdrop-blur">
      <div className="nums text-2xl font-extrabold text-brand-strong">{value}</div>
      <div className="mt-0.5 text-xs text-brand-strong/70">{label}</div>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-2 py-1.5">
      <div className="flex items-center gap-1 text-[10px] text-ink-3">{icon}{label}</div>
      <div className="nums mt-0.5 text-xs font-semibold text-ink">{value}</div>
    </div>
  );
}

function NetStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <div className="nums text-xl font-extrabold text-ink">{value}</div>
      <div className="text-[11px] text-ink-3">{label}</div>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-3">{title}</div>
      <ul className="mt-3 space-y-2 text-sm text-ink-2">
        {links.map((l) => (
          <li key={l}><span className="cursor-default hover:text-ink">{l}</span></li>
        ))}
      </ul>
    </div>
  );
}
