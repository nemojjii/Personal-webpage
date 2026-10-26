/**
 * A single quantum particle of mass m, confined to a one-dimensional
 * infinite square well of width L (Modes A, B, D) or incident on a finite
 * rectangular barrier (Mode C).
 *
 * Natural units throughout: ħ = 1, so energy and angular frequency share
 * units, and a stationary state's time-evolution phase is written
 * exp(−i Eₙ t) rather than exp(−i Eₙ t / ħ). Mass, length and energy are
 * dimensionless sliders here, not SI quantities — this is a worked model,
 * traced exactly, not a measurement of anything.
 *
 * Reference for the infinite well's eigenfunctions and energies: OpenStax
 * University Physics Volume 3, §7.4, "The Quantum Particle in a Box"
 * (https://openstax.org/books/university-physics-volume-3/pages/7-4-the-quantum-particle-in-a-box).
 * The finite rectangular barrier (Mode C) follows the standard scattering
 * treatment found in any introductory quantum mechanics text (e.g. Griffiths,
 * *Introduction to Quantum Mechanics*, §2.6) — boundary-matched plane waves
 * in three regions, solved exactly, not approximated.
 */

export const HBAR = 1;

/* ─────────────────────────────── complex arithmetic ──────────────────────
   A minimal, dependency-free helper — just enough to carry the scattering
   coefficients below through addition, multiplication and division without
   hand-expanding every real/imaginary part inline, where a transcription
   slip would be easy to make and hard to spot. */

export interface Complex {
  re: number;
  im: number;
}

export const cAdd = (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im });
export const cMul = (a: Complex, b: Complex): Complex => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});
export const cScale = (a: Complex, s: number): Complex => ({ re: a.re * s, im: a.im * s });
export function cDiv(a: Complex, b: Complex): Complex {
  const d = b.re * b.re + b.im * b.im;
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
}
/** |a|². Named distinctly from `cAbs` so a caller never mixes up a probability with an amplitude. */
export const cAbs2 = (a: Complex): number => a.re * a.re + a.im * a.im;
export const cAbs = (a: Complex): number => Math.sqrt(cAbs2(a));
/** e^{iθ}. */
export const cExpI = (theta: number): Complex => ({ re: Math.cos(theta), im: Math.sin(theta) });

/* ───────────────────────── A. Particle in a box ───────────────────────── */

export interface WellParams {
  /** Well width. */
  L: number;
  /** Particle mass. */
  m: number;
}

export const WELL_DEFAULTS: WellParams = { L: 1, m: 1 };
export const WELL_LIMITS = {
  L: { min: 0.5, max: 3, step: 0.1 },
  m: { min: 0.3, max: 3, step: 0.1 },
  n: { min: 1, max: 6, step: 1 },
} as const;

/**
 * ψₙ(x) = √(2/L) sin(nπx/L) for 0 ≤ x ≤ L, and 0 outside it — the infinite
 * well's n-th normalized stationary eigenfunction, satisfying the required
 * boundary conditions ψₙ(0) = ψₙ(L) = 0 for every n by construction (sin of
 * an integer multiple of π is exactly zero).
 */
export function eigenfunction(n: number, L: number, x: number): number {
  if (x < 0 || x > L) return 0;
  return Math.sqrt(2 / L) * Math.sin((n * Math.PI * x) / L);
}

/** Eₙ = n²π²ħ²/(2mL²), ħ = 1 — the n-th stationary state's energy. */
export function energy(n: number, L: number, m: number): number {
  return (n * n * Math.PI * Math.PI) / (2 * m * L * L);
}

export interface EigenstateSample {
  x: number;
  psi: number;
  density: number;
}

/** ψₙ and |ψₙ|² sampled at `points + 1` evenly-spaced positions over [0, L]. */
export function sampleEigenfunction(n: number, L: number, points = 240): EigenstateSample[] {
  const out: EigenstateSample[] = [];
  for (let i = 0; i <= points; i++) {
    const x = (i / points) * L;
    const psi = eigenfunction(n, L, x);
    out.push({ x, psi, density: psi * psi });
  }
  return out;
}

