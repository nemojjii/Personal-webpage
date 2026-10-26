import type { BoardNode } from "./types.ts";

/**
 * Fifteen curated nodes — not every page on the site, only the ones with a
 * real, citable connection to at least one other, plus two deliberately
 * isolated real projects kept for the board's honesty rather than its
 * density. See lib/board/edges.ts for what connects them and why, and the
 * Phase 20 audit notes for what was left out and why (the Bookshelf and
 * Screening Room have no reviewed/interpretive text to connect from, with
 * the single exception of Cosmos, which the About page does discuss).
 *
 * Positions (x, y) are a hand-composed default layout, not a force
 * simulation: five loose neighborhoods — computational research (far
 * left), the art-and-perception cluster (bottom), literature (bridging the
 * two, by way of Cosmos and the gravitational-waves entry), the Little
 * Laboratory instruments and their concept hubs (right and center), and
 * genuinely independent work kept physically apart (Phase 20.1).
 */
export const boardNodes: BoardNode[] = [
  // Research
  {
    id: "research/power-spectral-density-eeg-signal-quality",
    category: "research",
    title: "Area of Alpha Band in EEG for Stability Analysis",
    subtitle: "Signal Processing & Neurophysics",
    summary:
      "Measuring the area under the alpha band of an EEG spectrum as a quantitative index of restfulness, with an autoencoder trained to denoise the signal before the spectrum is taken.",
    href: "/research/power-spectral-density-eeg-signal-quality",
    x: 190,
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
    x: 190,
    y: 380,
  },
  {
    id: "research/perspectives-in-motion",
    category: "research",
    title: "Perspectives in Motion",
    subtitle: "Mathematics & Perception · early exploration",
    summary:
      "An early exploration of moving viewpoints, spatial perception, and the mathematical construction of visual landscapes, emerging from conversations with artist Jongseong Cho.",
    href: "/research/perspectives-in-motion",
    x: 430,
    y: 800,
  },
  {
    id: "research/gravitational-waves-binary-black-holes",
    category: "research",
    title: "Gravitational Waves from Binary Black Hole Systems",
    subtitle: "Computational Astrophysics",
    summary:
      "A deliberately classical model of a black-hole inspiral: Newtonian circular orbits losing energy at the Peters–Mathews rate, with the resulting frequency sweep compared against LIGO's observations.",
    href: "/research/gravitational-waves-binary-black-holes",
    x: 190,
    y: 620,
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
    x: 660,
    y: 860,
  },
  {
    id: "projects/generative-art-playground",
    category: "project",
    title: "Generative Art Playground",
    subtitle: "Mathematics, Computational Art & Interactive Visualization",
    summary:
      "An interactive exploration of mathematical structures as visual art, through complex transformations, vector fields, and parametric curves.",
    href: "/projects/generative-art",
    x: 900,
    y: 800,
  },
  {
    id: "projects/asymptote-ftc-robotics",
    category: "project",
    title: "αsymptote — Mechanical Design & Robotics",
    subtitle: "FIRST Tech Challenge · Team 26039 · 2024–2025",
    summary:
      "Mechanical Lead of FIRST Tech Challenge Team 26039 in the 2024–2025 INTO THE DEEP season: robot mechanisms, with a part in design reviews and development decisions.",
    href: "/projects/asymptote-ftc-robotics",
    x: 1420,
    y: 160,
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
    x: 960,
    y: 120,
  },
  {
    id: "laboratory/gradient-descent",
    category: "laboratory",
    title: "Gradient Descent",
    subtitle: "How does a step downhill find the bottom of a bowl?",
    summary:
      "A point on a bowl-shaped surface, moved downhill one step at a time against the gradient, with the conditions for convergence, oscillation and divergence.",
    href: "/laboratory/gradient-descent",
    x: 470,
    y: 330,
  },
  {
    id: "laboratory/reaction-kinetics",
    category: "laboratory",
    title: "Reaction Kinetics",
    subtitle: "How quickly does a reactant disappear when its rate is its own concentration?",
    summary:
      "An idealised first-order reaction, A → products: the exponential decay, its half-life, and the moment-by-moment rate.",
    href: "/laboratory/reaction-kinetics",
    x: 1420,
    y: 650,
  },
  {
    id: "laboratory/fourier-explorer",
    category: "laboratory",
    title: "Fourier Explorer",
    subtitle: "What does a periodic signal look like taken apart, one frequency at a time?",
    summary:
      "A finite sum of sine waves, built one harmonic at a time, with the time-domain sum and the discrete amplitude spectrum shown side by side.",
    href: "/laboratory/fourier-explorer",
    x: 1230,
    y: 190,
  },
  {
    id: "laboratory/quantum-mechanics-explorer",
    category: "laboratory",
    title: "Quantum Mechanics Explorer",
    subtitle: "What does it mean for a particle to be confined, in superposition, or measured?",
    summary:
      "One particle in a one-dimensional box, put to four tests: its stationary states, a superposition of them evolving in time, tunneling through a barrier, and position measurement.",
    href: "/laboratory/quantum-mechanics-explorer",
    x: 1230,
    y: 420,
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
    x: 940,
    y: 260,
  },
  {
    id: "concept/fourier-frequency-domain",
    category: "concept",
    title: "Fourier & Frequency-Domain Analysis",
    subtitle: "Reading a signal by its frequencies rather than its timeline",
    summary:
      "Building a periodic signal from its harmonics, and reading a recorded signal's frequency content back out of it, are the forward and reverse sides of the same analysis.",
    x: 680,
    y: 400,
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
    x: 430,
    y: 560,
  },
];
