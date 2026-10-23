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

export const POINTER_DEFORM_DEFAULTS: PointerDeformParams = { sigma: 110, strength: 12 };

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
