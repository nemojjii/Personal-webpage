"use client";

import { useEffect, useRef } from "react";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  WAVE FIELD — the interference pattern of two coherent circular sources
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Two sources at s1 and s2 emit circular waves of the same wavelength and
 *  phase. At a point p the superposition is
 *
 *      psi(p, t) = cos(k*r1 - w*t) + cos(k*r2 - w*t),   ri = |p - si|,
 *
 *  which factors, by the sum-to-product identity, into
 *
 *      psi(p, t) = 2 * cos( k*(r1 + r2)/2 - w*t ) * cos( k*(r1 - r2)/2 ).
 *
 *  The second factor carries no time: the field vanishes wherever
 *  r1 - r2 is an odd multiple of half a wavelength. Those are exactly the
 *  points whose distances to the two sources differ by a constant — a family
 *  of confocal hyperbolas with the sources as foci. So the dark curves in the
 *  drawing are conic sections, they do not move, and the only thing that
 *  travels is the crest pattern sweeping across them along the confocal
 *  ellipses. It is Young's two-slit geometry, drawn rather than measured.
 *
 *  The curves are extracted with marching squares on a coarse grid — a few
 *  thousand cosines per frame, canvas 2D, no WebGL, capped at ~30fps. The
 *  pointer displaces one source, which bends the whole hyperbolic family.
 *  The canvas never receives pointer events, so text above it stays
 *  selectable.
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

/**
 * Level set values and the weight of each. The zero set — the nodal lines,
 * where the waves cancel exactly — is drawn in charcoal and slightly heavier,
 * so the structure of the field reads before its shading does. Everything
 * either side of it is muted burgundy.
 */
const LEVELS = [-0.62, 0, 0.62] as const;
const LEVEL_ALPHA = [0.24, 0.62, 0.24] as const;
const NODAL_INDEX = 1;

/** rgb triples: charcoal for the nodal set, wine for the rest. */
const INK = "36, 35, 32";
const WINE = "112, 47, 59";

export interface WaveFieldProps {
  /** Half-separation of the two sources, as a fraction of the shorter edge. */
  separation?: number;
  /** Spatial frequency in cycles across the shorter edge. */
  frequency?: number;
  /** Grid spacing in CSS pixels. Larger is cheaper and more angular. */
  cell?: number;
  /** Overall opacity of the drawing. */
  opacity?: number;
  className?: string;
}

export function WaveField({
  separation = 0.19,
  frequency = 6.4,
  cell = 9,
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

      const short = Math.min(width, height);
      const k = (frequency * 2 * Math.PI) / short;
      const omega = 1.15;

      // The two sources sit either side of centre on the long axis, and the
      // pointer nudges them — which bends the whole hyperbolic family.
      const horizontal = width >= height;
      const d = separation * short;
      const cx = width / 2 + eased.x * short * 0.06;
      const cy = height / 2 + eased.y * short * 0.06;
      const s1x = horizontal ? cx - d : cx;
      const s1y = horizontal ? cy : cy - d;
      const s2x = horizontal ? cx + d + eased.x * short * 0.05 : cx + eased.x * short * 0.05;
      const s2y = horizontal ? cy + eased.y * short * 0.05 : cy + d + eased.y * short * 0.05;

      const phase = omega * t;

      for (let r = 0; r < rows; r++) {
        const y = r * cell;
        for (let c = 0; c < cols; c++) {
          const x = c * cell;
          const r1 = Math.hypot(x - s1x, y - s1y);
          const r2 = Math.hypot(x - s2x, y - s2y);
          field[r * cols + c] =
            (Math.cos(k * r1 - phase) + Math.cos(k * r2 - phase)) / 2;
        }
      }

      ctx.clearRect(0, 0, width, height);
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

        const nodal = l === NODAL_INDEX;
        ctx.strokeStyle = `rgba(${nodal ? INK : WINE}, ${LEVEL_ALPHA[l] * opacity})`;
        ctx.lineWidth = nodal ? 1 : 0.7;
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
  }, [separation, frequency, cell, opacity]);

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