/**
 * ∫₀ᴸ ψₙ(x)² dx by Simpson's rule, used only to check normalization
 * numerically (by a test, and available to the instrument itself as a
 * displayed sanity figure) — never substituted for the analytic √(2/L)
 * prefactor, which is exact.
 */
export function normalizationIntegral(n: number, L: number, points = 2000): number {
  const evenPoints = points % 2 === 0 ? points : points + 1;
  const h = L / evenPoints;
  let sum = eigenfunction(n, L, 0) ** 2 + eigenfunction(n, L, L) ** 2;
  for (let i = 1; i < evenPoints; i++) {
    const x = i * h;
    const weight = i % 2 === 0 ? 2 : 4;
    sum += weight * eigenfunction(n, L, x) ** 2;
  }
  return (h / 3) * sum;
}

/**
 * ∫₀ᴸ ψₙ(x) ψₘ(x) dx by Simpson's rule — used only to check orthogonality
 * numerically (n ≠ m should integrate to ≈ 0).
 */
export function overlapIntegral(n: number, m: number, L: number, points = 2000): number {
  const evenPoints = points % 2 === 0 ? points : points + 1;
  const h = L / evenPoints;
  let sum = eigenfunction(n, L, 0) * eigenfunction(m, L, 0) + eigenfunction(n, L, L) * eigenfunction(m, L, L);
  for (let i = 1; i < evenPoints; i++) {
    const x = i * h;
    const weight = i % 2 === 0 ? 2 : 4;
    sum += weight * eigenfunction(n, L, x) * eigenfunction(m, L, x);
  }
  return (h / 3) * sum;
}

/* ─────────────────────── B. Superposition & time evolution ────────────── */

/**
 * One term of a superposition, as entered: a non-negative amplitude and a
 * phase, cₙ = amplitude · e^{i·phase}. The full state is renormalized by
 * `normalizedWeights` below, so the amplitudes entered need not already
 * satisfy Σ|cₙ|² = 1 — only their relative sizes matter.
 */
export interface SuperpositionTerm {
  n: number;
  amplitude: number;
  phase: number;
}

export interface SuperpositionState {
  terms: SuperpositionTerm[];
}

export const SUPERPOSITION_DEFAULTS: SuperpositionState = {
  terms: [
    { n: 1, amplitude: 1, phase: 0 },
    { n: 2, amplitude: 1, phase: 0 },
  ],
};

/**
 * cₙ for each term, rescaled so Σ|cₙ|² = 1 — the eigenfunctions are already
 * orthonormal (see `overlapIntegral`), so this alone guarantees
 * ∫|Ψ|² dx = 1 at every x and t, without integrating anything.
 */
export function normalizedWeights(terms: SuperpositionTerm[]): { n: number; c: Complex }[] {
  const norm = Math.sqrt(terms.reduce((s, t) => s + t.amplitude * t.amplitude, 0));
  if (norm < 1e-12) return terms.map((t) => ({ n: t.n, c: { re: 0, im: 0 } }));
  return terms.map((t) => ({
    n: t.n,
    c: cScale(cExpI(t.phase), t.amplitude / norm),
  }));
}

/**
 * Ψ(x, t) = Σₙ cₙ ψₙ(x) e^{−i Eₙ t} — the time-dependent superposition, each
 * term carrying its own, energy-dependent phase. A single term (one active
 * n) reduces this to a bare stationary state: Ψ(x,t) = ψₙ(x) e^{−i Eₙ t},
 * whose squared magnitude is ψₙ(x)² for every t, since |e^{−iθ}| = 1 — the
 * reason a single eigenstate's probability density never changes in time.
 * With two or more terms of different energy, the cross terms between them
 * oscillate at their energy difference (see `beatAngularFrequencies`), and
 * |Ψ|² genuinely moves.
 */
export function psiAt(state: SuperpositionState, well: WellParams, x: number, t: number): Complex {
  const weights = normalizedWeights(state.terms);
  let sum: Complex = { re: 0, im: 0 };
  for (const w of weights) {
    const En = energy(w.n, well.L, well.m);
    const psiN = eigenfunction(w.n, well.L, x);
    const term = cMul(cScale(w.c, psiN), cExpI(-En * t));
    sum = cAdd(sum, term);
  }
  return sum;
}

