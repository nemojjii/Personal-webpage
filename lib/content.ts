import "server-only";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import {
  type Experiment,
  type ExperimentRelation,
  experimentForRef,
  experiments,
  isLaboratoryRef,
} from "./laboratory";
import {
  type ArchiveSection,
  type BookEntry,
  type Collection,
  type Entry,
  type EntryRef,
  type FilmEntry,
  type ProjectEntry,
  type ProjectLink,
  type ProjectStage,
  type ReadingStatus,
  type ResearchEntry,
  type ResearchStatus,
  type ThemeCollection,
  type ViewingStatus,
  type Visibility,
  archiveSections,
  collectionMeta,
  collections,
  isWork,
  projectStages,
  readingStatuses,
  researchStatuses,
  viewingStatuses,
  visibilities,
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
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
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

function readVisibility(data: Record<string, unknown>, where: string): Visibility {
  if (data.visibility !== undefined) {
    const v = String(data.visibility);
    if ((visibilities as readonly string[]).includes(v)) return v as Visibility;
    warn(where, `unknown visibility "${v}" — treating as "draft"`);
    return "draft";
  }
  return data.draft === true ? "draft" : "public";
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim();
  return s.length ? s : undefined;
}

/**
 * YAML reads an unquoted `2026-10-21` as a Date, and `String(date)` of that
 * is a long English sentence that sorts by weekday. Dates are kept as the
 * ISO day they were written as, whether or not the author quoted them.
 */
function dateString(value: unknown): string {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
  }
  return value === undefined || value === null ? "" : String(value).trim();
}

function optionalDate(value: unknown): string | undefined {
  const s = dateString(value);
  return s.length ? s : undefined;
}

function optionalYear(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

/**
 * Hosts a book cover or film poster `image:` may be fetched from, when it is
 * not a local path under public/. Keep this in sync with the remotePatterns
 * in next.config.ts — an image whose host is not in both places is dropped,
 * with a warning, rather than silently left broken on the page.
 */
const ALLOWED_IMAGE_HOSTS = new Set(["image.tmdb.org", "image.yes24.com", "covers.openlibrary.org"]);

/**
 * A work's `image:`. Either a local path under public/ ("/covers/foo.jpg",
 * "/posters/foo.jpg") or an absolute https URL on an allowed host. Anything
 * else — a relative path elsewhere, an http: URL, a host not on the list —
 * is dropped, with a warning in development, so a typo or an unapproved
 * source can never reach the page.
 */
function parseImage(value: unknown, where: string): string | undefined {
  const raw = optionalString(value);
  if (!raw) return undefined;
  if (raw.startsWith("/")) return raw;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    warn(where, `\`image\` is neither a local path (starting with /) nor an absolute URL: ${raw}`);
    return undefined;
  }
  if (url.protocol !== "https:") {
    warn(where, `\`image\` must be a local path or an https: URL, not ${url.protocol}: ${raw}`);
    return undefined;
  }
  if (!ALLOWED_IMAGE_HOSTS.has(url.hostname)) {
    warn(
      where,
      `\`image\` host "${url.hostname}" is not on the allowed list (${[...ALLOWED_IMAGE_HOSTS].join(", ")}): ${raw}`,
    );
    return undefined;
  }
  return raw;
}

/**
 * `imageSourceUrl`: an absolute http(s) URL, or dropped with a warning.
 * Unlike `image`, this is not restricted to a host allowlist — it is a
 * link for a human to follow (a provider's own product page), never a
 * resource the page fetches or embeds.
 */
function optionalAbsoluteUrl(value: unknown, field: string, where: string): string | undefined {
  const raw = optionalString(value);
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
    return raw;
  } catch {
    warn(where, `\`${field}\` is not an absolute http(s) URL: ${raw}`);
    return undefined;
  }
}

/**
 * A project's `links:`. Each needs a label and an absolute http(s) URL;
 * anything else is left out, with a warning in development, so a typo can
 * never become a broken or unsafe link on the page.
 */
function parseLinks(value: unknown, where: string): ProjectLink[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    warn(where, "`links` must be a list of { label, href } items");
    return [];
  }
  const links: ProjectLink[] = [];
  for (const item of value) {
    const record = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    const label = optionalString(record.label);
    const href = optionalString(record.href);
    if (!label || !href) {
      warn(where, "a link needs both `label` and `href`");
      continue;
    }
    let url: URL;
    try {
      url = new URL(href);
    } catch {
      warn(where, `link "${label}" is not an absolute URL: ${href}`);
      continue;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      warn(where, `link "${label}" must use http or https: ${href}`);
      continue;
    }
    links.push({ label, href: url.toString() });
  }
  return links;
}

