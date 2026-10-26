import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { experiments } from "../laboratory.ts";
import { boardEdges } from "./edges.ts";
import { boardNodes } from "./nodes.ts";
import {
  edgesTouching,
  filterByCategory,
  filterByEdgeKind,
  getNode,
  graph,
  isolatedNodes,
  neighborhood,
  neighborsOf,
  searchNodes,
  validateGraph,
} from "./graph.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_ROOT = path.join(here, "..", "..", "content");

test("the curated graph has no referential-integrity problems", () => {
  assert.deepEqual(validateGraph(graph), []);
});

test("curated counts match the audited set (no silent drift)", () => {
  assert.equal(boardNodes.length, 15);
  assert.equal(boardEdges.length, 11);
});

test("every node id is unique", () => {
  const ids = boardNodes.map((n) => n.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("every edge has a non-empty, real explanation", () => {
  for (const edge of boardEdges) {
    assert.ok(edge.note.trim().length > 20, `edge ${edge.id} needs a real explanation`);
  }
});

test("every real-content node points at a file that actually exists", () => {
  for (const node of boardNodes) {
    const [collection, slug] = node.id.split("/");
    if (collection === "concept") continue;
    if (collection === "laboratory") {
      assert.ok(
        experiments.some((e) => e.slug === slug),
        `node ${node.id} has no matching experiment in lib/laboratory.ts`,
      );
      continue;
    }
    const file = path.join(CONTENT_ROOT, collection, `${slug}.mdx`);
    assert.ok(fs.existsSync(file), `node ${node.id} has no content file at ${file}`);
  }
});

test("concept nodes have no href; every other node does", () => {
  for (const node of boardNodes) {
    if (node.category === "concept") assert.equal(node.href, undefined);
    else assert.ok(node.href && node.href.startsWith("/"));
  }
});

test("neighborsOf finds both directions of an edge", () => {
  const neighbors = neighborsOf(graph, "laboratory/gradient-descent");
  assert.ok(neighbors.some((n) => n.node.id === "research/consensus-dynamics-in-networks"));
  assert.ok(neighbors.some((n) => n.node.id === "concept/superposition") === false);
});

test("neighborhood includes the node itself plus its neighbors, nothing further", () => {
  const ids = neighborhood(graph, "laboratory/wave-superposition");
  assert.ok(ids.has("laboratory/wave-superposition"));
  assert.ok(ids.has("research/power-spectral-density-eeg-signal-quality"));
  assert.ok(ids.has("concept/superposition"));
  // Two hops away — not included at one hop.
  assert.ok(!ids.has("concept/fourier-frequency-domain"));
});

test("isolatedNodes finds exactly the two deliberately unconnected real nodes", () => {
  const isolated = isolatedNodes(graph).map((n) => n.id).sort();
  assert.deepEqual(isolated, ["laboratory/reaction-kinetics", "projects/asymptote-ftc-robotics"]);
});

test("edgesTouching only returns edges with both ends in the given set", () => {
  const ids = neighborhood(graph, "concept/superposition");
  const edges = edgesTouching(graph, ids);
  assert.ok(edges.every((e) => ids.has(e.from) && ids.has(e.to)));
  assert.ok(edges.length >= 3);
});

test("searchNodes matches title, subtitle and summary, case-insensitively", () => {
  assert.ok(searchNodes(graph, "GRADIENT").some((n) => n.id === "laboratory/gradient-descent"));
  assert.ok(searchNodes(graph, "ligo").some((n) => n.id === "research/gravitational-waves-binary-black-holes"));
  assert.equal(searchNodes(graph, "   ").length, boardNodes.length);
  assert.equal(searchNodes(graph, "no such thing here").length, 0);
});

test("filterByCategory with an empty set returns everything", () => {
  assert.equal(filterByCategory(graph, new Set()).length, boardNodes.length);
  assert.equal(filterByCategory(graph, new Set(["book"])).length, 1);
});

test("filterByEdgeKind with an empty set returns everything", () => {
  assert.equal(filterByEdgeKind(graph, new Set()).length, boardEdges.length);
  assert.ok(filterByEdgeKind(graph, new Set(["personal"])).length >= 1);
});

test("getNode returns undefined for an unknown id", () => {
  assert.equal(getNode(graph, "not/a/real/node"), undefined);
});

test("broken data is actually caught by validateGraph", () => {
  const broken = {
    nodes: [
      { id: "a", category: "research" as const, title: "A", subtitle: "", summary: "s", x: 0, y: 0 },
    ],
    edges: [
      { id: "a--b", from: "a", to: "b", kind: "mathematical" as const, note: "points nowhere" },
    ],
  };
  const problems = validateGraph(broken);
  assert.ok(problems.some((p) => p.includes("unknown node")));
  assert.ok(problems.some((p) => p.includes("no href")));
});
