/**
 * Wave superposition — two travelling sine waves on one string.
 *
 *   y₁(x,t) = A₁ sin(k₁x − ω₁t)
 *   y₂(x,t) = A₂ sin(k₂x − ω₂t + Δφ)
 *   y(x,t)  = y₁ + y₂
 *
 * The phase of wave 1 is taken as the reference (φ₁ = 0), so Δφ = φ₂ − φ₁.
 * Both waves travel on the same non-dispersive medium with speed v, so the
 * angular frequency of each follows its wave number: ω = v·k. Nothing here
 * assumes the two waves share a wavelength — when they do, the sum is a
 * single sinusoid whose amplitude depends only on Δφ; when they do not, it
 * is not.
 *
 * Units are arbitrary: lengths in units of the string, time in seconds.
 */

export interface WaveParams {
  /** Amplitudes. */
  a1: number;
  a2: number;
  /** Wave numbers, radians per unit length. */
  k1: number;
  k2: number;
  /** Phase of wave 2 relative to wave 1, radians. */
  phase: number;
  /** Propagation speed shared by both waves, length units per second. */
  v: number;
}

export const WAVE_DEFAULTS: WaveParams = { a1: 1, a2: 1, k1: 2, k2: 2, phase: 0, v: 1 };

export const WAVE_LIMITS = {
  a: { min: 0, max: 1.5, step: 0.05 },
  k: { min: 0.5, max: 4, step: 0.1 },
  phase: { min: -Math.PI, max: Math.PI, step: Math.PI / 12 },
  v: { min: 0.25, max: 2, step: 0.05 },
} as const;

/** Length of string shown. */
export const WAVE_LENGTH = 4 * Math.PI;

export const omega = (k: number, v: number) => v * k;
export const wavelength = (k: number) => (2 * Math.PI) / k;

export interface WavePoint {
  x: number;
  y1: number;
  y2: number;
  y: number;
}

export function displacement(p: WaveParams, x: number, t: number): WavePoint {
  const y1 = p.a1 * Math.sin(p.k1 * x - omega(p.k1, p.v) * t);
  const y2 = p.a2 * Math.sin(p.k2 * x - omega(p.k2, p.v) * t + p.phase);
  return { x, y1, y2, y: y1 + y2 };
}

/** The three curves sampled at n points along the string at time t. */
export function sampleWaves(p: WaveParams, t: number, n = 241, length = WAVE_LENGTH): WavePoint[] {
  const out: WavePoint[] = [];
  for (let i = 0; i < n; i++) out.push(displacement(p, (i / (n - 1)) * length, t));
  return out;
}

/** True when the two waves share a wave number (and therefore a frequency). */
export const sameWaveNumber = (p: WaveParams) => Math.abs(p.k1 - p.k2) < 1e-9;

/**
 * For equal wave numbers the sum is A sin(kx − ωt + δ) with
 *   A = √(A₁² + A₂² + 2A₁A₂ cos Δφ).
 * Undefined otherwise, because then there is no single amplitude.
 */
export function resultantAmplitude(p: WaveParams): number | undefined {
  if (!sameWaveNumber(p)) return undefined;
  return Math.sqrt(p.a1 * p.a1 + p.a2 * p.a2 + 2 * p.a1 * p.a2 * Math.cos(p.phase));
}

export type Interference = "constructive" | "destructive" | "partial";

/** The character of equal-frequency interference, from the phase alone. */
export function interference(p: WaveParams): Interference | undefined {
  if (!sameWaveNumber(p)) return undefined;
  const c = Math.cos(p.phase);
  if (c > 1 - 1e-6) return "constructive";
  if (c < -1 + 1e-6) return "destructive";
  return "partial";
}

/**
 * Pointwise: at a given x and t the two displacements either pull the same
 * way (they reinforce) or opposite ways (they oppose). This is true for any
 * pair of waves, equal wavelength or not, and is what the highlight shades.
 */
export const reinforces = (pt: WavePoint) => pt.y1 * pt.y2 > 0;