/* ───────────────────────────── parsing ────────────────────────────────── */

function parseEntry(collection: Collection, filename: string): Entry {
  const filePath = path.join(CONTENT_ROOT, collection, filename);
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  const slug = filename.replace(/\.mdx?$/, "");
  const where = `${collection}/${filename}`;
  const wordCount = countWords(content);

  const visibility = readVisibility(data, where);
  const base = {
    collection,
    slug,
    ref: `${collection}/${slug}`,
    href: `${collectionMeta[collection].base}/${slug}`,
    title: String(data.title ?? slug),
    subtitle: data.subtitle ? String(data.subtitle) : undefined,
    summary: data.summary ? String(data.summary) : undefined,
    date: dateString(data.date),
    updated: optionalDate(data.updated),
    tags: asArray(data.tags),
    draft: visibility !== "public",
    visibility,
    featured: data.featured === true,
    order: typeof data.order === "number" ? data.order : undefined,
    related: asArray(data.related),
    body: content,
    wordCount,
    readingMinutes: Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE)),
    pdf: data.pdf ? String(data.pdf) : undefined,
    references: asArray(data.references),
  } satisfies Omit<Entry, "collection"> & { collection: Collection };

  if (collection === "research") {
    let status = String(data.status ?? "idea") as ResearchStatus;
    if (!(status in researchStatuses)) {
      warn(where, `unknown status "${status}" — falling back to "idea"`);
      status = "idea";
    }
    let archiveSection = String(data.archiveSection ?? "completed") as ArchiveSection;
    if (!(archiveSections as readonly string[]).includes(archiveSection)) {
      warn(where, `unknown archiveSection "${archiveSection}" — falling back to "completed"`);
      archiveSection = "completed";
    }
    return {
      ...base,
      collection: "research",
      status,
      archiveSection,
      area: data.area ? String(data.area) : undefined,
      context: data.context ? String(data.context) : undefined,
      keywords: asArray(data.keywords),
    } as ResearchEntry;
  }

  if (collection === "projects") {
    let stage = String(data.stage ?? "exploration") as ProjectStage;
    if (!(stage in projectStages)) {
      warn(where, `unknown stage "${stage}" — falling back to "exploration"`);
      stage = "exploration";
    }
    let externalPage = optionalString(data.externalPage);
    if (externalPage && !externalPage.startsWith("/")) {
      warn(where, `externalPage "${externalPage}" must be a site-relative path starting with "/" — ignoring`);
      externalPage = undefined;
    }
    return {
      ...base,
      collection: "projects",
      stage,
      area: data.area ? String(data.area) : undefined,
      keywords: asArray(data.keywords),
      role: optionalString(data.role),
      period: optionalString(data.period),
      links: parseLinks(data.links, where),
      externalPage,
      href: externalPage ?? base.href,
    } as ProjectEntry;
  }

  // What remains is a book or a film: the two share the work fields.
  {
    const added = optionalDate(data.added) ?? optionalDate(data.date) ?? "";
    if (!added) warn(where, "missing `added` date");
    if (visibility !== "public" && optionalString(data.image)?.startsWith("/")) {
      warn(
        where,
        "a non-public entry names an image under public/ — anything there is served to whoever knows the URL",
      );
    }
    const work = {
      ...base,
      // For works, `date` doubles as the archive date so global ordering is sane.
      date: added,
      titleOriginal: optionalString(data.titleOriginal),
      titleEn: optionalString(data.titleEn),
      year: optionalYear(data.year),
      language: optionalString(data.language),
      genres: asArray(data.genres),
      themes: asArray(data.themes),
      inCollections: asArray(data.collections),
      image: parseImage(data.image, where),
      imageCredit: optionalString(data.imageCredit),
      imageSourceUrl: optionalAbsoluteUrl(data.imageSourceUrl, "imageSourceUrl", where),
      imageFetched: optionalDate(data.imageFetched),
      added,
      verified: data.verified === true,
      verifyNote: optionalString(data.verifyNote),
    };

    if (collection === "books") {
      let readingStatus = String(data.readingStatus ?? "unspecified") as ReadingStatus;
      if (!(readingStatus in readingStatuses)) {
        warn(where, `unknown readingStatus "${readingStatus}" — using "unspecified"`);
        readingStatus = "unspecified";
      }
      return {
        ...work,
        collection: "books",
        author: String(data.author ?? "").trim(),
        authorOriginal: optionalString(data.authorOriginal),
        edition: optionalString(data.edition),
        isbn: optionalString(data.isbn),
        readingStatus,
        dateFinished: optionalDate(data.dateFinished),
      } as BookEntry;
    }

    let viewingStatus = String(data.viewingStatus ?? "unspecified") as ViewingStatus;
    if (!(viewingStatus in viewingStatuses)) {
      warn(where, `unknown viewingStatus "${viewingStatus}" — using "unspecified"`);
      viewingStatus = "unspecified";
    }
    return {
      ...work,
      collection: "films",
      director: String(data.director ?? "").trim(),
      directorOriginal: optionalString(data.directorOriginal),
      country: optionalString(data.country),
      viewingStatus,
      dateWatched: optionalDate(data.dateWatched),
    } as FilmEntry;
  }
}

