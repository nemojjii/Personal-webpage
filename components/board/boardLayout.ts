/** Shared geometry for the Investigation Board's canvas — board units are plain pixels at scale 1. */

export const WORLD_WIDTH = 1760;
export const WORLD_HEIGHT = 1220;
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
  // Tall and narrow — a dossier profile, not another wide printed strip.
  // Deliberately the single largest footprint on the wall (bigger than a
  // primary-tier research card at 304×182) so IK-001 reads as the
  // investigation's main folder, not one more artifact among equals (Phase
  // 20.7.1). It is never tier-scaled (see nodeTier below, which
  // deliberately omits "case/iris-kim") — this absolute size already does
  // the job TIER_SCALE does for everything else.
  case: { w: 260, h: 330 },
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

const TIER_SCALE: Record<Tier, number> = { primary: 1.42, secondary: 1, peripheral: 0.8 };

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
  case: "Case File",
};

/** A short archival code for each category — used on cards, restrained rather than a color key. */
export const categoryCode: Record<string, string> = {
  research: "R",
  project: "P",
  laboratory: "L",
  concept: "C",
  book: "B",
  case: "IK",
};

export function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

/**
 * The single pointer/focal-centered zoom implementation shared by every
 * zoom input — wheel, trackpad pinch (Chromium ctrl+wheel and Safari
 * gesture events), touch pinch, and the explicit +/- buttons (anchored on
 * the viewport center) — so every one of them zooms toward the same point
 * it was asked to, rather than drifting toward the world origin.
 */
export function zoomAt(
  transform: { panX: number; panY: number; scale: number },
  focal: { x: number; y: number },
  factor: number,
): { panX: number; panY: number; scale: number } {
  const nextScale = clampScale(transform.scale * factor);
  const worldX = (focal.x - transform.panX) / transform.scale;
  const worldY = (focal.y - transform.panY) / transform.scale;
  return {
    scale: nextScale,
    panX: focal.x - worldX * nextScale,
    panY: focal.y - worldY * nextScale,
  };
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

/**
 * The default initial view never shrinks cards below this. It is a
 * minimum, not the thing driving the composition — fitTransform computes
 * the real scale from the actual measured viewport against
 * DEFAULT_VIEW_BOUNDS below, and only falls back to this floor on a
 * viewport too small to fit the bounds comfortably (a phone, mainly),
 * where showing one artifact at a readable size matters more than fitting
 * the whole cluster. "Fit to view" is the explicit way to see everything.
 */
export const DEFAULT_SCALE_FLOOR = 0.85;

/**
 * The default view composes around one compelling, tight area rather than
 * the graph's full bounds: IK-001 at its centre, encircled — asymmetrically,
 * not radially — by the EEG research, Fourier Explorer, Wave Superposition
 * and both concept hubs (Phase 20.7.1 recomposition; lib/board/nodes.ts has
 * the exact positions and the reasoning for each one's distance and angle).
 * The case file is the one deliberately unconnected artifact in this ring,
 * kept close by composition rather than by thread; the rest are genuinely
 * connected to each other (laboratory/fourier-explorer and research/power-
 * spectral-density-eeg-signal-quality both reach concept/fourier-frequency-
 * domain; laboratory/wave-superposition reaches concept/superposition and
 * the EEG research itself). These bounds are this ring's own bounding box
 * plus margin — computed from the nodes' actual rendered footprints (see
 * the layout note in nodes.ts), not eyeballed — so IK-001's centre sits
 * within a few dozen units of this box's own centre, and the fitTransform
 * camera therefore renders it at the middle of the opening view. Tight
 * bounds in a wide viewport mean this cluster renders large and legible
 * without any hardcoded zoom value. The rest of the wall sits just
 * off-screen, reachable by panning or an explicit "Fit to view".
 */
export const DEFAULT_VIEW_BOUNDS = { minX: -20, minY: 10, maxX: 985, maxY: 745 };

/**
 * Faint, non-interactive neighborhood labels — organisational aids placed
 * in the open space around each loose cluster, not claims that every
 * nearby node is connected to every other. Positions are hand-placed
 * against the curated layout in lib/board/nodes.ts.
 *
 * Phase 20.7.1 renames these to the five areas the case file's own
 * "Explore on the wall" links use, and drops a label for the ring directly
 * around IK-001 — EEG research, Fourier Explorer, Wave Superposition and
 * both concept hubs — since that ring is already legible as "the evidence
 * immediately surrounding the case file" without its own caption.
 * Mathematics & Computation keeps a label of its own further out, where
 * Gradient Descent and Consensus Dynamics sit without a concept hub nearby
 * to make the connection visually obvious.
 */
export const neighborhoodLabels: { text: string; x: number; y: number }[] = [
  { text: "Mathematics & Computation", x: 30, y: 740 },
  { text: "Art & Perception", x: 560, y: 870 },
  { text: "Science & Physics", x: 1040, y: 460 },
  { text: "Literature & Cinema", x: 1300, y: 760 },
  { text: "Independent Explorations", x: 1460, y: 130 },
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

/** A small tilt, in degrees — concept anchors and the case file stay upright; everything else is "placed by hand". */
export function rotationFor(id: string, category: string): number {
  if (category === "concept" || category === "case") return 0;
  return rand01(`rot:${id}`) * 4.4 - 2.2;
}

/** How far a thread sags downward under its own weight — a pinned string, not a ruled line. Always positive: gravity has one direction. */
export function threadSagFor(edgeId: string): number {
  return 9 + rand01(`sag:${edgeId}`) * 13;
}

/** Which corner a tape strip sits in, and how it tilts — deterministic per id. */
export function tapeFor(id: string): { corner: "left" | "right"; angle: number } {
  return {
    corner: rand01(`tape-side:${id}`) < 0.5 ? "left" : "right",
    angle: rand01(`tape-angle:${id}`) * 10 - 5,
  };
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