export interface SuperpositionSample {
  x: number;
  re: number;
  im: number;
  magnitude: number;
  density: number;
}

export function sampleSuperposition(
  state: SuperpositionState,
  well: WellParams,
  t: number,
  points = 240,
): SuperpositionSample[] {
  const out: SuperpositionSample[] = [];
  for (let i = 0; i <= points; i++) {
    const x = (i / points) * well.L;
    const psi = psiAt(state, well, x, t);
    out.push({ x, re: psi.re, im: psi.im, magnitude: cAbs(psi), density: cAbs2(psi) });
  }
  return out;
}

/**
 * The angular frequency at which each pair of active, distinct terms'
 * cross term beats, |Eₙ − Eₘ|, one entry per unordered pair — empty for a
 * single term, where there is no second energy to beat against and the
 * state is exactly stationary. The smallest of these sets the longest
 * period over which |Ψ(x,t)|² repeats.
 */
export function beatAngularFrequencies(state: SuperpositionState, well: WellParams): number[] {
  const active = state.terms.filter((t) => t.amplitude > 0);
  const out: number[] = [];
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const Ei = energy(active[i].n, well.L, well.m);
      const Ej = energy(active[j].n, well.L, well.m);
      if (Math.abs(Ei - Ej) > 1e-12) out.push(Math.abs(Ei - Ej));
    }
  }
  return out;
}

/* ─────────────────────────── C. Quantum tunneling ──────────────────────── */

export interface BarrierParams {
  /** Incident energy. */
  E: number;
  /** Barrier height. */
  V0: number;
  /** Barrier width. */
  a: number;
  /** Particle mass. */
  m: number;
}

export const BARRIER_DEFAULTS: BarrierParams = { E: 1, V0: 2, a: 1, m: 1 };
export const BARRIER_LIMITS = {
  E: { min: 0.05, max: 4, step: 0.05 },
  V0: { min: 0, max: 4, step: 0.05 },
  a: { min: 0, max: 3, step: 0.05 },
  m: { min: 0.3, max: 3, step: 0.1 },
} as const;

export type ScatteringRegime = "tunneling" | "over-barrier" | "at-barrier-top";

/** How close |E − V0| has to be, relative to V0 (or 1, if V0 = 0), to use the exact barrier-top limit below rather than the general-case formula either side of it would otherwise divide by (near) zero to reach. */
const BARRIER_TOP_EPS = 1e-6;

export function scatteringRegime(E: number, V0: number): ScatteringRegime {
  if (Math.abs(E - V0) < BARRIER_TOP_EPS * Math.max(1, V0)) return "at-barrier-top";
  return E < V0 ? "tunneling" : "over-barrier";
}

/**
 * The transmission probability T, exactly — not a wavefunction amplitude
 * read off a plot, which is not itself a probability. Three closed-form
 * cases, not one formula silently extended past where it is valid:
 *
 *  - E < V0 (`tunneling`): classically forbidden inside the barrier,
 *      T = [1 + V0² sinh²(κa) / (4E(V0−E))]⁻¹, κ = √(2m(V0−E)).
 *  - E > V0 (`over-barrier`): classically allowed throughout, but still
 *    *not* T = 1 — the barrier still partially reflects:
 *      T = [1 + V0² sin²(k'a) / (4E(E−V0))]⁻¹, k' = √(2m(E−V0)).
 *  - E = V0 (`at-barrier-top`): both formulas above divide by zero at
 *    exactly this point (V0 − E, or E − V0, in the denominator) while their
 *    numerators also vanish — not a singularity, but a removable one, whose
 *    limit (confirmed analytically and by evaluating the two formulas on
 *    either side as E → V0, in this module's tests) is the closed form
 *      T = [1 + mV0a²/2]⁻¹.
 *
 * Reduces correctly to T = 1 whenever there is nothing to scatter off —
 * V0 = 0 (no barrier) or a = 0 (no width) — and R = 1 − T always holds
 * exactly, by construction, not approximately.
 */
