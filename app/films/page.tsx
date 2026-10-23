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
  title: "The Screening Room",
  description:
    "Images that linger — a personal film archive, with room for notes on form and on people.",
  alternates: { canonical: "/films" },
};

export default function FilmsPage() {
  const films = getEntries("films").map(toWorkCard);

  return (
    <div className="shell py-16 sm:py-20">
      <PageHeader
        eyebrow={
          <>
            The Collection <span className="mx-1 text-rule">/</span> II
          </>
        }
        title="The Screening Room"
        intro={
          <>
            <em>Images that linger.</em> Films, and the people who made them. Each has a place
            for notes on form and on people, left empty until there is something to say.
          </>
        }
      />

      {films.length ? (
        <div className="mt-12">
          <Suspense fallback={<WorkGrid items={films} variant="films" />}>
            <WorkArchive items={films} kind="films" />
          </Suspense>
        </div>
      ) : (
        <div className="mt-12">
          <EmptyState>The first screening has not been programmed yet.</EmptyState>
        </div>
      )}

      <CollectionCredits providers={imageProvidersInUse(films)} />
    </div>
  );
}
