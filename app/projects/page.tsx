import type { Metadata } from "next";

import { EmptyState } from "@/components/ui/EmptyState";
import { EntryList } from "@/components/ui/EntryRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getEntries, splitFeatured } from "@/lib/content";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Interdisciplinary and personal explorations — work that sits between fields, and questions that are not yet research.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  const { featured, rest } = splitFeatured(getEntries("projects"));

  return (
    <div className="shell py-16 sm:py-20">
      <PageHeader
        eyebrow="Explorations"
        title="Projects"
        intro="Work that sits between fields, and questions that are not yet research. Some of this will turn into something; some of it is here because it would not leave me alone."
      />

      {featured.length || rest.length ? (
        <div className="mt-14 flex flex-col gap-16">
          {featured.length ? (
            <section aria-labelledby="projects-current">
              <SectionHeading as="h3">
                <span id="projects-current">Current</span>
              </SectionHeading>
              <EntryList entries={featured} className="border-t-0" />
            </section>
          ) : null}

          {rest.length ? (
            <section aria-labelledby="projects-other">
              <SectionHeading as="h3">
                <span id="projects-other">Other explorations</span>
              </SectionHeading>
              <EntryList entries={rest} className="border-t-0" />
            </section>
          ) : null}
        </div>
      ) : (
        <div className="mt-14">
          <EmptyState>Explorations will be gathered here.</EmptyState>
        </div>
      )}
    </div>
  );
}
