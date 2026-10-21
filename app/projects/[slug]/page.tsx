import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleLayout } from "@/components/content/ArticleLayout";
import { Mdx } from "@/components/content/mdx";
import { Prose } from "@/components/content/Prose";
import { ArticleHeader } from "@/components/ui/ArticleHeader";
import { Attachment } from "@/components/ui/Attachment";
import { ConnectedIdeas } from "@/components/ui/ConnectedIdeas";
import { EntryNav } from "@/components/ui/EntryNav";
import { References } from "@/components/ui/References";
import { byOrderThenDate, formatDate, getEntries, getEntry } from "@/lib/content";
import { buildToc } from "@/lib/toc";
import { projectStages } from "@/lib/types";
import { site } from "@/site.config";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getEntries("projects").map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const entry = getEntry("projects", slug);
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

export default async function ProjectPage({ params }: Params) {
  const { slug } = await params;
  const entry = getEntry("projects", slug);
  if (!entry || entry.collection !== "projects") notFound();

  const toc = buildToc(entry.body);
  const siblings = getEntries("projects").slice().sort(byOrderThenDate);
  const index = siblings.findIndex((e) => e.slug === entry.slug);

  const header = (
    <ArticleHeader
      eyebrow={
        <span className="font-sans text-[0.6875rem] font-medium tracking-[0.14em] uppercase text-ink-soft">
          {projectStages[entry.stage].label}
        </span>
      }
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
      {entry.pdf ? <Attachment href={entry.pdf} /> : null}
    </ArticleHeader>
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
          label="Other projects"
          next={index > 0 ? siblings[index - 1] : undefined}
          previous={index < siblings.length - 1 ? siblings[index + 1] : undefined}
        />
      </ArticleLayout>
    </div>
  );
}
