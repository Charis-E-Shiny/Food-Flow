import type { ReactNode } from "react";

export function PageHead({
  title,
  sub,
  actions,
  eyebrow,
}: {
  title: string;
  sub?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">{eyebrow}</div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {sub && <p className="mt-1.5 max-w-2xl text-sm text-ink-2">{sub}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
