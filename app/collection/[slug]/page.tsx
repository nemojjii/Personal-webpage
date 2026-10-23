import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CollectionCredits } from "@/components/collection/CollectionCredits";
import { WorkGrid } from "@/components/collection/WorkGrid";
import { Mdx } from "@/components/content/mdx";
import { Prose } from "@/components/content/Prose";
import { EmptyState } from "@/components/ui/EmptyState";
import { EntryList } from "@/components/ui/EntryRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getThemeCollection, themeCollectionItems, themeCollections } from "@/lib/content";
import { type BookEntry, type FilmEntry, isWork } from "@/lib/types";
import { imageProvidersInUse, toWorkCard } from "@/lib/works";
import { site } from "@/site.config";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return themeCollections().map((collection) => ({ slug: collection.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const collection = getThemeCollection(slug);
  if (!collection) return {};
  return {
    title: collection.title,
    description: collection.subtitle ?? `A thematic collection of books and films — ${site.name}.`,
    alternates: { canonical: `/collection/${collection.slug}` },
  };
}

/**
 * A hand-curated thematic collection: books and films gathered under one
 * idea, in the order the collection file gives them.
 */
export default async function ThemeCollectionPage({ params }: Params) {
  const { slug } = await params;
  const collection = getThemeCollection(slug);
  if (!collection) notFound();

  const items = themeCollectionItems(collection);
  const works = items.filter((e): e is BookEntry | FilmEntry => isWork(e)).map(toWorkCard);
  const others = items.filter((e) => !isWork(e));
  const hasBody = collection.body.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").trim().length > 0;

  return (
    <div className="shell py-16 sm:py-20">
      <PageHeader
        eyebrow={
          <>
            <Link href="/collection" className="link-quiet">
              The Collection
            </Link>
            <span className="mx-1 text-rule">/</span> {works.length}{" "}
            {works.length === 1 ? "work" : "works"}
          </>
        }
        title={collection.title}
        intro={collection.subtitle ? <em>{collection.subtitle}</em> : undefined}
      />

      {hasBody ? (
        <div className="mt-10 max-w-[40rem]">
          <Prose>
            <Mdx source={collection.body} />
          </Prose>
        </div>
      ) : null}

      {works.length ? (
        <WorkGrid items={works} variant="films" showKind className="mt-12" />
      ) : (
        <div className="mt-12">
          <EmptyState>Nothing has been gathered here yet.</EmptyState>
        </div>
      )}

      {others.length ? (
        <section className="mt-16" aria-labelledby="also-here">
          <SectionHeading as="h3">
            <span id="also-here">Also in this collection</span>
          </SectionHeading>
          <EntryList entries={others} className="border-t-0" compact />
        </section>
      ) : null}

      <CollectionCredits providers={imageProvidersInUse(works)} />
    </div>
  );
}
