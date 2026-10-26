import assert from "node:assert/strict";
import { test } from "node:test";

import {
  BARRIER_DEFAULTS,
  WELL_DEFAULTS,
  beatAngularFrequencies,
  cAbs2,
  eigenfunction,
  energy,
  histogram,
  mulberry32,
  normalizationIntegral,
  normalizedWeights,
  overlapIntegral,
  psiAt,
  psiScattering,
  reflection,
  sampleBarrierWave,
  sampleEigenfunction,
  sampleMeasurements,
  sampleOnePosition,
  sampleSuperposition,
  scatteringCoefficients,
  scatteringRegime,
  transmission,
  type SuperpositionState,
} from "./quantum.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

/* ───────────────────────── A. Particle in a box ───────────────────────── */

test("eigenfunction: boundary conditions — psi_n(0) = psi_n(L) = 0 for every n", () => {
  const L = 1.7;
  for (let n = 1; n <= 6; n++) {
    assert.ok(close(eigenfunction(n, L, 0), 0));
    assert.ok(close(eigenfunction(n, L, L), 0));
  }
});

test("eigenfunction: zero outside the well", () => {
  assert.equal(eigenfunction(1, 1, -0.1), 0);
  assert.equal(eigenfunction(1, 1, 1.1), 0);
});

test("eigenfunction: normalization — integral of psi_n^2 over [0, L] is 1, for several n and L", () => {
  for (const L of [0.5, 1, 2.3]) {
    for (let n = 1; n <= 5; n++) {
      assert.ok(close(normalizationIntegral(n, L), 1, 1e-6), `n=${n} L=${L}`);
    }
  }
});

test("eigenfunction: orthogonality — integral of psi_n * psi_m over [0, L] is ~0 for n != m", () => {
  const L = 1.3;
  for (let n = 1; n <= 4; n++) {
    for (let m = 1; m <= 4; m++) {
      if (n === m) continue;
      assert.ok(close(overlapIntegral(n, m, L), 0, 1e-6), `n=${n} m=${m}`);
    }
  }
});

test("energy: quantized as n^2, and scales as 1/L^2 and 1/m", () => {
  const L = 1, m = 1;
  const E1 = energy(1, L, m);
  assert.ok(close(energy(2, L, m) / E1, 4)); // E_n ∝ n²
  assert.ok(close(energy(3, L, m) / E1, 9));
  assert.ok(close(energy(1, 2 * L, m) / E1, 0.25)); // E_n ∝ 1/L²
  assert.ok(close(energy(1, L, 2 * m) / E1, 0.5)); // E_n ∝ 1/m
});

test("energy: matches the closed form n^2 pi^2 / (2 m L^2) directly", () => {
  assert.ok(close(energy(1, 1, 1), Math.PI * Math.PI / 2));
  assert.ok(close(energy(2, 1, 1), 4 * Math.PI * Math.PI / 2));
});

test("sampleEigenfunction: probability density is non-negative everywhere, and equals psi^2", () => {
  const samples = sampleEigenfunction(3, 1.5, 100);
  for (const s of samples) {
    assert.ok(s.density >= 0, `density negative at x=${s.x}`);
    assert.ok(close(s.density, s.psi * s.psi));
  }
});

/* ─────────────────────── B. Superposition & time evolution ────────────── */

test("normalizedWeights: sum of |c_n|^2 is 1 regardless of the input amplitudes' own scale", () => {
  const terms = [
    { n: 1, amplitude: 3, phase: 0 },
    { n: 2, amplitude: 4, phase: 1.2 },
  ];
  const weights = normalizedWeights(terms);
  const total = weights.reduce((s, w) => s + cAbs2(w.c), 0);
  assert.ok(close(total, 1, 1e-9));
});

test("normalizedWeights: a single term normalizes to |c| = 1 regardless of its phase", () => {
  const weights = normalizedWeights([{ n: 1, amplitude: 5, phase: 2.1 }]);
  assert.ok(close(cAbs2(weights[0].c), 1));
});

test("psiAt / probability density: a single stationary eigenstate has time-independent density", () => {
  const state: SuperpositionState = { terms: [{ n: 2, amplitude: 1, phase: 0 }] };
  const well = WELL_DEFAULTS;
  const x = 0.37;
  const densities = [0, 0.1, 1, 3.7, 100].map((t) => cAbs2(psiAt(state, well, x, t)));
  for (const d of densities) assert.ok(close(d, densities[0], 1e-9));
  // And it matches the bare eigenfunction's own density, since |e^{-iEt}| = 1.
  assert.ok(close(densities[0], eigenfunction(2, well.L, x) ** 2, 1e-9));
});

