import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleLayout } from "@/components/content/ArticleLayout";
import { Mdx } from "@/components/content/mdx";
import { Prose } from "@/components/content/Prose";
import { ArticleHeader } from "@/components/ui/ArticleHeader";
import { Attachment } from "@/components/ui/Attachment";
import { ConnectedIdeas } from "@/components/ui/ConnectedIdeas";
import { EntryNav } from "@/components/ui/EntryNav";
import { ReadingProgress } from "@/components/ui/ReadingProgress";
import { References } from "@/components/ui/References";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, getEntries, getEntry } from "@/lib/content";
import { buildToc } from "@/lib/toc";
import { site } from "@/site.config";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getEntries("research").map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const entry = getEntry("research", slug);
  if (!entry) return {};
  return {
    title: entry.title,
    description: entry.summary ?? site.description,
    alternates: { canonical: entry.href },
    openGraph: {
      type: "article",
      title: entry.title,
      description: entry.summary ?? site.description,
      url: entry.href,
      publishedTime: entry.date || undefined,
    },
  };
}

export default async function ResearchEntryPage({ params }: Params) {
  const { slug } = await params;
  const entry = getEntry("research", slug);
  if (!entry || entry.collection !== "research") notFound();

  const toc = buildToc(entry.body);
  const siblings = getEntries("research");
  const index = siblings.findIndex((e) => e.slug === entry.slug);

  const header = (
    <ArticleHeader
      eyebrow={<StatusBadge status={entry.status} />}
      title={entry.title}
      subtitle={entry.subtitle}
      summary={entry.summary}
      tags={entry.tags}
      meta={[
        entry.area ? <span key="area">{entry.area}</span> : null,
        entry.date ? (
          <time key="date" dateTime={entry.date}>
            {formatDate(entry.date)}
          </time>
        ) : null,
        entry.updated ? (
          <span key="updated">Updated {formatDate(entry.updated, "short")}</span>
        ) : null,
      ].filter(Boolean)}
    >
      {entry.keywords.length ? (
        <dl className="flex flex-wrap gap-x-2 gap-y-1 font-sans text-[0.75rem]">
          <dt className="label !text-ink-muted">Keywords</dt>
          <dd className="text-ink-soft">{entry.keywords.join(" · ")}</dd>
        </dl>
      ) : null}
      {entry.pdf ? (
        <div className="mt-5">
          <Attachment href={entry.pdf} label="Download PDF" />
        </div>
      ) : null}
    </ArticleHeader>
  );

  return (
    <div className="shell py-14 sm:py-16">
      <ReadingProgress targetId="entry" />

      <ArticleLayout toc={toc} header={header}>
        <div className="mt-10">
          <Prose>
            <Mdx source={entry.body} />
          </Prose>
        </div>

        <References items={entry.references} />
        <ConnectedIdeas entry={entry} />
        <EntryNav
          label="Other research"
          next={index > 0 ? siblings[index - 1] : undefined}
          previous={index < siblings.length - 1 ? siblings[index + 1] : undefined}
        />
      </ArticleLayout>
    </div>
  );
}
