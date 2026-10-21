/** The three content collections. Each maps to content/<collection>/ and /<collection>. */
export const collections = ["research", "writings", "notebook"] as const;
export type Collection = (typeof collections)[number];

/** Research project lifecycle. The key is what you write in frontmatter. */
export const researchStatuses = {
  idea: { label: "Research Idea", order: 3 },
  "in-progress": { label: "In Progress", order: 1 },
  completed: { label: "Completed", order: 2 },
  publication: { label: "Publication", order: 0 },
} as const;
export type ResearchStatus = keyof typeof researchStatuses;

/** Essay categories for /writings. */
export const writingCategories = {
  philosophy: { label: "Philosophy" },
  literature: { label: "Literature" },
  "science-and-society": { label: "Science & Society" },
  reflections: { label: "Reflections" },
} as const;
export type WritingCategory = keyof typeof writingCategories;

/** A reference to another entry, written in frontmatter as "collection/slug". */
export type EntryRef = string;

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
  date: string;
  updated?: string;
  tags: string[];
  draft: boolean;
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

export interface ResearchEntry extends EntryBase {
  collection: "research";
  status: ResearchStatus;
  /** Research area, e.g. "Differential Geometry". */
  area?: string;
  keywords: string[];
}

export interface WritingEntry extends EntryBase {
  collection: "writings";
  category: WritingCategory;
}

export interface NotebookEntry extends EntryBase {
  collection: "notebook";
  /** Sequential index such as "001". Taken from the filename prefix. */
  number: string;
}

export type Entry = ResearchEntry | WritingEntry | NotebookEntry;

export const isResearch = (e: Entry): e is ResearchEntry => e.collection === "research";
export const isWriting = (e: Entry): e is WritingEntry => e.collection === "writings";
export const isNotebook = (e: Entry): e is NotebookEntry => e.collection === "notebook";

export const collectionMeta: Record<
  Collection,
  { singular: string; plural: string; href: string }
> = {
  research: { singular: "Research", plural: "Research", href: "/research" },
  writings: { singular: "Essay", plural: "Writings", href: "/writings" },
  notebook: { singular: "Note", plural: "Notebook", href: "/notebook" },
};
