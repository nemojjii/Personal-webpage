import Link from "next/link";
import type { ReactNode } from "react";

import { Mdx } from "@/components/content/mdx";
import { Prose } from "@/components/content/Prose";
import { type Experiment, experiments } from "@/lib/laboratory";

/**
 * The page every experiment is set on: masthead, the instrument at full
 * width, the model notes in the reading measure, and the way to the next
 * experiment.
 */
export function ExperimentPage({ experiment, children }: { experiment: Experiment; children: ReactNode }) {
  const index = experiments.findIndex((e) => e.slug === experiment.slug);
  const previous = index > 0 ? experiments[index - 1] : undefined;
  const next = index < experiments.length - 1 ? experiments[index + 1] : undefined;

  return (
    <div className="shell py-14 sm:py-16">
      <div className="mx-auto max-w-[60rem]">
        <header className="border-b border-rule pb-8">
          <p className="label mb-5">
            <Link href="/laboratory" className="link-quiet">
              Little Laboratory
            </Link>
            <span className="mx-1 text-rule">/</span> {experiment.numeral}
          </p>
          <h1 className="max-w-[26ch] font-serif text-display leading-[1.05] tracking-[-0.018em] text-balance">
            {experiment.title}
          </h1>
          <p className="mt-3.5 max-w-[38ch] font-serif text-[1.25rem] leading-[1.35] text-ink-soft italic sm:text-[1.4rem]">
            {experiment.question}
          </p>
          <p className="mt-6 max-w-[34rem] font-serif text-[1.125rem] leading-[1.6] text-ink-soft">
            {experiment.description}
          </p>
        </header>

        <div className="mt-10">{children}</div>

        <div className="mx-auto mt-14 max-w-[40rem]">
          <Prose>
            <Mdx source={experiment.notes} />
          </Prose>
        </div>

        {previous || next ? (
          <nav
            aria-label="Other experiments"
            className="no-print mx-auto mt-16 grid max-w-[40rem] gap-6 border-t border-rule pt-6 sm:grid-cols-2"
          >
            <div>
              {previous ? (
                <Link href={previous.href} className="entry-row group block">
                  <span className="label block">← Experiment {previous.numeral}</span>
                  <span className="entry-title mt-1 inline-block font-serif text-[1.0625rem] leading-snug">
                    {previous.title}
                  </span>
                </Link>
              ) : null}
            </div>
            <div className="sm:text-right">
              {next ? (
                <Link href={next.href} className="entry-row group block">
                  <span className="label block">Experiment {next.numeral} →</span>
                  <span className="entry-title mt-1 inline-block font-serif text-[1.0625rem] leading-snug">
                    {next.title}
                  </span>
                </Link>
              ) : null}
            </div>
          </nav>
        ) : null}
      </div>
    </div>
  );
}
