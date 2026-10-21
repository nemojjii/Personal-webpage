import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleLayout } from "@/components/content/ArticleLayout";
import { Mdx } from "@/components/content/mdx";
import { Prose } from "@/components/content/Prose";
import { ArticleHeader } from "@/components/ui/ArticleHeader";
import { ConnectedIdeas } from "@/components/ui/ConnectedIdeas";
import { EntryNav } from "@/components/ui/EntryNav";
import { References } from "@/components/ui/References";
import { formatDate, getEntry, notebookBySequence } from "@/lib/content";
import { buildToc } from "@/lib/toc";
import { site } from "@/site.config";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return notebookBySequence().map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const entry = getEntry("notebook", slug);
  if (!entry || entry.collection !== "notebook") return {};
  return {
    title: `№ ${entry.number} — ${entry.title}`,
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

export default async function NotebookEntryPage({ params }: Params) {
  const { slug } = await params;
  const entry = getEntry("notebook", slug);
  if (!entry || entry.collection !== "notebook") notFound();

  const toc = buildToc(entry.body);
  const siblings = notebookBySequence();
  const index = siblings.findIndex((e) => e.slug === entry.slug);

  const header = (
    <ArticleHeader
      eyebrow={
        <span className="font-mono text-[0.8125rem] tracking-[0.08em] text-accent tnum">
          <span aria-hidden="true">№ </span>
          <span className="sr-only">Entry </span>
          {entry.number}
        </span>
      }
      title={entry.title}
      summary={entry.summary}
      tags={entry.tags}
      meta={[
        entry.date ? (
          <time key="date" dateTime={entry.date}>
            {formatDate(entry.date)}
          </time>
        ) : null,
      ].filter(Boolean)}
    />
  );

  return (
    <div className="shell py-14 sm:py-16">
      <ArticleLayout toc={toc} header={header}>
        <div className="mt-10">
          <Prose>
            <Mdx source={entry.body} />
          </Prose>
        </div>

        <References items={entry.references} />
        <ConnectedIdeas entry={entry} />
        <EntryNav
          label="Other notes"
          next={index > 0 ? siblings[index - 1] : undefined}
          previous={index < siblings.length - 1 ? siblings[index + 1] : undefined}
        />
      </ArticleLayout>
    </div>
  );
}
