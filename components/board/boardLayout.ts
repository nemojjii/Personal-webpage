/** Shared geometry for the Investigation Board's canvas — board units are plain pixels at scale 1. */

export const WORLD_WIDTH = 1500;
export const WORLD_HEIGHT = 1000;
export const MIN_SCALE = 0.35;
export const MAX_SCALE = 2.2;

export const CARD_W = 212;
export const CARD_H = 100;
export const HUB_SIZE = 140;

export const categoryLabel: Record<string, string> = {
  research: "Research",
  project: "Project",
  laboratory: "Little Laboratory",
  concept: "Concept",
  book: "Bookshelf",
};

/** A short archival code for each category — used on cards, restrained rather than a color key. */
export const categoryCode: Record<string, string> = {
  research: "R",
  project: "P",
  laboratory: "L",
  concept: "C",
  book: "B",
};

export function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

/**
 * A transform (pan + scale) that fits the given world-space bounds inside a
 * viewport of the given size, with margin. `minScale` is a readability
 * floor: below it, cards stop shrinking and the view centers on the bounds
 * instead of guaranteeing every node is on screen — an explicit "Fit to
 * view" action is what guarantees that; the default view should stay
 * legible even if the whole graph does not fit.
 */
export function fitTransform(
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  viewport: { width: number; height: number },
  margin = 80,
  minScale = MIN_SCALE,
): { panX: number; panY: number; scale: number } {
  const w = Math.max(1, bounds.maxX - bounds.minX);
  const h = Math.max(1, bounds.maxY - bounds.minY);
  const naturalScale = Math.min((viewport.width - margin * 2) / w, (viewport.height - margin * 2) / h);
  const scale = clampScale(Math.max(naturalScale, minScale));
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;
  const panX = viewport.width / 2 - cx * scale;
  const panY = viewport.height / 2 - cy * scale;
  return { panX, panY, scale };
}

/** The default initial view never shrinks cards below this — "Fit to view" is the explicit way to see everything at once. */
export const DEFAULT_SCALE_FLOOR = 0.78;

/**
 * The default view composes around the connected core of the graph, not
 * its full bounds — the two deliberately isolated nodes (reaction kinetics,
 * αsymptote) sit further out and peek in at the edge rather than forcing
 * the whole board to shrink to fit them in on first load. "Fit to view"
 * uses the real bounds and shows everything.
 */
export const DEFAULT_VIEW_BOUNDS = { minX: 150, minY: 70, maxX: 1290, maxY: 910 };
