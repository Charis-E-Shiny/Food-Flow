/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Mapped to CSS variables defined in index.css so themes stay single-source.
        canvas: "rgb(var(--c-canvas) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        "surface-2": "rgb(var(--c-surface-2) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
        "line-strong": "rgb(var(--c-line-strong) / <alpha-value>)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        "ink-2": "rgb(var(--c-ink-2) / <alpha-value>)",
        "ink-3": "rgb(var(--c-ink-3) / <alpha-value>)",
        brand: {
          DEFAULT: "rgb(var(--c-brand) / <alpha-value>)",
          strong: "rgb(var(--c-brand-strong) / <alpha-value>)",
          soft: "rgb(var(--c-brand-soft) / <alpha-value>)",
          tint: "rgb(var(--c-brand-tint) / <alpha-value>)",
        },
        risk: {
          DEFAULT: "rgb(var(--c-risk) / <alpha-value>)",
          soft: "rgb(var(--c-risk-soft) / <alpha-value>)",
        },
        warn: {
          DEFAULT: "rgb(var(--c-warn) / <alpha-value>)",
          soft: "rgb(var(--c-warn-soft) / <alpha-value>)",
        },
        demand: {
          DEFAULT: "rgb(var(--c-demand) / <alpha-value>)",
          soft: "rgb(var(--c-demand-soft) / <alpha-value>)",
        },
        ok: {
          DEFAULT: "rgb(var(--c-ok) / <alpha-value>)",
          soft: "rgb(var(--c-ok-soft) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["\"IBM Plex Mono\"", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
      boxShadow: {
        card: "0 1px 2px rgb(20 30 20 / 0.04), 0 1px 3px rgb(20 30 20 / 0.06)",
        lift: "0 4px 16px -4px rgb(20 30 20 / 0.12), 0 2px 6px -2px rgb(20 30 20 / 0.08)",
        pop: "0 12px 40px -8px rgb(20 30 20 / 0.22)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: "0.7" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        dash: {
          to: { "stroke-dashoffset": "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease both",
        "pulse-ring": "pulse-ring 2s ease-out infinite",
      },
    },
  },
  plugins: [],
};
