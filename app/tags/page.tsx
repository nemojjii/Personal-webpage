import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { allTags } from "@/lib/content";

export const metadata: Metadata = {
  title: "Index of tags",
  description: "Every subject that recurs across the research, writings and notebook.",
  alternates: { canonical: "/tags" },
};

export default function TagsPage() {
  const tags = allTags();

  return (
    <div className="shell py-16 sm:py-20">
      <div className="mx-auto max-w-[46rem]">
        <PageHeader
          eyebrow="Index"
          title="Tags"
          intro="The subjects that recur across research, writings and notebook. Tags are the loosest of the three ways things are connected here — the other two are explicit relations and backlinks."
        />

        {tags.length ? (
          <ul className="mt-12 border-t border-rule-soft">
            {tags.map((tag) => (
              <li key={tag.slug} className="entry-row border-b border-rule-soft">
                <Link
                  href={`/tags/${tag.slug}`}
                  className="flex items-baseline justify-between gap-6 py-3.5"
                >
                  <span className="entry-title font-serif text-[1.125rem]">{tag.tag}</span>
                  <span className="font-sans text-[0.75rem] text-ink-muted tnum">
                    {tag.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-12">
            <EmptyState hint="Add a `tags:` list to any content file.">
              Nothing is tagged yet.
            </EmptyState>
          </div>
        )}
      </div>
    </div>
  );
}
