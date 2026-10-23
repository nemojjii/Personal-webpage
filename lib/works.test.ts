import assert from "node:assert/strict";
import { test } from "node:test";

import type { WorkCardData } from "./types.ts";
import {
  EMPTY_QUERY,
  applyQuery,
  creatorFacet,
  fold,
  isDefaultQuery,
  languageFacet,
  matchesSearch,
  paramsToQuery,
  primaryTitle,
  queryToParams,
  secondaryTitles,
  sortWorks,
  type WorkQuery,
} from "./works.ts";

function card(partial: Partial<WorkCardData> & { slug: string }): WorkCardData {
  return {
    collection: "books",
    ref: `books/${partial.slug}`,
    href: `/bookshelf/${partial.slug}`,
    title: partial.slug,
    creator: "",
    genres: [],
    themes: [],
    status: "unspecified",
    statusLabel: "",
    added: "2026-10-21",
    visibility: "public",
    ...partial,
  };
}

const demian = card({
  slug: "demian",
  title: "데미안",
  titleOriginal: "Demian",
  creator: "Hermann Hesse",
  year: 1919,
  language: "de",
  genres: ["Novel"],
  added: "2026-10-21",
});

const cosmos = card({
  slug: "cosmos",
  title: "코스모스",
  titleEn: "Cosmos",
  creator: "Carl Sagan",
  year: 1980,
  language: "en",
  genres: ["Science"],
  added: "2026-10-21",
});

const agnes = card({
  slug: "agnes-varda",
  title: "아녜스 바르다의 말",
  creator: "Agnès Varda",
  language: "en",
  genres: ["Interviews", "Film"],
  added: "2026-10-21",
  // no year: should sink to the end of either year sort
});

const books = [demian, cosmos, agnes];

/* ───────────────────────────── search ─────────────────────────────────── */

test("matchesSearch: case-insensitive Latin", () => {
  assert.equal(matchesSearch(demian, "DEMIAN"), true);
  assert.equal(matchesSearch(demian, "demian"), true);
  assert.equal(matchesSearch(demian, "demianx"), false);
});

test("matchesSearch: Korean title", () => {
  assert.equal(matchesSearch(demian, "데미안"), true);
  assert.equal(matchesSearch(cosmos, "코스모스"), true);
  assert.equal(matchesSearch(cosmos, "데미안"), false);
});

test("matchesSearch: by creator, English and accented", () => {
  assert.equal(matchesSearch(demian, "Hesse"), true);
  assert.equal(matchesSearch(agnes, "Varda"), true);
  // fold() strips accents, so the unaccented form must also find Agnès.
  assert.equal(matchesSearch(agnes, "agnes"), true);
});

test("matchesSearch: whitespace is trimmed and terms are all required", () => {
  assert.equal(matchesSearch(demian, "  Hesse  "), true);
  assert.equal(matchesSearch(demian, "Hesse Demian"), true); // both terms present
  assert.equal(matchesSearch(demian, "Hesse Cosmos"), false); // second term absent
  assert.equal(matchesSearch(demian, "   "), true); // empty query matches everything
});

test("fold: Korean spacing and width-insensitive, accents stripped", () => {
  assert.equal(fold("작별하지 않는다"), fold("작별하지않는다"));
  assert.equal(fold("Agnès"), fold("Agnes"));
  assert.equal(fold("ABC"), fold("abc"));
});

/* ───────────────────────────── sorting ─────────────────────────────────── */

test("sortWorks: title A-Z and Z-A are exact reverses for this set", () => {
  const asc = sortWorks(books, "title").map((c) => c.slug);
  const desc = sortWorks(books, "titleDesc").map((c) => c.slug);
  assert.deepEqual(desc, [...asc].reverse());
});

test("sortWorks: yearAsc and yearDesc both sink undefined-year works to the end", () => {
  const asc = sortWorks(books, "yearAsc").map((c) => c.slug);
  const desc = sortWorks(books, "yearDesc").map((c) => c.slug);
  assert.deepEqual(asc, ["demian", "cosmos", "agnes-varda"]); // 1919, 1980, then undefined
  assert.deepEqual(desc, ["cosmos", "demian", "agnes-varda"]); // 1980, 1919, then undefined
});

