"use client";

import { useEffect, useRef } from "react";

/**
 * The lifecycle every field drawing shares: a transparent canvas sized to its
 * box at a capped device pixel ratio, a ~30 fps loop that runs only while the
 * canvas is on screen and the tab is visible, and a single still frame for a
 * visitor who prefers reduced motion. `draw` receives CSS-pixel dimensions and
 * the time in seconds.
 */
export function useFieldCanvas(
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number, t: number) => void,
  { fps = 30, stillAt = 2.5 }: { fps?: number; stillAt?: number } = {},
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  // Keep the latest drawing function without restarting the loop.
  useEffect(() => {
    drawRef.current = draw;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let frameId = 0;
    let visible = true;
    let lastDraw = 0;
    let start = 0;
    const interval = 1000 / fps;
    const stats = { frames: 0, ms: 0 };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const render = (t: number) => {
      const begin = performance.now();
      ctx.clearRect(0, 0, width, height);
      drawRef.current(ctx, width, height, t);
      stats.frames += 1;
      stats.ms += performance.now() - begin;
      if (process.env.NODE_ENV !== "production") {
        (window as unknown as { __heroStats?: Record<string, number> }).__heroStats = {
          frames: stats.frames,
          averageMs: stats.ms / stats.frames,
          width,
          height,
        };
      }
    };

    const loop = (now: number) => {
      frameId = requestAnimationFrame(loop);
      if (!visible) return;
      if (now - lastDraw < interval) return;
      lastDraw = now;
      if (!start) start = now;
      render((now - start) / 1000);
    };

    resize();
    const observer = new ResizeObserver(() => {
      resize();
      if (reduceMotion) render(stillAt);
    });
    observer.observe(canvas);

    if (reduceMotion) {
      render(stillAt);
      return () => observer.disconnect();
    }

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && !document.hidden;
    });
    intersection.observe(canvas);
    const onVisibility = () => {
      visible = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);
    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fps, stillAt]);

  return canvasRef;
}
