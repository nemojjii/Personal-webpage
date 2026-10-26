/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CURRICULUM VITAE
 *  Structured data rather than prose, so that the page and its print layout
 *  stay consistent as it grows. Add items to any section; empty sections are
 *  handled for you.
 *
 *  Anything written in [square brackets] is a placeholder — replace it.
 *
 *  Every item below is traceable to a verified, already-published source —
 *  a content/research/*.mdx or content/projects/*.mdx entry, or this file's
 *  own prior content — not to a résumé, memory, or inference. Where a source
 *  entry's own notes flag something as unverified, that detail is left out
 *  here too; see each entry's own "NOTES REQUIRING VERIFICATION" block for
 *  why. Nothing here is represented as a peer-reviewed publication: none of
 *  these manuscripts or posters have been.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface CvItem {
  /** Degree, position, award, talk or project title. */
  title: string;
  organisation?: string;
  location?: string;
  /** e.g. "2025 – present", "May 2026". */
  period?: string;
  /** A single qualifying line, set in italics. */
  note?: string;
  /** Bullet lines. */
  details?: string[];
  /** Makes the title a link — a DOI, a repository, a recording. */
  href?: string;
}

export type CvSection =
  | { id: string; label: string; kind: "items"; items: CvItem[] }
  | {
      id: string;
      label: string;
      kind: "groups";
      groups: { label: string; items: string[] }[];
    };

export const cvConfig = {
  /**
   * When true, sections with nothing in them still appear, with a quiet note.
   * Set to false once the CV is full enough that empty headings look odd.
   */
  showEmptySections: true,
  /** Optional single line under the name. */
  standfirst: "",
};

