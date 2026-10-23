/**
 * The hero artwork's pointer response: a bounded, display-only displacement
 * applied to an already-traced point as a pure post-processing step — never
 * fed back into the streamline tracing itself (see components/viz/HeroField.tsx,
 * where this is called only at the moment a point is pushed to the drawn
 * path, after Newton's method has already found it). That separation is
 * what keeps this deformation from ever being able to destabilise the
 * root-finding: nothing here can introduce a discontinuity or a numerical
 * blow-up in the underlying model, because the underlying model never sees
 * it.
 *
 * An earlier version of this file pushed a point directly away from the
 * pointer (a radial model). It read as a small dent pinched around the
 * cursor rather than a surface moving — every nearby point was pushed in a
 * different direction (literally every direction, in a full circle around
 * the pointer), and that push was a function of position alone, so it
 * persisted at full strength even while the pointer sat perfectly still:
 * confirmed directly by evaluating it over a stationary grid, where 960 of
 * 961 sampled points stayed displaced more than 1px with no pointer motion
 * at all, the "visibly pinched" artwork the model could never stop being.
 * Widening its radius only widens the dent; it cannot remove that the push
 * has no notion of motion or of a shared direction. `flowDisplace` below
 * replaces it: every point within reach of the pointer is pushed the same
 * direction — the direction the pointer is currently moving — so neighbours
 * move together, and with no motion there is nothing to push with, so the
 * surface has nothing to hold it pinched once the hand stops.
 */

export interface Point {
  x: number;
  y: number;
}

/** w(d) = exp(−d² / (2σ²)) — 1 at the pointer, smoothly to 0 with distance. */
export function gaussianWeight(d: number, sigma: number): number {
  if (sigma <= 0) return 0;
  return Math.exp(-(d * d) / (2 * sigma * sigma));
}

export interface FlowDeformParams {
  /** Spatial envelope radius (Gaussian sigma), in CSS pixels — how far the push reaches, not which way it points. */
  sigma: number;
  /** Displacement at the pointer's exact position, at or above `maxSpeed`, in CSS pixels. */
  maxDisplacement: number;
  /** Pointer speed (CSS px/s) at which the push saturates to `maxDisplacement`; faster motion pushes no harder. */
  maxSpeed: number;
}

// Comparable reach to the retired radial model's own widened value (200) —
// this is still a localisation radius, not a direction, so it did not need
// to change for the same reason the radial model's did.
export const FLOW_DEFORM_DEFAULTS: FlowDeformParams = { sigma: 240, maxDisplacement: 22, maxSpeed: 900 };

/**
 * Displaces (x, y) toward (vx, vy)'s direction — not away from (px, py) —
 * by an amount that falls off with distance from (px, py) through the same
 * bounded Gaussian envelope the radial model used for localisation, and
 * scales with how fast the pointer is moving, capped at `maxSpeed`. Because
 * every point within reach is pushed the same direction for a given frame,
 * regardless of where it sits relative to the pointer, the result reads as
 * a patch of surface carried along with the hand rather than a dent
 * radiating from a pin. Zero exactly when `influence` is 0 or the pointer
 * isn't moving (`vx = vy = 0`) — nothing here holds a point displaced once
 * the hand stops; see easeTo in the caller for the trailing decay that
 * keeps that transition gradual rather than an instant snap to rest.
 */
export function flowDisplace(
  x: number,
  y: number,
  px: number,
  py: number,
  vx: number,
  vy: number,
  influence: number,
  params: FlowDeformParams = FLOW_DEFORM_DEFAULTS,
): Point {
  const speed = Math.hypot(vx, vy);
  if (influence <= 0 || speed < 1e-6) return { x, y };
  const d = Math.hypot(x - px, y - py);
  const weight = gaussianWeight(d, params.sigma);
  if (weight < 1e-6) return { x, y };
  const magnitude = params.maxDisplacement * influence * weight * Math.min(1, speed / params.maxSpeed);
  return { x: x + (vx / speed) * magnitude, y: y + (vy / speed) * magnitude };
}

/**
 * Rescales (vx, vy) down to at most `maxSpeed` if it exceeds it, otherwise
 * leaves it unchanged — a sensible ceiling on raw pointer speed (a single
 * very large jump between two samples, e.g. from a focus change, should not
 * read as an arbitrarily hard push) applied before that speed is eased into
 * the smoothed velocity `flowDisplace` is actually driven by.
 */
export function capSpeed(vx: number, vy: number, maxSpeed: number): { vx: number; vy: number } {
  const speed = Math.hypot(vx, vy);
  if (speed <= maxSpeed || speed < 1e-9) return { vx, vy };
  const scale = maxSpeed / speed;
  return { vx: vx * scale, vy: vy * scale };
}

/**
 * Eases `current` toward `target` over elapsed time `dt` (seconds) with time
 * constant `tau` (seconds) — current + (target − current) · (1 − e^(−dt/τ)),
 * the standard smooth exponential approach: fast at first, slowing as it
 * nears the target, and frame-rate independent (unlike a fixed per-frame
 * fraction, which would ease at different effective rates if `dt` varied).
 */
export function easeTo(current: number, target: number, dt: number, tau: number): number {
  if (tau <= 0) return target;
  const rate = 1 - Math.exp(-dt / tau);
  return current + (target - current) * rate;
}

/**
 * Fills the gap between two consecutive, already-solved true points
 * (`from` → `to`) with extra samples — found by linearly interpolating the
 * true, undeformed geometry (never re-run through Newton's method, and an
 * excellent approximation over so short a span) and displacing each one —
 * whenever the segment passes close enough to the pointer, relative to its
 * own length, that the Gaussian envelope's magnitude could change
 * noticeably across it; a distant segment is left as the single displaced
 * endpoint it was before. Carried over from the retired radial model,
 * where it did load-bearing work closing a real, visible corner — here the
 * push direction no longer varies across space (every point moves the same
 * way for a given frame; see flowDisplace), only its magnitude does, and
 * that magnitude is a smooth, bounded Gaussian with nowhere near as sharp a
 * gradient, so this now does much less work. It is kept as the same cheap,
 * already-tested safety net regardless. The very last sample always lands
 * exactly on `flowDisplace(to, …)`, so chaining this call for every
 * consecutive pair in a line reproduces the original endpoints exactly and
 * only ever adds points between them.
 */
export function subdivideAndFlow(
  from: Point,
  to: Point,
  px: number,
  py: number,
  vx: number,
  vy: number,
  influence: number,
  params: FlowDeformParams = FLOW_DEFORM_DEFAULTS,
): Point[] {
  const segLen = Math.hypot(to.x - from.x, to.y - from.y);
  if (segLen < 1e-6 || influence <= 0 || Math.hypot(vx, vy) < 1e-6) {
    return [flowDisplace(to.x, to.y, px, py, vx, vy, influence, params)];
  }
  const nearest = Math.min(Math.hypot(from.x - px, from.y - py), Math.hypot(to.x - px, to.y - py));
  if (nearest >= 6 * segLen) return [flowDisplace(to.x, to.y, px, py, vx, vy, influence, params)];
  const n = Math.max(4, Math.min(16, Math.round((2 * segLen) / Math.max(nearest, 1))));
  const out: Point[] = [];
  for (let k = 1; k <= n; k++) {
    const t = k / n;
    out.push(flowDisplace(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, px, py, vx, vy, influence, params));
  }
  return out;
}
