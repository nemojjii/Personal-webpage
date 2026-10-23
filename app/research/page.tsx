import type { Metadata } from "next";

import { EmptyState } from "@/components/ui/EmptyState";
import { EntryList } from "@/components/ui/EntryRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getEntries } from "@/lib/content";
import type { ResearchEntry } from "@/lib/types";

export const metadata: Metadata = {
  title: "Research",
  description:
    "Research in theoretical science, mathematical modeling and computational physics.",
  alternates: { canonical: "/research" },
};

/**
 * The exact sequence within each section, as distinct from `splitFeatured`'s
 * featured-then-date ordering used elsewhere (the homepage, in particular,
 * which this file does not touch). A slug not listed sorts after every slug
 * that is, so a new entry is never silently dropped if this list is not
 * updated for it — it is simply unordered relative to the others.
 */
const ONGOING_ORDER = [
  "perspectives-in-motion",
  "consensus-dynamics-in-networks",
  "mri-nuclear-physics-image-processing",
];
const COMPLETED_ORDER = [
  "gravitational-waves-binary-black-holes",
  "power-spectral-density-eeg-signal-quality",
  "chemical-biodegradability-molecular-structure-ml",
];

function bySlugOrder(order: string[]) {
  return (a: ResearchEntry, b: ResearchEntry) => {
    const ia = order.indexOf(a.slug);
    const ib = order.indexOf(b.slug);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  };
}

export default function ResearchPage() {
  const entries = getEntries("research");
  const ongoing = entries.filter((e) => e.archiveSection === "ongoing").sort(bySlugOrder(ONGOING_ORDER));
  const completed = entries.filter((e) => e.archiveSection === "completed").sort(bySlugOrder(COMPLETED_ORDER));

  return (
    <div className="shell py-16 sm:py-20">
      <PageHeader
        eyebrow="Archive"
        title="Research"
        intro="Independent and school-based research — some still ongoing — in theoretical science, mathematical modeling, and the computational side of physics and chemistry, written up here from the original materials where the work is complete. Each account says what its sources establish and what remains open."
      />

      {ongoing.length || completed.length ? (
        <div className="mt-14 flex flex-col gap-16">
          {ongoing.length ? (
            <section aria-labelledby="research-ongoing">
              <SectionHeading as="h3">
                <span id="research-ongoing">Ongoing Research</span>
              </SectionHeading>
              <EntryList entries={ongoing} className="border-t-0" />
            </section>
          ) : null}

          {completed.length ? (
            <section aria-labelledby="research-completed">
              <SectionHeading as="h3">
                <span id="research-completed">Completed Research</span>
              </SectionHeading>
              <EntryList entries={completed} className="border-t-0" />
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
