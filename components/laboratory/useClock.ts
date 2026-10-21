"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A small animation clock for the laboratory instruments: seconds elapsed,
 * advanced by requestAnimationFrame while playing, paused automatically when
 * the tab is hidden, and never started on its own for a visitor who prefers
 * reduced motion. Renders are throttled to about 30 per second; the time
 * itself is kept exactly in a ref.
 */
export function useClock({
  autoplay = false,
  rate = 1,
  max,
  loop = false,
}: {
  /** Start after first paint, unless the visitor prefers reduced motion. */
  autoplay?: boolean;
  /** Clock seconds per real second. */
  rate?: number;
  /** Stop (or wrap, with `loop`) at this many seconds. */
  max?: number;
  loop?: boolean;
}) {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const tRef = useRef(0);

  useEffect(() => {
    if (!autoplay) return;
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = requestAnimationFrame(() => setPlaying(true));
    return () => cancelAnimationFrame(id);
  }, [autoplay]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    let lastRender = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (document.hidden) return;
      let next = tRef.current + dt * rate;
      if (max !== undefined && next >= max) {
        if (loop) {
          next -= max;
        } else {
          tRef.current = max;
          setT(max);
          setPlaying(false);
          return;
        }
      }
      tRef.current = next;
      if (now - lastRender >= 33) {
        lastRender = now;
        setT(next);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, rate, max, loop]);

  const seek = useCallback((value: number) => {
    tRef.current = value;
    setT(value);
  }, []);
  const reset = useCallback(() => seek(0), [seek]);

  return { t, playing, setPlaying, seek, reset };
}
