import type { Metadata } from "next";
import { Suspense } from "react";

import { CollectionCredits } from "@/components/collection/CollectionCredits";
import { WorkArchive } from "@/components/collection/WorkArchive";
import { WorkGrid } from "@/components/collection/WorkGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getEntries } from "@/lib/content";
import { imageProvidersInUse, toWorkCard } from "@/lib/works";

export const metadata: Metadata = {
  title: "The Bookshelf",
  description:
    "Words I return to — a personal literary archive of novels, philosophy, essays and science writing, kept under their original titles.",
  alternates: { canonical: "/bookshelf" },
};

export default function BookshelfPage() {
  const books = getEntries("books").map(toWorkCard);

  return (
    <div className="shell py-16 sm:py-20">
      <PageHeader
        eyebrow={
          <>
            The Collection <span className="mx-1 text-rule">/</span> I
          </>
        }
        title="The Bookshelf"
        intro={
          <>
            <em>Words I return to.</em> Novels, philosophy, essays and science writing, each
            listed under the title I know it by, with its original and English titles beside it.
          </>
        }
      />

      {books.length ? (
        <div className="mt-12">
          {/*
            The archive reads its initial state from the URL, so it renders on
            the client; until then — and without JavaScript at all — the whole
            shelf is shown.
          */}
          <Suspense fallback={<WorkGrid items={books} variant="books" />}>
            <WorkArchive items={books} kind="books" />
          </Suspense>
        </div>
      ) : (
        <div className="mt-12">
          <EmptyState>The shelf is still being filled.</EmptyState>
        </div>
      )}

      <CollectionCredits providers={imageProvidersInUse(books)} />
    </div>
  );
}
