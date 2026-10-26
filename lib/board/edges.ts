import type { BoardEdge } from "./types.ts";

/**
 * Eleven curated edges. Two existing editorial relations (E1, E2) are
 * reused verbatim from lib/laboratory.ts, not reworded. The rest are new,
 * each grounded in text already published somewhere on the site — quoted
 * or closely paraphrased in the note, never a new claim.
 *
 * Left out on purpose: the pre-existing `related` link between the EEG and
 * Consensus Dynamics research entries. That file's own "NOTES REQUIRING
 * VERIFICATION" flags the citation behind it as possibly describing an
 * external source rather than the author's own work, and asks that it be
 * confirmed. A board built to show "every connection has a reason" should
 * not promote a connection its own source material has not yet confirmed.
 * The small per-page link stays as it was; it is not repeated here.
 */
export const boardEdges: BoardEdge[] = [
  {
    id: "laboratory/wave-superposition--research/power-spectral-density-eeg-signal-quality",
    from: "laboratory/wave-superposition",
    to: "research/power-spectral-density-eeg-signal-quality",
    kind: "conceptual",
    note:
      "Fourier analysis treats a recorded signal as a superposition of sinusoids; this instrument shows two of them adding. The EEG work used that analysis on real recordings — it did not study this demonstration.",
  },
  {
    id: "laboratory/gradient-descent--research/consensus-dynamics-in-networks",
    from: "laboratory/gradient-descent",
    to: "research/consensus-dynamics-in-networks",
    kind: "mathematical",
    note:
      "Under its assumptions, the consensus iteration x ← x − dt·Lx is gradient descent on the graph-Laplacian energy ½xᵀLx, with the same kind of bound on the step size. The same mathematics read in two places, not the same demonstration.",
  },
  {
    id: "laboratory/wave-superposition--concept/superposition",
    from: "laboratory/wave-superposition",
    to: "concept/superposition",
    kind: "mathematical",
    note:
      "Two travelling waves added at every point — the plainest case of superposition on this site, and the one the other two cases are compared against.",
  },
  {
    id: "laboratory/fourier-explorer--concept/superposition",
    from: "laboratory/fourier-explorer",
    to: "concept/superposition",
    kind: "mathematical",
    note:
      "Fourier Explorer's own notes say it directly: \"superposition is linear, so the sum at any instant is just the terms added together, exactly as in the Wave Superposition instrument — this one simply allows more than two.\"",
  },
  {
    id: "laboratory/quantum-mechanics-explorer--concept/superposition",
    from: "laboratory/quantum-mechanics-explorer",
    to: "concept/superposition",
    kind: "conceptual",
    note:
      "Mode B combines stationary states ψₙ with coefficients cₙ into one wavefunction — the same linear addition of basis functions, but the coefficients are complex probability amplitudes, not physical displacements, and what beats is a probability density, not a string. Related mathematics, not the same physics.",
  },
  {
    id: "laboratory/fourier-explorer--concept/fourier-frequency-domain",
    from: "laboratory/fourier-explorer",
    to: "concept/fourier-frequency-domain",
    kind: "mathematical",
    note:
      "Builds a periodic signal forward, one harmonic at a time, and shows its discrete amplitude spectrum beside it — the forward direction of frequency-domain analysis.",
  },
  {
    id: "research/power-spectral-density-eeg-signal-quality--concept/fourier-frequency-domain",
    from: "research/power-spectral-density-eeg-signal-quality",
    to: "concept/fourier-frequency-domain",
    kind: "mathematical",
    note:
      "Takes the power spectral density of a real EEG recording via the fast Fourier transform — the reverse direction: reading a signal's frequency content back out of it.",
  },
  {
    id: "research/gravitational-waves-binary-black-holes--concept/fourier-frequency-domain",
    from: "research/gravitational-waves-binary-black-holes",
    to: "concept/fourier-frequency-domain",
    kind: "conceptual",
    note:
      "Compares a simulated chirp's frequency sweep against real LIGO spectrograms — a frequency-domain view of a time signal, though by comparing a sweep's shape over time rather than decomposing it into the instrument's discrete harmonics.",
  },
  {
    id: "projects/mathematics-perception-and-expression--projects/generative-art-playground",
    from: "projects/mathematics-perception-and-expression",
    to: "projects/generative-art-playground",
    kind: "thematic",
    note:
      "The project's own page links directly to the Generative Art Playground as \"a place to put a hand to it\" — the same mathematics made something to look at, not an answer to the question the project is actually asking.",
  },
  {
    id: "projects/mathematics-perception-and-expression--research/perspectives-in-motion",
    from: "projects/mathematics-perception-and-expression",
    to: "research/perspectives-in-motion",
    kind: "thematic",
    note:
      "Both are filed under the site's own \"Mathematics & Perception\" area and ask a version of the same question — whether the structures used to describe perception say anything about art or observation — approached from different directions. Two separate early explorations, not one line of work.",
  },
  {
    id: "books/cosmos--research/gravitational-waves-binary-black-holes",
    from: "books/cosmos",
    to: "research/gravitational-waves-binary-black-holes",
    kind: "personal",
    note:
      "The About page credits Cosmos with the sense that studying the universe is also a way of understanding what it means to belong to it. The gravitational-waves project turns a small piece of that same universe into equations — a shared subject, not a claim that the book caused the research.",
  },
];
