import assert from "node:assert/strict";
import { test } from "node:test";

import {
  EARTH,
  GM,
  THIRD_LAW_SLOPE,
  circularSpeed,
  escapeSpeed,
  impactSpeed,
  measureOrbit,
  orbitalElements,
  simulate,
  specificEnergy,
  thirdLawFit,
} from "./gravitation.ts";

test("escapeSpeed: exactly sqrt(2) times circularSpeed at the same radius", () => {
  const r = 3 * EARTH.R;
  assert.ok(Math.abs(escapeSpeed(r) / circularSpeed(r) - Math.SQRT2) < 1e-9);
});

test("specificEnergy: zero at the escape speed, negative below it, positive above it", () => {
  const r = 2 * EARTH.R;
  const vEsc = escapeSpeed(r);
  assert.ok(Math.abs(specificEnergy(r, 0, 0, vEsc)) < 1e-6);
  assert.ok(specificEnergy(r, 0, 0, vEsc * 0.9) < 0);
  assert.ok(specificEnergy(r, 0, 0, vEsc * 1.1) > 0);
});

test("orbitalElements: a circular orbit has eccentricity 0 and apogee = perigee = r", () => {
  const r = 4 * EARTH.R;
  const el = orbitalElements(0, r, circularSpeed(r), 0);
  assert.ok(el.bound);
  assert.ok(Math.abs(el.eccentricity!) < 1e-9);
  assert.ok(Math.abs(el.apogee! - r) / r < 1e-9);
  assert.ok(Math.abs(el.perigee! - r) / r < 1e-9);
});

test("orbitalElements: reports unbound for a speed at or above escape", () => {
  const r = 3 * EARTH.R;
  const el = orbitalElements(r, 0, 0, escapeSpeed(r));
  assert.equal(el.bound, false);
});

test("impactSpeed: matches energy conservation for a straight radial fall", () => {
  const r0 = 2 * EARTH.R;
  const v = impactSpeed(r0, 0, 0, 0)!;
  const energyAtStart = -GM / r0;
  const energyAtSurface = 0.5 * v * v - GM / EARTH.R;
  assert.ok(Math.abs(energyAtStart - energyAtSurface) / Math.abs(energyAtStart) < 1e-9);
});

test("simulate: a near-circular orbit stays close to its starting radius", () => {
  const r = 3 * EARTH.R;
  const v = circularSpeed(r);
  const period = 2 * Math.PI * Math.sqrt((r * r * r) / GM);
  const traj = simulate(0, r, v, 0, period, 2000);
  const measured = measureOrbit(traj);
  assert.ok((measured.apogee - measured.perigee) / r < 1e-3);
  assert.ok(measured.period !== undefined && Math.abs(measured.period - period) / period < 1e-3);
});

test("simulate: a steep fall from rest reaches the surface and stops there", () => {
  const traj = simulate(3 * EARTH.R, 0, 0, 0, 20000, 4000);
  assert.ok(traj.impact !== undefined);
  assert.ok(Math.abs(Math.hypot(traj.impact!.x, traj.impact!.y) - EARTH.R) / EARTH.R < 1e-6);
});

test("measureOrbit: a simulated circular orbit matches the exact two-body prediction", () => {
  const r = 5 * EARTH.R;
  const v = circularSpeed(r);
  const period = 2 * Math.PI * Math.sqrt((r * r * r) / GM);
  const traj = simulate(0, r, v, 0, period, 2500);
  const measured = measureOrbit(traj);
  const theory = orbitalElements(0, r, v, 0);
  assert.ok(Math.abs(measured.semiMajorAxis - theory.semiMajorAxis!) / theory.semiMajorAxis! < 1e-3);
});

test("thirdLawFit: recovers the theoretical slope 4π²/GM from exact (a³, T²) pairs", () => {
  const radii = [2, 3, 5, 7].map((n) => n * EARTH.R);
  const points = radii.map((r) => {
    const a3 = r * r * r;
    const period = 2 * Math.PI * Math.sqrt(a3 / GM);
    return { a3, t2: period * period };
  });
  const { slope } = thirdLawFit(points);
  assert.ok(Math.abs(slope - THIRD_LAW_SLOPE) / THIRD_LAW_SLOPE < 1e-9);
});
