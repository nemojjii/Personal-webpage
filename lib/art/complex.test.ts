import assert from "node:assert/strict";
import { test } from "node:test";

import {
  COMPLEX_DEFAULTS,
  applyMapping,
  buildSourceGrid,
  toSegments,
  transformLine,
} from "./complex.ts";

function close(a: number, b: number, eps = 1e-9) {
  assert.ok(Math.abs(a - b) < eps, `expected ${a} ≈ ${b}`);
}

test("applyMapping: square is the ordinary complex multiplication z·z", () => {
  const w = applyMapping("square", { re: 2, im: 3 });
  // (2+3i)^2 = 4 + 12i - 9 = -5 + 12i
  assert.ok(w);
  close(w.re, -5);
  close(w.im, 12);
});

test("applyMapping: cube on the real axis matches real cubing", () => {
  const w = applyMapping("cube", { re: 2, im: 0 });
  assert.ok(w);
  close(w.re, 8);
  close(w.im, 0);
});

test("applyMapping: reciprocal of 1 is 1, of i is -i", () => {
  const one = applyMapping("reciprocal", { re: 1, im: 0 });
  assert.ok(one);
  close(one.re, 1);
  close(one.im, 0);

  const i = applyMapping("reciprocal", { re: 0, im: 1 });
  assert.ok(i);
  close(i.re, 0);
  close(i.im, -1);
});

test("applyMapping: reciprocal is undefined exactly at the origin", () => {
  assert.equal(applyMapping("reciprocal", { re: 0, im: 0 }), undefined);
});

test("applyMapping: square and cube are finite everywhere finite input is finite", () => {
  for (const z of [{ re: 0, im: 0 }, { re: -3.5, im: 7.2 }, { re: 100, im: -100 }]) {
    assert.ok(applyMapping("square", z) !== undefined);
    assert.ok(applyMapping("cube", z) !== undefined);
  }
});

test("buildSourceGrid: produces 2·density lines, each with samplesPerLine + 1 points", () => {
  const grid = buildSourceGrid(2, 5, 40);
  assert.equal(grid.length, 10);
  for (const line of grid) assert.equal(line.length, 41);
});

test("buildSourceGrid: every point lies within [-extent, extent] on both axes", () => {
  const grid = buildSourceGrid(2, 5, 20);
  for (const line of grid) {
    for (const { re, im } of line) {
      assert.ok(Math.abs(re) <= 2 + 1e-9);
      assert.ok(Math.abs(im) <= 2 + 1e-9);
    }
  }
});

test("transformLine: marks a singularity as undefined rather than a huge finite value", () => {
  // density=3 → lines at -2, 0, 2, pushed as [h(-2), v(-2), h(0), v(0), h(2), v(2)];
  // index 3 is the vertical line at re = 0, which passes through the origin.
  const line = buildSourceGrid(2, 3, 10)[3];
  const transformed = transformLine(line, "reciprocal", 50);
  assert.ok(transformed.some((p) => p === undefined));
});

test("transformLine: marks a point that leaves the view limit as undefined, not clamped", () => {
  // The horizontal line at im = 0 passes close to the origin, where 1/z is
  // large-but-finite nearby and genuinely non-finite only exactly at z = 0.
  const line = buildSourceGrid(2, 3, 10)[2];
  const transformed = transformLine(line, "reciprocal", 1); // a tight view limit
  assert.ok(transformed.some((p) => p === undefined));
  assert.ok(transformed.some((p) => p !== undefined)); // not everything is clipped
  for (const p of transformed) {
    if (p) assert.ok(Math.hypot(p.re, p.im) <= 1 + 1e-9);
  }
});

test("toSegments: splits a line with a gap into separate runs, never bridging them", () => {
  const line = [1, 2, 3, undefined, 4, 5, undefined, undefined, 6, 7, 8];
  const segments = toSegments(line);
  assert.deepEqual(segments, [
    [1, 2, 3],
    [4, 5],
    [6, 7, 8],
  ]);
});

test("toSegments: a run of length 1 is dropped (nothing to draw a line with)", () => {
  assert.deepEqual(toSegments([1, undefined, 2, undefined, undefined, 3, 4]), [[3, 4]]);
});

test("toSegments: an entirely defined line is a single segment", () => {
  assert.deepEqual(toSegments([1, 2, 3]), [[1, 2, 3]]);
});

test("COMPLEX_DEFAULTS: produces a grid whose shape matches its own density", () => {
  const grid = buildSourceGrid(COMPLEX_DEFAULTS.extent, COMPLEX_DEFAULTS.density);
  assert.equal(grid.length, 2 * COMPLEX_DEFAULTS.density);
});
