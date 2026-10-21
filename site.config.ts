/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SITE CONFIGURATION
 *  Everything identity-related lives here. Edit this file and nothing else
 *  to change your name, affiliation, introduction, links, or CV file.
 *  Any link left as an empty string is hidden everywhere on the site.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const site = {
  /** Displayed everywhere as the site owner. */
  name: "Iris [Surname]",
  /** Used in tight spaces (mobile header, footer mark). */
  shortName: "Iris",
  /** Institution or affiliation. */
  affiliation: "Rutgers University",
  /** A short academic position line. Leave empty to hide. */
  position: "Undergraduate, Mathematics & Physical Sciences",
  /** Where the site is deployed. Used for metadata, sitemap and Open Graph. */
  url: "https://example.com",
  /** Browser tab / metadata title suffix. */
  titleSuffix: "Iris [Surname]",

  /** Homepage headline. Kept short on purpose. */
  headline: "Between the abstract and the tangible.",

  /** Homepage introductory statement. One or two sentences. */
  intro:
    "Exploring mathematics and the physical sciences, with an enduring curiosity about philosophy, literature, and the ways we perceive and express the world.",

  /** One-line description used for search engines and link previews. */
  description:
    "Academic homepage and intellectual archive — mathematics, the physical sciences, philosophy and literature.",

  /**
   * Professional links. Leave a value as "" and it disappears from the
   * contact page, the footer, and structured metadata.
   */
  links: {
    email: "",
    github: "",
    scholar: "",
    orcid: "",
    linkedin: "",
  },

  /**
   * Additional links, shown on the contact page in order.
   * e.g. { label: "arXiv", href: "https://arxiv.org/a/..." }
   */
  extraLinks: [] as { label: string; href: string; note?: string }[],

  /**
   * Curriculum Vitae PDF.
   * Put the file at public/cv/<filename> and set `pdf` to "/cv/<filename>".
   * While this is null, the download button is rendered as a quiet
   * "not yet available" note instead of a broken link.
   */
  cv: {
    pdf: null as string | null,
    updated: "", // e.g. "October 2026"
  },

  /** A short line at the top of the contact page. Leave empty to hide. */
  contactNote:
    "For academic correspondence, collaboration, or questions about anything on this site.",

  /** Footer closing note. Leave empty to hide. */
  footerNote: "",
} as const;

/** Primary navigation. Order here is the order in the header. */
export const navigation = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Research", href: "/research" },
  { label: "Writings", href: "/writings" },
  { label: "Notebook", href: "/notebook" },
  { label: "CV", href: "/cv" },
] as const;

/** Shown after the primary navigation, separated by a hairline. */
export const secondaryNavigation = [{ label: "Contact", href: "/contact" }] as const;

export type SiteConfig = typeof site;