test("psiAt / probability density: a genuine superposition's density is NOT time-independent", () => {
  const state: SuperpositionState = { terms: [{ n: 1, amplitude: 1, phase: 0 }, { n: 2, amplitude: 1, phase: 0 }] };
  const well = WELL_DEFAULTS;
  const x = 0.3; // off the node structure, where the cross term has room to move
  const d0 = cAbs2(psiAt(state, well, x, 0));
  const beatPeriod = (2 * Math.PI) / beatAngularFrequencies(state, well)[0];
  const dQuarter = cAbs2(psiAt(state, well, x, beatPeriod / 4));
  assert.ok(Math.abs(d0 - dQuarter) > 1e-3, "expected the superposition's density to change over time");
});

test("psiAt: normalized — integral of |Psi(x,t)|^2 over the well is 1, at several t", () => {
  const state: SuperpositionState = SUPERPOSITION_DEFAULTS_LIKE();
  const well = WELL_DEFAULTS;
  for (const t of [0, 0.5, 2.3]) {
    const samples = sampleSuperposition(state, well, t, 2000);
    // Simpson's rule over the sampled density.
    const h = well.L / 2000;
    let sum = samples[0].density + samples[samples.length - 1].density;
    for (let i = 1; i < 2000; i++) sum += (i % 2 === 0 ? 2 : 4) * samples[i].density;
    const integral = (h / 3) * sum;
    assert.ok(close(integral, 1, 1e-4), `t=${t}: integral=${integral}`);
  }
});
function SUPERPOSITION_DEFAULTS_LIKE(): SuperpositionState {
  return { terms: [{ n: 1, amplitude: 1, phase: 0 }, { n: 2, amplitude: 1, phase: 0.4 }] };
}

test("beatAngularFrequencies: empty for a single term (truly stationary — nothing to beat against)", () => {
  const state: SuperpositionState = { terms: [{ n: 3, amplitude: 1, phase: 0 }] };
  assert.deepEqual(beatAngularFrequencies(state, WELL_DEFAULTS), []);
});

test("beatAngularFrequencies: one entry for two terms, equal to |E2 - E1|", () => {
  const state: SuperpositionState = { terms: [{ n: 1, amplitude: 1, phase: 0 }, { n: 2, amplitude: 1, phase: 0 }] };
  const well = WELL_DEFAULTS;
  const freqs = beatAngularFrequencies(state, well);
  assert.equal(freqs.length, 1);
  assert.ok(close(freqs[0], Math.abs(energy(2, well.L, well.m) - energy(1, well.L, well.m))));
});

test("sampleSuperposition: density is non-negative everywhere", () => {
  const state: SuperpositionState = SUPERPOSITION_DEFAULTS_LIKE();
  const samples = sampleSuperposition(state, WELL_DEFAULTS, 0.73, 150);
  for (const s of samples) assert.ok(s.density >= -1e-12, `negative density at x=${s.x}`);
});

/* ─────────────────────────── C. Quantum tunneling ──────────────────────── */

test("transmission + reflection: conserve probability exactly, across both regimes", () => {
  for (const [E, V0, a] of [[0.5, 2, 1], [1, 2, 1], [3, 2, 1], [0.1, 1, 2]] as const) {
    assert.ok(close(transmission(E, V0, a) + reflection(E, V0, a), 1, 1e-12));
  }
});

test("transmission: reduces to 1 when there is no barrier (V0 = 0) or no width (a = 0)", () => {
  assert.ok(close(transmission(1, 0, 1), 1));
  assert.ok(close(transmission(1, 2, 0), 1));
});

test("transmission: tunneling regime (E < V0) is strictly between 0 and 1", () => {
  const T = transmission(0.5, 2, 1);
  assert.ok(T > 0 && T < 1);
});

test("transmission: over-barrier regime (E > V0) is NOT 1 — the barrier still partially reflects", () => {
  const T = transmission(3, 2, 1);
  assert.ok(T > 0 && T < 1, `expected 0 < T < 1 above the barrier, got ${T}`);
});

test("transmission: the exact barrier-top value (E = V0) matches the limit approached from both sides", () => {
  const V0 = 2, a = 1;
  const exact = transmission(V0, V0, a);
  const fromBelow = transmission(V0 - 1e-5, V0, a);
  const fromAbove = transmission(V0 + 1e-5, V0, a);
  assert.ok(close(exact, fromBelow, 1e-4));
  assert.ok(close(exact, fromAbove, 1e-4));
  // And matches the closed form 1 / (1 + m V0 a^2 / 2) directly.
  assert.ok(close(exact, 1 / (1 + (1 * V0 * a * a) / 2), 1e-9));
});

test("transmission: zero at E = 0 (nothing incident to transmit)", () => {
  assert.equal(transmission(0, 2, 1), 0);
});

