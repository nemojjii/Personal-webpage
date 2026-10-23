/** The content collections. Each maps to content/<collection>/. */
export const collections = ["research", "projects", "books", "films"] as const;
export type Collection = (typeof collections)[number];

/**
 * Who may see an entry.
 *   public  — built, listed, searchable, in the sitemap.
 *   draft   — visible only in `npm run dev`; absent from every production artefact.
 *   private — as draft. Kept distinct so your intent is recorded in the file.
 * The filter lives in lib/content.ts and runs at build time, so a non-public
 * entry produces no page, no route, no search data and no sitemap line.
 */
export const visibilities = ["public", "draft", "private"] as const;
export type Visibility = (typeof visibilities)[number];

/** Reading status for the Bookshelf. "unspecified" is the honest default. */
export const readingStatuses = {
  unspecified: { label: "" },
  reading: { label: "Reading" },
  finished: { label: "Finished" },
  "to-read": { label: "To read" },
  abandoned: { label: "Set aside" },
} as const;
export type ReadingStatus = keyof typeof readingStatuses;

/** Viewing status for the Screening Room. */
export const viewingStatuses = {
  unspecified: { label: "" },
  watched: { label: "Watched" },
  rewatched: { label: "Rewatched" },
  "to-watch": { label: "To watch" },
} as const;
export type ViewingStatus = keyof typeof viewingStatuses;

/** Research project lifecycle. The key is what you write in frontmatter. */
export const researchStatuses = {
  idea: { label: "Research Idea", order: 4 },
  "in-progress": { label: "In Progress", order: 1 },
  /** Experiments were run, but the work was not developed into a documented study. */
  preliminary: { label: "Preliminary Work", order: 3 },
  completed: { label: "Completed", order: 2 },
  publication: { label: "Publication", order: 0 },
} as const;
export type ResearchStatus = keyof typeof researchStatuses;

/**
 * Where a project stands. Deliberately not the same vocabulary as research:
 * these are explorations, and saying so is the point.
 */
export const projectStages = {
  exploration: { label: "Early Exploration", order: 0 },
  ongoing: { label: "Ongoing", order: 1 },
  "set-aside": { label: "Set Aside", order: 3 },
  finished: { label: "Finished", order: 2 },
} as const;
export type ProjectStage = keyof typeof projectStages;

/**
 * A reference to another entry, written in frontmatter as "collection/slug".
 * "laboratory/<slug>" refers to an experiment in lib/laboratory.ts.
 */
export type EntryRef = string;

/**
 * How an experiment and an entry are related — an editorial judgement,
 * written by hand, never inferred from tags or keywords.
 *   mathematical — the same mathematics, read in two places.
 *   conceptual   — one gives intuition for the other; not the same object.
 */
export const relationKinds = {
  mathematical: { label: "Mathematical connection" },
  conceptual: { label: "Conceptual connection" },
} as const;
export type RelationKind = keyof typeof relationKinds;

export interface EntryBase {
  collection: Collection;
  slug: string;
  /** "collection/slug" — the canonical identifier used by the relations system. */
  ref: EntryRef;
  href: string;
  title: string;
  subtitle?: string;
  /** Short abstract / standfirst. Used on index pages and in link previews. */
  summary?: string;
  /** May be empty: an entry whose date is not yet settled is still listed. */
  date: string;
  updated?: string;
  tags: string[];
  /** Legacy flag, still honoured: `draft: true` means visibility "draft". */
  draft: boolean;
  visibility: Visibility;
  /** Lifts an entry into the featured group on its index, and onto the homepage. */
  featured: boolean;
  /** Manual sort key within a group, ascending. Falls back to date. */
  order?: number;
  /** Explicit outgoing relations declared in frontmatter. */
  related: EntryRef[];
  /** Raw MDX body. */
  body: string;
  readingMinutes: number;
  wordCount: number;
  /** Optional external or local file attachment, e.g. "/papers/notes.pdf". */
  pdf?: string;
  /** Hand-written bibliography lines, rendered as a references list. */
  references: string[];
}

/**
 * Which half of the Research index an entry is grouped under. Deliberately
 * separate from `status`: a completed manuscript can still host an ongoing
 * continuation, and moving it to "ongoing" here must never be read as
 * reopening or undoing what `status: completed` already says happened.
 */
export const archiveSections = ["ongoing", "completed"] as const;
export type ArchiveSection = (typeof archiveSections)[number];

export interface ResearchEntry extends EntryBase {
  collection: "research";
  status: ResearchStatus;
  /** Which Research-index section this is listed under. See `ArchiveSection`. */
  archiveSection: ArchiveSection;
  /** Research area, e.g. "Computational Physics". */
  area?: string;
  /**
   * Where the work stands in the author's history, in a few restrained words —
   * e.g. "Earlier independent and school-based research". Shown in the page
   * header when given; never a school, venue or award.
   */
  context?: string;
  keywords: string[];
}

/** An explicitly provided external resource for a project. */
export interface ProjectLink {
  label: string;
  /** An absolute http(s) URL; anything else is dropped by the loader. */
  href: string;
}

