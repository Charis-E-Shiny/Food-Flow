import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { RotateCcw, Target } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Card, SectionTitle, Badge, Meter } from "@/components/ui";
import { calculateSpoilageRisk } from "@/lib/engine";
import { FORECASTS } from "@/data/mockData";
import { CROP_META } from "@/data/images";
import { tonnes, pct } from "@/lib/format";

interface Inputs {
  quantityT: number;
  arrivals: number; // % change
  demand: number; // % change
  temperatureC: number;
  windowH: number;
}

const PRESETS = FORECASTS.map((f) => ({
  id: f.id,
  label: `${f.location} · ${f.crop}`,
  emoji: CROP_META[f.crop].emoji,
  inputs: {
    quantityT: f.predictedQuantityT,
    arrivals: f.arrivalChangePct,
    demand: f.demandChangePct,
    temperatureC: f.temperatureC,
    windowH: f.spoilageWindowHours,
  } as Inputs,
}));

// Transparent prototype model — mirrors the factor logic in lib/engine,
// recomputed live from the raw sliders. (Illustrative, deterministic.)
function model(i: Inputs) {
  const arrivals = clamp(i.arrivals * 0.82, 0, 34);
  const demand = clamp(-i.demand * 1.15, 0, 22);
  const temp = clamp((i.temperatureC - 18) * 1.25, 0, 18);
  const shelf = clamp(((168 - i.windowH) / 168) * 16, 0, 16);
  const capacity = clamp((i.quantityT / 20) * 10, 0, 10);
  const waste = Math.round(clamp(arrivals + demand + temp + shelf + capacity, 0, 100));
  const spoilage = calculateSpoilageRisk(i.windowH, i.temperatureC);
  const band = waste >= 70 ? "high" : waste >= 45 ? "emerging" : "stable";
  const action = band === "high" ? "Redirect now" : band === "emerging" ? "Redirect / hold" : "Sell locally";
  return {
    waste,
    spoilage,
    band,
    action,
    factors: [
      { label: "Arrivals", v: Math.round(arrivals) },
      { label: "Demand", v: Math.round(demand) },
      { label: "Temperature", v: Math.round(temp) },
      { label: "Shelf life", v: Math.round(shelf) },
      { label: "Capacity", v: Math.round(capacity) },
    ],
  };
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export default function Simulator() {
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const base = PRESETS.find((p) => p.id === presetId)!;
  const [inp, setInp] = useState<Inputs>(base.inputs);

  const loadPreset = (id: string) => {
    setPresetId(id);
    setInp(PRESETS.find((p) => p.id === id)!.inputs);
  };

  const out = useMemo(() => model(inp), [inp]);
  const tone = out.band === "high" ? "risk" : out.band === "emerging" ? "warn" : "ok";

  return (
    <div>
      <PageHead
        eyebrow="Tool · Scenario Simulator"
        title="Scenario simulator"
        sub="Test supply, demand and weather conditions — watch the waste-risk recompute live."
        actions={
          <button onClick={() => setInp(base.inputs)} className="inline-flex items-center gap-1.5 rounded-xl border border-line-strong bg-surface px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-2">
            <RotateCcw size={14} /> Reset
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        {/* Controls */}
        <Card className="p-5">
          <SectionTitle eyebrow="Inputs" title="Scenario" />
          <div className="mt-4">
            <label className="text-xs font-semibold text-ink-2">Start from</label>
            <select
              value={presetId}
              onChange={(e) => loadPreset(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-line-strong bg-surface px-3 text-sm text-ink outline-none focus:border-brand"
            >
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="mt-5 space-y-5">
            <Slider label="Predicted quantity" value={inp.quantityT} min={1} max={30} step={0.1} unit="T" onChange={(v) => setInp({ ...inp, quantityT: v })} />
            <Slider label="Arrivals vs norm" value={inp.arrivals} min={-20} max={60} step={1} unit="%" signed onChange={(v) => setInp({ ...inp, arrivals: v })} />
            <Slider label="Demand vs norm" value={inp.demand} min={-30} max={30} step={1} unit="%" signed onChange={(v) => setInp({ ...inp, demand: v })} />
            <Slider label="Temperature" value={inp.temperatureC} min={10} max={45} step={1} unit="°C" onChange={(v) => setInp({ ...inp, temperatureC: v })} />
            <Slider label="Usable window" value={inp.windowH} min={24} max={264} step={6} unit="h" onChange={(v) => setInp({ ...inp, windowH: v })} />
          </div>
        </Card>

        {/* Output */}
        <Card className="p-5">
          <SectionTitle eyebrow="Result" title="Predicted outcome" right={<Badge tone={tone as "risk" | "warn" | "ok"} dot>{out.band === "high" ? "High risk" : out.band === "emerging" ? "Emerging" : "Stable"}</Badge>} />

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-line bg-surface-2 p-4 text-center">
              <motion.div key={out.waste} initial={{ scale: 0.9, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} className="nums text-4xl font-extrabold" style={{ color: `rgb(var(--c-${tone}))` }}>
                {out.waste}
              </motion.div>
              <div className="text-xs text-ink-3">waste risk / 100</div>
            </div>
            <div className="rounded-2xl border border-line bg-surface-2 p-4 text-center">
              <div className="nums text-4xl font-extrabold text-ink">{out.spoilage}</div>
              <div className="text-xs text-ink-3">spoilage risk / 100</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-3">Risk composition</div>
            <div className="space-y-2">
              {out.factors.map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs text-ink-2">{f.label}</span>
                  <Meter value={f.v} max={34} tone={tone as "risk" | "warn" | "ok"} />
                  <span className="nums w-6 text-right text-xs font-semibold text-ink">{f.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-brand/25 bg-brand-tint px-4 py-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-brand">Recommended</div>
              <div className="text-lg font-bold text-brand-strong">{out.action}</div>
            </div>
            <Link to="/optimize" className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong">
              <Target size={15} /> Optimize
            </Link>
          </div>
          <p className="mt-3 text-[11px] text-ink-3">
            Arrivals {pct(inp.arrivals, true)} · demand {pct(inp.demand, true)} · {inp.temperatureC}°C · {tonnes(inp.quantityT)}. Illustrative decision-engine model.
          </p>
        </Card>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  signed,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  signed?: boolean;
  onChange: (v: number) => void;
}) {
  const shown = signed && value > 0 ? `+${value}` : `${value}`;
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-ink-2">{label}</label>
        <span className="nums rounded-lg bg-surface-2 px-2 py-0.5 text-sm font-semibold text-ink">{shown}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-2"
        style={{ accentColor: "rgb(var(--c-brand))" }}
      />
    </div>
  );
}
