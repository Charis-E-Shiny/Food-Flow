import type { ReactNode } from "react";

// Shared form primitives for the auth screens.
export function Field({
  label,
  icon,
  type = "text",
  value,
  onChange,
  placeholder,
  autoFocus,
  rightLabel,
}: {
  label: string;
  icon?: ReactNode;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  rightLabel?: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-xs font-semibold text-ink-2">
        {label}
        {rightLabel}
      </span>
      <span className="relative flex items-center">
        {icon && <span className="pointer-events-none absolute left-3 text-ink-3">{icon}</span>}
        <input
          type={type}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={
            "h-11 w-full rounded-xl border border-line-strong bg-surface text-sm text-ink placeholder:text-ink-3 outline-none transition-colors focus:border-brand " +
            (icon ? "pl-10 pr-3" : "px-3")
          }
        />
      </span>
    </label>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink-2">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-line-strong bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-brand"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PasswordNote() {
  return (
    <p className="rounded-lg border border-dashed border-line-strong bg-surface-2 px-3 py-2 text-[11px] leading-relaxed text-ink-3">
      Sandbox sign-in — any email and password are accepted. No credentials are stored or sent
      anywhere; your session lives only in this browser.
    </p>
  );
}
