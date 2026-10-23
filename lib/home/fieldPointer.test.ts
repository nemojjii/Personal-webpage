import assert from "node:assert/strict";
import { test } from "node:test";

import { capSpeed, easeTo, FLOW_DEFORM_DEFAULTS, flowDisplace, gaussianWeight, subdivideAndFlow } from "./fieldPointer.ts";

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

/* ─────────────────────────────── flowDisplace ────────────────────────────── */

test("flowDisplace: unchanged when influence is 0", () => {
  const p = flowDisplace(10, 20, 15, 25, 100, 0, 0);
  assert.deepEqual(p, { x: 10, y: 20 });
});

test("flowDisplace: unchanged when the pointer isn't moving, however close or long it has been there", () => {
  // The defining difference from the retired radial model: sitting still
  // leaves nothing to push with, at the pointer's exact position or anywhere else.
  for (const [x, y] of [[0, 0], [50, 0], [-30, 40]] as const) {
    const p = flowDisplace(x, y, 0, 0, 0, 0, 1);
    assert.deepEqual(p, { x, y });
  }
});

test("flowDisplace: pushes toward the velocity's direction, not away from the pointer", () => {
  // A point due *west* of the pointer, with the pointer moving *east* (vx > 0),
  // should move further east too — toward (vx, vy), never away from (px, py).
  const p = flowDisplace(-30, 0, 0, 0, 300, 0, 1);
  assert.ok(p.x > -30);
  close(p.y, 0, 1e-6);
});

test("flowDisplace: every point within reach moves the *same* direction for a given velocity", () => {
  const vx = 120, vy = -40;
  const dirOf = (p: { x: number; y: number }) => Math.atan2(p.y, p.x);
  const targetDir = Math.atan2(vy, vx);
  for (const [x, y] of [[40, 0], [0, 40], [-40, 20], [20, -40]] as const) {
    const before = { x, y };
    const after = flowDisplace(x, y, 0, 0, vx, vy, 1);
    const moved = { x: after.x - before.x, y: after.y - before.y };
    if (Math.hypot(moved.x, moved.y) < 1e-6) continue; // outside the envelope — no direction to compare
    close(dirOf(moved), targetDir, 1e-6);
  }
});

test("flowDisplace: displacement is bounded by maxDisplacement · influence at any distance or speed", () => {
  const params = { sigma: 60, strength: 15, maxDisplacement: 18, maxSpeed: 500 };
  for (const influence of [0.25, 0.6, 1]) {
    for (const d of [1, 10, 50, 150, 500]) {
      for (const speed of [10, 500, 5000]) {
        const p = flowDisplace(d, 0, 0, 0, speed, 0, influence, params);
        const actual = Math.hypot(p.x - d, p.y - 0);
        assert.ok(actual <= params.maxDisplacement * influence + 1e-9);
      }
    }
  }
});

test("flowDisplace: speed above maxSpeed pushes no harder than maxSpeed itself (saturates, does not grow further)", () => {
  const params = { sigma: 200, maxDisplacement: 20, maxSpeed: 300 };
  const atMax = flowDisplace(0, 0, 0, 0, 300, 0, 1, params);
  const wayOver = flowDisplace(0, 0, 0, 0, 5000, 0, 1, params);
  close(Math.hypot(atMax.x, atMax.y), Math.hypot(wayOver.x, wayOver.y), 1e-6);
});

test("flowDisplace: negligible far beyond sigma, for any influence or speed", () => {
  const params = { sigma: 30, maxDisplacement: 20, maxSpeed: 500 };
  const p = flowDisplace(1000, 1000, 0, 0, 500, 0, 1, params);
  close(p.x, 1000, 1e-6);
  close(p.y, 1000, 1e-6);
});

test("flowDisplace: scales linearly with influence at fixed position and velocity", () => {
  const params = { sigma: 200, maxDisplacement: 20, maxSpeed: 500 };
  const half = flowDisplace(30, 0, 0, 0, 200, 0, 0.5, params);
  const full = flowDisplace(30, 0, 0, 0, 200, 0, 1, params);
  close((full.x - 30) / 2, half.x - 30, 1e-9);
});

