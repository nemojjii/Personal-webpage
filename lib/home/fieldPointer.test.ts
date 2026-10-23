import assert from "node:assert/strict";
import { test } from "node:test";

import { deformPoint, easeTo, gaussianWeight, POINTER_DEFORM_DEFAULTS, subdivideAndDeform } from "./fieldPointer.ts";

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

test("easeTo: frame-rate independent — many small steps vs few large steps covering the same total elapsed time converge to nearly the same value", () => {
  const tau = 0.08;
  const totalTime = 0.5;

  let fine = 0; // simulating ~120 fps: 60 steps of ~1/120 s
  for (let i = 0; i < 60; i++) fine = easeTo(fine, 1, totalTime / 60, tau);

  let coarse = 0; // simulating ~20 fps: 10 steps of 1/20 s
  for (let i = 0; i < 10; i++) coarse = easeTo(coarse, 1, totalTime / 10, tau);

  close(fine, coarse, 1e-3);
});

test("easeTo: converges arbitrarily close to a fixed (resting) target as iterations continue", () => {
  let v = -5; // start far from rest
  const target = 0;
  for (let i = 0; i < 500; i++) v = easeTo(v, target, 0.016, 0.1);
  close(v, target, 1e-6);
});

test("easeTo: never overshoots a fixed target, approaching monotonically from either side", () => {
  let fromBelow = 0;
  let prevBelow = fromBelow;
  let fromAbove = 10;
  let prevAbove = fromAbove;
  for (let i = 0; i < 50; i++) {
    fromBelow = easeTo(fromBelow, 5, 0.02, 0.1);
    assert.ok(fromBelow >= prevBelow && fromBelow <= 5);
    prevBelow = fromBelow;

    fromAbove = easeTo(fromAbove, 5, 0.02, 0.1);
    assert.ok(fromAbove <= prevAbove && fromAbove >= 5);
    prevAbove = fromAbove;
  }
});

/* ───────────────────────────── subdivideAndDeform ────────────────────────── */

test("subdivideAndDeform: a single deformed point when the segment is far from the pointer", () => {
  const params = { sigma: 60, strength: 15 };
  const pts = subdivideAndDeform({ x: 0, y: 500 }, { x: 10, y: 500 }, 0, 0, 1, params);
  assert.equal(pts.length, 1);
  close(pts[0].x, deformPoint(10, 500, 0, 0, 1, params).x);
  close(pts[0].y, deformPoint(10, 500, 0, 0, 1, params).y);
});

test("subdivideAndDeform: subdivides (more than one point) when the segment passes close to the pointer", () => {
  const params = { sigma: 200, strength: 20 };
  const pts = subdivideAndDeform({ x: -10, y: 2 }, { x: 10, y: 2 }, 0, 0, 1, params);
  assert.ok(pts.length > 1, `expected subdivision, got ${pts.length} point(s)`);
  assert.ok(pts.length <= 16, "capped at 16 extra samples");
});

test("subdivideAndDeform: the last sample always lands exactly on deformPoint(to, …)", () => {
  const params = { sigma: 200, strength: 20 };
  for (const [from, to] of [
    [{ x: -10, y: 2 }, { x: 10, y: 2 }],
    [{ x: 300, y: 300 }, { x: 310, y: 305 }],
  ] as const) {
    const pts = subdivideAndDeform(from, to, 0, 0, 1, params);
    const expected = deformPoint(to.x, to.y, 0, 0, 1, params);
    close(pts[pts.length - 1].x, expected.x);
    close(pts[pts.length - 1].y, expected.y);
  }
});

test("subdivideAndDeform: every returned point is finite", () => {
  const params = { sigma: 200, strength: 20 };
  for (const h of [0, 1, 2, 5, 50]) {
    const pts = subdivideAndDeform({ x: -50, y: h }, { x: 50, y: h }, 0, 0, 1, params);
    for (const p of pts) {
      assert.equal(Number.isFinite(p.x), true);
      assert.equal(Number.isFinite(p.y), true);
    }
  }
});

test("subdivideAndDeform: unaffected when influence is 0 — a single unchanged point", () => {
  const pts = subdivideAndDeform({ x: -10, y: 2 }, { x: 10, y: 2 }, 0, 0, 0);
  assert.deepEqual(pts, [{ x: 10, y: 2 }]);
});

test("subdivideAndDeform: measurably straightens the sharp turn a plain deform-and-lineTo would draw near a close pass", () => {
  // Reproduces the Phase 16.3 symptom directly: a nearly-straight true
  // curve passing a few pixels from the pointer, deformed either as three
  // bare points (the old behaviour) or via subdivideAndDeform between each
  // pair — the turning angle at the middle vertex should be smaller with
  // subdivision than without it.
  const params = { sigma: 200, strength: 20 };
  const px = 0, py = 0;
  const a = { x: -10, y: 2 };
  const b = { x: 0, y: 2 };
  const c = { x: 10, y: 2 };
  function turningAngleDeg(p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }) {
    const v1 = { x: p1.x - p0.x, y: p1.y - p0.y };
    const v2 = { x: p2.x - p1.x, y: p2.y - p1.y };
    const dot = v1.x * v2.x + v1.y * v2.y;
    const m = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y) || 1;
    return (Math.acos(Math.max(-1, Math.min(1, dot / m))) * 180) / Math.PI;
  }
  const bareAngle = turningAngleDeg(
    deformPoint(a.x, a.y, px, py, 1, params),
    deformPoint(b.x, b.y, px, py, 1, params),
    deformPoint(c.x, c.y, px, py, 1, params),
  );
  const ab = subdivideAndDeform(a, b, px, py, 1, params);
  const bc = subdivideAndDeform(b, c, px, py, 1, params);
  const subdivided = [deformPoint(a.x, a.y, px, py, 1, params), ...ab, ...bc];
  let worst = 0;
  for (let i = 1; i < subdivided.length - 1; i++) {
    worst = Math.max(worst, turningAngleDeg(subdivided[i - 1], subdivided[i], subdivided[i + 1]));
  }
  assert.ok(worst < bareAngle, `expected subdivision to reduce the worst turning angle (${worst.toFixed(1)} vs ${bareAngle.toFixed(1)})`);
});

/* ───────────────────────────────── defaults ─────────────────────────────── */

test("POINTER_DEFORM_DEFAULTS: a reasonable, bounded interaction", () => {
  assert.ok(POINTER_DEFORM_DEFAULTS.sigma > 0);
  assert.ok(POINTER_DEFORM_DEFAULTS.strength > 0 && POINTER_DEFORM_DEFAULTS.strength < 50);
});
