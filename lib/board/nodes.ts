import type { BoardNode } from "./types.ts";

/**
 * Fifteen curated evidence nodes — not every page on the site, only the
 * ones with a real, citable connection to at least one other, plus two
 * deliberately isolated real projects kept for the board's honesty rather
 * than its density — plus, as of Phase 20.7, a sixteenth node that is not
 * evidence at all: the case file for the investigation itself (IK-001, see
 * below). See lib/board/edges.ts for what connects the fifteen and why, and
 * the Phase 20 audit notes for what was left out and why (the Bookshelf and
 * Screening Room have no reviewed/interpretive text to connect from, with
 * the single exception of Cosmos, which the About page does discuss).
 *
 * Positions (x, y) are a hand-composed default layout, not a force
 * simulation. Phase 20.7.1 put IK-001 at the centre of its own ring — the
 * EEG research, Fourier Explorer, Wave Superposition and both concept
 * hubs, at varied distances and angles (solved by a small AABB-separation
 * script so none of the six overlap; never a uniform radial spoke
 * pattern) — and left everything outside that ring exactly where Phase
 * 20.6 put it: Science & Physics (right, around Quantum Mechanics Explorer
 * and Gravitational Waves), Mathematics & Computation's outer pair,
 * Gradient Descent and Consensus Dynamics (lower-left), Art & Perception
 * (bottom-centre), Literature & Cinema's one entry, Cosmos (right), and the
 * two genuinely independent, deliberately unconnected projects kept apart
 * in their own corner (Phase 20.1). See boardLayout.ts's
 * DEFAULT_VIEW_BOUNDS for the exact camera framing (computed from this
 * ring's own rendered footprint, not eyeballed) and neighborhoodLabels for
 * where each outer area is labelled.
 */
