/**
 * Fourier synthesis — a finite harmonic series built one sine at a time.
 *
 *   f(t) = Σ_{n=1}^{N} A_n sin(2π n f₀ t + φ_n)
 *
 * N is how many terms are summed (1–8 here), f₀ the fundamental frequency in
 * hertz, and A_n, φ_n the amplitude and phase of the n-th harmonic, whose own
 * frequency is n·f₀. This is a *Fourier series* for a periodic signal: a sum
 * of finitely many sinusoids. It is not a Fourier transform — that maps a
 * signal (periodic or not) to a function of continuous frequency, via an
 * integral, not a finite sum — and for N below a few hundred the square- and
 * sawtooth-wave presets only approximate those waveforms; see
 * `squareWaveParams`/`sawtoothWaveParams` below for exactly how.
 *
 * Amplitude is in arbitrary units, matching the rest of the Little
 * Laboratory; frequency is in hertz and time in seconds, so the two axes of
 * the frequency-domain plot carry real units even though the signal is not
 * measured from anything.
 */

export const FOURIER_MAX_N = 8;

export interface FourierParams {
  /** Active harmonic count — only amplitudes/phases[0 .. n-1] are summed. */
  n: number;
  /** Fundamental frequency, hertz. */
  f0: number;
  /** A_1 .. A_8, arbitrary units. Index i holds harmonic i+1. */
  amplitudes: number[];
  /** φ_1 .. φ_8, radians. Index i holds harmonic i+1. */
  phases: number[];
}

export const FOURIER_DEFAULTS: FourierParams = {
  n: 3,
  f0: 1,
  amplitudes: [1, 0.5, 0.25, 0, 0, 0, 0, 0],
  phases: [0, 0, 0, 0, 0, 0, 0, 0],
};

export const FOURIER_LIMITS = {
  n: { min: 1, max: FOURIER_MAX_N, step: 1 },
  f0: { min: 0.5, max: 3, step: 0.1 },
  amplitude: { min: 0, max: 1.5, step: 0.05 },
  phase: { min: -Math.PI, max: Math.PI, step: Math.PI / 12 },
} as const;

/** A fresh, independently-mutable copy — never hand out the shared constant. */
export function cloneParams(p: FourierParams = FOURIER_DEFAULTS): FourierParams {
  return { n: p.n, f0: p.f0, amplitudes: [...p.amplitudes], phases: [...p.phases] };
}

/** The n-th harmonic's own frequency, n·f₀. Harmonic numbers start at 1. */
export const harmonicFrequency = (f0: number, harmonic: number) => harmonic * f0;

/** One fundamental period, 1/f₀ seconds. Undefined (no period) at f₀ = 0. */
export const period = (f0: number) => (f0 > 0 ? 1 / f0 : undefined);

/** The n-th harmonic's displacement alone, A_n sin(2π n f₀ t + φ_n). */
export function harmonicValue(amplitude: number, f0: number, harmonic: number, phase: number, t: number): number {
  return amplitude * Math.sin(2 * Math.PI * harmonicFrequency(f0, harmonic) * t + phase);
}

/** Every active harmonic's value at t, in harmonic order (length p.n). */
export function componentsAt(p: FourierParams, t: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < p.n; i++) out.push(harmonicValue(p.amplitudes[i], p.f0, i + 1, p.phases[i], t));
  return out;
}

/** f(t): the sum of the active harmonics alone. */
export function synthesize(p: FourierParams, t: number): number {
  let sum = 0;
  for (let i = 0; i < p.n; i++) sum += harmonicValue(p.amplitudes[i], p.f0, i + 1, p.phases[i], t);
  return sum;
}

export interface TimeSample {
  t: number;
  components: number[];
  sum: number;
}

/**
 * f(t) and its components sampled over `periods` fundamental periods (one
 * period when f₀ = 0, since there is then no period to multiply). `n`
 * points per period, so the total sample count scales with `periods`.
 */
export function sampleTimeDomain(p: FourierParams, periods = 2, pointsPerPeriod = 120): TimeSample[] {
  const span = period(p.f0) ?? 1;
  const total = Math.max(2, Math.round(periods * pointsPerPeriod));
  const out: TimeSample[] = [];
  for (let i = 0; i <= total; i++) {
    const t = (i / total) * periods * span;
    out.push({ t, components: componentsAt(p, t), sum: synthesize(p, t) });
  }
  return out;
}

export interface SpectrumLine {
  /** Harmonic number, 1 .. p.n. */
  harmonic: number;
  /** harmonic · f₀, hertz. */
  frequency: number;
  amplitude: number;
  /** Radians, as entered — not folded into [0, 2π). */
  phase: number;
}

/** The discrete amplitude spectrum: one line per *active* harmonic only. */
export function spectrum(p: FourierParams): SpectrumLine[] {
  const out: SpectrumLine[] = [];
  for (let i = 0; i < p.n; i++) {
    out.push({
      harmonic: i + 1,
      frequency: harmonicFrequency(p.f0, i + 1),
      amplitude: p.amplitudes[i],
      phase: p.phases[i],
    });
  }
  return out;
}

/** The largest magnitude any active harmonic's amplitude reaches, for axis scaling. */
export const maxActiveAmplitude = (p: FourierParams) =>
  Math.max(0, ...p.amplitudes.slice(0, p.n).map((a) => Math.abs(a)));

/**
 * The square wave's Fourier series carries only odd harmonics, with
 * amplitude 4/(nπ):  square(t) = (4/π) Σ_{n odd} (1/n) sin(2π n f₀ t).
 * Even-indexed harmonics are set to exactly zero, not merely small, so the
 * instrument shows the real structure — not an approximation that happens
 * to look small on the even terms.
 */
export function squareWaveParams(f0: number, maxN: number = FOURIER_MAX_N): FourierParams {
  const amplitudes = Array.from({ length: FOURIER_MAX_N }, (_, i) => {
    const harmonic = i + 1;
    if (harmonic > maxN || harmonic % 2 === 0) return 0;
    return 4 / (Math.PI * harmonic);
  });
  return { n: maxN, f0, amplitudes, phases: new Array(FOURIER_MAX_N).fill(0) };
}

/**
 * The sawtooth wave's Fourier series carries every harmonic, with amplitude
 * 2/(nπ) and alternating sign: sawtooth(t) = (2/π) Σ_n [(−1)^{n+1}/n] sin(2π
 * n f₀ t). A negative coefficient is the same sine with amplitude flipped
 * and phase shifted by π (sin(θ+π) = −sin θ), so it is written that way here
 * — every amplitude in this model is non-negative, and the sign lives in
 * `phase` — which also demonstrates, concretely, that an amplitude/phase
 * pair and a signed coefficient are two descriptions of the same term.
 */
export function sawtoothWaveParams(f0: number, maxN: number = FOURIER_MAX_N): FourierParams {
  const amplitudes = new Array(FOURIER_MAX_N).fill(0);
  const phases = new Array(FOURIER_MAX_N).fill(0);
  for (let harmonic = 1; harmonic <= maxN; harmonic++) {
    amplitudes[harmonic - 1] = 2 / (Math.PI * harmonic);
    phases[harmonic - 1] = harmonic % 2 === 0 ? Math.PI : 0;
  }
  return { n: maxN, f0, amplitudes, phases };
}

/** A single pure tone: harmonic 1 only, every other harmonic silent. */
export function pureSineParams(f0: number): FourierParams {
  const amplitudes = new Array(FOURIER_MAX_N).fill(0);
  amplitudes[0] = 1;
  return { n: 1, f0, amplitudes, phases: new Array(FOURIER_MAX_N).fill(0) };
}
