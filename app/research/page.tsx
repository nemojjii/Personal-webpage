import type { Metadata } from "next";

import { EmptyState } from "@/components/ui/EmptyState";
import { EntryList } from "@/components/ui/EntryRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getEntries, splitFeatured } from "@/lib/content";

export const metadata: Metadata = {
  title: "Research",
  description:
    "Research in theoretical science, mathematical modeling and computational physics.",
  alternates: { canonical: "/research" },
};

export default function ResearchPage() {
  const { featured, rest } = splitFeatured(getEntries("research"));

  return (
    <div className="shell py-16 sm:py-20">
      <PageHeader
        eyebrow="Archive"
        title="Research"
        intro="Work in theoretical science, mathematical modeling, and the computational side of physics and chemistry. Full accounts of each project are being assembled from the original materials."
      />

      {featured.length || rest.length ? (
        <div className="mt-14 flex flex-col gap-16">
          {featured.length ? (
            <section aria-labelledby="research-featured">
              <SectionHeading as="h3">
                <span id="research-featured">Featured research</span>
              </SectionHeading>
              <EntryList entries={featured} className="border-t-0" />
            </section>
          ) : null}

          {rest.length ? (
            <section aria-labelledby="research-additional">
              <SectionHeading as="h3">
                <span id="research-additional">Additional research</span>
              </SectionHeading>
              <EntryList entries={rest} className="border-t-0" />
            </section>
          ) : null}
        </div>
      ) : (
        <div className="mt-14">
          <EmptyState>Research will be listed here.</EmptyState>
        </div>
      )}
    </div>
  );
}