test("flowDisplace: never leaves a visible static dent — zero velocity gives zero displacement everywhere, unlike a radial push", () => {
  const params = FLOW_DEFORM_DEFAULTS;
  let maxDisp = 0;
  for (let x = -300; x <= 300; x += 20) {
    for (let y = -300; y <= 300; y += 20) {
      const p = flowDisplace(x, y, 0, 0, 0, 0, 1, params);
      maxDisp = Math.max(maxDisp, Math.hypot(p.x - x, p.y - y));
    }
  }
  assert.equal(maxDisp, 0);
});

/* ────────────────────────────────── capSpeed ─────────────────────────────── */

test("capSpeed: leaves a velocity at or under the cap unchanged", () => {
  assert.deepEqual(capSpeed(100, 0, 500), { vx: 100, vy: 0 });
  assert.deepEqual(capSpeed(0, 0, 500), { vx: 0, vy: 0 });
});

test("capSpeed: rescales a velocity over the cap down to exactly the cap, preserving direction", () => {
  const { vx, vy } = capSpeed(800, 600, 500); // 3-4-5 triangle, |v| = 1000
  close(Math.hypot(vx, vy), 500, 1e-9);
  close(vx / vy, 800 / 600, 1e-9); // same direction
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

/* ───────────────────────────── subdivideAndFlow ──────────────────────────── */

test("subdivideAndFlow: a single displaced point when the segment is far from the pointer", () => {
  const params = { sigma: 60, maxDisplacement: 15, maxSpeed: 500 };
  const pts = subdivideAndFlow({ x: 0, y: 500 }, { x: 10, y: 500 }, 0, 0, 300, 0, 1, params);
  assert.equal(pts.length, 1);
  const expected = flowDisplace(10, 500, 0, 0, 300, 0, 1, params);
  close(pts[0].x, expected.x);
  close(pts[0].y, expected.y);
});

test("subdivideAndFlow: a single unchanged point when the pointer isn't moving, regardless of distance", () => {
  const pts = subdivideAndFlow({ x: -10, y: 2 }, { x: 10, y: 2 }, 0, 0, 0, 0, 1);
  assert.deepEqual(pts, [{ x: 10, y: 2 }]);
});

test("subdivideAndFlow: subdivides (more than one point) when a moving pointer's segment passes close to it", () => {
  const params = FLOW_DEFORM_DEFAULTS;
  const pts = subdivideAndFlow({ x: -10, y: 2 }, { x: 10, y: 2 }, 0, 0, 300, 0, 1, params);
  assert.ok(pts.length > 1, `expected subdivision, got ${pts.length} point(s)`);
  assert.ok(pts.length <= 16, "capped at 16 extra samples");
});

test("subdivideAndFlow: the last sample always lands exactly on flowDisplace(to, …)", () => {
  const params = FLOW_DEFORM_DEFAULTS;
  for (const [from, to] of [
    [{ x: -10, y: 2 }, { x: 10, y: 2 }],
    [{ x: 300, y: 300 }, { x: 310, y: 305 }],
  ] as const) {
    const pts = subdivideAndFlow(from, to, 0, 0, 150, 80, 1, params);
    const expected = flowDisplace(to.x, to.y, 0, 0, 150, 80, 1, params);
    close(pts[pts.length - 1].x, expected.x);
    close(pts[pts.length - 1].y, expected.y);
  }
});

test("subdivideAndFlow: every returned point is finite", () => {
  const params = FLOW_DEFORM_DEFAULTS;
  for (const h of [0, 1, 2, 5, 50]) {
    const pts = subdivideAndFlow({ x: -50, y: h }, { x: 50, y: h }, 0, 0, 400, -200, 1, params);
    for (const p of pts) {
      assert.equal(Number.isFinite(p.x), true);
      assert.equal(Number.isFinite(p.y), true);
    }
  }
});

/* ───────────────────────────────── defaults ─────────────────────────────── */

test("FLOW_DEFORM_DEFAULTS: a reasonable, bounded interaction", () => {
  assert.ok(FLOW_DEFORM_DEFAULTS.sigma > 0);
  assert.ok(FLOW_DEFORM_DEFAULTS.maxDisplacement > 0 && FLOW_DEFORM_DEFAULTS.maxDisplacement < 50);
  assert.ok(FLOW_DEFORM_DEFAULTS.maxSpeed > 0);
});
