/**
 * Vector Field Drawings: streamlines of a two-dimensional vector field,
 * integrated with fourth-order Runge–Kutta. Pure numerics — no canvas, no
 * DOM — so the integrator and the field definitions can be tested on their
 * own, independent of how they are eventually drawn.
 */

export type Point = [number, number];

export const fieldKinds = ["spiral", "saddle", "wave"] as const;
export type FieldKind = (typeof fieldKinds)[number];

export const fieldLabel: Record<FieldKind, string> = {
  spiral: "Spiral",
  saddle: "Saddle",
  wave: "Wave",
};

export interface FieldParams {
  kind: FieldKind;
  /** First shape parameter — meaning depends on `kind`; see `vectorAt`. */
  a: number;
  /** Second shape parameter. */
  b: number;
}

export interface IntegrationParams {
  /** RK4 step size, in the same units as the field's domain. */
  stepSize: number;
  /** Upper bound on steps per trajectory, each direction. */
  maxSteps: number;
  /** A trajectory stops once it leaves the square [−bound, bound]². */
  bound: number;
}

export const VECTORFIELD_DEFAULTS: FieldParams = { kind: "spiral", a: 0.15, b: 1 };
export const INTEGRATION_DEFAULTS: IntegrationParams = { stepSize: 0.05, maxSteps: 220, bound: 4 };
export const SEED_DEFAULTS = { count: 24, seed: 1 };

export const FIELD_LIMITS = {
  a: { min: -1, max: 1, step: 0.05 },
  b: { min: 0.25, max: 3, step: 0.05 },
} as const;
export const INTEGRATION_LIMITS = {
  stepSize: { min: 0.01, max: 0.15, step: 0.01 },
  maxSteps: { min: 40, max: 400, step: 20 },
} as const;
export const SEED_LIMITS = {
  count: { min: 4, max: 80, step: 4 },
} as const;

/**
 * The field's value at (x, y).
 *   spiral — rotation with a controlling inward/outward drift: at a = 0 the
 *            flow is a pure rotation (closed circles); a > 0 spirals out,
 *            a < 0 spirals in. b scales the angular speed.
 *   saddle — (a x, −b y): flows toward the x-axis and away along it, the
 *            standard hyperbolic saddle, unless a or b is 0.
 *   wave   — (a·sin(b y), a·sin(b x)): a divergence-free-looking field
 *            whose streamlines braid around the sine field's cells.
 */
export function vectorAt(params: FieldParams, x: number, y: number): Point {
  const { kind, a, b } = params;
  switch (kind) {
    case "spiral":
      return [a * x - b * y, b * x + a * y];
    case "saddle":
      return [a * x, -b * y];
    case "wave":
      return [a * Math.sin(b * y), a * Math.sin(b * x)];
  }
}

/** One fourth-order Runge–Kutta step of dP/dt = f(P). */
export function rk4Step(f: (p: Point) => Point, p: Point, h: number): Point {
  const [x, y] = p;
  const k1 = f([x, y]);
  const k2 = f([x + (h * k1[0]) / 2, y + (h * k1[1]) / 2]);
  const k3 = f([x + (h * k2[0]) / 2, y + (h * k2[1]) / 2]);
  const k4 = f([x + h * k3[0], y + h * k3[1]]);
  return [
    x + (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
    y + (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
  ];
}

/**
 * The trajectory through `start`, stepped with RK4 until it leaves `bound`,
 * stalls (speed effectively zero, as at a fixed point), goes non-finite, or
 * `maxSteps` is reached — whichever comes first. The stop is a genuine end
 * of the line, never wrapped or reconnected elsewhere.
 */
export function integrateTrajectory(
  field: FieldParams,
  start: Point,
  integration: IntegrationParams,
): Point[] {
  const f = (p: Point) => vectorAt(field, p[0], p[1]);
  const { stepSize, maxSteps, bound } = integration;
  const points: Point[] = [start];
  let p = start;
  for (let i = 0; i < maxSteps; i++) {
    const next = rk4Step(f, p, stepSize);
    if (!Number.isFinite(next[0]) || !Number.isFinite(next[1])) break;
    if (Math.abs(next[0]) > bound || Math.abs(next[1]) > bound) break;
    const speed = Math.hypot(next[0] - p[0], next[1] - p[1]);
    if (speed < 1e-9) break; // a fixed point of the field
    points.push(next);
    p = next;
  }
  return points;
}

/** A full streamline: integrated forward and backward from its seed. */
export function fullTrajectory(
  field: FieldParams,
  seed: Point,
  integration: IntegrationParams,
): Point[] {
  const forward = integrateTrajectory(field, seed, integration);
  const backward = integrateTrajectory(
    field,
    seed,
    { ...integration, stepSize: -integration.stepSize },
  );
  return [...backward.slice(1).reverse(), ...forward];
}

/**
 * A small, dependency-free deterministic PRNG (mulberry32): the same seed
 * always produces the same sequence, which is what makes a composition
 * reproducible from its parameters alone.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `count` seed points, deterministic for a given `seed`, spread over [−bound, bound]². */
export function generateSeeds(count: number, seed: number, bound: number): Point[] {
  const rand = mulberry32(seed);
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    points.push([(rand() * 2 - 1) * bound, (rand() * 2 - 1) * bound]);
  }
  return points;
}
