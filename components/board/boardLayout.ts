/** Shared geometry for the Investigation Board's canvas — board units are plain pixels at scale 1. */

export const WORLD_WIDTH = 1500;
export const WORLD_HEIGHT = 1000;
export const MIN_SCALE = 0.35;
export const MAX_SCALE = 2.2;

/**
 * Each category gets its own base proportions — a research document reads
 * tall and narrow, a laboratory artifact reads as a wide printed strip, a
 * book cover taller still. `tierScale` then varies the actual rendered
 * size per node, so the wall has a real hierarchy rather than one size per
 * category.
 */
export const CARD_SIZE: Record<string, { w: number; h: number }> = {
  research: { w: 214, h: 128 },
  project: { w: 196, h: 114 },
  laboratory: { w: 246, h: 104 },
  book: { w: 134, h: 186 },
};
export const HUB_SIZE = 150;

export type Tier = "primary" | "secondary" | "peripheral";

/**
 * The wall's visual hierarchy: a compelling primary cluster (the verified
 * Fourier/EEG relationship, per the brief), a secondary ring of related
 * evidence, and peripheral, genuinely independent observations. This is a
 * compositional judgement, not a claim about intellectual importance.
 */
export const nodeTier: Record<string, Tier> = {
  "research/power-spectral-density-eeg-signal-quality": "primary",
  "laboratory/fourier-explorer": "primary",
  "concept/superposition": "primary",
  "concept/fourier-frequency-domain": "primary",

  "laboratory/wave-superposition": "secondary",
  "laboratory/quantum-mechanics-explorer": "secondary",
  "laboratory/gradient-descent": "secondary",
  "research/consensus-dynamics-in-networks": "secondary",
  "research/gravitational-waves-binary-black-holes": "secondary",
  "books/cosmos": "secondary",
  "projects/mathematics-perception-and-expression": "secondary",
  "projects/generative-art-playground": "secondary",
  "research/perspectives-in-motion": "secondary",

  "laboratory/reaction-kinetics": "peripheral",
  "projects/asymptote-ftc-robotics": "peripheral",
};

const TIER_SCALE: Record<Tier, number> = { primary: 1.22, secondary: 1, peripheral: 0.82 };

export function tierOf(id: string): Tier {
  return nodeTier[id] ?? "secondary";
}

export function sizeFor(id: string, category: string): { w: number; h: number } {
  const base = category === "concept" ? { w: HUB_SIZE, h: HUB_SIZE } : CARD_SIZE[category];
  const scale = TIER_SCALE[tierOf(id)];
  return { w: Math.round(base.w * scale), h: Math.round(base.h * scale) };
}

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
export const DEFAULT_SCALE_FLOOR = 0.8;

/**
 * The default view composes around one compelling area rather than the
 * graph's full bounds: the EEG research, the two Fourier-adjacent
 * instruments and their concept hubs — a real, verified relationship
 * (laboratory/fourier-explorer and research/power-spectral-density-eeg-
 * signal-quality both connect to concept/fourier-frequency-domain). The
 * rest of the wall sits just off-screen, reachable by panning or an
 * explicit "Fit to view".
 */
export const DEFAULT_VIEW_BOUNDS = { minX: 70, minY: 10, maxX: 1380, maxY: 500 };

/**
 * Faint, non-interactive neighborhood labels — organisational aids placed
 * in the open space around each loose cluster, not claims that every
 * nearby node is connected to every other. Positions are hand-placed
 * against the curated layout in lib/board/nodes.ts.
 */
export const neighborhoodLabels: { text: string; x: number; y: number }[] = [
  { text: "Signal & Frequency", x: 180, y: 15 },
  { text: "Physics & Superposition", x: 1040, y: 15 },
  { text: "Mathematics & Perception", x: 580, y: 955 },
  { text: "Literary & Scientific Imagination", x: 180, y: 715 },
  { text: "Independent Investigations", x: 1420, y: 395 },
];

/* ---------------------------------------------------------------------- */
/* Deterministic "placed by hand" variation — seeded by id, never random   */
/* across renders, so the wall is a stable composition, not a jittering    */
/* one. Plain string hashing; nothing here needs to be cryptographic.      */
/* ---------------------------------------------------------------------- */

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A value in [0, 1), deterministic per seed. */
function rand01(seed: string): number {
  return (hash(seed) % 100000) / 100000;
}

/** A small tilt, in degrees — concept anchors stay upright; everything else is "placed by hand". */
export function rotationFor(id: string, category: string): number {
  if (category === "concept") return 0;
  return rand01(`rot:${id}`) * 4.4 - 2.2;
}

/** How far a thread sags downward under its own weight — a pinned string, not a ruled line. Always positive: gravity has one direction. */
export function threadSagFor(edgeId: string): number {
  return 9 + rand01(`sag:${edgeId}`) * 13;
}

/**
 * A closed, slightly irregular circle path — a hand-drawn annotation
 * rather than a geometric button. Deterministic per id; computed once by
 * the caller, not per render.
 */
export function wobbleCirclePath(cx: number, cy: number, r: number, seed: string, points = 11): string {
  const pts = Array.from({ length: points }, (_, i) => {
    const angle = (i / points) * Math.PI * 2;
    const jitter = 1 + (rand01(`${seed}:${i}`) - 0.5) * 0.09;
    return { x: cx + Math.cos(angle) * r * jitter, y: cy + Math.sin(angle) * r * jitter };
  });
  const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  });
  const start = mid(pts[points - 1], pts[0]);
  let d = `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} `;
  for (let i = 0; i < points; i++) {
    const p = pts[i];
    const next = pts[(i + 1) % points];
    const m = mid(p, next);
    d += `Q ${p.x.toFixed(1)} ${p.y.toFixed(1)} ${m.x.toFixed(1)} ${m.y.toFixed(1)} `;
  }
  return d + "Z";
}
