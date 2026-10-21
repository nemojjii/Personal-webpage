import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EntryList } from "@/components/ui/EntryRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { allTags, getTag } from "@/lib/content";
import { type Collection, collectionMeta } from "@/lib/types";

type Params = { params: Promise<{ tag: string }> };

export function generateStaticParams() {
  return allTags().map((tag) => ({ tag: tag.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { tag } = await params;
  const record = getTag(tag);
  if (!record) return {};
  return {
    title: `${record.tag}`,
    description: `Everything tagged “${record.tag}” — ${record.count} ${
      record.count === 1 ? "entry" : "entries"
    } across research, writings and the notebook.`,
    alternates: { canonical: `/tags/${record.slug}` },
  };
}

const ORDER: Collection[] = ["research", "projects", "writings", "notebook", "books", "films"];

export default async function TagPage({ params }: Params) {
  const { tag } = await params;
  const record = getTag(tag);
  if (!record) notFound();

  const groups = ORDER.map((collection) => ({
    collection,
    entries: record.entries.filter((entry) => entry.collection === collection),
  })).filter((group) => group.entries.length > 0);

  return (
    <div className="shell py-16 sm:py-20">
      <PageHeader
        eyebrow={
          <>
            Tag <span className="mx-1 text-rule">/</span> {record.count}{" "}
            {record.count === 1 ? "entry" : "entries"}
          </>
        }
        title={record.tag}
        intro={
          <>
            Everything on the site under this subject.{" "}
            <Link href="/tags" className="link-quiet text-ink">
              All tags
            </Link>
            .
          </>
        }
      />

      <div className="mt-14 flex flex-col gap-14">
        {groups.map((group) => (
          <section key={group.collection}>
            <SectionHeading
              as="h3"
              action={{
                label: `All ${collectionMeta[group.collection].plural.toLowerCase()}`,
                href: collectionMeta[group.collection].href,
              }}
            >
              {collectionMeta[group.collection].plural}
            </SectionHeading>
            <EntryList entries={group.entries} className="border-t-0" />
          </section>
        ))}
      </div>
    </div>
  );
}