export interface ProjectEntry extends EntryBase {
  collection: "projects";
  stage: ProjectStage;
  /** Free text, e.g. "Mathematics & Perception". */
  area?: string;
  keywords: string[];
  /** Your part in it, in a few words. Shown only when given. */
  role?: string;
  /**
   * When the work happened, in your own words — "2025–2026", "Ongoing since
   * 2025". Distinct from `date`, which is the day the entry joined the site.
   */
  period?: string;
  /** Explicit external resources. Empty unless you add them. */
  links: ProjectLink[];
}

/** Fields the Bookshelf and the Screening Room share. */
export interface WorkBase extends EntryBase {
  /** Display title — the Korean title as you keep it. `title` holds this. */
  /** Title in the work's original language, when different. */
  titleOriginal?: string;
  /** English title, when there is one. */
  titleEn?: string;
  /** Publication or release year. Absent rather than guessed. */
  year?: number;
  /** ISO 639-1 code of the original language, e.g. "ja", "fr", "ko". */
  language?: string;
  genres: string[];
  /** Curated by hand. Never assigned automatically. */
  themes: string[];
  /** Slugs of thematic collections (content/collections/) this work belongs to. */
  inCollections: string[];
  /**
   * Path under public/ ("/covers/demian.jpg") or an https URL on an
   * allowed provider host (see lib/content.ts ALLOWED_IMAGE_HOSTS).
   * Absent → typographic placeholder.
   */
  image?: string;
  /** Short attribution for the image, shown beneath it when present. */
  imageCredit?: string;
  /**
   * Where a provider's terms require the image to link back to their own
   * page for the work (YES24's terms do; it is good practice generally),
   * this is that page, rendered as the link under `imageCredit`. An
   * absolute http(s) URL; anything else is dropped.
   */
  imageSourceUrl?: string;
  /**
   * The day (YYYY-MM-DD) an `image` sourced from a provider with its own
   * cache-expiry terms was last fetched from that provider — TMDB's terms
   * forbid caching its content for more than six months. Set this whenever
   * `image` points at image.tmdb.org; `npm run check-image-freshness` warns
   * once it is more than ~150 days old. Meaningless, and ignored, for a
   * local file or a provider with no such limit.
   */
  imageFetched?: string;
  /** Date this entry was added to the archive (YYYY-MM-DD). Real, not invented. */
  added: string;
  /** False until the bibliographic metadata has been checked by you. */
  verified: boolean;
  /** Free-text note on what still needs checking. Never rendered publicly. */
  verifyNote?: string;
}

export interface BookEntry extends WorkBase {
  collection: "books";
  author: string;
  /** Author's name in the original script, when different, e.g. "村上春樹". */
  authorOriginal?: string;
  edition?: string;
  isbn?: string;
  readingStatus: ReadingStatus;
  dateFinished?: string;
}

export interface FilmEntry extends WorkBase {
  collection: "films";
  director: string;
  /** Director's name in the original script, when different. */
  directorOriginal?: string;
  country?: string;
  viewingStatus: ViewingStatus;
  dateWatched?: string;
}

export type Entry = ResearchEntry | ProjectEntry | BookEntry | FilmEntry;

export const isResearch = (e: Entry): e is ResearchEntry => e.collection === "research";
export const isProject = (e: Entry): e is ProjectEntry => e.collection === "projects";
export const isBook = (e: Entry): e is BookEntry => e.collection === "books";
export const isFilm = (e: Entry): e is FilmEntry => e.collection === "films";
export const isWork = (e: Entry): e is BookEntry | FilmEntry => isBook(e) || isFilm(e);

/**
 * `href` is the index page; `base` is where individual entries live. The two
 * differ only for books, which are read at /bookshelf rather than /books.
 */
export const collectionMeta: Record<
  Collection,
  { singular: string; plural: string; href: string; base: string }
> = {
  research: { singular: "Research", plural: "Research", href: "/research", base: "/research" },
  projects: { singular: "Project", plural: "Projects", href: "/projects", base: "/projects" },
  books: { singular: "Book", plural: "Bookshelf", href: "/bookshelf", base: "/bookshelf" },
  films: { singular: "Film", plural: "Screening Room", href: "/films", base: "/films" },
};

/** A hand-curated thematic collection that may hold both books and films. */
export interface ThemeCollection {
  slug: string;
  title: string;
  subtitle?: string;
  /** Refs such as "books/demian" or "films/magnolia", in the order you want them shown. */
  items: EntryRef[];
  visibility: Visibility;
  body: string;
}

/* ────────────────────── the Collection: index cards ───────────────────── */

/**
 * The serialisable face of a book or film: what an index card, a search
 * result or a thematic collection needs — and nothing a client component
 * must not see. No body, no verification notes.
 */
export interface WorkCardData {
  collection: "books" | "films";
  slug: string;
  ref: EntryRef;
  href: string;
  title: string;
  titleOriginal?: string;
  titleEn?: string;
  /** Author or director. Empty while an entry still awaits identification. */
  creator: string;
  creatorOriginal?: string;
  year?: number;
  language?: string;
  country?: string;
  genres: string[];
  themes: string[];
  status: ReadingStatus | ViewingStatus;
  statusLabel: string;
  added: string;
  updated?: string;
  image?: string;
  visibility: Visibility;
}
