/**
 * Parametric Forms: Lissajous figures, rose curves and hypotrochoids. Pure
 * functions of a parameter `t` — no rendering — so the curve definitions and
 * their closure can be tested independently of how they are drawn.
 *
 * Each curve's integer parameters are chosen so the traced domain is a
 * *proven* period, derived directly below rather than recalled from memory:
 * a curve is sampled over exactly the interval that is shown to return it to
 * its own starting point, so "closed" is never asserted without a reason.
 */

export const parametricKinds = ["lissajous", "rose", "hypotrochoid"] as const;
export type ParametricKind = (typeof parametricKinds)[number];

export interface LissajousParams {
  kind: "lissajous";
  /** Angular frequencies. Integers, so x and y are always 2π-periodic together. */
  a: number;
  b: number;
  /** Phase offset between the two, in radians. Does not affect closure. */
  delta: number;
}

export interface RoseParams {
  kind: "rose";
  /** r = cos((n/d)·θ), n and d positive integers. */
  n: number;
  d: number;
}

export interface HypotrochoidParams {
  kind: "hypotrochoid";
  /** Fixed circle radius. Integer, with r, so closure is guaranteed exactly. */
  R: number;
  /** Rolling circle radius. Integer; r = 0 is excluded (the slider floor is 1). */
  r: number;
  /** Pen offset from the rolling circle's centre. Any non-negative real — only the loop's size, never closure, depends on it. */
  d: number;
}

export type ParametricParams = LissajousParams | RoseParams | HypotrochoidParams;

export const LISSAJOUS_DEFAULTS: LissajousParams = { kind: "lissajous", a: 3, b: 2, delta: Math.PI / 2 };
export const ROSE_DEFAULTS: RoseParams = { kind: "rose", n: 5, d: 1 };
export const HYPOTROCHOID_DEFAULTS: HypotrochoidParams = { kind: "hypotrochoid", R: 5, r: 3, d: 5 };

export const LISSAJOUS_LIMITS = {
  a: { min: 1, max: 7, step: 1 },
  b: { min: 1, max: 7, step: 1 },
  delta: { min: 0, max: Math.PI, step: Math.PI / 24 },
} as const;
export const ROSE_LIMITS = {
  n: { min: 1, max: 9, step: 1 },
  d: { min: 1, max: 9, step: 1 },
} as const;
export const HYPOTROCHOID_LIMITS = {
  R: { min: 2, max: 12, step: 1 },
  r: { min: 1, max: 11, step: 1 },
  d: { min: 0, max: 10, step: 0.25 },
} as const;

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

/**
 * A domain of t (or θ) over which the curve is *proven* to close — i.e. the
 * point at the end of the domain equals the point at its start — derived
 * from each definition rather than quoted from a petal-counting rule that
 * would need to be independently re-verified. It may retrace part of itself
 * (harmless to the shape); it is never less than a full closed curve.
 */
export function period(params: ParametricParams): number {
  switch (params.kind) {
    case "lissajous":
      // x(t + 2π) = sin(a(t + 2π) + δ) = sin(at + δ) since a is an integer
      // multiple of 2π added inside sin changes nothing; same for y with b.
      return 2 * Math.PI;
    case "rose":
      // r(θ + 2πd) = cos((n/d)(θ + 2πd)) = cos((n/d)θ + 2πn) = cos((n/d)θ),
      // and the plotted angle θ + 2πd ≡ θ (mod 2π) since d is an integer, so
      // the point at θ + 2πd is identical to the point at θ.
      return 2 * Math.PI * params.d;
    case "hypotrochoid": {
      // With g = gcd(R, r): the first term's angle advances by T = 2π·r/g,
      // a multiple of 2π (since g | r), so it returns to its start. The
      // second term's angle advances by ((R−r)/r)·T = 2π·(R−r)/g, also a
      // multiple of 2π since g | R and g | r ⟹ g | (R − r). Both terms
      // return exactly, so T = 2π·r/g is a valid period.
      const g = gcd(params.R, params.r);
      return (2 * Math.PI * params.r) / g;
    }
  }
}

/** The curve's point at parameter t (Lissajous, hypotrochoid) or θ (rose). */
export function samplePoint(params: ParametricParams, t: number): { x: number; y: number } {
  switch (params.kind) {
    case "lissajous":
      return { x: Math.sin(params.a * t + params.delta), y: Math.sin(params.b * t) };
    case "rose": {
      const r = Math.cos((params.n / params.d) * t);
      return { x: r * Math.cos(t), y: r * Math.sin(t) };
    }
    case "hypotrochoid": {
      const { R, r, d } = params;
      const ratio = (R - r) / r;
      return {
        x: (R - r) * Math.cos(t) + d * Math.cos(ratio * t),
        y: (R - r) * Math.sin(t) - d * Math.sin(ratio * t),
      };
    }
  }
}

/** `count + 1` points evenly spaced over the curve's proven period, start to the same point again. */
export function sampleCurve(params: ParametricParams, count = 600): { x: number; y: number }[] {
  const T = period(params);
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= count; i++) {
    points.push(samplePoint(params, (i / count) * T));
  }
  return points;
}
