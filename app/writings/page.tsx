import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/ui/EmptyState";
import { EntryList } from "@/components/ui/EntryRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { getEntries } from "@/lib/content";
import { type WritingCategory, writingCategories } from "@/lib/types";

export const metadata: Metadata = {
  title: "Writings",
  description:
    "Essays on philosophy, literature, science and society — an independent archive of long-form writing.",
  alternates: { canonical: "/writings" },
};

export default async function WritingsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const all = getEntries("writings");

  // Only categories that actually contain something are offered.
  const available = (Object.keys(writingCategories) as WritingCategory[])
    .map((key) => ({
      key,
      label: writingCategories[key].label,
      count: all.filter((entry) => entry.category === key).length,
    }))
    .filter((item) => item.count > 0);

  const selected = available.find((item) => item.key === category)?.key;
  const entries = selected ? all.filter((entry) => entry.category === selected) : all;

  return (
    <div className="shell py-16 sm:py-20">
      <PageHeader
        eyebrow="Essays"
        title="Writings"
        intro="Longer prose: philosophy, literature, and the places where the sciences meet the rest of thought. Written to be read slowly."
      >
        {available.length > 1 ? (
          <nav aria-label="Filter by category">
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <li>
                <Link
                  href="/writings"
                  aria-current={selected ? undefined : "page"}
                  className={`font-sans text-[0.8125rem] transition-colors duration-200 ${
                    selected ? "text-ink-soft hover:text-ink" : "text-accent"
                  }`}
                >
                  All
                  <span className="ml-1.5 text-[0.6875rem] text-ink-muted tnum">
                    {all.length}
                  </span>
                </Link>
              </li>
              {available.map((item) => (
                <li key={item.key}>
                  <Link
                    href={`/writings?category=${item.key}`}
                    aria-current={selected === item.key ? "page" : undefined}
                    className={`font-sans text-[0.8125rem] transition-colors duration-200 ${
                      selected === item.key ? "text-accent" : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    {item.label}
                    <span className="ml-1.5 text-[0.6875rem] text-ink-muted tnum">
                      {item.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </PageHeader>

      {entries.length ? (
        <EntryList entries={entries} className="mt-12 border-t-0" />
      ) : (
        <div className="mt-12">
          <EmptyState>
            Essays will appear here as they are finished.
          </EmptyState>
        </div>
      )}
    </div>
  );
}
