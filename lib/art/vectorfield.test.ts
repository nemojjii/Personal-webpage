import assert from "node:assert/strict";
import { test } from "node:test";

import {
  fullTrajectory,
  generateSeeds,
  INTEGRATION_DEFAULTS,
  integrateTrajectory,
  mulberry32,
  rk4Step,
  vectorAt,
  type FieldParams,
  type Point,
} from "./vectorfield.ts";

function close(a: number, b: number, eps = 1e-6) {
  assert.ok(Math.abs(a - b) < eps, `expected ${a} ≈ ${b} (±${eps})`);
}

/* ────────────────────────────── fields ─────────────────────────────────── */

test("vectorAt: spiral at a = 0 is a pure rotation, (-by, bx)", () => {
  const [vx, vy] = vectorAt({ kind: "spiral", a: 0, b: 1 }, 2, 3);
  close(vx, -3);
  close(vy, 2);
});

test("vectorAt: saddle scales each axis independently", () => {
  const [vx, vy] = vectorAt({ kind: "saddle", a: 2, b: 5 }, 3, 4);
  close(vx, 6);
  close(vy, -20);
});

test("vectorAt: every field is exactly zero at the origin", () => {
  for (const kind of ["spiral", "saddle", "wave"] as const) {
    const [vx, vy] = vectorAt({ kind, a: 0.5, b: 1.5 }, 0, 0);
    close(vx, 0);
    close(vy, 0);
  }
});

/* ───────────────────────────── integrator ──────────────────────────────── */

test("rk4Step: a pure rotation field approximately conserves distance from the origin", () => {
  const f = (p: Point): Point => [-p[1], p[0]];
  const start: Point = [1, 0];
  const next = rk4Step(f, start, 0.05);
  const r0 = Math.hypot(start[0], start[1]);
  const r1 = Math.hypot(next[0], next[1]);
  close(r0, r1, 1e-6);
});

test("rk4Step: matches the analytic solution of a linear saddle for a small step", () => {
  const field: FieldParams = { kind: "saddle", a: 0.5, b: 0.5 };
  const f = (p: Point): Point => vectorAt(field, p[0], p[1]);
  const h = 0.02;
  const next = rk4Step(f, [1, 1], h);
  // dx/dt = a x ⟹ x(h) = x0·e^(a h); dy/dt = -b y ⟹ y(h) = y0·e^(-b h)
  close(next[0], Math.exp(field.a * h), 1e-8);
  close(next[1], Math.exp(-field.b * h), 1e-8);
});

test("integrateTrajectory: a seed exactly at a fixed point goes nowhere", () => {
  const field: FieldParams = { kind: "spiral", a: 0.2, b: 1 };
  const points = integrateTrajectory(field, [0, 0], INTEGRATION_DEFAULTS);
  assert.deepEqual(points, [[0, 0]]);
});

test("integrateTrajectory: stops once the trajectory leaves `bound`", () => {
  // a > 0 spirals outward without limit, so this must terminate on the bound,
  // not run to maxSteps.
  const field: FieldParams = { kind: "spiral", a: 0.5, b: 1 };
  const integration = { stepSize: 0.05, maxSteps: 10000, bound: 2 };
  const points = integrateTrajectory(field, [0.1, 0], integration);
  assert.ok(points.length < 10000);
  const last = points[points.length - 1];
  assert.ok(Math.max(Math.abs(last[0]), Math.abs(last[1])) <= 2 + 0.5); // one step may overshoot slightly before the check
});

test("integrateTrajectory: respects maxSteps for a field that never leaves bound", () => {
  // Pure rotation (a = 0) stays on a circle forever; this must be capped by maxSteps.
  const field: FieldParams = { kind: "spiral", a: 0, b: 1 };
  const integration = { stepSize: 0.05, maxSteps: 50, bound: 100 };
  const points = integrateTrajectory(field, [1, 0], integration);
  assert.equal(points.length, 51); // the seed plus 50 steps
});

test("fullTrajectory: a non-trivial seed produces points on both sides of the seed", () => {
  const field: FieldParams = { kind: "saddle", a: 0.3, b: 0.3 };
  const integration = { stepSize: 0.05, maxSteps: 40, bound: 10 };
  const points = fullTrajectory(field, [0.5, 0.5], integration);
  // The seed itself must appear exactly once, somewhere in the middle.
  const seedOccurrences = points.filter((p) => p[0] === 0.5 && p[1] === 0.5).length;
  assert.equal(seedOccurrences, 1);
  assert.ok(points.length > integration.maxSteps); // both halves contributed
});

/* ───────────────────────────── determinism ──────────────────────────────── */

test("mulberry32: the same seed reproduces the same sequence exactly", () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  const seqA = [a(), a(), a()];
  const seqB = [b(), b(), b()];
  assert.deepEqual(seqA, seqB);
});

test("mulberry32: different seeds diverge, and every value is in [0, 1)", () => {
  const a = mulberry32(1)();
  const b = mulberry32(2)();
  assert.notEqual(a, b);
  for (const seed of [1, 2, 3, 999]) {
    const v = mulberry32(seed)();
    assert.ok(v >= 0 && v < 1);
  }
});

test("generateSeeds: deterministic, correct count, within bounds", () => {
  const a = generateSeeds(20, 7, 4);
  const b = generateSeeds(20, 7, 4);
  assert.deepEqual(a, b);
  assert.equal(a.length, 20);
  for (const [x, y] of a) {
    assert.ok(Math.abs(x) <= 4 && Math.abs(y) <= 4);
  }
});

test("generateSeeds: a different seed gives a different composition", () => {
  const a = generateSeeds(10, 1, 4);
  const b = generateSeeds(10, 2, 4);
  assert.notDeepEqual(a, b);
});
