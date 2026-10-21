import Link from "next/link";

import { WaveField } from "@/components/viz/WaveField";
import { EmptyState } from "@/components/ui/EmptyState";
import { EntryList } from "@/components/ui/EntryRow";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getEntries, notebookBySequence, researchByStatus } from "@/lib/content";
import { site } from "@/site.config";

export default function HomePage() {
  const research = researchByStatus().slice(0, 3);
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

          <p className="mt-7 max-w-[32rem] font-serif text-[1.1875rem] leading-[1.68] text-ink-soft sm:text-[1.25rem]">
            {site.intro}
          </p>

          <p className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 font-sans text-[0.8125rem]">
            <Link href="/about" className="link-quiet text-ink">
              About
            </Link>
            <Link href="/research" className="link-quiet text-ink">
              Research
            </Link>
            <Link href="/notebook" className="link-quiet text-ink">
              Notebook
            </Link>
          </p>
        </div>

        {/* The field. Decorative, but the mathematics is real — see
            components/viz/WaveField.tsx. */}
        <figure className="rise lg:pt-2" style={{ animationDelay: "160ms" }}>
          <div className="aspect-4/3 w-full border border-rule-soft bg-surface/30 sm:aspect-square lg:aspect-4/5">
            <WaveField />
          </div>
          <figcaption className="mt-3 font-sans text-[0.6875rem] leading-relaxed text-ink-muted">
            Level curves of{" "}
            <span className="font-mono">
              ψ(p,t) = ⅕ Σ cos(k<sub>j</sub>·p + ω<sub>j</sub>t)
            </span>
            {" — "}five interfering plane waves. Five-fold symmetric about a
            point, periodic under no translation at all.
          </figcaption>
        </figure>
      </section>

      {/* ── Research ────────────────────────────────────────────────────── */}
      <section className="pt-10 sm:pt-12">
        <SectionHeading action={research.length ? { label: "All research", href: "/research" } : undefined}>
          Research
        </SectionHeading>
        {research.length ? (
          <EntryList entries={research} className="mt-2 border-t-0" />
        ) : (
          <div className="mt-6">
            <EmptyState hint="Add a file to content/research/ to begin.">
              Projects and questions in progress will appear here.
            </EmptyState>
          </div>
        )}
      </section>

      {/* ── Writings ────────────────────────────────────────────────────── */}
      <section className="pt-16 sm:pt-20">
        <SectionHeading action={writings.length ? { label: "All writings", href: "/writings" } : undefined}>
          Selected writing
        </SectionHeading>
        {writings.length ? (
          <EntryList entries={writings} className="mt-2 border-t-0" />
        ) : (
          <div className="mt-6">
            <EmptyState hint="Add a file to content/writings/ to begin.">
              Essays on philosophy, literature and the sciences will appear here.
            </EmptyState>
          </div>
        )}
      </section>

      {/* ── Notebook ───────────────────────────────────────────────────── */}
      <section className="pt-16 sm:pt-20">
        <SectionHeading action={notes.length ? { label: "The notebook", href: "/notebook" } : undefined}>
          From the notebook
        </SectionHeading>
        {notes.length ? (
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
        ) : (
          <div className="mt-6">
            <EmptyState hint="Add a file to content/notebook/ to begin.">
              Open questions, observations and reading notes will appear here.
            </EmptyState>
          </div>
        )}
      </section>
    </div>
  );
}