export function transmission(E: number, V0: number, a: number, m = 1): number {
  if (E <= 0) return 0;
  if (a <= 0) return 1;
  const regime = scatteringRegime(E, V0);
  if (regime === "at-barrier-top") return 1 / (1 + (m * V0 * a * a) / 2);
  if (regime === "tunneling") {
    const kappa = Math.sqrt(2 * m * (V0 - E));
    const s = Math.sinh(kappa * a);
    return 1 / (1 + (V0 * V0 * s * s) / (4 * E * (V0 - E)));
  }
  const kp = Math.sqrt(2 * m * (E - V0));
  const s = Math.sin(kp * a);
  return 1 / (1 + (V0 * V0 * s * s) / (4 * E * (E - V0)));
}

/** R = 1 − T. Probability is conserved exactly, by this definition, not as an approximation to check. */
export function reflection(E: number, V0: number, a: number, m = 1): number {
  return 1 - transmission(E, V0, a, m);
}

export interface ScatteringCoefficients {
  /** Reflected amplitude (region I, x < 0). */
  r: Complex;
  /** Transmitted amplitude (region III, x > a). */
  t: Complex;
  /** Region II (0 ≤ x ≤ a) coefficients, in its own basis — e^{±κx} if tunneling, e^{±ik'x} if over-barrier. */
  A: Complex;
  B: Complex;
  /** Region I/III wavenumber, √(2mE). */
  k: number;
  /** Region II's own real parameter: κ (tunneling) or k' (over-barrier). */
  kappaOrKPrime: number;
  regime: ScatteringRegime;
}

/**
 * The full boundary-matched scattering state for a plane wave of unit
 * incident amplitude, from solving ψ and ψ′ continuity at x = 0 and x = a
 * exactly (closed form, not a numerical solver) in both regimes. At the
 * barrier top, E is nudged by a relative 10⁻⁶ to the over-barrier side
 * purely so the *wavefunction shape* has something non-singular to draw —
 * `transmission` above never uses this nudge, and reports the exact T at
 * E = V0 directly.
 */
export function scatteringCoefficients(E: number, V0: number, a: number, m = 1): ScatteringCoefficients {
  const regime = scatteringRegime(E, V0);
  const effectiveE = regime === "at-barrier-top" ? V0 * (1 + 1e-6) + 1e-9 : E;
  const k = Math.sqrt(2 * m * E);
  if (effectiveE < V0) {
    const kappa = Math.sqrt(2 * m * (V0 - effectiveE));
    const s = Math.sinh(kappa * a);
    const c = Math.cosh(kappa * a);
    const denomCoef = (kappa * kappa - k * k) / (2 * k * kappa);
    const t = cDiv({ re: 1, im: 0 }, { re: c, im: denomCoef * s });
    const r = cMul(t, { re: 0, im: (-s * (k * k + kappa * kappa)) / (2 * k * kappa) });
    const A = cScale(cMul(t, { re: 1, im: k / kappa }), Math.exp(-kappa * a) / 2);
    const B = cScale(cMul(t, { re: 1, im: -k / kappa }), Math.exp(kappa * a) / 2);
    return { r, t, A, B, k, kappaOrKPrime: kappa, regime: "tunneling" };
  }
  const kp = Math.sqrt(2 * m * (effectiveE - V0));
  const s = Math.sin(kp * a);
  const c = Math.cos(kp * a);
  const t = cDiv({ re: 1, im: 0 }, { re: c, im: (-s * (k * k + kp * kp)) / (2 * k * kp) });
  const r = cMul(t, { re: 0, im: (-s * (k * k - kp * kp)) / (2 * k * kp) });
  const A = cMul(cScale(t, (1 + k / kp) / 2), cExpI(-kp * a));
  const B = cMul(cScale(t, (1 - k / kp) / 2), cExpI(kp * a));
  return { r, t, A, B, k, kappaOrKPrime: kp, regime: "over-barrier" };
}

