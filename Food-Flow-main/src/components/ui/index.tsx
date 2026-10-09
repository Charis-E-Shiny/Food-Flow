import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { RiskBand } from "@/types";

// ============================================================
// FoodFlow UI kit — small, composable, token-driven primitives.
// ============================================================

export function Card({
  className,
  children,
  as: As = "div",
  interactive,
}: {
  className?: string;
  children: ReactNode;
  as?: "div" | "section" | "article";
  interactive?: boolean;
}) {
  return (
    <As
      className={cn(
        "rounded-2xl border border-line bg-surface shadow-card",
        interactive && "transition-shadow hover:shadow-lift",
        className,
      )}
    >
      {children}
    </As>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  sub,
  className,
  right,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  className?: string;
  right?: ReactNode;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div>
        {eyebrow && (
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
            {eyebrow}
          </div>
        )}
        <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
        {sub && <p className="mt-1 max-w-2xl text-sm text-ink-2">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

type Tone = "brand" | "risk" | "warn" | "demand" | "ok" | "neutral";

const toneMap: Record<Tone, string> = {
  brand: "bg-brand-tint text-brand-strong",
  risk: "bg-risk-soft text-risk",
  warn: "bg-warn-soft text-warn",
  demand: "bg-demand-soft text-demand",
  ok: "bg-ok-soft text-ok",
  neutral: "bg-surface-2 text-ink-2 border border-line",
};

export function Badge({
  tone = "neutral",
  children,
  className,
  dot,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        toneMap[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export const bandTone: Record<RiskBand, Tone> = {
  stable: "ok",
  emerging: "warn",
  high: "risk",
};

export const bandLabel: Record<RiskBand, string> = {
  stable: "Stable",
  emerging: "Emerging",
  high: "High risk",
};

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";
const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-strong shadow-card active:scale-[0.98]",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-surface-2 active:scale-[0.98]",
  ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
  danger: "bg-risk text-white hover:brightness-95 active:scale-[0.98]",
};
const btnSizes = { sm: "h-8 px-3", md: "h-10 px-4", lg: "h-12 px-6 text-[15px]" };

interface BtnProps {
  variant?: BtnVariant;
  size?: keyof typeof btnSizes;
  className?: string;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: BtnProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(btnBase, btnVariants[variant], btnSizes[size], className)} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({
  to,
  variant = "primary",
  size = "md",
  className,
  children,
}: BtnProps & { to: string }) {
  return (
    <Link to={to} className={cn(btnBase, btnVariants[variant], btnSizes[size], className)}>
      {children}
    </Link>
  );
}

/** Thin labeled progress / meter bar. */
export function Meter({
  value,
  max = 100,
  tone = "brand",
  className,
}: {
  value: number;
  max?: number;
  tone?: Tone;
  className?: string;
}) {
  const fill: Record<Tone, string> = {
    brand: "bg-brand",
    risk: "bg-risk",
    warn: "bg-warn",
    demand: "bg-demand",
    ok: "bg-ok",
    neutral: "bg-ink-3",
  };
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-2", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", fill[tone])}
        style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
      />
    </div>
  );
}

/** A small "simulation" chip used to keep honesty front-and-center. */
export function DemoChip({ className }: { className?: string }) {
  return (
    <span
      title="Illustrative scenario — not measured real-world data"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-dashed border-line-strong bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-ink-3",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-warn" />
      Demo data
    </span>
  );
}
