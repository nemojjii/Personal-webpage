import type { Metadata } from "next";

import { InvestigationBoard } from "@/components/board/InvestigationBoard";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Investigation Board",
  description:
    "A curated map of how this site's research, projects, Little Laboratory instruments and a handful of other pages connect — and, just as deliberately, where they don't.",
  alternates: { canonical: "/connected-ideas" },
};

export default function ConnectedIdeasPage() {
  return (
    <div className="py-10 sm:py-14">
      <div className="shell">
        <PageHeader
          eyebrow="Connected Ideas"
          title="Investigation Board"
          intro={
            <em>
              Fifteen pages from across this site, pinned up and threaded together — eleven connections
              between them that are actually true.
            </em>
          }
        />
      </div>

      {/* The wall itself breaks out of the site's usual article width — it is meant to dominate the page, not sit inside it. */}
      <div className="relative mt-8 ml-[calc(50%_-_50vw)] w-screen px-3 sm:mt-10 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[110rem]">
          <InvestigationBoard />
        </div>
      </div>

      <div className="shell mt-10">
        <details className="group max-w-[38rem] border-t border-rule-soft pt-5">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-sans text-[0.75rem] font-medium tracking-[0.04em] text-ink-soft transition-colors duration-200 hover:text-ink">
            <span
              aria-hidden="true"
              className="inline-block text-ink-muted transition-transform duration-200 group-open:rotate-90"
            >
              ▸
            </span>
            About this investigation
          </summary>
          <p className="mt-4 font-serif text-[0.9375rem] leading-[1.6] text-ink-soft">
            Every edge on this board is grounded in something already written elsewhere on the site — an
            experiment&apos;s own notes, a project&apos;s own text, or the About page — quoted or closely
            paraphrased, not invented for the occasion. Two real pages, the Reaction Kinetics instrument
            and the αsymptote robotics project, appear with no edges at all: genuinely part of the site,
            with no forced connection to anything else here. The Bookshelf and the Screening Room are
            almost entirely absent for the same reason — most of those entries are bibliographic records
            with no reviewed or interpretive text to connect from; <em>Cosmos</em> is the one exception
            the About page actually discusses. A pre-existing link between two research entries, flagged
            in that research&apos;s own notes as resting on an unconfirmed citation, is left off this
            board until it is confirmed.
          </p>
        </details>
      </div>
    </div>
  );
}
