import {
  type BookEntry,
  type FilmEntry,
  type WorkCardData,
  readingStatuses,
  viewingStatuses,
} from "./types.ts";

/**
 * Pure helpers for the Collection. Nothing here touches the file system, so
 * the same code runs on the server (to build the cards) and in the browser
 * (to search, filter and sort them). lib/content.ts is server-only; this is
 * not.
 */

/* ───────────────────────────── cards ──────────────────────────────────── */

export function toWorkCard(entry: BookEntry | FilmEntry): WorkCardData {
  const shared = {
    collection: entry.collection,
    slug: entry.slug,
    ref: entry.ref,
    href: entry.href,
    title: entry.title,
    titleOriginal: entry.titleOriginal,
    titleEn: entry.titleEn,
    year: entry.year,
    language: entry.language,
    genres: entry.genres,
    themes: entry.themes,
    added: entry.added,
    updated: entry.updated,
    image: entry.image,
    visibility: entry.visibility,
  };
  if (entry.collection === "books") {
    return {
      ...shared,
      collection: "books",
      creator: entry.author,
      creatorOriginal: entry.authorOriginal,
      status: entry.readingStatus,
      statusLabel: readingStatuses[entry.readingStatus].label,
    };
  }
  return {
    ...shared,
    collection: "films",
    creator: entry.director,
    creatorOriginal: entry.directorOriginal,
    country: entry.country,
    status: entry.viewingStatus,
    statusLabel: viewingStatuses[entry.viewingStatus].label,
  };
}

/**
 * The title shown prominently: a documented English release/publication
 * title when one is recorded (`titleEn`, or `titleOriginal` itself when the
 * work's original language already is English), and the original-language
 * title otherwise. Never a fabricated translation — where none is recorded,
 * this is simply the title you'd have gotten before (`titleOriginal`, or
 * `title` for a work with no separate original, e.g. one written in Korean).
 */
export function primaryTitle(work: {
  title: string;
  titleOriginal?: string;
  titleEn?: string;
  language?: string;
}): string {
  if (work.titleEn) return work.titleEn;
  if (work.language === "en" && work.titleOriginal) return work.titleOriginal;
  return work.titleOriginal || work.title;
}

/**
 * The title(s) to set beneath the primary title, smaller: the Korean title
 * and the original-language title, in that order, each only when it differs
 * from the primary title and from each other — so a Korean-original work
 * with no English edition shows nothing here, and a Japanese novel with an
 * English translation shows both its Korean and Japanese titles.
 */
export function secondaryTitles(work: {
  title: string;
  titleOriginal?: string;
  titleEn?: string;
  language?: string;
}): string[] {
  const primary = primaryTitle(work);
  const seen = new Set([primary]);
  const out: string[] = [];
  for (const candidate of [work.title, work.titleOriginal]) {
    if (candidate && !seen.has(candidate)) {
      seen.add(candidate);
      out.push(candidate);
    }
  }
  return out;
}

/** What to call the person who made it. */
export const creatorNoun = (collection: "books" | "films") =>
  collection === "books" ? "author" : "director";

/* ──────────────────────────── languages ───────────────────────────────── */

const LANGUAGE_NAMES: Record<string, string> = {
  ar: "Arabic",
  cs: "Czech",
  da: "Danish",
  de: "German",
  el: "Greek",
  en: "English",
  es: "Spanish",
  fa: "Persian",
  fi: "Finnish",
  fr: "French",
  he: "Hebrew",
  hi: "Hindi",
  hu: "Hungarian",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  nl: "Dutch",
  no: "Norwegian",
  pl: "Polish",
  pt: "Portuguese",
  ru: "Russian",
  sv: "Swedish",
  tr: "Turkish",
  zh: "Chinese",
};

/** "ja" → "Japanese". Unknown codes are shown as written rather than hidden. */
export function languageName(code?: string): string | undefined {
  if (!code) return undefined;
  return LANGUAGE_NAMES[code.toLowerCase()] ?? code;
}

/* ───────────────────────── search, filter, sort ───────────────────────── */

/**
 * "curated" is the order the page already renders in when no sort is
 * chosen — by `added`, then title — kept as a named, selectable sort (not
 * merely the default) so it can be returned to exactly after another sort
 * has been applied.
 */
export const workSorts = ["curated", "title", "titleDesc", "yearAsc", "yearDesc"] as const;
export type WorkSort = (typeof workSorts)[number];

export function sortLabel(sort: WorkSort): string {
  switch (sort) {
    case "curated":
      return "Curated order";
    case "title":
      return "Title A–Z";
    case "titleDesc":
      return "Title Z–A";
    case "yearAsc":
      return "Year, oldest first";
    case "yearDesc":
      return "Year, newest first";
  }
}

