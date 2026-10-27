import type { BoardEdge, BoardGraph, BoardNode } from "./types.ts";
import { boardEdges } from "./edges.ts";
import { boardNodes } from "./nodes.ts";

export const graph: BoardGraph = { nodes: boardNodes, edges: boardEdges };

/** Every referential-integrity problem the curated data could have. Empty on a healthy graph. */
export function validateGraph(g: BoardGraph): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();

  for (const node of g.nodes) {
    if (!node.id) {
      problems.push("a node is missing an id");
      continue;
    }
    if (ids.has(node.id)) problems.push(`duplicate node id "${node.id}"`);
    ids.add(node.id);
    if (!node.title.trim()) problems.push(`node "${node.id}" has no title`);
    if (!node.summary.trim()) problems.push(`node "${node.id}" has no summary`);
    if (node.category !== "concept" && node.category !== "case" && !node.href) {
      problems.push(`node "${node.id}" is not a concept or case node but has no href`);
    }
    if (node.href && !node.href.startsWith("/")) {
      problems.push(`node "${node.id}" has a non-relative href "${node.href}"`);
    }
    if (node.coverImage && !node.coverImage.startsWith("https://")) {
      problems.push(`node "${node.id}" has a non-https coverImage "${node.coverImage}"`);
    }
  }

  const edgeIds = new Set<string>();
  for (const edge of g.edges) {
    if (edgeIds.has(edge.id)) problems.push(`duplicate edge id "${edge.id}"`);
    edgeIds.add(edge.id);
    if (!ids.has(edge.from)) problems.push(`edge "${edge.id}" points from unknown node "${edge.from}"`);
    if (!ids.has(edge.to)) problems.push(`edge "${edge.id}" points to unknown node "${edge.to}"`);
    if (edge.from === edge.to) problems.push(`edge "${edge.id}" connects a node to itself`);
    if (!edge.note.trim()) problems.push(`edge "${edge.id}" has no explanation`);
  }

  return problems;
}

export function getNode(g: BoardGraph, id: string): BoardNode | undefined {
  return g.nodes.find((n) => n.id === id);
}

export interface Neighbor {
  node: BoardNode;
  edge: BoardEdge;
  direction: "outgoing" | "incoming";
}

/** The other nodes one edge away from `id`, each with the edge that connects them. */
export function neighborsOf(g: BoardGraph, id: string): Neighbor[] {
  const out: Neighbor[] = [];
  for (const edge of g.edges) {
    if (edge.from === id) {
      const node = getNode(g, edge.to);
      if (node) out.push({ node, edge, direction: "outgoing" });
    } else if (edge.to === id) {
      const node = getNode(g, edge.from);
      if (node) out.push({ node, edge, direction: "incoming" });
    }
  }
  return out;
}

/** The ids of `id` and everything one edge away from it. */
export function neighborhood(g: BoardGraph, id: string): Set<string> {
  const ids = new Set<string>([id]);
  for (const { node } of neighborsOf(g, id)) ids.add(node.id);
  return ids;
}

export function edgesTouching(g: BoardGraph, ids: Set<string>): BoardEdge[] {
  return g.edges.filter((e) => ids.has(e.from) && ids.has(e.to));
}

/** Nodes with no edge at all — shown, not hidden, since isolation here is honest, not a bug. */
export function isolatedNodes(g: BoardGraph): BoardNode[] {
  const connected = new Set<string>();
  for (const e of g.edges) {
    connected.add(e.from);
    connected.add(e.to);
  }
  return g.nodes.filter((n) => !connected.has(n.id));
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFKD");
}

/** Case-insensitive match against a node's title, subtitle and summary. */
export function searchNodes(g: BoardGraph, query: string): BoardNode[] {
  const q = normalize(query.trim());
  if (!q) return g.nodes;
  return g.nodes.filter((n) =>
    [n.title, n.subtitle, n.summary].some((field) => normalize(field).includes(q)),
  );
}

export function filterByCategory(g: BoardGraph, categories: Set<string>): BoardNode[] {
  if (categories.size === 0) return g.nodes;
  return g.nodes.filter((n) => categories.has(n.category));
}

export function filterByEdgeKind(g: BoardGraph, kinds: Set<string>): BoardEdge[] {
  if (kinds.size === 0) return g.edges;
  return g.edges.filter((e) => kinds.has(e.kind));
}
