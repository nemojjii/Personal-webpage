"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";

import type { WorkCardData } from "@/lib/types";
import {
  EMPTY_QUERY,
  type WorkQuery,
  applyQuery,
  creatorFacet,
  creatorNoun,
  facet,
  groupByCreator,
  isDefaultQuery,
  languageFacet,
  paramsToQuery,
  queryToParams,
  sortLabel,
  statusFacet,
  workSorts,
  yearFacet,
} from "@/lib/works";

import { WorkGrid } from "./WorkGrid";

/**
 * Search, filters, sorting and director- or author-focused browsing for the
 * Bookshelf and the Screening Room.
 *
 * Everything happens in the browser over the cards the page was built with;
 * there is no search endpoint and nothing non-public ever reaches this code.
 * The current view is mirrored into the address bar with `replaceState`, so
 * a filtered shelf can be linked to without a server round trip per keystroke.
 * Without JavaScript the page shows the full shelf instead (see the Suspense
 * fallback where this is used).
 */
export function WorkArchive({
  items,
  kind,
}: {
  items: WorkCardData[];
  kind: "books" | "films";
}) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState<WorkQuery>(() => paramsToQuery(searchParams));
  const id = useId();

  useEffect(() => {
    const params = queryToParams(query).toString();
    const next = `${window.location.pathname}${params ? `?${params}` : ""}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", next);
    }
  }, [query]);

  const genres = useMemo(() => facet(items, "genres"), [items]);
  const themes = useMemo(() => facet(items, "themes"), [items]);
  const statuses = useMemo(() => statusFacet(items), [items]);
  const years = useMemo(() => (kind === "films" ? yearFacet(items) : []), [items, kind]);
  const languages = useMemo(() => languageFacet(items), [items]);
  const creators = useMemo(() => creatorFacet(items), [items]);

  const results = useMemo(() => applyQuery(items, query), [items, query]);
  const groups = useMemo(() => (query.group ? groupByCreator(results) : []), [results, query.group]);

  const noun = kind === "books" ? "book" : "film";
  const creator = creatorNoun(kind);
  const filtered = !isDefaultQuery(query);
  const update = (patch: Partial<WorkQuery>) => setQuery((q) => ({ ...q, ...patch }));

  return (
    <section aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`} className="sr-only">
        Browse the {kind === "books" ? "shelf" : "archive"}
      </h2>

      <form
        role="search"
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-col gap-y-5 border-b border-rule-soft pb-6"
      >
        <div className="flex flex-wrap items-end gap-x-8 gap-y-5">
          <label className="block min-w-[14rem] flex-1">
            <span className="label mb-1.5 block">Search</span>
            <input
              type="search"
              value={query.q}
              onChange={(e) => update({ q: e.target.value })}
              placeholder={kind === "books" ? "Title or author — 제목, 작가" : "Title or director — 제목, 감독"}
              autoComplete="off"
              className="w-full border-b border-rule bg-transparent py-1.5 font-serif text-[1.0625rem] text-ink
                         placeholder:text-ink-muted focus:border-accent focus:outline-none"
            />
          </label>

          {genres.length > 1 ? (
            <Select
              label="Genre"
              value={query.genre}
              onChange={(genre) => update({ genre })}
              all="All genres"
              options={genres.map((g) => ({ value: g, label: g }))}
            />
          ) : null}
          {languages.length > 1 ? (
            <Select
              label="Language"
              value={query.language}
              onChange={(language) => update({ language })}
              all="Any language"
              options={languages}
            />
          ) : null}
          {creators.length > 1 ? (
            <Select
              label={kind === "books" ? "Author" : "Director"}
              value={query.creator}
              onChange={(creator) => update({ creator })}
              all={kind === "books" ? "Any author" : "Any director"}
              options={creators.map((c) => ({ value: c, label: c }))}
            />
          ) : null}
          {themes.length > 0 ? (
            <Select
              label="Theme"
              value={query.theme}
              onChange={(theme) => update({ theme })}
              all="All themes"
              options={themes.map((t) => ({ value: t, label: t }))}
            />
          ) : null}
          {statuses.length > 0 ? (
            <Select
              label={kind === "books" ? "Reading" : "Viewing"}
              value={query.status}
              onChange={(status) => update({ status })}
              all="Any"
              options={statuses}
            />
          ) : null}
          {years.length > 1 ? (
            <Select
              label="Year"
              value={query.year}
              onChange={(year) => update({ year })}
              all="All years"
              options={years.map((y) => ({ value: y, label: y }))}
            />
          ) : null}
          <Select
            label="Sort"
            value={query.sort}
            onChange={(sort) => update({ sort: sort as WorkQuery["sort"] })}
            options={workSorts.map((s) => ({ value: s, label: sortLabel(s) }))}
          />
          <Select
            label="View"
            value={query.group ? "creator" : "grid"}
            onChange={(view) => update({ group: view === "creator" })}
            options={[
              { value: "grid", label: kind === "books" ? "Shelf" : "Wall" },
              { value: "creator", label: `By ${creator}` },
            ]}
          />
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <p role="status" aria-live="polite" className="font-sans text-[0.8125rem] text-ink-soft tnum">
            {results.length === items.length
              ? `${items.length} ${items.length === 1 ? noun : `${noun}s`}`
              : `${results.length} of ${items.length} ${items.length === 1 ? noun : `${noun}s`}`}
          </p>
          {filtered ? (
            <button
              type="button"
              onClick={() => setQuery(EMPTY_QUERY)}
              className="link-quiet font-sans text-[0.8125rem] text-ink"
            >
              Reset
            </button>
          ) : null}
        </div>
      </form>

      {results.length === 0 ? (
        <div className="mt-10 border-l border-rule py-1 pl-5">
          <p className="font-serif text-[1.0625rem] text-ink-soft italic">
            Nothing {kind === "books" ? "on the shelf" : "in the archive"} matches that.
          </p>
          <p className="mt-1.5 font-sans text-[0.8125rem] text-ink-muted">
            Try fewer words, or{" "}
            <button
              type="button"
              onClick={() => setQuery(EMPTY_QUERY)}
              className="link-quiet text-ink"
            >
              start again
            </button>
            .
          </p>
        </div>
      ) : query.group ? (
        <div className="mt-10 flex flex-col gap-y-12">
          {groups.map((group) => (
            <section key={group.creator || "—"} aria-label={group.creator || `Unnamed ${creator}`}>
              <h3 className="flex items-baseline gap-x-3 border-b border-rule pb-2.5 font-serif text-[1.25rem] leading-snug">
                {group.creator || <span className="text-ink-muted italic">{creator} not yet confirmed</span>}
                {group.creatorOriginal ? (
                  <span className="font-serif text-[1rem] text-ink-muted">{group.creatorOriginal}</span>
                ) : null}
                <span className="ml-auto font-sans text-[0.75rem] text-ink-muted tnum">
                  {group.items.length}
                </span>
              </h3>
              <WorkGrid items={group.items} variant={kind} className="mt-6" />
            </section>
          ))}
        </div>
      ) : (
        <WorkGrid items={results} variant={kind} className="mt-10" />
      )}
    </section>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  all,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  /** Label of the empty option, when the select is a filter rather than a setting. */
  all?: string;
}) {
  return (
    <label className="block">
      <span className="label mb-1.5 block">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-[8.5rem] appearance-none border-b border-rule bg-transparent py-1.5 pr-6
                     font-sans text-[0.8125rem] text-ink focus:border-accent focus:outline-none"
        >
          {all !== undefined ? <option value="">{all}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 12 12"
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-1 h-2.5 w-2.5 -translate-y-1/2 text-ink-muted"
        >
          <path d="M2 4.5 6 8.5l4-4" fill="none" stroke="currentColor" strokeWidth="1.1" />
        </svg>
      </span>
    </label>
  );
}