test("sortWorks: curated order is deterministic and stable under repetition", () => {
  const once = sortWorks(books, "curated").map((c) => c.slug);
  const twice = sortWorks(sortWorks(books, "yearAsc"), "curated").map((c) => c.slug);
  assert.deepEqual(once, twice);
});

test("sortWorks: curated order does not mutate the input array", () => {
  const original = [...books];
  sortWorks(books, "title");
  assert.deepEqual(books, original);
});

/* ─────────────────────────── filter + facets ───────────────────────────── */

test("applyQuery: language filter narrows correctly", () => {
  const result = applyQuery(books, { ...EMPTY_QUERY, language: "de" });
  assert.deepEqual(result.map((c) => c.slug), ["demian"]);
});

test("applyQuery: creator filter narrows correctly", () => {
  const result = applyQuery(books, { ...EMPTY_QUERY, creator: "Carl Sagan" });
  assert.deepEqual(result.map((c) => c.slug), ["cosmos"]);
});

test("applyQuery: search combined with a filter", () => {
  const result = applyQuery(books, { ...EMPTY_QUERY, q: "코스모스", language: "en" });
  assert.deepEqual(result.map((c) => c.slug), ["cosmos"]);
  const empty = applyQuery(books, { ...EMPTY_QUERY, q: "코스모스", language: "de" });
  assert.deepEqual(empty, []);
});

test("languageFacet: distinct languages only, by name", () => {
  const facets = languageFacet(books);
  assert.deepEqual(
    facets.map((f) => f.value).sort(),
    ["de", "en"],
  );
});

test("creatorFacet: distinct, non-empty creators only", () => {
  const withBlank = [...books, card({ slug: "unidentified", creator: "" })];
  const facets = creatorFacet(withBlank);
  assert.equal(facets.includes(""), false);
  assert.equal(facets.length, 3);
});

/* ─────────────────────────── reset / default query ──────────────────────── */

test("isDefaultQuery: EMPTY_QUERY is the default, and any set field is not", () => {
  assert.equal(isDefaultQuery(EMPTY_QUERY), true);
  assert.equal(isDefaultQuery({ ...EMPTY_QUERY, language: "en" }), false);
  assert.equal(isDefaultQuery({ ...EMPTY_QUERY, creator: "Carl Sagan" }), false);
  assert.equal(isDefaultQuery({ ...EMPTY_QUERY, sort: "title" }), false);
});

test("resetting to EMPTY_QUERY restores curated order exactly", () => {
  const scrambled: WorkQuery = { ...EMPTY_QUERY, sort: "titleDesc", language: "de" };
  const scrambledResult = applyQuery(books, scrambled).map((c) => c.slug);
  const restoredResult = applyQuery(books, EMPTY_QUERY).map((c) => c.slug);
  const originalCurated = sortWorks(books, "curated").map((c) => c.slug);
  assert.notDeepEqual(scrambledResult, restoredResult);
  assert.deepEqual(restoredResult, originalCurated);
});

/* ─────────────────────────── URL round-tripping ─────────────────────────── */

test("queryToParams / paramsToQuery round-trip, including language and creator", () => {
  const query: WorkQuery = {
    ...EMPTY_QUERY,
    q: "hesse",
    language: "de",
    creator: "Hermann Hesse",
    sort: "yearAsc",
    group: true,
  };
  const params = queryToParams(query);
  const restored = paramsToQuery(params);
  assert.deepEqual(restored, query);
});

test("paramsToQuery: an unrecognised sort value falls back to curated", () => {
  const params = new URLSearchParams("sort=bogus");
  assert.equal(paramsToQuery(params).sort, "curated");
});

test("paramsToQuery: no params object returns EMPTY_QUERY", () => {
  assert.deepEqual(paramsToQuery(null), EMPTY_QUERY);
});

/* ─────────────────────────────── titles ──────────────────────────────────── */

test("primaryTitle and secondaryTitles never fabricate a translation", () => {
  assert.equal(primaryTitle(agnes), "아녜스 바르다의 말"); // no titleEn, not English-original
  assert.deepEqual(secondaryTitles(agnes), []); // nothing distinct to show beneath it
  assert.equal(primaryTitle(cosmos), "Cosmos"); // titleEn present
  assert.deepEqual(secondaryTitles(cosmos), ["코스모스"]);
});
