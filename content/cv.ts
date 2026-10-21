/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CURRICULUM VITAE
 *  Structured data rather than prose, so that the page and its print layout
 *  stay consistent as it grows. Add items to any section; empty sections are
 *  handled for you.
 *
 *  Anything written in [square brackets] is a placeholder — replace it.
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
        // Add the degree title, dates and any honours once they are settled.
        title: "Undergraduate, Chemical Physics & Mathematics",
        organisation: "Rutgers University",
      },
    ],
  },
  {
    id: "research-experience",
    label: "Research Experience",
    kind: "items",
    // Titles only for now. Add the institution, period, supervisor and a
    // one-line description to each as you recover the details.
    items: [
      {
        title:
          "Study on Power Spectral Density by Improving Electroencephalography Signal Quality",
      },
      {
        title:
          "Predicting Chemical Biodegradability Using Molecular Spectrum Data Through Machine Learning Classification",
      },
      {
        title:
          "Solving Consensus Dynamics in Networks Using Mathematical and Computational Methods",
      },
      { title: "Modeling Gravitational Waves from Binary Black Hole Systems" },
      { title: "Image Processing Using MRI Nuclear Physics and Computational Simulations" },
    ],
  },
  {
    id: "projects",
    label: "Projects",
    kind: "items",
    items: [],
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
  {
    id: "awards",
    label: "Awards & Honours",
    kind: "items",
    items: [],
  },
  {
    id: "skills",
    label: "Skills",
    kind: "groups",
    groups: [],
  },
];
