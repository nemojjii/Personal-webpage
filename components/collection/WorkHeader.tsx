import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import { TagList } from "@/components/ui/TagList";
import { VisibilityMark } from "@/components/ui/VisibilityMark";
import { formatDate } from "@/lib/content";
import {
  type BookEntry,
  type FilmEntry,
  type ThemeCollection,
  collectionMeta,
  readingStatuses,
  viewingStatuses,
} from "@/lib/types";
import { languageName, titleLang } from "@/lib/works";

import { WorkCover } from "./WorkCover";

/**
 * The masthead of a single book or film: the cover beside the titles in each
 * of their languages, who made it, and the bibliographic facts that are
 * actually known. Anything not filled in is simply not shown.
 */
export function WorkHeader({
  entry,
  collections,
  showPrivateNotes = false,
}: {
  entry: BookEntry | FilmEntry;
  /** Thematic collections this work belongs to. */
  collections: ThemeCollection[];
  /** Development only: surface the verification note so it can be resolved. */
  showPrivateNotes?: boolean;
}) {
  const isBook = entry.collection === "books";
  const creator = isBook ? entry.author : entry.director;
  const creatorOriginal = isBook ? entry.authorOriginal : entry.directorOriginal;
  const statusLabel = isBook
    ? readingStatuses[entry.readingStatus].label
    : viewingStatuses[entry.viewingStatus].label;
  const statusDate = isBook ? entry.dateFinished : entry.dateWatched;

  const original =
    entry.titleOriginal && entry.titleOriginal !== entry.title ? entry.titleOriginal : undefined;
  const english =
    entry.titleEn && entry.titleEn !== entry.title && entry.titleEn !== original
      ? entry.titleEn
      : undefined;

  const facts = (
    [
      !isBook && entry.country ? { term: "Country", detail: entry.country } : null,
      entry.language ? { term: "Language", detail: languageName(entry.language) } : null,
      isBook && entry.edition ? { term: "Edition", detail: entry.edition } : null,
      isBook && entry.isbn ? { term: "ISBN", detail: <span className="tnum">{entry.isbn}</span> } : null,
      entry.genres.length
        ? { term: entry.genres.length > 1 ? "Genres" : "Genre", detail: entry.genres.join(" · ") }
        : null,
      entry.themes.length
        ? { term: entry.themes.length > 1 ? "Themes" : "Theme", detail: entry.themes.join(" · ") }
        : null,
      statusLabel
        ? {
            term: isBook ? "Reading" : "Viewing",
            detail: (
              <>
                {statusLabel}
                {statusDate ? (
                  <span className="text-ink-muted">
                    {" · "}
                    <time dateTime={statusDate}>{formatDate(statusDate, "short")}</time>
                  </span>
                ) : null}
              </>
            ),
          }
        : null,
      collections.length
        ? {
            term: collections.length > 1 ? "Collections" : "Collection",
            detail: collections.map((c, i) => (
              <Fragment key={c.slug}>
                {i > 0 ? <span className="text-ink-muted"> · </span> : null}
                <Link href={`/collection/${c.slug}`} className="link-quiet text-ink">
                  {c.title}
                </Link>
              </Fragment>
            )),
          }
        : null,
      entry.added
        ? {
            term: "Added",
            detail: <time dateTime={entry.added}>{formatDate(entry.added, "short")}</time>,
          }
        : null,
    ] as ({ term: string; detail: ReactNode } | null)[]
  ).filter((f): f is { term: string; detail: ReactNode } => f !== null);

  return (
    <header className="border-b border-rule pb-8">
      <div className="grid gap-8 sm:grid-cols-[9.5rem_1fr] sm:gap-10">
        <div>
          <WorkCover
            work={{
              collection: entry.collection,
              title: entry.title,
              creator,
              year: entry.year,
              image: entry.image,
            }}
            eager
            className="w-[9.5rem] sm:w-full"
          />
          {entry.imageCredit ? (
            <p className="mt-2 max-w-[9.5rem] font-sans text-[0.6875rem] leading-snug text-ink-muted sm:max-w-none">
              {entry.imageCredit}
            </p>
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <Link href={collectionMeta[entry.collection].href} className="label link-quiet !text-accent">
              {isBook ? "The Bookshelf" : "The Screening Room"}
            </Link>
            <VisibilityMark visibility={entry.visibility} />
          </div>

          <h1
            lang={titleLang(entry.title)}
            className="font-serif text-display leading-[1.08] tracking-[-0.015em] text-balance"
          >
            {entry.title}
          </h1>

          {original || english ? (
            <p className="mt-3 flex flex-col gap-y-0.5 font-serif text-[1.25rem] leading-[1.35] text-ink-soft italic sm:text-[1.35rem]">
              {original ? <span lang={entry.language}>{original}</span> : null}
              {english ? <span lang="en">{english}</span> : null}
            </p>
          ) : null}

          {creator || entry.year ? (
            <p className="mt-5 font-serif text-[1.125rem] leading-snug text-ink">
              {creator}
              {creatorOriginal ? <span className="text-ink-muted"> · {creatorOriginal}</span> : null}
              {entry.year ? (
                <span className="text-ink-muted tnum">
                  {creator ? " · " : ""}
                  {entry.year}
                </span>
              ) : null}
            </p>
          ) : null}

          {entry.summary ? (
            <p className="mt-5 max-w-[34rem] font-serif text-[1.125rem] leading-[1.6] text-ink-soft">
              {entry.summary}
            </p>
          ) : null}

          {facts.length ? (
            <dl className="mt-7 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 font-sans text-[0.8125rem] leading-snug">
              {facts.map((fact) => (
                <Fragment key={fact.term}>
                  <dt className="label pt-px !text-ink-muted">{fact.term}</dt>
                  <dd className="text-ink-soft">{fact.detail}</dd>
                </Fragment>
              ))}
            </dl>
          ) : null}

          {entry.tags.length ? <TagList tags={entry.tags} className="mt-6" size="xs" /> : null}

          {showPrivateNotes && (!entry.verified || entry.verifyNote) ? (
            <aside className="mt-6 border-l border-dashed border-accent-soft py-0.5 pl-3 font-sans text-[0.75rem] leading-relaxed text-ink-soft">
              <span className="font-medium text-accent">Development only · </span>
              {entry.verified ? null : "Metadata not yet verified. "}
              {entry.verifyNote}
            </aside>
          ) : null}
        </div>
      </div>
    </header>
  );
}
