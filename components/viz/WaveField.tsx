"use client";

import { useEffect, useRef } from "react";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  WAVE FIELD — level curves of a quasiperiodic interference pattern
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  The drawing is the set of level curves of the scalar field
 *
 *      psi(p, t) = (1/N) * SUM_{j<N} cos( k_j · p + omega_j · t )
 *
 *  where the wave vectors k_j are N plane waves of equal magnitude kappa,
 *  evenly spaced in direction over a half turn:
 *
 *      k_j = kappa * ( cos(theta_j), sin(theta_j) ),   theta_j = pi*j/N + Theta.
 *
 *  For N = 5 the directions span a 10-fold symmetric star, and the sum is
 *  quasiperiodic: the pattern has local five-fold symmetry but never repeats —
 *  the standard construction of a Penrose-like tiling from a superposition of
 *  plane waves. The angular frequencies omega_j are mutually incommensurable,
 *  so the field never returns to a previous state.
 *
 *  Curves are extracted with marching squares on a coarse grid, which keeps the
 *  cost to a few thousand cosines per frame (no WebGL, no shaders, ~30fps),
 *  and drawn as hairlines. The canvas never receives pointer events; the
 *  pointer is read from the window, so text above it stays fully selectable.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Marching-squares case table. Each pair of entries is one segment. */
const CASES: ReadonlyArray<readonly number[]> = [
  [],
  [3, 0],
  [0, 1],
  [3, 1],
  [1, 2],
  [3, 0, 1, 2],
  [0, 2],
  [3, 2],
  [2, 3],
  [2, 0],
  [0, 1, 2, 3],
  [2, 1],
  [1, 3],
  [1, 0],
  [0, 3],
  [],
];

/** Level set values, and the weight of each — the zero set is drawn darkest. */
const LEVELS = [-0.72, -0.48, -0.24, 0, 0.24, 0.48, 0.72] as const;
const LEVEL_ALPHA = [0.12, 0.2, 0.3, 0.52, 0.3, 0.2, 0.12] as const;

export interface WaveFieldProps {
  /** Number of plane waves. 5 gives the quasiperiodic five-fold field. */
  waves?: number;
  /** Spatial frequency in cycles across the shorter edge. */
  frequency?: number;
  /** Grid spacing in CSS pixels. Larger is cheaper and more angular. */
  cell?: number;
  /** Overall opacity of the drawing. */
  opacity?: number;
  className?: string;
}

export function WaveField({
  waves = 5,
  frequency = 4.2,
  cell = 11,
  opacity = 1,
  className = "",
}: WaveFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    let cols = 0;
    let rows = 0;
    let field = new Float32Array(0);

    // Pointer target and its eased follower, in normalised field units.
    const pointer = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };

    let frameId = 0;
    let visible = true;
    let lastDraw = 0;
    let startTime = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / cell) + 1;
      rows = Math.ceil(height / cell) + 1;
      field = new Float32Array(cols * rows);
    };

    /** Fill `field` with psi at time t, then stroke its level curves. */
    const draw = (t: number) => {
      if (!width || !height) return;

      const scale = frequency * (2 * Math.PI) / Math.min(width, height);
      const theta0 = 0.22 + 0.12 * Math.sin(t * 0.07) + eased.x * 0.28;
      const kx: number[] = [];
      const ky: number[] = [];
      const phase: number[] = [];

      for (let j = 0; j < waves; j++) {
        const theta = (Math.PI * j) / waves + theta0;
        kx.push(Math.cos(theta) * scale);
        ky.push(Math.sin(theta) * scale);
        // Incommensurable rates: the field is never periodic in time.
        phase.push(t * (0.1 + 0.031 * Math.SQRT2 * (j + 1)) + j * 1.7);
      }

      // Origin drifts slowly, and leans towards the pointer.
      const ox = width * (0.5 + eased.x * 0.18);
      const oy = height * (0.5 + eased.y * 0.18);

      for (let r = 0; r < rows; r++) {
        const y = r * cell - oy;
        for (let c = 0; c < cols; c++) {
          const x = c * cell - ox;
          let sum = 0;
          for (let j = 0; j < waves; j++) {
            sum += Math.cos(kx[j] * x + ky[j] * y + phase[j]);
          }
          field[r * cols + c] = sum / waves;
        }
      }

      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 0.75;
      ctx.lineCap = "round";

      for (let l = 0; l < LEVELS.length; l++) {
        const level = LEVELS[l];
        ctx.beginPath();

        for (let r = 0; r < rows - 1; r++) {
          for (let c = 0; c < cols - 1; c++) {
            const v0 = field[r * cols + c];
            const v1 = field[r * cols + c + 1];
            const v2 = field[(r + 1) * cols + c + 1];
            const v3 = field[(r + 1) * cols + c];

            const index =
              (v0 > level ? 1 : 0) |
              (v1 > level ? 2 : 0) |
              (v2 > level ? 4 : 0) |
              (v3 > level ? 8 : 0);

            const segments = CASES[index];
            if (segments.length === 0) continue;

            const x = c * cell;
            const y = r * cell;

            for (let s = 0; s < segments.length; s += 2) {
              const a = edge(segments[s], x, y, cell, v0, v1, v2, v3, level);
              const b = edge(segments[s + 1], x, y, cell, v0, v1, v2, v3, level);
              ctx.moveTo(a[0], a[1]);
              ctx.lineTo(b[0], b[1]);
            }
          }
        }

        ctx.strokeStyle = `rgba(112, 47, 59, ${LEVEL_ALPHA[l] * opacity})`;
        ctx.stroke();
      }
    };

    const loop = (now: number) => {
      frameId = requestAnimationFrame(loop);
      if (!visible) return;
      if (now - lastDraw < 33) return; // ~30fps is plenty for this motion
      lastDraw = now;
      if (!startTime) startTime = now;

      eased.x += (pointer.x - eased.x) * 0.045;
      eased.y += (pointer.y - eased.y) * 0.045;

      draw((now - startTime) / 1000);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointer.x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1));
      pointer.y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1));
    };

    resize();

    const observer = new ResizeObserver(() => {
      resize();
      if (reduceMotion) draw(0);
    });
    observer.observe(canvas);

    if (reduceMotion) {
      // A single, still frame — the same mathematics, no motion.
      draw(0);
      return () => observer.disconnect();
    }

    const intersection = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    intersection.observe(canvas);

    const onVisibility = () => {
      visible = !document.hidden;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      intersection.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [waves, frequency, cell, opacity]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none h-full w-full select-none ${className}`}
    />
  );
}

/** Linear interpolation of the level crossing along one cell edge. */
function edge(
  which: number,
  x: number,
  y: number,
  size: number,
  v0: number,
  v1: number,
  v2: number,
  v3: number,
  level: number,
): [number, number] {
  switch (which) {
    case 0: {
      const t = (level - v0) / (v1 - v0 || 1e-6);
      return [x + t * size, y];
    }
    case 1: {
      const t = (level - v1) / (v2 - v1 || 1e-6);
      return [x + size, y + t * size];
    }
    case 2: {
      const t = (level - v3) / (v2 - v3 || 1e-6);
      return [x + t * size, y + size];
    }
    default: {
      const t = (level - v0) / (v3 - v0 || 1e-6);
      return [x, y + t * size];
    }
  }
}