export const boardNodes: BoardNode[] = [
  // The case file — the board's narrative anchor and, as of Phase 20.7.1,
  // its physical centre. Fixed at this point first; the five nodes below
  // that make up its ring (EEG, Fourier Explorer, both concept hubs, Wave
  // Superposition) were then placed around it, asymmetrically, close
  // enough that none of the six overlap. Deliberately has no editorial
  // edges: see lib/board/edges.ts's header comment and
  // components/board/InvestigationBoard.tsx, where selecting it opens
  // IrisKimCaseFile rather than the generic ArtifactCaseFile.
  {
    id: "case/iris-kim",
    category: "case",
    title: "Who is Iris Kim?",
    subtitle: "An unfinished investigation.",
    summary:
      "The case file for the investigation itself — who pursues the research, mathematics, and art pinned up elsewhere on this wall. Built only from this site's own verified About, CV and content pages; still being written.",
    x: 470,
    y: 330,
  },

  // Research
  {
    id: "research/power-spectral-density-eeg-signal-quality",
    category: "research",
    title: "Area of Alpha Band in EEG for Stability Analysis",
    subtitle: "Signal Processing & Neurophysics",
    summary:
      "Measuring the area under the alpha band of an EEG spectrum as a quantitative index of restfulness, with an autoencoder trained to denoise the signal before the spectrum is taken.",
    href: "/research/power-spectral-density-eeg-signal-quality",
    // Upper-left of IK-001, closest of the ring (Phase 20.7.1).
    x: 140,
    y: 160,
  },
  {
    id: "research/consensus-dynamics-in-networks",
    category: "research",
    title: "Solving Consensus Dynamics in Networks",
    subtitle: "Graph Theory & Network Dynamics",
    summary:
      "How the structure of a network decides whether a group of agents can agree — worked through adjacency, degree and Laplacian matrices, and simulated on graphs from four nodes to a hundred.",
    href: "/research/consensus-dynamics-in-networks",
    x: 220,
    y: 1000,
  },
  {
    id: "research/perspectives-in-motion",
    category: "research",
    title: "Perspectives in Motion",
    subtitle: "Mathematics & Perception · early exploration",
    summary:
      "An early exploration of moving viewpoints, spatial perception, and the mathematical construction of visual landscapes, emerging from conversations with artist Jongseong Cho.",
    href: "/research/perspectives-in-motion",
    x: 560,
    y: 1060,
  },
  {
    id: "research/gravitational-waves-binary-black-holes",
    category: "research",
    title: "Gravitational Waves from Binary Black Hole Systems",
    subtitle: "Computational Astrophysics",
    summary:
      "A deliberately classical model of a black-hole inspiral: Newtonian circular orbits losing energy at the Peters–Mathews rate, with the resulting frequency sweep compared against LIGO's observations.",
    href: "/research/gravitational-waves-binary-black-holes",
    x: 1150,
    y: 710,
  },

  // Projects
  {
    id: "projects/mathematics-perception-and-expression",
    category: "project",
    title: "Mathematics, Perception, and Artistic Expression",
    subtitle: "An early exploration",
    summary:
      "A developing interest, not a research project: whether the mathematics used to describe perception has anything to say about the choices made in art, and where the analogy stops being useful.",
    href: "/projects/mathematics-perception-and-expression",
    x: 640,
    y: 920,
  },
  {
    id: "projects/generative-art-playground",
    category: "project",
    title: "Generative Art Playground",
    subtitle: "Mathematics, Computational Art & Interactive Visualization",
    summary:
      "An interactive exploration of mathematical structures as visual art, through complex transformations, vector fields, and parametric curves.",
    href: "/projects/generative-art",
    x: 880,
    y: 970,
  },
  {
    id: "projects/asymptote-ftc-robotics",
    category: "project",
    title: "αsymptote — Mechanical Design & Robotics",
    subtitle: "FIRST Tech Challenge · Team 26039 · 2024–2025",
    summary:
      "Mechanical Lead of FIRST Tech Challenge Team 26039 in the 2024–2025 INTO THE DEEP season: robot mechanisms, with a part in design reviews and development decisions.",
    href: "/projects/asymptote-ftc-robotics",
    x: 1580,
    y: 220,
  },

  // Little Laboratory
  {
    id: "laboratory/wave-superposition",
    category: "laboratory",
    title: "Wave Superposition",
    subtitle: "What happens where two waves share one string?",
    summary:
      "Two travelling sine waves and their sum, drawn on the same string: amplitudes, wave numbers, relative phase, and the constructive and destructive regions of their sum.",
    href: "/laboratory/wave-superposition",
    // Lower-left of IK-001, the furthest of the ring (Phase 20.7.1).
    x: 110,
    y: 550,
  },
  {
    id: "laboratory/gradient-descent",
    category: "laboratory",
    title: "Gradient Descent",
    subtitle: "How does a step downhill find the bottom of a bowl?",
    summary:
      "A point on a bowl-shaped surface, moved downhill one step at a time against the gradient, with the conditions for convergence, oscillation and divergence.",
    href: "/laboratory/gradient-descent",
    x: 180,
    y: 820,
  },
  {
    id: "laboratory/reaction-kinetics",
    category: "laboratory",
    title: "Reaction Kinetics",
    subtitle: "How quickly does a reactant disappear when its rate is its own concentration?",
    summary:
      "An idealised first-order reaction, A → products: the exponential decay, its half-life, and the moment-by-moment rate.",
    href: "/laboratory/reaction-kinetics",
    x: 1580,
    y: 480,
  },
  {
    id: "laboratory/fourier-explorer",
    category: "laboratory",
    title: "Fourier Explorer",
    subtitle: "What does a periodic signal look like taken apart, one frequency at a time?",
    summary:
      "A finite sum of sine waves, built one harmonic at a time, with the time-domain sum and the discrete amplitude spectrum shown side by side.",
    href: "/laboratory/fourier-explorer",
    // Upper-right of IK-001 (Phase 20.7.1).
    x: 801,
    y: 100,
  },
  {
    id: "laboratory/quantum-mechanics-explorer",
    category: "laboratory",
    title: "Quantum Mechanics Explorer",
    subtitle: "What does it mean for a particle to be confined, in superposition, or measured?",
    summary:
      "One particle in a one-dimensional box, put to four tests: its stationary states, a superposition of them evolving in time, tunneling through a barrier, and position measurement.",
    href: "/laboratory/quantum-mechanics-explorer",
    x: 1120,
    y: 560,
  },

  // Concepts — hubs for a mathematical structure genuinely shared by three
  // or more of the nodes above, not a restatement of a single pairwise link.
  {
    id: "concept/superposition",
    category: "concept",
    title: "Superposition",
    subtitle: "Adding solutions together to get another solution",
    summary:
      "The same linear structure — a sum of basis terms, each with its own coefficient — underlies a classical wave sum, a finite Fourier series, and a quantum state, even though what the coefficients mean differs in each.",
    // Right of IK-001, close (Phase 20.7.1).
    x: 840,
    y: 420,
  },
  {
    id: "concept/fourier-frequency-domain",
    category: "concept",
    title: "Fourier & Frequency-Domain Analysis",
    subtitle: "Reading a signal by its frequencies rather than its timeline",
    summary:
      "Building a periodic signal from its harmonics, and reading a recorded signal's frequency content back out of it, are the forward and reverse sides of the same analysis.",
    // Below IK-001, slightly left (Phase 20.7.1).
    x: 410,
    y: 630,
  },

  // Books
  {
    id: "books/cosmos",
    category: "book",
    title: "Cosmos",
    subtitle: "Carl Sagan",
    summary:
      "Credited on the About page with giving words to a sense of belonging to the universe — 'we are made of the same matter as the stars.'",
    href: "/bookshelf/cosmos",
    // The same Open Library cover already used on this book's own Bookshelf page (content/books/cosmos.mdx).
    coverImage: "https://covers.openlibrary.org/b/id/10601318-L.jpg",
    x: 1370,
    y: 830,
  },
];
