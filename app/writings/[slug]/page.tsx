import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleLayout } from "@/components/content/ArticleLayout";
import { Mdx } from "@/components/content/mdx";
import { Prose } from "@/components/content/Prose";
import { ArticleHeader } from "@/components/ui/ArticleHeader";
import { ConnectedIdeas } from "@/components/ui/ConnectedIdeas";
import { EntryNav } from "@/components/ui/EntryNav";
import { PrintButton } from "@/components/ui/PrintButton";
import { ReadingProgress } from "@/components/ui/ReadingProgress";
import { References } from "@/components/ui/References";
import { formatDate, getEntries, getEntry } from "@/lib/content";
import { buildToc } from "@/lib/toc";
import { writingCategories } from "@/lib/types";
import { site } from "@/site.config";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getEntries("writings").map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const entry = getEntry("writings", slug);
  if (!entry) return {};
  return {
    title: entry.title,
    description: entry.summary ?? entry.subtitle ?? site.description,
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

export default async function WritingPage({ params }: Params) {
  const { slug } = await params;
  const entry = getEntry("writings", slug);
  if (!entry || entry.collection !== "writings") notFound();

  const toc = buildToc(entry.body);
  const siblings = getEntries("writings");
  const index = siblings.findIndex((e) => e.slug === entry.slug);

  const header = (
    <ArticleHeader
      eyebrow={
        <span className="font-sans text-[0.6875rem] font-medium tracking-[0.14em] uppercase text-accent">
          {writingCategories[entry.category].label}
        </span>
      }
      title={entry.title}
      subtitle={entry.subtitle}
      tags={entry.tags}
      meta={[
        entry.date ? (
          <time key="date" dateTime={entry.date}>
            {formatDate(entry.date)}
          </time>
        ) : null,
        <span key="read">{entry.readingMinutes} min read</span>,
      ].filter(Boolean)}
      actions={<PrintButton />}
    />
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
          label="Other writings"
          next={index > 0 ? siblings[index - 1] : undefined}
          previous={index < siblings.length - 1 ? siblings[index + 1] : undefined}
        />
      </ArticleLayout>
    </div>
  );
}
