import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Clock, TrendingUp } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Img } from "@/components/ui/Img";
import { IMG, CROP_META } from "@/data/images";
import { KOLAR_SCENARIO } from "@/data/scenario";
import { tonnes } from "@/lib/format";

// Split auth layout: focused form on the left, premium product
// showcase on the right (image + floating live snapshot card).
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const f = KOLAR_SCENARIO.forecast;
  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[1fr_1.1fr]">
      {/* Form side */}
      <div className="flex min-h-screen flex-col px-6 py-8 sm:px-12 lg:px-16">
        <div className="flex items-center justify-between">
          <Logo />
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink lg:hidden">
            <ArrowLeft size={15} /> Home
          </Link>
        </div>
        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-sm py-10">
            <h1 className="text-[28px] font-bold tracking-tight text-ink">{title}</h1>
            <p className="mt-1.5 text-sm text-ink-2">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
        <div className="text-xs text-ink-3">{footer}</div>
      </div>

      {/* Showcase side */}
      <div className="relative hidden overflow-hidden lg:block">
        <Img src={IMG.heroFields} alt="Terraced farmland at golden hour" className="absolute inset-0 h-full w-full" imgClassName="scale-105" />
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-strong via-brand-strong/70 to-brand/25" />
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{ backgroundImage: "radial-gradient(40rem 40rem at 90% 10%, rgb(255 255 255 / 0.18), transparent 55%)" }}
          aria-hidden
        />

        <Link to="/" className="absolute right-8 top-8 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/25">
          <ArrowLeft size={15} /> Back to site
        </Link>

        <div className="absolute inset-0 flex flex-col justify-end p-12 text-white">
          {/* floating live snapshot card */}
          <div className="mb-8 w-[22rem] max-w-full rounded-2xl border border-white/20 bg-white/10 p-4 shadow-pop backdrop-blur-md">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-white/70">
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
                Live surplus signal
              </span>
              <span>{f.district.split(",")[1]?.trim() ?? f.district}</span>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{CROP_META[f.crop].emoji}</span>
                <div>
                  <div className="text-lg font-bold">{f.location} · {f.crop}</div>
                  <div className="text-xs text-white/70">predicted surplus</div>
                </div>
              </div>
              <div className="nums text-3xl font-extrabold">{tonnes(f.predictedQuantityT)}</div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Chip icon={<Clock size={12} />} label={`${f.horizonHours}h`} />
              <Chip icon={<TrendingUp size={12} />} label={`+${f.arrivalChangePct}%`} />
              <Chip icon={<AlertTriangle size={12} />} label={`${f.wasteRisk} risk`} />
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="text-[30px] font-bold leading-tight">
              The control room for agricultural surplus.
            </h2>
            <div className="mt-6 flex items-center gap-6 border-t border-white/20 pt-5">
              <Stat value="6.9T" label="preserved / event" />
              <Stat value="13.4T" label="redirected in-window" />
              <Stat value="11" label="states live" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-white/15 px-2 py-1.5 text-xs font-semibold">
      {icon}
      <span className="nums">{label}</span>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="nums text-xl font-bold">{value}</div>
      <div className="text-[11px] text-white/70">{label}</div>
    </div>
  );
}
