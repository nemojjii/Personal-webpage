import assert from "node:assert/strict";
import { test } from "node:test";

import { chirpEnvelope, chirpPoints } from "./chirp.ts";

function close(a: number, b: number, eps = 1e-9) {
  assert.ok(Math.abs(a - b) < eps, `expected ${a} ≈ ${b}`);
}

test("chirpPoints: starts and ends exactly at t = 0 and t = 1", () => {
  const points = chirpPoints(100);
  close(points[0].t, 0);
  close(points[points.length - 1].t, 1);
  assert.equal(points.length, 101);
});

test("chirpPoints: every y stays within its own envelope", () => {
  for (const { t, y } of chirpPoints(200)) {
    assert.ok(Math.abs(y) <= chirpEnvelope(t) + 1e-9);
  }
});

test("chirpPoints: y is exactly 0 at t = 0 (sin of zero phase)", () => {
  const points = chirpPoints(50);
  close(points[0].y, 0);
});

test("chirpEnvelope: increases monotonically from 0.3 to 1.0 over [0, 1]", () => {
  close(chirpEnvelope(0), 0.3);
  close(chirpEnvelope(1), 1.0);
  for (let i = 0; i < 20; i++) {
    const a = chirpEnvelope(i / 20);
    const b = chirpEnvelope((i + 1) / 20);
    assert.ok(b > a);
  }
});

test("chirpPoints: deterministic — identical calls produce identical output", () => {
  assert.deepEqual(chirpPoints(80), chirpPoints(80));
});