export const cvSections: CvSection[] = [
  {
    id: "education",
    label: "Education",
    kind: "items",
    items: [
      {
        // Phrased as ongoing study, not a declared major: no record on this
        // site confirms the Chemical Physics / Mathematics pairing as a
        // formally declared double major, only that these are the subjects
        // of study (site.config.ts intro; content/pages/about.mdx).
        title: "Undergraduate Studies in Chemical Physics and Mathematics",
        organisation: "Rutgers University–New Brunswick",
      },
    ],
  },
  {
    id: "research-interests",
    label: "Research Interests",
    kind: "groups",
    // The `area` field of each content/research/*.mdx entry, verbatim.
    groups: [
      {
        label: "Areas",
        items: [
          "Signal Processing & Neurophysics",
          "Cheminformatics & Machine Learning",
          "Graph Theory & Network Dynamics",
          "Computational Astrophysics",
          "Mathematics & Perception",
        ],
      },
    ],
  },
  {
    id: "research-experience",
    label: "Research Experience",
    kind: "items",
    // One item per content/research/*.mdx entry with any actual
    // investigative work reported (so not "Perspectives in Motion" — an
    // early exploration with nothing yet to report as experience; see that
    // entry). Titles and status notes follow each entry's own frontmatter
    // exactly. "Earlier independent and school-based research" is each
    // entry's own `context` field, not a new characterisation.
    items: [
      {
        // Title corrected to match the research page (changed there
        // 2026-10-21 to follow the poster; this file had not been updated
        // to match — see content/research/power-spectral-density-eeg-signal-quality.mdx's
        // own verification notes, which flagged exactly this gap).
        title: "Area of Alpha Band in EEG for Stability Analysis",
        organisation: "Independent and school-based research",
        note: "Completed",
        href: "/research/power-spectral-density-eeg-signal-quality",
      },
      {
        title:
          "Predicting Chemical Biodegradability Using Molecular Structure Data Through Machine Learning Classification",
        organisation: "Independent and school-based research",
        note: "Completed",
        href: "/research/chemical-biodegradability-molecular-structure-ml",
      },
      {
        title:
          "Solving Consensus Dynamics in Networks Using Mathematical and Computational Method",
        organisation: "Independent and school-based research",
        note: "Ongoing investigation; earlier manuscript and poster completed",
        href: "/research/consensus-dynamics-in-networks",
      },
      {
        title: "Calculations of Gravitational Waves from Binary Black Hole Systems",
        organisation: "Independent and school-based research",
        note: "Completed",
        href: "/research/gravitational-waves-binary-black-holes",
      },
      {
        title: "Image Processing Using MRI Nuclear Physics and Computational Simulations",
        organisation: "Independent and school-based research",
        note: "Preliminary work",
        href: "/research/mri-nuclear-physics-image-processing",
      },
    ],
  },
  {
    id: "research-outputs",
    label: "Selected Research Outputs",
    kind: "items",
    // The documented artefact behind each completed or partly-completed
    // entry above — a manuscript, a poster, or both, per that entry's own
    // body text. Deliberately excludes the MRI entry ("MANUSCRIPT. None.",
    // per its own verification notes) and Perspectives in Motion (nothing
    // written up yet). None of these is described as a publication: none
    // has been peer-reviewed or carries a claimed venue.
    items: [
      {
        title: "Area of Alpha Band in EEG for Stability Analysis",
        note: "Poster",
        href: "/research/power-spectral-density-eeg-signal-quality",
      },
      {
        title:
          "Predicting Chemical Biodegradability Using Molecular Structure Data Through Machine Learning Classification",
        note: "Manuscript",
        href: "/research/chemical-biodegradability-molecular-structure-ml",
      },
      {
        title:
          "Solving Consensus Dynamics in Networks Using Mathematical and Computational Method",
        note: "Manuscript and poster",
        href: "/research/consensus-dynamics-in-networks",
      },
      {
        title: "Calculations of Gravitational Waves from Binary Black Hole Systems",
        note: "Manuscript",
        href: "/research/gravitational-waves-binary-black-holes",
      },
    ],
  },
  {
    id: "skills",
    label: "Technical Skills",
    kind: "groups",
    // Only tools, languages and methods named explicitly in a research or
    // project entry's own body text (not inferred from a technique or
    // guessed from a field of study) — e.g. MATLAB appears once in the MRI
    // entry, inside a passage its own notes flag as unverified whether the
    // results are Iris's own, so it is not listed here. Web development
    // tools are this site's own, visible directly in this repository.
    groups: [
      { label: "Languages", items: ["Python", "TypeScript"] },
      {
        label: "Scientific computing",
        items: ["NumPy", "SciPy", "Matplotlib", "networkx", "pyedflib"],
      },
      {
        label: "Methods",
        items: [
          "Autoencoder-based signal denoising",
          "Classification modelling (decision tree, SVM, random forest, k-nearest neighbours)",
          "Numerical integration (explicit Euler)",
        ],
      },
      { label: "Web development", items: ["React", "Next.js", "Inline SVG data visualisation"] },
    ],
  },
  {
    id: "awards",
    label: "Honors & Awards",
    kind: "items",
    // From the FIRST Tech Challenge official team record, already linked
    // from content/projects/asymptote-ftc-robotics.mdx. Two further
    // qualifier-round awards exist on the same record but are not listed
    // on that project's own page yet, so are left out here too.
    items: [
      {
        title: "Innovate Award sponsored by RTX — 2nd Place",
        organisation: "FIRST Tech Challenge, New York – Long Island Championship",
        period: "2024–2025",
        href: "https://ftc-events.firstinspires.org/team/26039",
      },
      {
        title: "Finalist Alliance — 1st Team Selected",
        organisation: "FIRST Tech Challenge, New York – Long Island Championship",
        period: "2024–2025",
        href: "https://ftc-events.firstinspires.org/team/26039",
      },
      // Verified directly against https://www.challengeu.org/winners-c
      // (fetched 2026-10-26): the page lists "Jieun Kim, The Stony Brook
      // School" under its "Gold Award" heading, for the "International
      // Peace and Security Challenge" — an essay competition (the page's
      // own intro: "reviewing more than 180 outstanding essay
      // submissions"), not a publication. No year is given anywhere on
      // the page for this entry; its only year is a site-wide "© 2023 by
      // ChallengeU" footer, which is not an award date and is not used as
      // one here — `period` is left unset rather than asserting a year
      // ("2024") the source does not confirm. Flag this to Iris: if a
      // correct year is known from elsewhere (certificate, notification
      // email), add it as `period` below.
      {
        title: "Gold Award — International Peace and Security Challenge",
        organisation: "ChallengeU",
        location: "The Stony Brook School",
        href: "https://www.challengeu.org/winners-c",
      },
    ],
  },
  {
    id: "projects",
    label: "Selected Projects",
    kind: "items",
    // One item per content/projects/*.mdx entry (all four).
    items: [
      {
        title: "Little Laboratory — Interactive Scientific Explorations",
        organisation: "Independent development",
        note: "Ongoing",
        period: "Since October 2026",
        href: "/projects/little-laboratory",
      },
      {
        title: "Generative Art Playground",
        organisation: "Independent development",
        note: "Ongoing",
        period: "Since October 2026",
        href: "/projects/generative-art",
      },
      {
        title: "αsymptote — Mechanical Design & Robotics",
        organisation: "FIRST Tech Challenge · Team 26039",
        note: "Mechanical Lead",
        period: "2024–2025 season",
        href: "/projects/asymptote-ftc-robotics",
      },
      {
        title: "Mathematics, Perception, and Artistic Expression",
        note: "Early exploration",
        href: "/projects/mathematics-perception-and-expression",
      },
    ],
  },
  {
    id: "publications",
    label: "Publications",
    kind: "items",
    items: [],
  },
  {
    id: "presentations",
    label: "Presentations",
    kind: "items",
    items: [],
  },
  {
    id: "teaching",
    label: "Teaching & Tutoring",
    kind: "items",
    items: [],
  },
];
