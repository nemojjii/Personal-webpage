/**
 * Small, mathematically real signatures for the Little Laboratory and
 * Generative Art Playground cards — not decoration, but each instrument's
 * own default curve, sampled once at module load from the same pure
 * functions the instrument pages themselves use. A node with n=2 is drawn
 * because it is the second eigenstate, not because it "looked nice".
 */
import { DESCENT_DEFAULTS, run } from "@/lib/laboratory/gradient.ts";
import { FOURIER_DEFAULTS, sampleTimeDomain } from "@/lib/laboratory/fourier.ts";
import { KINETICS_DEFAULTS, curve, timeWindow } from "@/lib/laboratory/kinetics.ts";
import { sampleEigenfunction } from "@/lib/laboratory/quantum.ts";
import { WAVE_DEFAULTS, sampleWaves } from "@/lib/laboratory/wave.ts";
import { ROSE_DEFAULTS, sampleCurve } from "@/lib/art/parametric.ts";

const W = 140;
const H = 34;
const PAD = 3;

function pathFrom(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = Math.max(1e-9, maxX - minX);
  const spanY = Math.max(1e-9, maxY - minY);
  const sx = (x: number) => PAD + ((x - minX) / spanX) * (W - 2 * PAD);
  const sy = (y: number) => H - PAD - ((y - minY) / spanY) * (H - 2 * PAD);
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`)
    .join(" ");
}

const waveSamples = sampleWaves(WAVE_DEFAULTS, 0, 72);
const gradientSamples = run(DESCENT_DEFAULTS.q, DESCENT_DEFAULTS.start, DESCENT_DEFAULTS.eta).path;
const kineticsSamples = curve(
  KINETICS_DEFAULTS.a0,
  KINETICS_DEFAULTS.k,
  timeWindow(KINETICS_DEFAULTS.k),
  48,
);
const fourierSamples = sampleTimeDomain(FOURIER_DEFAULTS, 2, 60);
const quantumSamples = sampleEigenfunction(2, 1, 48);
const roseSamples = sampleCurve(ROSE_DEFAULTS, 90);

/** Keyed by node id; viewBox is always "0 0 100 36". Each path is a real default curve, not an invented decoration. */
export const instrumentGlyphs: Record<string, string> = {
  "laboratory/wave-superposition": pathFrom(waveSamples.map((p) => ({ x: p.x, y: p.y }))),
  "laboratory/gradient-descent": pathFrom(gradientSamples.map((p) => ({ x: p.x, y: p.y }))),
  "laboratory/reaction-kinetics": pathFrom(kineticsSamples.map((p) => ({ x: p.t, y: p.a }))),
  "laboratory/fourier-explorer": pathFrom(fourierSamples.map((p) => ({ x: p.t, y: p.sum }))),
  "laboratory/quantum-mechanics-explorer": pathFrom(quantumSamples.map((p) => ({ x: p.x, y: p.psi }))),
  /** The Generative Art Playground's own content includes "a curve traced from one changing parameter" — a rose curve, its default. */
  "projects/generative-art-playground": pathFrom(roseSamples.map((p) => ({ x: p.x, y: p.y }))),
};

export const INSTRUMENT_GLYPH_VIEWBOX = `0 0 ${W} ${H}`;
