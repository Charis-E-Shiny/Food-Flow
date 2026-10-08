import { useEffect, useRef, useState } from "react";
import { Bell, TrendingDown, TrendingUp, AlertTriangle, CloudRain, Activity } from "lucide-react";
import { cn } from "@/lib/cn";
import { ALERTS, type Alert, type AlertKind } from "@/data/mockData";

const meta: Record<AlertKind, { icon: typeof Bell; tone: string; bg: string }> = {
  rise: { icon: TrendingUp, tone: "text-ok", bg: "bg-ok-soft" },
  fall: { icon: TrendingDown, tone: "text-risk", bg: "bg-risk-soft" },
  risk: { icon: AlertTriangle, tone: "text-risk", bg: "bg-risk-soft" },
  weather: { icon: CloudRain, tone: "text-demand", bg: "bg-demand-soft" },
  demand: { icon: Activity, tone: "text-brand", bg: "bg-brand-tint" },
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [readAll, setReadAll] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = readAll ? 0 : ALERTS.length;

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((v) => !v);
          setReadAll(true);
        }}
        className="relative rounded-lg p-2 text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
        aria-label="Alerts"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-risk px-1 text-[9px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-30 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-line bg-surface shadow-pop">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="text-sm font-semibold text-ink">Predictive alerts</span>
            <span className="text-[11px] text-ink-3">{ALERTS.length} signals</span>
          </div>
          <div className="scroll-thin max-h-[22rem] overflow-y-auto">
            {ALERTS.map((a) => (
              <AlertRow key={a.id} a={a} />
            ))}
          </div>
          <div className="border-t border-line px-4 py-2 text-center text-[11px] text-ink-3">
            Forecast signals · illustrative
          </div>
        </div>
      )}
    </div>
  );
}

function AlertRow({ a }: { a: Alert }) {
  const [open, setOpen] = useState(false);
  const m = meta[a.kind];
  const Icon = m.icon;
  return (
    <button onClick={() => setOpen((v) => !v)} className="flex w-full gap-3 border-b border-line px-4 py-3 text-left last:border-b-0 hover:bg-surface-2">
      <span className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg", m.bg, m.tone)}>
        <Icon size={15} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-semibold text-ink">{a.title}</span>
          <span className="shrink-0 text-[10px] text-ink-3">{a.time}</span>
        </span>
        <span className={cn("mt-0.5 block text-xs leading-relaxed text-ink-2", open ? "" : "line-clamp-1")}>{a.detail}</span>
      </span>
    </button>
  );
}
