/** Shared geometry for the Investigation Board's canvas — board units are plain pixels at scale 1. */

export const WORLD_WIDTH = 1500;
export const WORLD_HEIGHT = 1000;
export const MIN_SCALE = 0.35;
export const MAX_SCALE = 2.2;

/**
 * Each category gets its own card proportions — a research document reads
 * tall and narrow, a book cover taller still, a concept hub is a circle.
 * Nothing here is arbitrary variation; it is what each kind of evidence
 * actually looks like.
 */
export const CARD_SIZE: Record<string, { w: number; h: number }> = {
  research: { w: 218, h: 124 },
  project: { w: 200, h: 114 },
  laboratory: { w: 218, h: 120 },
  book: { w: 138, h: 190 },
};
export const HUB_SIZE = 152;

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
export const DEFAULT_SCALE_FLOOR = 0.82;

/**
 * The default view composes around one compelling area rather than the
 * graph's full bounds: the EEG research, the two Fourier-adjacent
 * instruments and their concept hubs — a real, verified relationship
 * (laboratory/fourier-explorer and research/power-spectral-density-eeg-
 * signal-quality both connect to concept/fourier-frequency-domain). The
 * rest of the atlas sits just off-screen, reachable by panning or an
 * explicit "Fit to view".
 */
export const DEFAULT_VIEW_BOUNDS = { minX: 90, minY: 30, maxX: 1360, maxY: 480 };

/**
 * Faint, non-interactive neighborhood labels — organisational aids placed
 * in the open space around each loose cluster, not claims that every
 * nearby node is connected to every other. Positions are hand-placed
 * against the curated layout in lib/board/nodes.ts.
 */
export const neighborhoodLabels: { text: string; x: number; y: number }[] = [
  { text: "Signal & Frequency", x: 190, y: 30 },
  { text: "Physics & Superposition", x: 1030, y: 30 },
  { text: "Mathematics & Perception", x: 580, y: 950 },
  { text: "Literary & Scientific Imagination", x: 190, y: 710 },
  { text: "Independent Investigations", x: 1420, y: 390 },
];
