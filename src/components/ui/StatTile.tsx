import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useCountUp } from "@/hooks/useCountUp";

// Executive KPI tile. Big legible number, tight label, optional
// delta and sparkline slot. Numbers animate on mount.

export function StatTile({
  label,
  value,
  unit,
  decimals = 0,
  prefix,
  delta,
  deltaTone = "ink-3",
  icon,
  accent = "brand",
  countUp = true,
  className,
  hint,
}: {
  label: string;
  value: number;
  unit?: string;
  decimals?: number;
  prefix?: string;
  delta?: string;
  deltaTone?: "ok" | "risk" | "warn" | "ink-3";
  icon?: ReactNode;
  accent?: "brand" | "risk" | "warn" | "demand";
  countUp?: boolean;
  className?: string;
  hint?: string;
}) {
  const shown = useCountUp(countUp ? value : value, countUp ? 900 : 0, decimals);
  const display = countUp ? shown : value;
  const accentBar: Record<string, string> = {
    brand: "bg-brand",
    risk: "bg-risk",
    warn: "bg-warn",
    demand: "bg-demand",
  };
  const deltaColor: Record<string, string> = {
    ok: "text-ok",
    risk: "text-risk",
    warn: "text-warn",
    "ink-3": "text-ink-3",
  };
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-card",
        className,
      )}
    >
      <span className={cn("absolute left-0 top-4 h-8 w-1 rounded-r-full", accentBar[accent])} />
      <div className="flex items-start justify-between pl-2">
        <div className="text-[13px] font-medium text-ink-2">{label}</div>
        {icon && <div className="text-ink-3">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-1 pl-2">
        {prefix && <span className="text-xl font-semibold text-ink-2">{prefix}</span>}
        <span className="nums text-[28px] font-bold leading-none tracking-tight text-ink">
          {display.toLocaleString("en-IN", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })}
        </span>
        {unit && <span className="text-sm font-medium text-ink-3">{unit}</span>}
      </div>
      <div className="mt-2 flex items-center justify-between pl-2">
        {delta && <span className={cn("text-xs font-medium", deltaColor[deltaTone])}>{delta}</span>}
        {hint && <span className="text-[11px] text-ink-3">{hint}</span>}
      </div>
    </div>
  );
}
