/**
 * First-order kinetics for an idealised elementary reaction A → products.
 *
 *   d[A]/dt = −k [A]        ⇒        [A](t) = [A]₀ e^{−kt},   k ≥ 0
 *
 * The half-life t½ = ln 2 / k does not depend on the concentration, which is
 * the signature of first-order behaviour. Units are illustrative: mol L⁻¹
 * for concentration, seconds for time, s⁻¹ for k. No particular real
 * reaction is implied.
 */

export const KINETICS_DEFAULTS = { a0: 1, k: 0.35 };

export const KINETICS_LIMITS = {
  a0: { min: 0.1, max: 2, step: 0.05 },
  k: { min: 0, max: 2, step: 0.05 },
} as const;

export const LN2 = Math.LN2;

export function concentration(a0: number, k: number, t: number): number {
  return a0 * Math.exp(-k * Math.max(0, t));
}

/** Fraction of the initial concentration remaining at time t. */
export const fractionRemaining = (k: number, t: number) => Math.exp(-k * Math.max(0, t));

/** Undefined when k = 0: nothing decays, so nothing halves. */
export const halfLife = (k: number) => (k > 0 ? LN2 / k : undefined);

/** Instantaneous rate of disappearance, −d[A]/dt = k[A]. */
export const rate = (a0: number, k: number, t: number) => k * concentration(a0, k, t);

/**
 * How many seconds the plot shows. About six half-lives when there is a
 * half-life to speak of, so the curve visibly flattens; kept within sensible
 * bounds so very fast or very slow reactions still fit the frame.
 */
export function timeWindow(k: number): number {
  if (k <= 0) return 20;
  return Math.min(60, Math.max(2, 6 * (LN2 / k)));
}

export function curve(a0: number, k: number, tMax: number, n = 161): { t: number; a: number }[] {
  return Array.from({ length: n }, (_, i) => {
    const t = (i / (n - 1)) * tMax;
    return { t, a: concentration(a0, k, t) };
  });
}
