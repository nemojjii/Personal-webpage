/**
 * An illustrative frequency-sweep ("chirp") shape for the homepage's Research
 * panel — a quadratic-phase sinusoid, not a reproduction of GW150914 or any
 * other observed signal. The gravitational-wave research entry's own model
 * computes an orbital frequency sweep, never a strain waveform (see its
 * "Challenges and limitations"); this is a generic illustration of what
 * "frequency rising over time" looks like as a plot, in the same spirit,
 * not a stand-in for either the model's output or the real data.
 */

export interface ChirpPoint {
  /** 0 to 1 across the panel. */
  t: number;
  /** The illustrative amplitude, within ±envelope(t). */
  y: number;
}

export const CHIRP_DEFAULTS = {
  points: 160,
  /** Cycles completed over [0, 1] at the start and at the end of the sweep. */
  cyclesStart: 2,
  cyclesEnd: 13,
} as const;

/** The envelope |y| is bounded by: small at the start, fuller near the end. */
export function chirpEnvelope(t: number): number {
  return 0.3 + 0.7 * t;
}

/**
 * `count + 1` points across t ∈ [0, 1], instantaneous frequency rising
 * linearly from `cyclesStart` to `cyclesEnd` cycles per unit t — a quadratic
 * phase, so the frequency (the phase's derivative) increases smoothly
 * rather than jumping.
 */
export function chirpPoints(
  count: number = CHIRP_DEFAULTS.points,
  cyclesStart: number = CHIRP_DEFAULTS.cyclesStart,
  cyclesEnd: number = CHIRP_DEFAULTS.cyclesEnd,
): ChirpPoint[] {
  const points: ChirpPoint[] = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const phase = 2 * Math.PI * (cyclesStart * t + ((cyclesEnd - cyclesStart) * t * t) / 2);
    points.push({ t, y: chirpEnvelope(t) * Math.sin(phase) });
  }
  return points;
}
