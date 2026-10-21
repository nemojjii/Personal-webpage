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
  name: "Iris (Jieun) Kim",
  /** Used in tight spaces (mobile header, footer mark). */
  shortName: "Iris",
  /** Institution or affiliation. */
  affiliation: "Rutgers University",
  /** A short academic position line. Leave empty to hide. */
  position: "Undergraduate, Chemical Physics & Mathematics",
  /** Where the site is deployed. Used for metadata, sitemap and Open Graph. */
  url: "https://www.itsmeiris.com",
  /** Browser tab / metadata title suffix. */
  titleSuffix: "Iris (Jieun) Kim",

  /** Homepage headline. Kept short on purpose. */
  headline: "Between the abstract and the tangible.",

  /**
   * Homepage introduction. One paragraph per entry — kept short on purpose,
   * since the About page is where the longer account lives.
   */
  intro: [
    "I’m an undergraduate student studying Chemical Physics and Mathematics at Rutgers University.",
    "I’m interested in the mathematical structures underlying the physical world, the questions that emerge when we try to understand it, and the unexpected connections between science, philosophy, literature, and art.",
  ],

  /** One-line description used for search engines and link previews. */
  description:
    "Academic homepage and intellectual archive of Iris (Jieun) Kim — chemical physics and mathematics at Rutgers University, with research in theoretical science and mathematical modeling.",

  /**
   * Professional links. Leave a value as "" and it disappears from the
   * contact page, the footer, and structured metadata.
   */
  links: {
    email: "jk2575@scarletmail.rutgers.edu",
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
  { label: "Projects", href: "/projects" },
  { label: "Writings", href: "/writings" },
  { label: "Notebook", href: "/notebook" },
  { label: "CV", href: "/cv" },
] as const;

/** Shown after the primary navigation, separated by a hairline. */
export const secondaryNavigation = [{ label: "Contact", href: "/contact" }] as const;

export type SiteConfig = typeof site;
