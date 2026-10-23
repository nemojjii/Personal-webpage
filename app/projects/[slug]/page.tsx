import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Fragment, type ReactNode } from "react";

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
  // An entry with `externalPage` has no detail page of its own to build —
  // see the redirect below, and the `externalPage` doc comment in lib/types.ts.
  return getEntries("projects")
    .filter((entry) => !entry.externalPage)
    .map((entry) => ({ slug: entry.slug }));
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
  if (entry.externalPage) redirect(entry.externalPage);

  const toc = buildToc(entry.body);
  const siblings = getEntries("projects").slice().sort(byOrderThenDate);
  const index = siblings.findIndex((e) => e.slug === entry.slug);

  // Only what was actually given: no row is ever rendered for an empty field.
  const facts = (
    [
      entry.role ? { term: "Role", detail: entry.role } : null,
      entry.period ? { term: "Period", detail: entry.period } : null,
      entry.keywords.length ? { term: "Keywords", detail: entry.keywords.join(" · ") } : null,
      entry.links.length
        ? {
            term: entry.links.length > 1 ? "Links" : "Link",
            detail: entry.links.map((link, i) => (
              <Fragment key={link.href}>
                {i > 0 ? <span className="text-ink-muted"> · </span> : null}
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-quiet text-ink"
                >
                  {link.label}
                </a>
                <span className="text-ink-muted"> {new URL(link.href).host}</span>
              </Fragment>
            )),
          }
        : null,
    ] as ({ term: string; detail: ReactNode } | null)[]
  ).filter((f): f is { term: string; detail: ReactNode } => f !== null);

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
        // The entry's own date — the day it joined the site. The work's
        // period, when known, is a fact of its own below.
        entry.date ? (
          <span key="date">
            Added <time dateTime={entry.date}>{formatDate(entry.date)}</time>
          </span>
        ) : null,
        entry.updated ? (
          <span key="updated">Updated {formatDate(entry.updated, "short")}</span>
        ) : null,
      ].filter(Boolean)}
    >
      {facts.length ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 font-sans text-[0.75rem]">
          {facts.map((fact) => (
            <Fragment key={fact.term}>
              <dt className="label !text-ink-muted">{fact.term}</dt>
              <dd className="text-ink-soft">{fact.detail}</dd>
            </Fragment>
          ))}
        </dl>
      ) : null}
      {entry.pdf ? (
        <div className={facts.length ? "mt-5" : ""}>
          <Attachment href={entry.pdf} />
        </div>
      ) : null}
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
