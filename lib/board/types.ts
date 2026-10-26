/**
 * The Investigation Board's own data model. This is a curated, editorial
 * layer on top of the site's real content — every node names a page that
 * already exists, and every edge is grounded in something that page, or
 * another page it points to, actually says. Nothing here is invented.
 */

export type BoardCategory =
  | "research"
  | "project"
  | "laboratory"
  | "concept"
  | "book";

/**
 * How two nodes relate. "mathematical" and "conceptual" match the
 * vocabulary already used for experiment relations (lib/laboratory.ts);
 * "thematic" is a shared question or area, not shared mathematics;
 * "personal" is a biographical connection the site itself draws (an About
 * page passage), not a scientific one — kept distinct so it is never read
 * as a claim of fact.
 */
export type BoardEdgeKind = "mathematical" | "conceptual" | "thematic" | "personal";

export interface BoardNode {
  /** Stable, unique id. For real content this is "<collection>/<slug>" or "laboratory/<slug>"; concept nodes use "concept/<slug>". */
  id: string;
  category: BoardCategory;
  title: string;
  /** One short line — the subtitle/question shown on the card. */
  subtitle: string;
  /** A sentence or two of real, already-published summary, not new writing. */
  summary: string;
  /** The real site route this node opens. Concept nodes have none. */
  href?: string;
  /** A real, already-published cover image URL (books only) — never a fabricated or placeholder cover. */
  coverImage?: string;
  /** Hand-placed default layout position, in an arbitrary board unit square. */
  x: number;
  y: number;
}

export interface BoardEdge {
  /** Stable id, "<from>--<to>". */
  id: string;
  from: string;
  to: string;
  kind: BoardEdgeKind;
  /** A human-readable reason, grounded in published text. Required: every edge needs one. */
  note: string;
}

export interface BoardGraph {
  nodes: BoardNode[];
  edges: BoardEdge[];
}
