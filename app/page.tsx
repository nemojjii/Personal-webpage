import Link from "next/link";

import { WaveField } from "@/components/viz/WaveField";
import { EmptyState } from "@/components/ui/EmptyState";
import { EntryList } from "@/components/ui/EntryRow";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  getEntries,
  notebookBySequence,
  splitFeatured,
} from "@/lib/content";
import { site } from "@/site.config";

export default function HomePage() {
  const research = splitFeatured(getEntries("research"));
  const featuredResearch = [...research.featured, ...research.rest].slice(0, 3);
  const projects = splitFeatured(getEntries("projects"));
  const featuredProjects = [...projects.featured, ...projects.rest].slice(0, 2);
  const writings = getEntries("writings").slice(0, 3);
  const notes = notebookBySequence().slice(0, 4);

  return (
    <div className="shell">
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="grid gap-12 pt-16 pb-14 sm:pt-24 lg:grid-cols-[1fr_minmax(0,20rem)] lg:items-start lg:gap-16 lg:pt-28 lg:pb-16">
        <div className="rise max-w-[36rem]">
          <p className="label">
            {site.name}
            {site.affiliation ? (
              <>
                <span aria-hidden="true" className="mx-2 text-rule">
                  /
                </span>
                {site.affiliation}
              </>
            ) : null}
          </p>

          <h1 className="mt-6 font-serif text-hero leading-[1.02] tracking-[-0.025em] text-balance">
            {site.headline}
          </h1>

          <div className="mt-7 flex max-w-[32rem] flex-col gap-y-4 font-serif text-[1.1875rem] leading-[1.68] text-ink-soft sm:text-[1.25rem]">
            {site.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <p className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 font-sans text-[0.8125rem]">
            <Link href="/about" className="link-quiet text-ink">
              More in About
            </Link>
            <Link href="/research" className="link-quiet text-ink">
              Research
            </Link>
            <Link href="/cv" className="link-quiet text-ink">
              CV
            </Link>
          </p>
        </div>

        {/* Two-source interference — see components/viz/WaveField.tsx */}
        <figure className="rise lg:pt-2" style={{ animationDelay: "160ms" }}>
          <div className="aspect-4/3 w-full border border-rule-soft bg-surface/30 sm:aspect-square lg:aspect-4/5">
            <WaveField />
          </div>
          <figcaption className="mt-3 max-w-[22rem] font-sans text-[0.6875rem] leading-relaxed text-ink-muted">
            <span className="font-mono text-ink-soft">
              ψ = cos(kr₁ − ωt) + cos(kr₂ − ωt)
            </span>
            <br />
            Two sources, interfering. The dark curves are the hyperbolas along
            which the waves cancel exactly — they never move.
          </figcaption>
        </figure>
      </section>

      {/* ── Research ────────────────────────────────────────────────────── */}
      <section className="pt-10 sm:pt-12">
        <SectionHeading
          action={
            featuredResearch.length ? { label: "All research", href: "/research" } : undefined
          }
        >
          Research
        </SectionHeading>
        {featuredResearch.length ? (
          <EntryList entries={featuredResearch} className="mt-2 border-t-0" />
        ) : (
          <div className="mt-6">
            <EmptyState>Research will be listed here.</EmptyState>
          </div>
        )}
      </section>

      {/* ── Projects ───────────────────────────────────────────────────── */}
      {featuredProjects.length ? (
        <section className="pt-16 sm:pt-20">
          <SectionHeading action={{ label: "All projects", href: "/projects" }}>
            Projects
          </SectionHeading>
          <EntryList entries={featuredProjects} className="mt-2 border-t-0" />
        </section>
      ) : null}

      {/* ── Writings ────────────────────────────────────────────────────── */}
      {writings.length ? (
        <section className="pt-16 sm:pt-20">
          <SectionHeading action={{ label: "All writings", href: "/writings" }}>
            Selected writing
          </SectionHeading>
          <EntryList entries={writings} className="mt-2 border-t-0" />
        </section>
      ) : null}

      {/* ── Notebook ───────────────────────────────────────────────────── */}
      {notes.length ? (
        <section className="pt-16 sm:pt-20">
          <SectionHeading action={{ label: "The notebook", href: "/notebook" }}>
            From the notebook
          </SectionHeading>
          <ul className="mt-5 grid gap-x-10 gap-y-5 sm:grid-cols-2">
            {notes.map((note) => (
              <li key={note.ref} className="entry-row border-t border-rule-soft pt-4">
                <Link href={note.href} className="group block">
                  <span className="font-mono text-[0.6875rem] tracking-wide text-ink-muted tnum">
                    <span aria-hidden="true">№ </span>
                    {note.number}
                  </span>
                  <span className="entry-title mt-1.5 block font-serif text-[1.125rem] leading-snug">
                    {note.title}
                  </span>
                  {note.summary ? (
                    <span className="mt-1.5 block max-w-[24rem] font-serif text-[0.9375rem] leading-[1.55] text-ink-soft">
                      {note.summary}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
