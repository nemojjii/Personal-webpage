/**
 * Standing waves — a string driven at one end and clamped at the other
 * (Rutgers 275 Classical Physics Lab 10, "Standing Waves"), and the same
 * mathematics applied to a sealed air column.
 *
 * Both setups share one shape: a sinusoidal driver of small, fixed
 * amplitude at x = 0 (the buzzer; the loudspeaker, sealed into the tube)
 * and a rigid, fixed boundary at x = L (the fret; the plunger). The steady
 * forced response of the wave equation to that pair of conditions, for any
 * L — not only a resonant one — is
 *
 *   u(x,t) = A₀ · [sin(k(L−x)) / sin(kL)] · cos(ωt),
 *
 * which satisfies u(L,t) = 0 for every L (the clamped end) and
 * u(0,t) = A₀ cos(ωt) exactly (the driven end's own amplitude, fixed and
 * small, matching the handout's "the buzzer end is a good approximation of
 * a node"). It diverges as kL → nπ for an undamped, lossless string —
 * resonance — which is also the condition L = n·λ/2 the handout gives.
 * SIN_FLOOR below keeps the displayed curve finite there; it is a
 * rendering choice, not a claim about real damping.
 *
 * Pressure in a sound wave is proportional to −∂u/∂x (compression where the
 * displacement gradient is negative). Differentiating the shape above gives
 * a cosine in the same denominator — the pressure pattern is the
 * displacement pattern's own quarter-wavelength-shifted companion, not an
 * independent curve, and a node of one is exactly an antinode of the
 * other. This is the fact Question 2 of the handout turns on.
 */

export const STRING_FREQUENCY_HZ = 120;
export const STRING_LINEAR_DENSITY = 2.0e-4; // kg/m
export const STRING_LINEAR_DENSITY_UNCERTAINTY = 0.2e-4; // ±10%, per the handout
export const GRAVITY = 9.8; // m/s^2

export const MASS_LIMITS = { min: 0.02, max: 0.5, step: 0.005 };
export const STRING_LENGTH_LIMITS = { min: 0.1, max: 2.0, step: 0.002 };

export const tension = (massKg: number, g = GRAVITY) => massKg * g;

export const stringSpeed = (massKg: number, rho = STRING_LINEAR_DENSITY, g = GRAVITY) =>
  Math.sqrt(tension(massKg, g) / rho);

export const waveNumber = (speed: number, f: number) => (2 * Math.PI * f) / speed;
export const wavelengthOf = (speed: number, f: number) => speed / f;

/** The nearest mode number for a given length and wavelength (n ≥ 1). */
export const nearestMode = (length: number, lambda: number) =>
  Math.max(1, Math.round((2 * length) / lambda));

/** The length at which mode n resonates, for a given wavelength. */
export const resonantLength = (n: number, lambda: number) => (n * lambda) / 2;

const SIN_FLOOR = 0.035;
export const MAX_DISPLAY_GAIN = 1 / SIN_FLOOR;

const safeSin = (x: number) => {
  const s = Math.sin(x);
  return (s >= 0 ? 1 : -1) * Math.max(Math.abs(s), SIN_FLOOR);
};

/** Displacement shape, driven at x=0 and clamped at x=L (see module notes). */
export const drivenDisplacement = (x: number, L: number, k: number) => Math.sin(k * (L - x)) / safeSin(k * L);

/** Pressure shape: −∂(displacement)/∂x of the same solution, up to a fixed scale. */
export const drivenPressure = (x: number, L: number, k: number) => Math.cos(k * (L - x)) / safeSin(k * L);

/** How strongly the forced response is amplified relative to the driver's own amplitude. */
export const resonanceGain = (L: number, k: number) => 1 / Math.max(Math.abs(Math.sin(k * L)), SIN_FLOOR);

/** True once the gain has climbed to a visibly distinct, "found it" level. */
export const isNearResonance = (L: number, k: number) => Math.abs(Math.sin(k * L)) < 0.12;

export const AIR_FREQUENCY_LIMITS = { min: 400, max: 2000, step: 5 };
export const AIR_LENGTH_LIMITS = { min: 0.05, max: 1.5, step: 0.002 };
export const DEFAULT_TEMPERATURE_C = 22;
export const TEMPERATURE_LIMITS = { min: 0, max: 35, step: 0.5 };

/** c = 331.4 + 0.6T, T in degrees Celsius. */
export const speedOfSound = (tempC: number) => 331.4 + 0.6 * tempC;

/** c implied by a measured resonant length at mode n on the string: c = 2fL/n. */
export const speedFromResonantLength = (n: number, measuredLength: number, f: number) =>
  (2 * f * measuredLength) / n;

/** c implied by a measured spacing between successive pressure maxima: λ = 2Δx, c = fλ. */
export const speedFromDeltaX = (measuredDeltaX: number, f: number) => 2 * f * measuredDeltaX;

/** Signed percent difference of a measured value from its theoretical prediction. */
export const percentDifference = (measured: number, theoretical: number) =>
  ((measured - theoretical) / theoretical) * 100;