/* ───────────────────────────── the index ──────────────────────────────── */

/**
 * In production only `public` entries exist as far as the site is concerned.
 * In development everything is loaded so you can preview drafts and private
 * entries; the UI marks them. This is the single gate for every page, route,
 * search index, related-content panel and sitemap line.
 */
export const isProduction = process.env.NODE_ENV === "production";
export const isPubliclyVisible = (e: { visibility: Visibility }) =>
  !isProduction || e.visibility === "public";

let cache: Entry[] | null = null;

/** Every entry across every collection, newest first. */
export function allEntries(): Entry[] {
  if (cache) return cache;
  const entries = collections.flatMap((collection) =>
    readCollectionFiles(collection).map((file) => parseEntry(collection, file)),
  );
  cache = entries
    .filter(isPubliclyVisible)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.title.localeCompare(b.title)));
  return cache;
}

export function getEntries<C extends Collection>(collection: C): Extract<Entry, { collection: C }>[] {
  return allEntries().filter((e) => e.collection === collection) as Extract<
    Entry,
    { collection: C }
  >[];
}

/**
 * Ordering within an index group: an explicit `order` first (ascending),
 * then newest date, then title. Entries without either keep a stable place.
 */
export function byOrderThenDate(a: Entry, b: Entry): number {
  if (a.order !== undefined || b.order !== undefined) {
    return (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
  }
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return a.title.localeCompare(b.title);
}

/** Splits a collection into its featured entries and the rest. */
export function splitFeatured<T extends Entry>(entries: T[]): {
  featured: T[];
  rest: T[];
} {
  const sorted = entries.slice().sort(byOrderThenDate);
  return {
    featured: sorted.filter((e) => e.featured),
    rest: sorted.filter((e) => !e.featured),
  };
}

export function getEntry(collection: Collection, slug: string): Entry | undefined {
  return allEntries().find((e) => e.collection === collection && e.slug === slug);
}

export function getEntryByRef(ref: EntryRef): Entry | undefined {
  return allEntries().find((e) => e.ref === ref);
}

/** Research sorted by status (publications first), then by order or date. */
export function researchByStatus(): ResearchEntry[] {
  return getEntries("research")
    .slice()
    .sort((a, b) => {
      const d = researchStatuses[a.status].order - researchStatuses[b.status].order;
      return d !== 0 ? d : byOrderThenDate(a, b);
    });
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

/**
 * An experiment connected to an entry. `kind` and `note` come from the
 * experiment's own declaration when it has one; a relation declared only in
 * frontmatter is listed without them.
 */
export interface ExperimentLink {
  experiment: Experiment;
  kind?: ExperimentRelation["kind"];
  note?: string;
}

/**
 * Experiments connected to an entry, from either side: the experiment's
 * `related` list (which carries the kind and the note), or a
 * "laboratory/<slug>" ref in the entry's own frontmatter. Unknown slugs are
 * dropped, with a warning in development.
 */
export function relatedExperiments(entry: Entry): ExperimentLink[] {
  const map = new Map<string, ExperimentLink>();
  for (const experiment of experiments) {
    const relation = experiment.related.find((r) => r.ref === entry.ref);
    if (relation) map.set(experiment.slug, { experiment, kind: relation.kind, note: relation.note });
  }
  for (const ref of entry.related) {
    if (!isLaboratoryRef(ref)) continue;
    const experiment = experimentForRef(ref);
    if (!experiment) {
      warn(entry.ref, `related "${ref}" does not match any experiment`);
      continue;
    }
    if (!map.has(experiment.slug)) map.set(experiment.slug, { experiment });
  }
  return [...map.values()];
}

/** An entry connected to an experiment, with the experiment's own account of why. */
export interface EntryLink {
  entry: Entry;
  kind?: ExperimentRelation["kind"];
  note?: string;
}

/**
 * Entries connected to an experiment, from either side. Only public entries
 * can appear, because allEntries() has already applied the visibility gate.
 */
export function experimentConnections(experiment: Experiment): EntryLink[] {
  const map = new Map<string, EntryLink>();
  for (const relation of experiment.related) {
    const entry = getEntryByRef(relation.ref);
    if (!entry) {
      warn(`laboratory/${experiment.slug}`, `related "${relation.ref}" does not resolve to a public entry`);
      continue;
    }
    map.set(entry.ref, { entry, kind: relation.kind, note: relation.note });
  }
  for (const entry of allEntries()) {
    if (entry.related.includes(`laboratory/${experiment.slug}`) && !map.has(entry.ref)) {
      map.set(entry.ref, { entry });
    }
  }
  return [...map.values()];
}

/** Union of outgoing and incoming relations, grouped by collection. */
export function connections(entry: Entry): {
  all: Entry[];
  byCollection: Record<Collection, Entry[]>;
  experiments: ExperimentLink[];
  sharedTags: Entry[];
} {
  const map = new Map<string, Entry>();
  for (const e of [...outgoing(entry), ...incoming(entry)]) map.set(e.ref, e);
  const all = [...map.values()].sort((a, b) => (a.date < b.date ? 1 : -1));

  const byCollection = Object.fromEntries(
    collections.map((c) => [c, all.filter((e) => e.collection === c)]),
  ) as Record<Collection, Entry[]>;

  const tags = new Set(entry.tags.map(normalizeTag));
  const sharedTags = allEntries().filter(
    (e) =>
      e.ref !== entry.ref &&
      !map.has(e.ref) &&
      e.tags.some((t) => tags.has(normalizeTag(t))),
  );

  return { all, byCollection, experiments: relatedExperiments(entry), sharedTags };
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

/* ─────────────────────── thematic collections ─────────────────────────── */

let themeCache: ThemeCollection[] | null = null;

/** Hand-curated collections from content/collections/, public ones only in production. */
export function themeCollections(): ThemeCollection[] {
  if (themeCache) return themeCache;
  const dir = path.join(CONTENT_ROOT, "collections");
  if (!fs.existsSync(dir)) return (themeCache = []);
  themeCache = fs
    .readdirSync(dir)
    .filter((f) => /\.mdx?$/.test(f) && !f.startsWith("_") && !f.startsWith("."))
    .map((file) => {
      const { data, content } = matter(fs.readFileSync(path.join(dir, file), "utf8"));
      const slug = file.replace(/\.mdx?$/, "");
      return {
        slug,
        title: String(data.title ?? slug),
        subtitle: optionalString(data.subtitle),
        items: asArray(data.items),
        visibility: readVisibility(data, `collections/${file}`),
        body: content,
      } satisfies ThemeCollection;
    })
    .filter(isPubliclyVisible)
    .sort((a, b) => a.title.localeCompare(b.title));
  return themeCache;
}

export function getThemeCollection(slug: string): ThemeCollection | undefined {
  return themeCollections().find((c) => c.slug === slug);
}

/**
 * Membership is declared on either side — `items:` in the collection file or
 * `collections:` in the work's frontmatter — and the two are merged here, so
 * nothing has to be kept in sync by hand. The collection's own `items` order
 * comes first; works that only declare themselves follow, newest first.
 */
export function themeCollectionItems(collection: ThemeCollection): Entry[] {
  const explicit = collection.items
    .map((ref) => {
      const entry = getEntryByRef(ref);
      if (!entry) warn(`collections/${collection.slug}`, `item "${ref}" does not resolve to a public entry`);
      return entry;
    })
    .filter((e): e is Entry => Boolean(e));
  const declared = allEntries().filter(
    (e) => isWork(e) && e.inCollections.includes(collection.slug) && !collection.items.includes(e.ref),
  );
  return [...explicit, ...declared];
}

/** Thematic collections that include the given entry, by either declaration. */
export function themeCollectionsFor(entry: Entry): ThemeCollection[] {
  return themeCollections().filter(
    (c) => c.items.includes(entry.ref) || (isWork(entry) && entry.inCollections.includes(c.slug)),
  );
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
