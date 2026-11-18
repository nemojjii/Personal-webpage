import assert from "node:assert/strict";
import { test } from "node:test";

import {
  drivenDisplacement,
  drivenPressure,
  nearestMode,
  resonanceGain,
  resonantLength,
  speedOfSound,
  stringSpeed,
  tension,
  wavelengthOf,
  waveNumber,
} from "./standingWaves.ts";

test("tension: F = mg", () => {
  assert.equal(tension(0.1, 10), 1);
});

test("stringSpeed: c = sqrt(F/rho)", () => {
  const c = stringSpeed(0.1, 0.0004, 10); // F=1N, rho=4e-4 -> c=50
  assert.ok(Math.abs(c - 50) < 1e-9);
});

test("resonantLength and nearestMode are inverse at integer n", () => {
  const lambda = 0.8;
  for (let n = 1; n <= 6; n++) {
    const L = resonantLength(n, lambda);
    assert.equal(nearestMode(L, lambda), n);
  }
});

test("drivenDisplacement: always zero at the clamped end x=L, for any L", () => {
  const k = waveNumber(stringSpeed(0.15), 120);
  for (const L of [0.3, 0.57, 0.912, 1.4]) {
    assert.ok(Math.abs(drivenDisplacement(L, L, k)) < 1e-9);
  }
});

test("drivenDisplacement: at the driven end x=0, amplitude is exactly 1 away from resonance", () => {
  const k = waveNumber(stringSpeed(0.15), 120);
  const lambda = (2 * Math.PI) / k;
  // Half-way between two resonant lengths -- as far from resonance as possible.
  const L = resonantLength(3, lambda) + lambda / 4;
  assert.ok(Math.abs(Math.abs(drivenDisplacement(0, L, k)) - 1) < 1e-6);
});

test("drivenPressure is pi/2 out of spatial phase with drivenDisplacement at the clamped end", () => {
  // u(L)=sin(0)=0 (node); p(L)=cos(0)/sin(kL) is the pattern's largest value (antinode).
  const k = waveNumber(stringSpeed(0.2), 120);
  const lambda = (2 * Math.PI) / k;
  const L = resonantLength(4, lambda);
  assert.ok(Math.abs(drivenDisplacement(L, L, k)) < 1e-6);
  assert.ok(Math.abs(drivenPressure(L, L, k)) > 1); // amplified near resonance, not near zero
});

test("resonanceGain grows large near a resonant length and stays near 1 away from one", () => {
  const k = waveNumber(stringSpeed(0.15), 120);
  const lambda = (2 * Math.PI) / k;
  const onResonance = resonantLength(5, lambda);
  const offResonance = resonantLength(5, lambda) + lambda / 4;
  assert.ok(resonanceGain(onResonance, k) > 20);
  assert.ok(Math.abs(resonanceGain(offResonance, k) - 1) < 1e-6);
});

test("speedOfSound: c(22C) matches the handout's room-temperature figure", () => {
  assert.ok(Math.abs(speedOfSound(22) - 344.6) < 1e-9);
});

test("wavelengthOf: c = f*lambda, inverted", () => {
  assert.ok(Math.abs(wavelengthOf(340, 1000) - 0.34) < 1e-9);
});
