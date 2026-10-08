import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { ALERTS } from "@/data/mockData";

// Slim predictive-alert ticker under the header. Auto-rotates
// through the latest forecast signals; dismissible per session.
export function AlertTicker() {
  const [i, setI] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (hidden) return;
    const t = setInterval(() => setI((n) => (n + 1) % ALERTS.length), 4200);
    return () => clearInterval(t);
  }, [hidden]);

  if (hidden) return null;
  const a = ALERTS[i];

  return (
    <div className="sticky top-16 z-30 border-b border-line bg-brand-tint/60 backdrop-blur">
      <div className="mx-auto flex h-9 max-w-[1360px] items-center gap-3 px-4 sm:px-6">
        <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-strong">
          <Sparkles size={12} /> Live signal
        </span>
        <div className="relative h-5 flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={a.id}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex items-center gap-2 truncate text-[13px] text-ink"
            >
              <span className="font-semibold">{a.title}</span>
              <span className="hidden truncate text-ink-2 sm:inline">— {a.detail}</span>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {ALERTS.map((_, idx) => (
            <span key={idx} className={"h-1 w-1 rounded-full " + (idx === i ? "bg-brand" : "bg-brand-soft/60")} />
          ))}
          <button onClick={() => setHidden(true)} className="ml-1 rounded p-0.5 text-ink-3 hover:text-ink" aria-label="Dismiss alerts">
            <X size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
