/**
 * Gradient descent on a quadratic bowl.
 *
 *   f(x,y) = ½(a x² + b y²),  a, b > 0
 *   ∇f     = (a x, b y)
 *   p_{n+1} = p_n − η ∇f(p_n)
 *
 * Because the two coordinates decouple, each step multiplies x by (1 − ηa)
 * and y by (1 − ηb). The iteration converges to the minimum at the origin
 * exactly when both factors have magnitude below 1, i.e. η < 2/max(a, b);
 * a negative factor makes that coordinate overshoot and alternate sides
 * (oscillation) while still shrinking; a factor of magnitude 1 or more makes
 * it grow without bound (divergence). None of this generalises to arbitrary
 * non-convex functions, where gradient descent finds at best a local minimum.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Quadratic {
  a: number;
  b: number;
}

export const DESCENT_DEFAULTS = {
  q: { a: 1, b: 3 } as Quadratic,
  eta: 0.3,
  start: { x: -2.2, y: 1.6 } as Point,
};

export const DESCENT_LIMITS = {
  curvature: { min: 0.2, max: 5, step: 0.1 },
  eta: { min: 0.02, max: 1.6, step: 0.02 },
  coordinate: { min: -2.5, max: 2.5, step: 0.1 },
} as const;

/** Half-width of the plotted window, in the same units as x and y. */
export const DESCENT_EXTENT = 3;
/** Steps are never run past this; the plot has nothing more to show. */
export const MAX_STEPS = 200;
/** Beyond this the iteration is declared divergent. */
const DIVERGENCE_BOUND = 1e3;
/** Below this gradient norm the iteration is declared converged. */
const CONVERGENCE_TOLERANCE = 1e-6;

export const objective = (q: Quadratic, p: Point) => 0.5 * (q.a * p.x * p.x + q.b * p.y * p.y);
export const gradient = (q: Quadratic, p: Point): Point => ({ x: q.a * p.x, y: q.b * p.y });
export const norm = (p: Point) => Math.hypot(p.x, p.y);

export function step(q: Quadratic, p: Point, eta: number): Point {
  const g = gradient(q, p);
  return { x: p.x - eta * g.x, y: p.y - eta * g.y };
}

/** The learning rate above which the iteration diverges. */
export const stabilityLimit = (q: Quadratic) => 2 / Math.max(q.a, q.b);

export type Regime = "converging" | "oscillating" | "diverging";

export function regime(q: Quadratic, eta: number): Regime {
  const ra = 1 - eta * q.a;
  const rb = 1 - eta * q.b;
  if (Math.max(Math.abs(ra), Math.abs(rb)) >= 1) return "diverging";
  if (Math.min(ra, rb) < 0) return "oscillating";
  return "converging";
}

export type RunStatus = "running" | "converged" | "diverged";

export interface Run {
  path: Point[];
  status: RunStatus;
}

/**
 * The whole trajectory from `start`, computed up front so the page can step
 * through it. Stops early when the gradient is negligible or the point has
 * left any reasonable frame; every value in `path` is finite.
 */
export function run(q: Quadratic, start: Point, eta: number, maxSteps = MAX_STEPS): Run {
  const path: Point[] = [start];
  let p = start;
  for (let i = 0; i < maxSteps; i++) {
    if (norm(gradient(q, p)) < CONVERGENCE_TOLERANCE) return { path, status: "converged" };
    const next = step(q, p, eta);
    if (!Number.isFinite(next.x) || !Number.isFinite(next.y) || norm(next) > DIVERGENCE_BOUND) {
      return { path, status: "diverged" };
    }
    path.push(next);
    p = next;
  }
  return { path, status: norm(gradient(q, p)) < CONVERGENCE_TOLERANCE ? "converged" : "running" };
}

/** Points on the level curve f = c, an ellipse a x² + b y² = 2c. */
export function levelCurve(q: Quadratic, c: number, n = 96): Point[] {
  const rx = Math.sqrt((2 * c) / q.a);
  const ry = Math.sqrt((2 * c) / q.b);
  return Array.from({ length: n + 1 }, (_, i) => {
    const th = (2 * Math.PI * i) / n;
    return { x: rx * Math.cos(th), y: ry * Math.sin(th) };
  });
}

/** Level values that fill the window evenly, whatever the curvature. */
export function contourLevels(q: Quadratic, extent = DESCENT_EXTENT, count = 7): number[] {
  // The largest level whose ellipse still touches the window edge on its narrow axis.
  const cMax = 0.5 * Math.max(q.a, q.b) * extent * extent;
  return Array.from({ length: count }, (_, i) => cMax * ((i + 1) / count) ** 2);
}
