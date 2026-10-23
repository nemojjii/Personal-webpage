import assert from "node:assert/strict";
import { test } from "node:test";

import {
  FOURIER_DEFAULTS,
  FOURIER_MAX_N,
  cloneParams,
  componentsAt,
  harmonicFrequency,
  maxActiveAmplitude,
  period,
  pureSineParams,
  sampleTimeDomain,
  sawtoothWaveParams,
  spectrum,
  squareWaveParams,
  synthesize,
  type FourierParams,
} from "./fourier.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

function single(amplitude: number, f0: number, phase: number, n = 1): FourierParams {
  const amplitudes = new Array(FOURIER_MAX_N).fill(0);
  const phases = new Array(FOURIER_MAX_N).fill(0);
  amplitudes[n - 1] = amplitude;
  phases[n - 1] = phase;
  return { n, f0, amplitudes, phases };
}

test("harmonicFrequency: the n-th harmonic sits at n·f0", () => {
  assert.equal(harmonicFrequency(1, 1), 1);
  assert.equal(harmonicFrequency(2, 3), 6);
  assert.equal(harmonicFrequency(0.5, 4), 2);
  assert.equal(harmonicFrequency(2, 1), 2); // harmonic 1 IS the fundamental, not an offset from it
});

test("period: 1/f0, undefined at f0 = 0 (no period to speak of)", () => {
  assert.equal(period(1), 1);
  assert.equal(period(2), 0.5);
  assert.equal(period(0), undefined);
});

test("synthesize: a single unit harmonic reproduces a plain sine exactly", () => {
  const p = single(1, 1, 0);
  // sin(2π·1·1·t) at the quarter, half and three-quarter period of a 1 Hz tone.
  assert.ok(close(synthesize(p, 0), 0));
  assert.ok(close(synthesize(p, 0.25), 1)); // sin(π/2)
  assert.ok(close(synthesize(p, 0.5), 0, 1e-9)); // sin(π)
  assert.ok(close(synthesize(p, 0.75), -1)); // sin(3π/2)
});

test("synthesize: superposition is linear — two harmonics sum pointwise", () => {
  const a = single(1, 1, 0, 1);
  const b = single(0.5, 1, 0, 2);
  const combined: FourierParams = {
    n: 2,
    f0: 1,
    amplitudes: [1, 0.5, 0, 0, 0, 0, 0, 0],
    phases: [0, 0, 0, 0, 0, 0, 0, 0],
  };
  for (const t of [0, 0.1, 0.37, 1.2345]) {
    assert.ok(close(synthesize(combined, t), synthesize(a, t) + synthesize(b, t)));
  }
});

test("synthesize: a phase of π exactly inverts a harmonic (sin(θ+π) = −sin θ)", () => {
  const plain = single(1, 1, 0);
  const shifted = single(1, 1, Math.PI);
  for (const t of [0, 0.123, 0.5, 0.9]) {
    assert.ok(close(synthesize(shifted, t), -synthesize(plain, t)));
  }
});

test("synthesize: zero amplitude contributes nothing, at any phase", () => {
  for (const phase of [0, 1, Math.PI, -2]) {
    const p = single(0, 1, phase);
    assert.ok(close(synthesize(p, 0.37), 0));
  }
});

test("harmonic count (n): only the first n harmonics are summed, regardless of what is stored beyond it", () => {
  const p: FourierParams = {
    n: 2,
    f0: 1,
    amplitudes: [1, 1, 1, 1, 0, 0, 0, 0], // harmonics 3, 4 have real amplitudes but are inactive
    phases: [0, 0, 0, 0, 0, 0, 0, 0],
  };
  const expected = synthesize({ ...p, n: 2 }, 0.2);
  const manual = Math.sin(2 * Math.PI * 1 * 1 * 0.2) + 1 * Math.sin(2 * Math.PI * 2 * 1 * 0.2);
  assert.ok(close(expected, manual));

  // Raising n must pick up the previously-inactive, already-stored harmonics
  // unchanged — changing the count never alters the stored values themselves.
  const raised = { ...p, n: 4 };
  assert.deepEqual(raised.amplitudes, p.amplitudes);
  assert.ok(!close(synthesize(raised, 0.2), synthesize(p, 0.2)), "raising n must change the sum here");
});

test("componentsAt: returns exactly n components, each the lone harmonic's own value", () => {
  const p: FourierParams = {
    n: 3,
    f0: 1,
    amplitudes: [1, 0.5, 0.25, 9, 9, 9, 9, 9],
    phases: [0, 0, 0, 0, 0, 0, 0, 0],
  };
  const c = componentsAt(p, 0.3);
  assert.equal(c.length, 3);
  assert.ok(close(c[0], Math.sin(2 * Math.PI * 1 * 1 * 0.3)));
  assert.ok(close(c[1], 0.5 * Math.sin(2 * Math.PI * 2 * 1 * 0.3)));
  assert.ok(close(c[2], 0.25 * Math.sin(2 * Math.PI * 3 * 1 * 0.3)));
  assert.ok(close(c.reduce((s, v) => s + v, 0), synthesize(p, 0.3)));
});

test("spectrum: one line per active harmonic, frequency = harmonic·f0, amplitude/phase as entered", () => {
  const p: FourierParams = {
    n: 3,
    f0: 2,
    amplitudes: [1, 0.5, 0.25, 7, 7, 7, 7, 7], // beyond n=3: must not appear
    phases: [0.1, 0.2, 0.3, 5, 5, 5, 5, 5],
  };
  const lines = spectrum(p);
  assert.equal(lines.length, 3);
  assert.deepEqual(
    lines.map((l) => l.harmonic),
    [1, 2, 3],
  );
  assert.deepEqual(
    lines.map((l) => l.frequency),
    [2, 4, 6],
  );
  assert.deepEqual(
    lines.map((l) => l.amplitude),
    [1, 0.5, 0.25],
  );
  assert.ok(close(lines[0].phase, 0.1) && close(lines[1].phase, 0.2) && close(lines[2].phase, 0.3));
});

