import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/ui/EmptyState";
import { EntryList } from "@/components/ui/EntryRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { allTags, notebookBySequence } from "@/lib/content";

export const metadata: Metadata = {
  title: "Notebook",
  description:
    "A working notebook: open questions, mathematical observations, reading notes and unfinished arguments.",
  alternates: { canonical: "/notebook" },
};

export default function NotebookPage() {
  const entries = notebookBySequence();
  // Counts are notebook-local here, so the number matches what this page lists.
  const tags = allTags()
    .map((tag) => ({
      ...tag,
      count: tag.entries.filter((entry) => entry.collection === "notebook").length,
    }))
    .filter((tag) => tag.count > 0)
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, 14);

  return (
    <div className="shell py-16 sm:py-20">
      <PageHeader
        eyebrow={entries.length ? `${entries.length} entries` : "Working notes"}
        title="Notebook"
        intro="Entries are numbered and left as they were written. Nothing here is finished, and earlier notes are not corrected to agree with later ones."
      >
        {tags.length ? (
          <div>
            <h2 className="label mb-2.5">Recurring</h2>
            <ul className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
              {tags.map((tag) => (
                <li key={tag.slug}>
                  <Link
                    href={`/tags/${tag.slug}`}
                    className="font-sans text-[0.8125rem] text-ink-soft transition-colors duration-200 hover:text-accent"
                  >
                    {tag.tag}
                    <span className="ml-1 text-[0.6875rem] text-ink-muted tnum">
                      {tag.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </PageHeader>

      {entries.length ? (
        <EntryList entries={entries} className="mt-12 border-t-0" />
      ) : (
        <div className="mt-12">
          <EmptyState>
            The first entry has not been written yet.
          </EmptyState>
        </div>
      )}
    </div>
  );
}
