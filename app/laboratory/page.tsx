import type { Metadata } from "next";
import Link from "next/link";

import { ExperimentGlyph } from "@/components/laboratory/ExperimentGlyph";
import { PageHeader } from "@/components/ui/PageHeader";
import { experiments } from "@/lib/laboratory";

export const metadata: Metadata = {
  title: "Little Laboratory",
  description:
    "A small space for mathematical curiosity — three interactive experiments in wave superposition, gradient descent and reaction kinetics.",
  alternates: { canonical: "/laboratory" },
};

export default function LaboratoryPage() {
  return (
    <div className="shell py-16 sm:py-20">
      <PageHeader
        eyebrow="Experiments"
        title="Little Laboratory"
        intro={
          <>
            <em>A small space for mathematical curiosity — where equations become something to
            explore.</em> Three instruments, each built on one standard model, each yours to move.
          </>
        }
      />

      <ul className="mt-12 grid gap-x-10 gap-y-12 md:grid-cols-3">
        {experiments.map((experiment) => (
          <li key={experiment.slug} className="entry-row flex flex-col">
            <Link href={experiment.href} className="group block">
              <div className="border border-rule-soft bg-surface/40 px-5 py-6 text-ink transition-colors duration-300 group-hover:border-rule">
                <ExperimentGlyph slug={experiment.slug} />
              </div>
              <p className="label mt-5">{experiment.numeral}</p>
              <h2 className="mt-2 font-serif text-[1.5rem] leading-[1.2] tracking-[-0.01em]">
                <span className="entry-title">{experiment.title}</span>
              </h2>
              <p className="mt-2 font-serif text-[1.0625rem] leading-snug text-ink-soft italic">
                {experiment.question}
              </p>
              <p className="mt-3 font-serif text-[1rem] leading-[1.6] text-ink-soft">
                {experiment.description}
              </p>
              <p className="mt-4 font-sans text-[0.8125rem] text-ink">
                Open the experiment
                <span aria-hidden="true"> →</span>
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
