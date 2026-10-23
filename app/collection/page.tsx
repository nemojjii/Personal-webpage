import type { Metadata } from "next";
import Link from "next/link";

import { CollectionCredits } from "@/components/collection/CollectionCredits";
import { WorkGrid } from "@/components/collection/WorkGrid";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getEntries, themeCollectionItems, themeCollections } from "@/lib/content";
import { type WorkCardData, isWork } from "@/lib/types";
import { imageProvidersInUse, toWorkCard } from "@/lib/works";

export const metadata: Metadata = {
  title: "The Collection",
  description:
    "Stories, images, and ideas I keep returning to — a personal library of books and a small screening room of films.",
  alternates: { canonical: "/collection" },
};

/** One of the two spaces, introduced on the landing page. */
function Space({
  numeral,
  title,
  subtitle,
  description,
  href,
  enter,
  count,
  noun,
  items,
}: {
  numeral: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  enter: string;
  count: number;
  noun: string;
  items: WorkCardData[];
}) {
  const id = `space-${href.replace("/", "")}`;
  return (
    <section aria-labelledby={id} className="flex flex-col">
      <p className="label">{numeral}</p>
      <h2 id={id} className="mt-3 font-serif text-[1.9rem] leading-[1.1] tracking-[-0.01em] sm:text-[2.2rem]">
        <Link href={href} className="transition-colors duration-200 hover:text-accent">
          {title}
        </Link>
      </h2>
      <p className="mt-2 font-serif text-[1.25rem] leading-snug text-ink-soft italic">{subtitle}</p>
      <p className="mt-4 max-w-[30rem] font-serif text-[1.0625rem] leading-[1.6] text-ink-soft">
        {description}
      </p>

      {items.length ? (
        <WorkGrid items={items} variant="recent" className="mt-8" />
      ) : (
        <p className="mt-8 border-l border-rule py-1 pl-5 font-serif text-[1.0625rem] text-ink-soft italic">
          Nothing has been shelved here yet.
        </p>
      )}

      <p className="mt-7 flex flex-wrap items-baseline gap-x-4 font-sans text-[0.8125rem]">
        <Link href={href} className="link-quiet text-ink">
          {enter}
          <span aria-hidden="true"> →</span>
        </Link>
        <span className="text-ink-muted tnum">
          {count} {count === 1 ? noun : `${noun}s`}
        </span>
      </p>
    </section>
  );
}

export default function CollectionPage() {
  const books = getEntries("books");
  const films = getEntries("films");
  // `featured` lifts a work to the front; otherwise the most recently added.
  const pick = <T extends { featured: boolean }>(entries: T[], n: number) =>
    [...entries.filter((e) => e.featured), ...entries.filter((e) => !e.featured)].slice(0, n);

  const collections = themeCollections().map((collection) => ({
    ...collection,
    count: themeCollectionItems(collection).filter(isWork).length,
  }));
  const shownBooks = pick(books, 4).map(toWorkCard);
  const shownFilms = pick(films, 4).map(toWorkCard);

  return (
    <div className="shell py-16 sm:py-20">
      <PageHeader
        eyebrow="Archive"
        title="The Collection"
        intro={
          <>
            <em>Stories, images, and ideas I keep returning to.</em> A private library
            connected to a small screening room: two spaces, kept separately and read together.
          </>
        }
      />

      <div className="mt-14 grid gap-16 lg:grid-cols-2 lg:gap-x-20">
        <Space
          numeral="I"
          title="The Bookshelf"
          subtitle="Words I return to."
          description="Novels, philosophy, essays and science writing, each listed under the title I know it by, with its original and English titles beside it."
          href="/bookshelf"
          enter="Browse the shelf"
          count={books.length}
          noun="book"
          items={shownBooks}
        />
        <Space
          numeral="II"
          title="The Screening Room"
          subtitle="Images that linger."
          description="Films, and the people who made them. Each has a place for notes on form and on people, left empty until there is something to say."
          href="/films"
          enter="Enter the screening room"
          count={films.length}
          noun="film"
          items={shownFilms}
        />
      </div>

      {collections.length ? (
        <section className="mt-20" aria-labelledby="thematic-collections">
          <SectionHeading>
            <span id="thematic-collections">Thematic collections</span>
          </SectionHeading>
          <ul className="mt-2">
            {collections.map((collection) => (
              <li key={collection.slug} className="entry-row border-b border-rule-soft last:border-b-0">
                <Link
                  href={`/collection/${collection.slug}`}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4"
                >
                  <span className="flex flex-wrap items-baseline gap-x-3">
                    <span className="entry-title font-serif text-[1.25rem]">{collection.title}</span>
                    {collection.subtitle ? (
                      <span className="font-serif text-[1rem] text-ink-soft italic">
                        {collection.subtitle}
                      </span>
                    ) : null}
                  </span>
                  <span className="font-sans text-[0.75rem] text-ink-muted tnum">
                    {collection.count} {collection.count === 1 ? "work" : "works"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <CollectionCredits providers={imageProvidersInUse([...shownBooks, ...shownFilms])} />
    </div>
  );
}