test("scatteringRegime: classifies E relative to V0 correctly, including the barrier top", () => {
  assert.equal(scatteringRegime(1, 2), "tunneling");
  assert.equal(scatteringRegime(3, 2), "over-barrier");
  assert.equal(scatteringRegime(2, 2), "at-barrier-top");
});

test("scatteringCoefficients: |t|^2 matches transmission(), and |r|^2 + |t|^2 = 1, in both regimes", () => {
  for (const [E, V0, a] of [[0.5, 2, 1], [3, 2, 1]] as const) {
    const c = scatteringCoefficients(E, V0, a);
    assert.ok(close(cAbs2(c.t), transmission(E, V0, a), 1e-9));
    assert.ok(close(cAbs2(c.r) + cAbs2(c.t), 1, 1e-9));
  }
});

test("psiScattering: the wavefunction is continuous across both boundaries (x=0, x=a), in both regimes", () => {
  for (const [E, V0, a] of [[0.5, 2, 1], [3, 2, 1]] as const) {
    const c = scatteringCoefficients(E, V0, a);
    const eps = 1e-6;
    const left0 = psiScattering(c, a, -eps);
    const right0 = psiScattering(c, a, eps);
    assert.ok(close(left0.re, right0.re, 1e-4), `re continuity at 0, E=${E}`);
    assert.ok(close(left0.im, right0.im, 1e-4), `im continuity at 0, E=${E}`);
    const leftA = psiScattering(c, a, a - eps);
    const rightA = psiScattering(c, a, a + eps);
    assert.ok(close(leftA.re, rightA.re, 1e-4), `re continuity at a, E=${E}`);
    assert.ok(close(leftA.im, rightA.im, 1e-4), `im continuity at a, E=${E}`);
  }
});

test("sampleBarrierWave: density is non-negative everywhere, and the potential is V0 only inside the barrier", () => {
  const params = BARRIER_DEFAULTS;
  const samples = sampleBarrierWave(params, -2, params.a + 2, 200);
  for (const s of samples) {
    assert.ok(s.density >= -1e-9, `negative density at x=${s.x}`);
    if (s.x < 0 || s.x > params.a) assert.equal(s.potential, 0);
    else assert.equal(s.potential, params.V0);
  }
});

/* ───────────────────────── D. Measurement & probability ───────────────── */

test("mulberry32: the same seed produces the same sequence, deterministically", () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  const seqA = Array.from({ length: 20 }, () => a());
  const seqB = Array.from({ length: 20 }, () => b());
  assert.deepEqual(seqA, seqB);
});

test("mulberry32: draws land in [0, 1)", () => {
  const rng = mulberry32(7);
  for (let i = 0; i < 500; i++) {
    const v = rng();
    assert.ok(v >= 0 && v < 1, `out of range: ${v}`);
  }
});

test("sampleOnePosition: always within [0, L]", () => {
  const rng = mulberry32(1);
  for (let i = 0; i < 200; i++) {
    const x = sampleOnePosition(2, 1.7, rng);
    assert.ok(x >= 0 && x <= 1.7, `x=${x} out of [0, L]`);
  }
});

test("sampleMeasurements: reproducible — the same seed gives the exact same positions", () => {
  const a = sampleMeasurements(2, 1, 123, 50);
  const b = sampleMeasurements(2, 1, 123, 50);
  assert.deepEqual(a, b);
});

test("sampleMeasurements: a different seed gives a different sequence", () => {
  const a = sampleMeasurements(2, 1, 1, 50);
  const b = sampleMeasurements(2, 1, 2, 50);
  assert.notDeepEqual(a, b);
});

test("sampleMeasurements: the empirical histogram approaches the theoretical density for a large sample", () => {
  const n = 1, L = 1;
  const samples = sampleMeasurements(n, L, 99, 20000);
  const bins = histogram(samples, L, 10);
  for (const bin of bins) {
    const mid = (bin.x0 + bin.x1) / 2;
    const theoretical = eigenfunction(n, L, mid) ** 2;
    // Generous tolerance: this is a statistical comparison, not an exact one.
    assert.ok(Math.abs(bin.density - theoretical) < 0.25, `bin [${bin.x0.toFixed(2)},${bin.x1.toFixed(2)}): empirical=${bin.density.toFixed(3)} theoretical=${theoretical.toFixed(3)}`);
  }
});

test("histogram: bin counts sum to the total sample count", () => {
  const samples = sampleMeasurements(1, 1, 5, 500);
  const bins = histogram(samples, 1, 16);
  const total = bins.reduce((s, b) => s + b.count, 0);
  assert.equal(total, 500);
});

test("histogram: an empty sample set gives zero density everywhere, not NaN", () => {
  const bins = histogram([], 1, 8);
  for (const b of bins) assert.equal(b.density, 0);
});
