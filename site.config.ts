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
  affiliation: "Rutgers University–New Brunswick",
  /** A short academic position line. Leave empty to hide. Phrased as ongoing
   * study rather than a declared major — no record on this site confirms
   * the Chemical Physics / Mathematics pairing as a formally declared
   * double major. */
  position: "Undergraduate studying Chemical Physics and Mathematics",
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
    "I’m an undergraduate student studying Chemical Physics and Mathematics at Rutgers University–New Brunswick.",
    "I’m interested in the mathematical structures underlying the physical world, the questions that emerge when we try to understand it, and the unexpected connections between science, philosophy, literature, and art.",
  ],

  /** One-line description used for search engines and link previews. */
  description:
    "Iris (Jieun) Kim | Chemical Physics & Mathematics at Rutgers University–New Brunswick.",

  /**
   * Professional links. Leave a value as "" and it disappears from the
   * contact page, the footer, and structured metadata.
   */
  links: {
    email: "jk2575@scarletmail.rutgers.edu",
    github: "https://github.com/nemojjii",
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

export interface NavItem {
  label: string;
  href: string;
  /**
   * Routes that also count as "here" for this item — the Bookshelf and the
   * Screening Room live under Collection, and the Generative Art Playground
   * under Little Laboratory, without crowding the header.
   */
  includes?: readonly string[];
  /** Listed beneath the item in the mobile menu and the footer. */
  children?: readonly { label: string; href: string }[];
  /**
   * Renders as a dropdown on desktop instead of a plain link — the trigger
   * toggles a short list of its own `children` rather than navigating
   * directly. Opt-in per item (Collection also has `children`, for the
   * mobile menu and footer, but stays a plain desktop link).
   */
  desktopDropdown?: boolean;
}

/** Primary navigation. Order here is the order in the header. */
export const navigation: readonly NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Research", href: "/research" },
  { label: "Projects", href: "/projects" },
  {
    label: "Collection",
    href: "/collection",
    includes: ["/bookshelf", "/films"],
    children: [
      { label: "The Bookshelf", href: "/bookshelf" },
      { label: "The Screening Room", href: "/films" },
    ],
  },
  {
    label: "Little Laboratory",
    href: "/laboratory",
    includes: ["/projects/generative-art"],
    desktopDropdown: true,
    children: [
      { label: "Little Laboratory", href: "/laboratory" },
      { label: "Generative Art", href: "/projects/generative-art" },
    ],
  },
  { label: "CV", href: "/cv" },
];

/** Shown after the primary navigation, separated by a hairline. */
export const secondaryNavigation: readonly NavItem[] = [
  { label: "Investigation Board", href: "/connected-ideas" },
  { label: "Contact", href: "/contact" },
];

export type SiteConfig = typeof site;