test("maxActiveAmplitude: ignores inactive harmonics and takes the magnitude", () => {
  const p: FourierParams = {
    n: 2,
    f0: 1,
    amplitudes: [0.3, -0.9, 50, 50, 0, 0, 0, 0],
    phases: [0, 0, 0, 0, 0, 0, 0, 0],
  };
  assert.equal(maxActiveAmplitude(p), 0.9);
});

test("squareWaveParams: only odd harmonics, amplitude exactly 4/(nπ), even harmonics exactly zero", () => {
  const p = squareWaveParams(1, 8);
  assert.equal(p.n, 8);
  for (let n = 1; n <= 8; n++) {
    const a = p.amplitudes[n - 1];
    if (n % 2 === 1) assert.ok(close(a, 4 / (Math.PI * n)), `harmonic ${n}`);
    else assert.equal(a, 0, `harmonic ${n} (even) must be exactly zero`);
    assert.equal(p.phases[n - 1], 0);
  }
});

test("squareWaveParams: respects a smaller maxN (truncated series)", () => {
  const p = squareWaveParams(1, 3);
  assert.equal(p.n, 3);
  assert.ok(close(p.amplitudes[0], 4 / Math.PI));
  assert.equal(p.amplitudes[1], 0);
  assert.ok(close(p.amplitudes[2], 4 / (3 * Math.PI)));
  // Harmonics beyond maxN are zeroed even though the array is still length 8.
  assert.equal(p.amplitudes[6], 0);
});

test("sawtoothWaveParams: every harmonic present, amplitude 2/(nπ), sign carried as phase 0 or π", () => {
  const p = sawtoothWaveParams(1, 8);
  assert.equal(p.n, 8);
  for (let n = 1; n <= 8; n++) {
    assert.ok(close(p.amplitudes[n - 1], 2 / (Math.PI * n)), `amplitude at harmonic ${n}`);
    const expectedPhase = n % 2 === 0 ? Math.PI : 0;
    assert.equal(p.phases[n - 1], expectedPhase, `phase at harmonic ${n}`);
  }
});

test("sawtoothWaveParams: the encoded sign matches the signed-coefficient series at a sample point", () => {
  const p = sawtoothWaveParams(1, 8);
  const t = 0.1234;
  const viaModel = synthesize(p, t);
  let viaSignedSeries = 0;
  for (let nHarm = 1; nHarm <= 8; nHarm++) {
    const sign = nHarm % 2 === 0 ? -1 : 1;
    viaSignedSeries += sign * (2 / (Math.PI * nHarm)) * Math.sin(2 * Math.PI * nHarm * 1 * t);
  }
  assert.ok(close(viaModel, viaSignedSeries));
});

test("pureSineParams: exactly one active harmonic, unit amplitude, zero phase", () => {
  const p = pureSineParams(1.5);
  assert.equal(p.n, 1);
  assert.equal(p.f0, 1.5);
  assert.equal(p.amplitudes[0], 1);
  assert.equal(p.phases[0], 0);
  assert.ok(p.amplitudes.slice(1).every((a) => a === 0));
});

test("cloneParams: an independent copy — mutating it never touches the shared defaults", () => {
  const c = cloneParams(FOURIER_DEFAULTS);
  c.amplitudes[0] = 999;
  c.phases[0] = 999;
  c.n = 1;
  assert.equal(FOURIER_DEFAULTS.amplitudes[0], 1, "defaults amplitude must be unchanged");
  assert.equal(FOURIER_DEFAULTS.phases[0], 0, "defaults phase must be unchanged");
  assert.equal(FOURIER_DEFAULTS.n, 3, "defaults n must be unchanged");
});

test("cloneParams: reset behaviour — cloning the defaults twice gives equal but distinct objects", () => {
  const a = cloneParams();
  const b = cloneParams();
  assert.deepEqual(a, b);
  assert.notEqual(a.amplitudes, b.amplitudes, "arrays must not be shared references");
});

test("sampleTimeDomain: spans exactly `periods` fundamental periods and starts at t = 0", () => {
  const p = single(1, 2, 0); // f0 = 2 Hz, period 0.5 s
  const samples = sampleTimeDomain(p, 2, 50);
  assert.ok(close(samples[0].t, 0));
  assert.ok(close(samples[samples.length - 1].t, 2 * 0.5)); // 2 periods
  // Every sample's `sum` must equal synthesize() at that same t (no divergent code paths).
  for (const s of samples.filter((_, i) => i % 17 === 0)) {
    assert.ok(close(s.sum, synthesize(p, s.t)));
  }
});

test("sampleTimeDomain: falls back to a 1-second window when f0 = 0 (no period to multiply)", () => {
  const p: FourierParams = { n: 1, f0: 0, amplitudes: [1, 0, 0, 0, 0, 0, 0, 0], phases: [0, 0, 0, 0, 0, 0, 0, 0] };
  const samples = sampleTimeDomain(p, 2, 10);
  assert.ok(close(samples[samples.length - 1].t, 2)); // 2 × the 1-second fallback
});

test("FOURIER_DEFAULTS: matches the stated initial condition — 3 harmonics, 1 Hz fundamental", () => {
  assert.equal(FOURIER_DEFAULTS.n, 3);
  assert.equal(FOURIER_DEFAULTS.f0, 1);
  assert.equal(FOURIER_DEFAULTS.amplitudes.length, FOURIER_MAX_N);
  assert.equal(FOURIER_DEFAULTS.phases.length, FOURIER_MAX_N);
});
