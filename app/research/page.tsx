import type { Metadata } from "next";

import { EmptyState } from "@/components/ui/EmptyState";
import { EntryList } from "@/components/ui/EntryRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getEntries } from "@/lib/content";
import { type ResearchStatus, researchStatuses } from "@/lib/types";

export const metadata: Metadata = {
  title: "Research",
  description:
    "Research projects, questions in progress and publications — an archive organised by stage rather than by date.",
  alternates: { canonical: "/research" },
};

const ORDER: ResearchStatus[] = ["publication", "in-progress", "completed", "idea"];

export default function ResearchPage() {
  const all = getEntries("research");

  const groups = ORDER.map((status) => ({
    status,
    label: researchStatuses[status].label,
    entries: all.filter((entry) => entry.status === status),
  })).filter((group) => group.entries.length > 0);

  return (
    <div className="shell py-16 sm:py-20">
      <PageHeader
        eyebrow="Archive"
        title="Research"
        intro="Projects are listed by stage rather than by date, so that an unfinished question sits beside a finished one without pretending to be the same kind of thing."
      />

      {groups.length ? (
        <div className="mt-14 flex flex-col gap-16">
          {groups.map((group) => (
            <section key={group.status} aria-labelledby={`status-${group.status}`}>
              <SectionHeading as="h3">
                <span id={`status-${group.status}`}>
                  {group.label}
                  <span className="ml-2 font-normal text-ink-muted tnum">
                    {String(group.entries.length).padStart(2, "0")}
                  </span>
                </span>
              </SectionHeading>
              <EntryList entries={group.entries} className="border-t-0" />
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-14">
          <EmptyState hint="Copy content/research/_template.mdx to start a project.">
            No research entries yet.
          </EmptyState>
        </div>
      )}
    </div>
  );
}
