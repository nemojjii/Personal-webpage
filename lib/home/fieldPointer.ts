/**
 * The hero artwork's pointer response: a bounded, radially-symmetric
 * Gaussian displacement, applied to an already-traced point as a pure
 * post-processing step — never fed back into the streamline tracing itself
 * (see components/viz/HeroField.tsx, where this is called only at the
 * moment a point is pushed to the drawn path, after Newton's method has
 * already found it). That separation is what keeps this deformation from
 * ever being able to destabilise the root-finding: nothing here can
 * introduce a discontinuity or a numerical blow-up in the underlying model,
 * because the underlying model never sees it.
 */

export interface PointerDeformParams {
  /** Interaction radius: the Gaussian's standard deviation, in CSS pixels. */
  sigma: number;
  /** Displacement at the pointer's exact position (d = 0), in CSS pixels. */
  strength: number;
}

// Widened from an earlier {110, 12}: at that radius the response reached
// only a narrow patch around the pointer (≈36% of the canvas at >1px of
// displacement, on a representative hero size) and neighbouring points
// ≈30–40px apart — the spacing between this piece's own lines — differed
// in their displacement by up to half of it, reading as disjoint rather
// than as one surface moving together. At {200, 20}, the same measurements
// put ≈98% of the canvas above that threshold and cut the worst-case
// neighbour-to-neighbour difference roughly in half, without the field
// reaching full canvas coverage the way a still-wider {240, 22} did — kept
// to feel like a disturbance centred on the pointer rather than a softening
// of the whole piece. Strength scaled with sigma so the Gaussian's slope
// near the pointer — and with it the character of the response, not just
// its reach — stays close to the original.
export const POINTER_DEFORM_DEFAULTS: PointerDeformParams = { sigma: 200, strength: 20 };

/** w(d) = exp(−d² / (2σ²)) — 1 at the pointer, smoothly to 0 with distance. */
export function gaussianWeight(d: number, sigma: number): number {
  if (sigma <= 0) return 0;
  return Math.exp(-(d * d) / (2 * sigma * sigma));
}

/**
 * (x, y) pushed radially away from (px, py) by `strength · influence · w(d)`
 * — bounded above by `strength · influence` for any distance, since
 * `w(d) ≤ 1` everywhere. `influence` is a separate [0, 1] factor the caller
 * eases in and out over time, for a smooth approach and return to rest
 * rather than a step change the instant a pointer arrives or leaves.
 * Returns the point unchanged exactly at d = 0 (no direction to push in,
 * and the one place a naïve version could divide by zero) and whenever
 * `influence` is 0.
 */
export function deformPoint(
  x: number,
  y: number,
  px: number,
  py: number,
  influence: number,
  params: PointerDeformParams = POINTER_DEFORM_DEFAULTS,
): { x: number; y: number } {
  if (influence <= 0) return { x, y };
  const dx = x - px;
  const dy = y - py;
  const d = Math.hypot(dx, dy);
  if (d < 1e-6) return { x, y };
  const magnitude = params.strength * influence * gaussianWeight(d, params.sigma);
  return { x: x + (dx / d) * magnitude, y: y + (dy / d) * magnitude };
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

export interface Point {
  x: number;
  y: number;
}

/**
 * `deformPoint` pushes a point directly away from (px, py) — a direction
 * that rotates fastest exactly where a streamline passes closest to the
 * pointer, since a point just before closest approach and one just after it
 * are pushed in close to opposite directions. Two points sampled `segLen`
 * apart straddling that near-miss, each simply deformed and joined with a
 * straight line, can then show a visible corner where neither endpoint
 * individually is wrong — the corner is a sampling-resolution artefact of
 * the display step, not of deformPoint or of the streamline itself.
 *
 * This fills the gap between two consecutive, already-solved true points
 * (`from` → `to`) with extra samples — found by linearly interpolating the
 * true, undeformed geometry (never re-run through Newton's method, and an
 * excellent approximation over so short a span) and deforming each one —
 * whenever the segment passes close enough to the pointer, relative to its
 * own length, for that rotation to be visible; a distant segment is left as
 * the single deformed endpoint it was before. How many samples scales with
 * how close the pass is, capped so the cost of a near-miss stays bounded.
 * The very last sample always lands exactly on `deformPoint(to, …)`, so
 * chaining this call for every consecutive pair in a line reproduces the
 * original endpoints exactly and only ever adds points between them.
 */
export function subdivideAndDeform(
  from: Point,
  to: Point,
  px: number,
  py: number,
  influence: number,
  params: PointerDeformParams = POINTER_DEFORM_DEFAULTS,
): Point[] {
  const segLen = Math.hypot(to.x - from.x, to.y - from.y);
  if (segLen < 1e-6 || influence <= 0) return [deformPoint(to.x, to.y, px, py, influence, params)];
  const nearest = Math.min(Math.hypot(from.x - px, from.y - py), Math.hypot(to.x - px, to.y - py));
  if (nearest >= 6 * segLen) return [deformPoint(to.x, to.y, px, py, influence, params)];
  const n = Math.max(4, Math.min(16, Math.round((2 * segLen) / Math.max(nearest, 1))));
  const out: Point[] = [];
  for (let k = 1; k <= n; k++) {
    const t = k / n;
    out.push(deformPoint(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, px, py, influence, params));
  }
  return out;
}
