"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A one-shot "draw it in" reveal: a fraction from 0 to 1, advanced by
 * requestAnimationFrame while playing, that a renderer uses to show only the
 * first `fraction` of a composition. Mirrors `useClock` (the Little
 * Laboratory's animation hook) in shape and in throttling renders to about
 * 30 per second, but is a distinct concept: there, `t` is a meaningful
 * physical time axis the visitor steps through; here, the fraction is purely
 * an optional demonstration of how the drawing is built up, with no axis of
 * its own — so it starts already fully revealed, and "replay" is the
 * exception, not the default state a visitor arrives to.
 *
 * Skips the animation entirely under `prefers-reduced-motion`, jumping
 * straight to fully revealed.
 */
export function useReveal(durationMs: number) {
  const [fraction, setFraction] = useState(1);
  const [playing, setPlaying] = useState(false);
  const fractionRef = useRef(1);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const startOffset = fractionRef.current >= 1 ? 0 : fractionRef.current * durationMs;
    const startTime = performance.now() - startOffset;
    let lastRender = 0;
    const tick = (now: number) => {
      const frac = Math.min((now - startTime) / durationMs, 1);
      fractionRef.current = frac;
      if (frac >= 1 || now - lastRender >= 33) {
        lastRender = now;
        setFraction(frac);
      }
      if (frac >= 1) {
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, durationMs]);

  const play = useCallback(() => {
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      fractionRef.current = 1;
      setFraction(1);
      return;
    }
    if (fractionRef.current >= 1) {
      fractionRef.current = 0;
      setFraction(0);
    }
    setPlaying(true);
  }, []);

  const pause = useCallback(() => setPlaying(false), []);

  /** Jumps straight to fully revealed — used when resetting to defaults. */
  const complete = useCallback(() => {
    fractionRef.current = 1;
    setFraction(1);
    setPlaying(false);
  }, []);

  return { fraction, playing, play, pause, complete };
}
