import type { Metadata } from "next";

import { ArticleLayout } from "@/components/content/ArticleLayout";
import { Mdx } from "@/components/content/mdx";
import { Prose } from "@/components/content/Prose";
import { ConnectedIdeas } from "@/components/ui/ConnectedIdeas";
import { EntryNav } from "@/components/ui/EntryNav";
import { References } from "@/components/ui/References";
import { isProduction, themeCollectionsFor } from "@/lib/content";
import { buildToc } from "@/lib/toc";
import type { BookEntry, FilmEntry } from "@/lib/types";
import { primaryTitle, secondaryTitles } from "@/lib/works";
import { site } from "@/site.config";

import { WorkHeader } from "./WorkHeader";

type Work = BookEntry | FilmEntry;

/** Page metadata for a book or film, with the Open Graph type to match. */
export function workMetadata(entry: Work): Metadata {
  const primary = primaryTitle(entry);
  const second = secondaryTitles(entry);
  const title = second.length ? `${primary} (${second.join(" / ")})` : primary;
  const creator = entry.collection === "books" ? entry.author : entry.director;
  const where = entry.collection === "books" ? "On the Bookshelf" : "In the Screening Room";
  const description =
    entry.summary ?? [creator, entry.year, `${where} of ${site.name}`].filter(Boolean).join(" · ");
  const releaseDate = entry.year ? String(entry.year) : undefined;

  return {
    title,
    description,
    alternates: { canonical: entry.href },
    openGraph:
      entry.collection === "books"
        ? {
            type: "book",
            title,
            description,
            url: entry.href,
            authors: entry.author ? [entry.author] : undefined,
            isbn: entry.isbn,
            releaseDate,
          }
        : {
            type: "video.movie",
            title,
            description,
            url: entry.href,
            directors: entry.director ? [entry.director] : undefined,
            releaseDate,
          },
  };
}

/**
 * The reading page shared by books and films. The masthead carries the
 * facts; the body — notes, and the reflection sections when they exist — is
 * rendered only when there is something in it.
 */
export function WorkPage({
  entry,
  siblings,
  navLabel,
}: {
  entry: Work;
  /** The collection in index order, for previous / next. */
  siblings: Work[];
  navLabel: string;
}) {
  const toc = buildToc(entry.body);
  const index = siblings.findIndex((e) => e.slug === entry.slug);
  // wordCount ignores MDX comments and bare tags, so a template left untouched
  // counts as empty and the page ends at its masthead.
  const hasBody = entry.wordCount > 0;

  return (
    <div className="shell py-14 sm:py-16">
      <ArticleLayout
        toc={toc}
        header={
          <WorkHeader
            entry={entry}
            collections={themeCollectionsFor(entry)}
            showPrivateNotes={!isProduction}
          />
        }
      >
        {hasBody ? (
          <div className="mt-10">
            <Prose>
              <Mdx source={entry.body} />
            </Prose>
          </div>
        ) : null}

        <References items={entry.references} />
        <ConnectedIdeas entry={entry} />
        <EntryNav
          label={navLabel}
          next={index > 0 ? siblings[index - 1] : undefined}
          previous={index < siblings.length - 1 ? siblings[index + 1] : undefined}
        />
      </ArticleLayout>
    </div>
  );
}
