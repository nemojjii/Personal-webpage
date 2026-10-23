/**
 * Complex Transformations: how a structured grid on the complex plane moves
 * under a holomorphic map. Pure geometry — no rendering, no DOM — so the same
 * module drives the SVG component and its tests.
 */

export interface Complex {
  re: number;
  im: number;
}

export const complexMappings = ["square", "cube", "reciprocal"] as const;
export type ComplexMapping = (typeof complexMappings)[number];

export const mappingLabel: Record<ComplexMapping, string> = {
  square: "f(z) = z²",
  cube: "f(z) = z³",
  reciprocal: "f(z) = 1/z",
};

export interface ComplexParams {
  mapping: ComplexMapping;
  /** Lines per axis in the source grid (odd, so one line sits on each axis). */
  density: number;
  /** The source grid spans [−extent, extent] on both axes. */
  extent: number;
  /** Points of the transformed plane beyond this radius are treated as unbounded and dropped. */
  viewLimit: number;
}

export const COMPLEX_DEFAULTS: ComplexParams = {
  mapping: "square",
  density: 9,
  extent: 2,
  viewLimit: 8,
};

export const COMPLEX_LIMITS = {
  density: { min: 3, max: 15, step: 2 },
  extent: { min: 1, max: 3, step: 0.5 },
  viewLimit: { min: 4, max: 16, step: 1 },
} as const;

function mul(a: Complex, b: Complex): Complex {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}

/**
 * The mapping's value at z, or undefined where it is not finite — 1/z at the
 * origin, and nowhere else for these three maps. Never silently substituted
 * with a clamped or placeholder value.
 */
export function applyMapping(mapping: ComplexMapping, z: Complex): Complex | undefined {
  let result: Complex;
  switch (mapping) {
    case "square":
      result = mul(z, z);
      break;
    case "cube":
      result = mul(mul(z, z), z);
      break;
    case "reciprocal": {
      const d = z.re * z.re + z.im * z.im;
      if (d === 0) return undefined;
      result = { re: z.re / d, im: -z.im / d };
      break;
    }
  }
  return Number.isFinite(result.re) && Number.isFinite(result.im) ? result : undefined;
}

/** A straight gridline, as the points it is sampled at. */
export type GridLine = Complex[];

/**
 * The source grid: `density` horizontal lines and `density` vertical lines,
 * evenly spaced across [−extent, extent], each sampled at enough points that
 * its image under a mapping reads as a curve rather than a polygon.
 */
export function buildSourceGrid(extent: number, density: number, samplesPerLine = 160): GridLine[] {
  const lines: GridLine[] = [];
  const step = (2 * extent) / (density - 1);
  for (let i = 0; i < density; i++) {
    const c = -extent + i * step; // the fixed coordinate for this line
    const horizontal: GridLine = [];
    const vertical: GridLine = [];
    for (let s = 0; s <= samplesPerLine; s++) {
      const t = -extent + (s / samplesPerLine) * 2 * extent;
      horizontal.push({ re: t, im: c });
      vertical.push({ re: c, im: t });
    }
    lines.push(horizontal, vertical);
  }
  return lines;
}

/**
 * A transformed line, keeping the gaps: `undefined` at a sample that was
 * non-finite (a singularity) or fell outside `viewLimit` (unbounded growth).
 * Never interpolated or clamped into something drawable.
 */
export function transformLine(
  line: GridLine,
  mapping: ComplexMapping,
  viewLimit: number,
): (Complex | undefined)[] {
  return line.map((z) => {
    const w = applyMapping(mapping, z);
    if (!w) return undefined;
    if (Math.hypot(w.re, w.im) > viewLimit) return undefined;
    return w;
  });
}

/**
 * Breaks a line with gaps into the maximal runs of consecutive defined
 * points — what actually gets drawn as separate path segments, so a
 * singularity or an out-of-view point never joins two sides of a curve that
 * were never connected.
 */
export function toSegments<T>(line: (T | undefined)[]): T[][] {
  const segments: T[][] = [];
  let current: T[] = [];
  for (const point of line) {
    if (point === undefined) {
      if (current.length > 1) segments.push(current);
      current = [];
    } else {
      current.push(point);
    }
  }
  if (current.length > 1) segments.push(current);
  return segments;
}
