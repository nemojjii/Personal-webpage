import assert from "node:assert/strict";
import { test } from "node:test";

import {
  HYPOTROCHOID_DEFAULTS,
  LISSAJOUS_DEFAULTS,
  ROSE_DEFAULTS,
  period,
  sampleCurve,
  samplePoint,
  type HypotrochoidParams,
  type LissajousParams,
  type ParametricParams,
} from "./parametric.ts";

function close(a: number, b: number, eps = 1e-9) {
  assert.ok(Math.abs(a - b) < eps, `expected ${a} ≈ ${b} (±${eps})`);
}

/**
 * The property every `period()` claim rests on: sampling at t = 0 and at
 * t = period(params) must land on the same point. This is what "closed" is
 * actually checked against, for every case below — not asserted, verified.
 */
function assertCloses(params: ParametricParams, eps = 1e-7) {
  const T = period(params);
  const start = samplePoint(params, 0);
  const end = samplePoint(params, T);
  close(start.x, end.x, eps);
  close(start.y, end.y, eps);
}

/* ───────────────────────────── lissajous ────────────────────────────────── */

test("lissajous: period is always 2π, independent of a and b", () => {
  for (const a of [1, 2, 5, 7]) {
    for (const b of [1, 3, 4, 7]) {
      const params: LissajousParams = { kind: "lissajous", a, b, delta: 0.4 };
      assert.equal(period(params), 2 * Math.PI);
    }
  }
});

test("lissajous: closes at t = 2π for a range of integer frequencies", () => {
  for (const a of [1, 2, 5, 7]) {
    for (const b of [1, 3, 4, 7]) {
      assertCloses({ kind: "lissajous", a, b, delta: 0.4 });
    }
  }
});

test("lissajous: at t = 0, x = sin(δ) and y = 0", () => {
  const p = samplePoint({ kind: "lissajous", a: 3, b: 2, delta: 0.7 }, 0);
  close(p.x, Math.sin(0.7));
  close(p.y, 0);
});

test("lissajous: δ = π/2 and a = b = 1 traces the unit circle", () => {
  const params: LissajousParams = { kind: "lissajous", a: 1, b: 1, delta: Math.PI / 2 };
  for (const t of [0, 0.3, 1.1, 2.9, 5.5]) {
    const { x, y } = samplePoint(params, t);
    close(x * x + y * y, 1, 1e-9);
  }
});

/* ──────────────────────────────── rose ──────────────────────────────────── */

test("rose: period is 2π·d, regardless of n", () => {
  for (const n of [1, 4, 5, 9]) {
    for (const d of [1, 2, 3, 7]) {
      assert.equal(period({ kind: "rose", n, d }), 2 * Math.PI * d);
    }
  }
});

test("rose: closes at θ = 2π·d for coprime and non-coprime n, d alike", () => {
  const cases: [number, number][] = [
    [5, 1], // coprime
    [1, 1],
    [4, 3], // coprime
    [6, 4], // gcd = 2, not reduced — the derivation never assumed lowest terms
    [9, 9],
  ];
  for (const [n, d] of cases) assertCloses({ kind: "rose", n, d });
});

test("rose: at θ = 0, the point is (1, 0) — r = cos(0) = 1 on the polar axis", () => {
  const p = samplePoint({ kind: "rose", n: 5, d: 1 }, 0);
  close(p.x, 1);
  close(p.y, 0);
});

test("rose: every point lies within the unit disc, since |cos| ≤ 1", () => {
  const points = sampleCurve({ kind: "rose", n: 7, d: 3 }, 400);
  for (const { x, y } of points) assert.ok(x * x + y * y <= 1 + 1e-9);
});

/* ────────────────────────────── hypotrochoid ────────────────────────────── */

test("hypotrochoid: period formula matches 2π·r / gcd(R, r)", () => {
  const cases: [number, number, number][] = [
    [5, 3, 6 * Math.PI], // gcd(5,3) = 1 → 2π·3/1
    [6, 4, 4 * Math.PI], // gcd(6,4) = 2 → 2π·4/2
    [8, 2, 2 * Math.PI], // gcd(8,2) = 2 → 2π·2/2
    [9, 9, 2 * Math.PI], // gcd(9,9) = 9 → 2π·9/9
  ];
  for (const [R, r, expected] of cases) {
    close(period({ kind: "hypotrochoid", R, r, d: 2 } as HypotrochoidParams), expected);
  }
});

test("hypotrochoid: closes at its own derived period, across R, r, d combinations", () => {
  const cases: [number, number, number][] = [
    [5, 3, 5],
    [6, 4, 2],
    [12, 1, 7],
    [9, 9, 0], // r = R: the rolling circle matches the fixed one
  ];
  for (const [R, r, d] of cases) assertCloses({ kind: "hypotrochoid", R, r, d });
});

test("hypotrochoid: at t = 0, x = (R − r) + d and y = 0", () => {
  const params: HypotrochoidParams = { kind: "hypotrochoid", R: 5, r: 3, d: 2 };
  const p = samplePoint(params, 0);
  close(p.x, (5 - 3) + 2);
  close(p.y, 0);
});

/* ─────────────────────────────── sampleCurve ────────────────────────────── */

test("sampleCurve: first and last sampled points coincide (the curve is traced fully closed)", () => {
  const defaults: ParametricParams[] = [LISSAJOUS_DEFAULTS, ROSE_DEFAULTS, HYPOTROCHOID_DEFAULTS];
  for (const params of defaults) {
    const points = sampleCurve(params, 300);
    assert.equal(points.length, 301);
    close(points[0].x, points[300].x, 1e-7);
    close(points[0].y, points[300].y, 1e-7);
  }
});

test("sampleCurve: every sampled point is finite", () => {
  for (const params of [LISSAJOUS_DEFAULTS, ROSE_DEFAULTS, HYPOTROCHOID_DEFAULTS]) {
    for (const { x, y } of sampleCurve(params, 150)) {
      assert.ok(Number.isFinite(x) && Number.isFinite(y));
    }
  }
});
