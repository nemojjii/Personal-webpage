import assert from "node:assert/strict";
import { test } from "node:test";

import { deformPoint, easeTo, gaussianWeight, POINTER_DEFORM_DEFAULTS } from "./fieldPointer.ts";

function close(a: number, b: number, eps = 1e-9) {
  assert.ok(Math.abs(a - b) < eps, `expected ${a} ≈ ${b} (±${eps})`);
}

/* ────────────────────────────── gaussianWeight ──────────────────────────── */

test("gaussianWeight: exactly 1 at d = 0", () => {
  close(gaussianWeight(0, 100), 1);
});

test("gaussianWeight: decreases monotonically with distance", () => {
  const sigma = 80;
  let prev = gaussianWeight(0, sigma);
  for (let d = 10; d <= 300; d += 10) {
    const w = gaussianWeight(d, sigma);
    assert.ok(w < prev, `expected weight to decrease at d=${d}`);
    assert.ok(w >= 0, "weight never negative");
    prev = w;
  }
});

test("gaussianWeight: effectively 0 far beyond sigma", () => {
  assert.ok(gaussianWeight(1000, 50) < 1e-10);
});

test("gaussianWeight: sigma = 0 is treated as no influence rather than divide-by-zero", () => {
  assert.equal(gaussianWeight(0, 0), 0);
  assert.equal(Number.isFinite(gaussianWeight(5, 0)), true);
});

/* ─────────────────────────────── deformPoint ────────────────────────────── */

test("deformPoint: unchanged when influence is 0", () => {
  const p = deformPoint(10, 20, 15, 25, 0);
  assert.deepEqual(p, { x: 10, y: 20 });
});

test("deformPoint: unchanged exactly at the pointer (d = 0) — no direction, no NaN", () => {
  const p = deformPoint(50, 50, 50, 50, 1);
  assert.deepEqual(p, { x: 50, y: 50 });
  assert.equal(Number.isFinite(p.x), true);
  assert.equal(Number.isFinite(p.y), true);
});

test("deformPoint: displacement is bounded by strength · influence at any distance", () => {
  const params = { sigma: 60, strength: 15 };
  for (const influence of [0.25, 0.6, 1]) {
    for (const d of [1, 10, 50, 150, 500]) {
      const p = deformPoint(d, 0, 0, 0, influence, params);
      const actualDisplacement = Math.hypot(p.x - d, p.y - 0);
      assert.ok(actualDisplacement <= params.strength * influence + 1e-9);
    }
  }
});

test("deformPoint: pushes directly away from the pointer", () => {
  // Pointer at origin, point due east: displacement must stay on the positive x-axis.
  const p = deformPoint(40, 0, 0, 0, 1, { sigma: 100, strength: 10 });
  assert.ok(p.x > 40);
  close(p.y, 0);
});

test("deformPoint: negligible far beyond sigma, for any influence", () => {
  const params = { sigma: 30, strength: 20 };
  const p = deformPoint(1000, 1000, 0, 0, 1, params);
  close(p.x, 1000, 1e-6);
  close(p.y, 1000, 1e-6);
});

test("deformPoint: scales linearly with influence at fixed position", () => {
  const params = { sigma: 80, strength: 10 };
  const half = deformPoint(30, 0, 0, 0, 0.5, params);
  const full = deformPoint(30, 0, 0, 0, 1, params);
  close((full.x - 30) / 2, half.x - 30, 1e-9);
});

/* ───────────────────────────────── easeTo ───────────────────────────────── */

test("easeTo: reaches the target exactly after infinite time (within float precision)", () => {
  const v = easeTo(0, 1, 100, 0.15);
  close(v, 1, 1e-9);
});

test("easeTo: moves toward, never past, the target in one step", () => {
  const v = easeTo(0, 1, 0.05, 0.15);
  assert.ok(v > 0 && v < 1);
});

test("easeTo: larger dt moves further toward the target than smaller dt", () => {
  const small = easeTo(0, 1, 0.01, 0.15);
  const large = easeTo(0, 1, 0.1, 0.15);
  assert.ok(large > small);
});

test("easeTo: dt = 0 leaves the value unchanged", () => {
  close(easeTo(0.3, 1, 0, 0.15), 0.3);
});

test("easeTo: tau <= 0 snaps immediately to the target", () => {
  assert.equal(easeTo(0, 1, 0.01, 0), 1);
});

/* ───────────────────────────────── defaults ─────────────────────────────── */

test("POINTER_DEFORM_DEFAULTS: a reasonable, bounded interaction", () => {
  assert.ok(POINTER_DEFORM_DEFAULTS.sigma > 0);
  assert.ok(POINTER_DEFORM_DEFAULTS.strength > 0 && POINTER_DEFORM_DEFAULTS.strength < 50);
});