export interface WorkQuery {
  /** Free text, matched against every title, the creator, genres and themes. */
  q: string;
  genre: string;
  theme: string;
  status: string;
  /** Release or publication year, as a string so it round-trips through the URL. */
  year: string;
  /** ISO 639-1 code of the original language. */
  language: string;
  /** Author or director, matched exactly. */
  creator: string;
  sort: WorkSort;
  /** Group the results under their author or director. */
  group: boolean;
}

export const EMPTY_QUERY: WorkQuery = {
  q: "",
  genre: "",
  theme: "",
  status: "",
  year: "",
  language: "",
  creator: "",
  sort: "curated",
  group: false,
};

export function isDefaultQuery(query: WorkQuery): boolean {
  return (
    !query.q &&
    !query.genre &&
    !query.theme &&
    !query.status &&
    !query.year &&
    !query.language &&
    !query.creator &&
    query.sort === EMPTY_QUERY.sort &&
    !query.group
  );
}

/**
 * The form used for matching: case-folded, width-folded (full-width Latin
 * and digits become ordinary ones), accent-stripped so "Agnes" finds
 * "Agnès", and with spaces removed so 작별하지않는다 finds 작별하지 않는다.
 * Hangul syllables decompose under NFD and recompose under NFC, so Korean
 * survives the round trip untouched.
 */
export function fold(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .normalize("NFC")
    .replace(/\s+/g, "");
}

