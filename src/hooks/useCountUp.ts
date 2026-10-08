import { useEffect, useRef, useState } from "react";

/**
 * Animates a number from 0 → target when it first mounts (or when
 * `target` changes). Respects prefers-reduced-motion by snapping.
 */
export function useCountUp(target: number, durationMs = 900, decimals = 0): number {
  const [value, setValue] = useState(0);
  const frame = useRef<number>();
  const start = useRef<number>();

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(target);
      return;
    }
    start.current = undefined;
    const factor = Math.pow(10, decimals);

    const step = (t: number) => {
      if (start.current === undefined) start.current = t;
      const progress = Math.min((t - start.current) / durationMs, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased * factor) / factor);
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, durationMs, decimals]);

  return value;
}
