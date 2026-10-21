import "server-only";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import {
  type Collection,
  type Entry,
  type EntryRef,
  type NotebookEntry,
  type ResearchEntry,
  type ResearchStatus,
  type WritingCategory,
  type WritingEntry,
  collections,
  researchStatuses,
  writingCategories,
} from "./types";

const CONTENT_ROOT = path.join(process.cwd(), "content");
const WORDS_PER_MINUTE = 215;

/* ───────────────────────────── helpers ────────────────────────────────── */

function readCollectionFiles(collection: Collection): string[] {
  const dir = path.join(CONTENT_ROOT, collection);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.mdx?$/.test(f) && !f.startsWith("_") && !f.startsWith("."));
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

function countWords(markdown: string): number {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function warn(file: string, message: string) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[content] ${file}: ${message}`);
  }
}

/* ───────────────────────────── parsing ────────────────────────────────── */

function parseEntry(collection: Collection, filename: string): Entry {
  const filePath = path.join(CONTENT_ROOT, collection, filename);
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  const slug = filename.replace(/\.mdx?$/, "");
  const where = `${collection}/${filename}`;
  const wordCount = countWords(content);

  const base = {
    collection,
    slug,
    ref: `${collection}/${slug}`,
    href: `/${collection}/${slug}`,
    title: String(data.title ?? slug),
    subtitle: data.subtitle ? String(data.subtitle) : undefined,
    summary: data.summary ? String(data.summary) : undefined,
    date: String(data.date ?? ""),
    updated: data.updated ? String(data.updated) : undefined,
    tags: asArray(data.tags),
    draft: data.draft === true,
    related: asArray(data.related),
    body: content,
    wordCount,
    readingMinutes: Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE)),
    pdf: data.pdf ? String(data.pdf) : undefined,
    references: asArray(data.references),
  } satisfies Omit<Entry, "collection"> & { collection: Collection };

  if (!data.date) warn(where, "missing `date` in frontmatter");

  if (collection === "research") {
    let status = String(data.status ?? "idea") as ResearchStatus;
    if (!(status in researchStatuses)) {
      warn(where, `unknown status "${status}" — falling back to "idea"`);
      status = "idea";
    }
    return {
      ...base,
      collection: "research",
      status,
      area: data.area ? String(data.area) : undefined,
      keywords: asArray(data.keywords),
    } as ResearchEntry;
  }

  if (collection === "writings") {
    let category = String(data.category ?? "reflections") as WritingCategory;
    if (!(category in writingCategories)) {
      warn(where, `unknown category "${category}" — falling back to "reflections"`);
      category = "reflections";
    }
    return { ...base, collection: "writings", category } as WritingEntry;
  }

  const numberFromName = /^(\d{3,})[-_]/.exec(filename)?.[1];
  const number = String(data.number ?? numberFromName ?? "").padStart(3, "0");
  if (!numberFromName && !data.number) {
    warn(where, "no sequential number — prefix the filename, e.g. 004-my-note.mdx");
  }
  return { ...base, collection: "notebook", number } as NotebookEntry;
}

/* ───────────────────────────── the index ──────────────────────────────── */

const includeDrafts = process.env.NODE_ENV !== "production";

let cache: Entry[] | null = null;

/** Every entry across every collection, newest first. */
export function allEntries(): Entry[] {
  if (cache) return cache;
  const entries = collections.flatMap((collection) =>
    readCollectionFiles(collection).map((file) => parseEntry(collection, file)),
  );
  cache = entries
    .filter((e) => includeDrafts || !e.draft)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.title.localeCompare(b.title)));
  return cache;
}

export function getEntries<C extends Collection>(collection: C): Extract<Entry, { collection: C }>[] {
  return allEntries().filter((e) => e.collection === collection) as Extract<
    Entry,
    { collection: C }
  >[];
}

export function getEntry(collection: Collection, slug: string): Entry | undefined {
  return allEntries().find((e) => e.collection === collection && e.slug === slug);
}

export function getEntryByRef(ref: EntryRef): Entry | undefined {
  return allEntries().find((e) => e.ref === ref);
}

/** Research sorted by status (publications first) and then by date. */
export function researchByStatus(): ResearchEntry[] {
  return getEntries("research").slice().sort((a, b) => {
    const d = researchStatuses[a.status].order - researchStatuses[b.status].order;
    return d !== 0 ? d : a.date < b.date ? 1 : -1;
  });
}

/** Notebook entries ordered by their sequential number, highest first. */
export function notebookBySequence(): NotebookEntry[] {
  return getEntries("notebook")
    .slice()
    .sort((a, b) => b.number.localeCompare(a.number));
}

/* ──────────────────────── the relations system ────────────────────────── */

/**
 * Relations are declared in one direction only — list a `related:` ref in
 * frontmatter — and this module derives the reverse direction, so a link
 * written once shows up on both entries.
 */

/** Entries explicitly referenced by this entry, resolved and deduplicated. */
export function outgoing(entry: Entry): Entry[] {
  const seen = new Set<string>();
  return entry.related
    .map((ref) => getEntryByRef(ref))
    .filter((e): e is Entry => {
      if (!e || e.ref === entry.ref || seen.has(e.ref)) return false;
      seen.add(e.ref);
      return true;
    });
}

/** Entries that reference this entry — backlinks. */
export function incoming(entry: Entry): Entry[] {
  return allEntries().filter(
    (e) => e.ref !== entry.ref && e.related.includes(entry.ref),
  );
}

/** Union of outgoing and incoming relations, grouped by collection. */
export function connections(entry: Entry): {
  all: Entry[];
  byCollection: Record<Collection, Entry[]>;
  sharedTags: Entry[];
} {
  const map = new Map<string, Entry>();
  for (const e of [...outgoing(entry), ...incoming(entry)]) map.set(e.ref, e);
  const all = [...map.values()].sort((a, b) => (a.date < b.date ? 1 : -1));

  const byCollection = {
    research: all.filter((e) => e.collection === "research"),
    writings: all.filter((e) => e.collection === "writings"),
    notebook: all.filter((e) => e.collection === "notebook"),
  } as Record<Collection, Entry[]>;

  const tags = new Set(entry.tags.map(normalizeTag));
  const sharedTags = allEntries().filter(
    (e) =>
      e.ref !== entry.ref &&
      !map.has(e.ref) &&
      e.tags.some((t) => tags.has(normalizeTag(t))),
  );

  return { all, byCollection, sharedTags };
}

/* ──────────────────────────────── tags ────────────────────────────────── */

export function normalizeTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export interface TagRecord {
  tag: string;
  slug: string;
  count: number;
  entries: Entry[];
}

/** Every tag used anywhere, most used first. Display form is the first spelling seen. */
export function allTags(): TagRecord[] {
  const map = new Map<string, TagRecord>();
  for (const entry of allEntries()) {
    for (const tag of entry.tags) {
      const slug = normalizeTag(tag);
      if (!slug) continue;
      const record = map.get(slug) ?? { tag, slug, count: 0, entries: [] };
      record.count += 1;
      record.entries.push(entry);
      map.set(slug, record);
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function getTag(slug: string): TagRecord | undefined {
  return allTags().find((t) => t.slug === slug);
}

/* ───────────────────────────── formatting ─────────────────────────────── */

export function formatDate(
  value: string | undefined,
  style: "long" | "short" | "year" = "long",
): string {
  if (!value) return "";
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return value;
  const options: Intl.DateTimeFormatOptions =
    style === "year"
      ? { year: "numeric", timeZone: "UTC" }
      : style === "short"
        ? { month: "short", year: "numeric", timeZone: "UTC" }
        : { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" };
  return new Intl.DateTimeFormat("en-US", options).format(date);
}