function haystack(card: WorkCardData): string {
  return fold(
    [
      card.title,
      card.titleOriginal,
      card.titleEn,
      card.creator,
      card.creatorOriginal,
      card.year,
      card.country,
      languageName(card.language),
      ...card.genres,
      ...card.themes,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

/** Every whitespace-separated term must appear somewhere in the card. */
export function matchesSearch(card: WorkCardData, q: string): boolean {
  const terms = q.trim().split(/\s+/).map(fold).filter(Boolean);
  if (!terms.length) return true;
  const hay = haystack(card);
  return terms.every((term) => hay.includes(term));
}

const collator = new Intl.Collator("ko", { sensitivity: "base", numeric: true });

function compareText(a: string | undefined, b: string | undefined): number {
  // Missing values sort last whichever way the list is read.
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return collator.compare(a, b);
}

function compareDateDesc(a: string | undefined, b: string | undefined): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a < b ? 1 : a > b ? -1 : 0;
}

export function sortWorks(cards: WorkCardData[], sort: WorkSort): WorkCardData[] {
  const byTitle = (a: WorkCardData, b: WorkCardData) => compareText(a.title, b.title);
  // Works without a year sink to the end whichever direction is chosen.
  const byYear = (a: WorkCardData, b: WorkCardData, ascending: boolean) => {
    if (a.year === undefined && b.year === undefined) return byTitle(a, b);
    if (a.year === undefined) return 1;
    if (b.year === undefined) return -1;
    return (ascending ? a.year - b.year : b.year - a.year) || byTitle(a, b);
  };
  return cards.slice().sort((a, b) => {
    switch (sort) {
      case "title":
        return byTitle(a, b);
      case "titleDesc":
        return -byTitle(a, b);
      case "yearAsc":
        return byYear(a, b, true);
      case "yearDesc":
        return byYear(a, b, false);
      case "curated":
      default:
        return compareDateDesc(a.added, b.added) || byTitle(a, b);
    }
  });
}

export function applyQuery(cards: WorkCardData[], query: WorkQuery): WorkCardData[] {
  const filtered = cards.filter(
    (card) =>
      matchesSearch(card, query.q) &&
      (!query.genre || card.genres.includes(query.genre)) &&
      (!query.theme || card.themes.includes(query.theme)) &&
      (!query.status || card.status === query.status) &&
      (!query.year || String(card.year ?? "") === query.year) &&
      (!query.language || card.language === query.language) &&
      (!query.creator || card.creator === query.creator),
  );
  return sortWorks(filtered, query.sort);
}

/** Distinct values of a list-valued field, in collation order. */
export function facet(cards: WorkCardData[], key: "genres" | "themes"): string[] {
  const set = new Set<string>();
  for (const card of cards) for (const value of card[key]) set.add(value);
  return [...set].sort(collator.compare);
}

/** Original languages in use, as code/name pairs, in collation order by name. */
export function languageFacet(cards: WorkCardData[]): { value: string; label: string }[] {
  const codes = new Set<string>();
  for (const card of cards) if (card.language) codes.add(card.language);
  return [...codes]
    .map((code) => ({ value: code, label: languageName(code) ?? code }))
    .sort((a, b) => collator.compare(a.label, b.label));
}

/** Authors or directors in use, in collation order. Entries awaiting a creator are skipped. */
export function creatorFacet(cards: WorkCardData[]): string[] {
  const set = new Set<string>();
  for (const card of cards) if (card.creator) set.add(card.creator);
  return [...set].sort(collator.compare);
}

/** Statuses actually in use, with their labels; the unlabelled default is skipped. */
export function statusFacet(cards: WorkCardData[]): { value: string; label: string }[] {
  const map = new Map<string, string>();
  for (const card of cards) if (card.statusLabel) map.set(card.status, card.statusLabel);
  return [...map.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => collator.compare(a.label, b.label));
}

/** Years in use, newest first. */
export function yearFacet(cards: WorkCardData[]): string[] {
  const years = new Set<number>();
  for (const card of cards) if (card.year !== undefined) years.add(card.year);
  return [...years].sort((a, b) => b - a).map(String);
}

export interface CreatorGroup {
  creator: string;
  creatorOriginal?: string;
  items: WorkCardData[];
}

/** Results gathered under their author or director, chronologically within. */
export function groupByCreator(cards: WorkCardData[]): CreatorGroup[] {
  const map = new Map<string, CreatorGroup>();
  for (const card of cards) {
    const key = card.creator || "";
    const group = map.get(key) ?? {
      creator: card.creator,
      creatorOriginal: card.creatorOriginal,
      items: [],
    };
    group.items.push(card);
    map.set(key, group);
  }
  return [...map.values()]
    .map((group) => ({
      ...group,
      items: group.items
        .slice()
        .sort((a, b) => (a.year ?? Infinity) - (b.year ?? Infinity) || compareText(a.title, b.title)),
    }))
    .sort((a, b) => compareText(a.creator, b.creator));
}

/* ───────────────────────── URL round-tripping ─────────────────────────── */

export function paramsToQuery(params: URLSearchParams | null): WorkQuery {
  if (!params) return EMPTY_QUERY;
  const sort = params.get("sort") ?? "";
  return {
    q: params.get("q") ?? "",
    genre: params.get("genre") ?? "",
    theme: params.get("theme") ?? "",
    status: params.get("status") ?? "",
    year: params.get("year") ?? "",
    language: params.get("lang") ?? "",
    creator: params.get("who") ?? "",
    sort: (workSorts as readonly string[]).includes(sort) ? (sort as WorkSort) : "curated",
    group: params.get("view") === "creator",
  };
}

export function queryToParams(query: WorkQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.genre) params.set("genre", query.genre);
  if (query.theme) params.set("theme", query.theme);
  if (query.status) params.set("status", query.status);
  if (query.year) params.set("year", query.year);
  if (query.language) params.set("lang", query.language);
  if (query.creator) params.set("who", query.creator);
  if (query.sort !== EMPTY_QUERY.sort) params.set("sort", query.sort);
  if (query.group) params.set("view", "creator");
  return params;
}

/* ───────────────────────────── language tags ──────────────────────────── */

const HANGUL = /[ᄀ-ᇿ㄰-㆏가-힯]/;

/**
 * The `lang` attribute for a display title. Titles are kept in Korean as a
 * rule, but a work added under its English or French title should not be
 * announced as Korean.
 */
export function titleLang(title: string): string | undefined {
  return HANGUL.test(title) ? "ko" : undefined;
}

/* ───────────────────────────── image providers ────────────────────────── */

/** A provider whose terms require crediting them wherever their images appear. */
export type ImageProvider = "tmdb" | "yes24" | "openlibrary";

const PROVIDER_HOSTS: Record<ImageProvider, string> = {
  tmdb: "image.tmdb.org",
  yes24: "image.yes24.com",
  openlibrary: "covers.openlibrary.org",
};

/**
 * Which credited providers actually supply an image among these works, so a
 * page can show exactly the attribution its own content requires — never a
 * blanket notice for a provider nothing on the page uses.
 */
export function imageProvidersInUse(works: { image?: string }[]): Set<ImageProvider> {
  const hosts = new Set<string>();
  for (const w of works) {
    if (!w.image?.startsWith("https://")) continue;
    try {
      hosts.add(new URL(w.image).hostname);
    } catch {
      /* malformed values never reach this far from lib/content.ts; ignore defensively */
    }
  }
  const providers = new Set<ImageProvider>();
  for (const [provider, host] of Object.entries(PROVIDER_HOSTS) as [ImageProvider, string][]) {
    if (hosts.has(host)) providers.add(provider);
  }
  return providers;
}
