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
    <div className="shell py-16 sm:py-20">
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

      <div className="mt-10">
        <InvestigationBoard />
      </div>

      <p className="mx-auto mt-10 max-w-[38rem] font-serif text-[0.9375rem] leading-[1.6] text-ink-soft">
        Every edge on this board is grounded in something already written elsewhere on the site — an
        experiment&apos;s own notes, a project&apos;s own text, or the About page — quoted or closely
        paraphrased, not invented for the occasion. Two real pages, the Reaction Kinetics instrument and
        the αsymptote robotics project, appear with no edges at all: genuinely part of the site, with no
        forced connection to anything else here. The Bookshelf and the Screening Room are almost entirely
        absent for the same reason — most of those entries are bibliographic records with no reviewed or
        interpretive text to connect from; <em>Cosmos</em> is the one exception the About page actually
        discusses. A pre-existing link between two research entries, flagged in that research&apos;s own
        notes as resting on an unconfirmed citation, is left off this board until it is confirmed.
      </p>
    </div>
  );
}
