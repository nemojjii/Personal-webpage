import assert from "node:assert/strict";
import { test } from "node:test";

import { DEFAULT_VIEW_BOUNDS, sizeFor } from "../../components/board/boardLayout.ts";
import { boardNodes } from "./nodes.ts";

/**
 * Phase 20.7.1 recomposed the board around IK-001 by hand (solved for
 * non-overlap with a one-off script, not committed) rather than with a
 * force simulation run at build time — these tests are what keep that
 * one-off solution honest as the curated data keeps changing.
 */

function box(x: number, y: number, w: number, h: number) {
  return { x0: x - w / 2, x1: x + w / 2, y0: y - h / 2, y1: y + h / 2 };
}

test("no two nodes' rendered footprints overlap at the default layout", () => {
  const boxes = boardNodes.map((n) => {
    const size = sizeFor(n.id, n.category);
    return { id: n.id, ...box(n.x, n.y, size.w, size.h) };
  });
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      const overlapping = !(a.x1 < b.x0 || a.x0 > b.x1 || a.y1 < b.y0 || a.y0 > b.y1);
      assert.ok(!overlapping, `${a.id} and ${b.id} overlap in the default layout`);
    }
  }
});

test("IK-001 is the single largest footprint on the wall", () => {
  const caseNode = boardNodes.find((n) => n.id === "case/iris-kim");
  assert.ok(caseNode, "case/iris-kim must exist");
  const caseSize = sizeFor(caseNode!.id, caseNode!.category);
  const caseArea = caseSize.w * caseSize.h;
  for (const n of boardNodes) {
    if (n.id === "case/iris-kim") continue;
    const size = sizeFor(n.id, n.category);
    assert.ok(
      caseArea > size.w * size.h,
      `${n.id} (${size.w}x${size.h}) is not smaller than IK-001 (${caseSize.w}x${caseSize.h})`,
    );
  }
});

test("IK-001 sits near the centre of the default camera's own framing bounds", () => {
  const caseNode = boardNodes.find((n) => n.id === "case/iris-kim")!;
  const boundsCenterX = (DEFAULT_VIEW_BOUNDS.minX + DEFAULT_VIEW_BOUNDS.maxX) / 2;
  const boundsCenterY = (DEFAULT_VIEW_BOUNDS.minY + DEFAULT_VIEW_BOUNDS.maxY) / 2;
  const dx = Math.abs(caseNode.x - boundsCenterX);
  const dy = Math.abs(caseNode.y - boundsCenterY);
  // Loose tolerance — the ring is asymmetric by design, so IK-001 need not
  // be exactly centred, only close enough that the rendered opening scene
  // reads as "IK-001 in the middle", not "IK-001 in a corner".
  assert.ok(dx < 100, `IK-001 is ${dx}px off-centre horizontally in the default view bounds`);
  assert.ok(dy < 100, `IK-001 is ${dy}px off-centre vertically in the default view bounds`);
});

test("the ring immediately around IK-001 fits inside DEFAULT_VIEW_BOUNDS with room to spare", () => {
  const ringIds = new Set([
    "case/iris-kim",
    "research/power-spectral-density-eeg-signal-quality",
    "laboratory/fourier-explorer",
    "concept/superposition",
    "concept/fourier-frequency-domain",
    "laboratory/wave-superposition",
  ]);
  for (const n of boardNodes) {
    if (!ringIds.has(n.id)) continue;
    const size = sizeFor(n.id, n.category);
    const b = box(n.x, n.y, size.w, size.h);
    assert.ok(b.x0 >= DEFAULT_VIEW_BOUNDS.minX, `${n.id} extends left of DEFAULT_VIEW_BOUNDS`);
    assert.ok(b.x1 <= DEFAULT_VIEW_BOUNDS.maxX, `${n.id} extends right of DEFAULT_VIEW_BOUNDS`);
    assert.ok(b.y0 >= DEFAULT_VIEW_BOUNDS.minY, `${n.id} extends above DEFAULT_VIEW_BOUNDS`);
    assert.ok(b.y1 <= DEFAULT_VIEW_BOUNDS.maxY, `${n.id} extends below DEFAULT_VIEW_BOUNDS`);
  }
});