/** ψ(x) across all three regions, from a solved `ScatteringCoefficients`. */
export function psiScattering(coeffs: ScatteringCoefficients, a: number, x: number): Complex {
  if (x < 0) {
    return cAdd(cExpI(coeffs.k * x), cMul(coeffs.r, cExpI(-coeffs.k * x)));
  }
  if (x <= a) {
    return coeffs.regime === "tunneling"
      ? cAdd(cScale(coeffs.A, Math.exp(coeffs.kappaOrKPrime * x)), cScale(coeffs.B, Math.exp(-coeffs.kappaOrKPrime * x)))
      : cAdd(cMul(coeffs.A, cExpI(coeffs.kappaOrKPrime * x)), cMul(coeffs.B, cExpI(-coeffs.kappaOrKPrime * x)));
  }
  return cMul(coeffs.t, cExpI(coeffs.k * (x - a)));
}

export interface BarrierSample {
  x: number;
  potential: number;
  re: number;
  im: number;
  density: number;
}

/** The potential and |ψ|² across [xMin, xMax], spanning the barrier at [0, a]. */
export function sampleBarrierWave(params: BarrierParams, xMin: number, xMax: number, points = 320): BarrierSample[] {
  const coeffs = scatteringCoefficients(params.E, params.V0, params.a, params.m);
  const out: BarrierSample[] = [];
  for (let i = 0; i <= points; i++) {
    const x = xMin + (i / points) * (xMax - xMin);
    const psi = psiScattering(coeffs, params.a, x);
    const potential = x >= 0 && x <= params.a ? params.V0 : 0;
    out.push({ x, potential, re: psi.re, im: psi.im, density: cAbs2(psi) });
  }
  return out;
}

/* ───────────────────────── D. Measurement & probability ───────────────── */

/**
 * mulberry32 — a small, deterministic 32-bit PRNG: the same seed always
 * produces the same sequence of draws, in this engine or any other
 * implementation of it, which is what "reproducible" means here (not just
 * "the same on this machine"). Not cryptographic; nothing here needs it
 * to be.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * One rejection-sampled position from |ψₙ(x)|² on [0, L]: a candidate x is
 * drawn uniformly, then accepted with probability density(x)/maxDensity.
 * The maximum of sin² is exactly 1, so the envelope 2/L is exact — not an
 * estimate — and every accepted sample is distributed exactly as |ψₙ|²,
 * not merely approximately. Two draws from `rng` per attempt, so the
 * number of `rng` calls (and therefore the exact sequence of positions, for
 * a fixed seed) is itself deterministic only up to how many attempts
 * rejection takes — which is why reproducibility is checked by comparing
 * two full runs of the same seed, not by assuming a fixed call count.
 */
export function sampleOnePosition(n: number, L: number, rng: () => number): number {
  const maxDensity = 2 / L;
  for (let attempt = 0; attempt < 10000; attempt++) {
    const x = rng() * L;
    const density = eigenfunction(n, L, x) ** 2;
    if (rng() * maxDensity <= density) return x;
  }
  // Not reachable in practice (acceptance probability is never below ~0,
  // and the loop above already succeeds within a handful of attempts on
  // average) — a defined fallback rather than an unbounded loop.
  return L / 2;
}

/** `count` reproducible measurement positions, drawn in sequence from one seeded generator. */
export function sampleMeasurements(n: number, L: number, seed: number, count: number): number[] {
  const rng = mulberry32(seed);
  const out: number[] = [];
  for (let i = 0; i < count; i++) out.push(sampleOnePosition(n, L, rng));
  return out;
}

export interface HistogramBin {
  x0: number;
  x1: number;
  count: number;
  /** count / (total samples × bin width) — comparable directly to |ψₙ(x)|². */
  density: number;
}

/** `samples` binned into `bins` equal-width bars over [0, L], each carrying its own empirical density for direct comparison with the theoretical curve. */
export function histogram(samples: number[], L: number, bins = 24): HistogramBin[] {
  const width = L / bins;
  const counts = new Array(bins).fill(0) as number[];
  for (const x of samples) {
    let i = Math.floor(x / width);
    if (i < 0) i = 0;
    if (i >= bins) i = bins - 1;
    counts[i]++;
  }
  return counts.map((count, i) => ({
    x0: i * width,
    x1: (i + 1) * width,
    count,
    density: samples.length > 0 ? count / (samples.length * width) : 0,
  }));
}
