"use client";

import Link from "next/link";

import type { BoardNode } from "@/lib/board/types";

import { CaseFolder, type OriginRect, type Spread } from "./CaseFolder";

/**
 * The case file for the investigation itself (Phase 20.7) — not an
 * artifact's record, built from the same Living Casebook engine every
 * other case file uses (CaseFolder), but with its own bespoke pages rather
 * than ArtifactCaseFile's generic spreads built from one BoardNode's
 * fields. Every sentence below is quoted or closely paraphrased from this
 * site's own published About page, CV and content entries — nothing here
 * is a new psychological or biographical claim. The "Explore on the wall"
 * links are a section index into real board evidence, not editorial edges:
 * see lib/board/edges.ts and lib/board/nodes.ts for why this file has none
 * of its own.
 */
export function IrisKimCaseFile({
  resolveNode,
  onSelectNode,
  onClose,
  originRect,
}: {
  resolveNode: (id: string) => BoardNode | undefined;
  onSelectNode: (id: string) => void;
  onClose: () => void;
  originRect?: OriginRect | null;
}) {
  function evidenceList(ids: string[]) {
    const items = ids.map((id) => ({ id, node: resolveNode(id) })).filter((x) => x.node);
    if (items.length === 0) return null;
    return (
      <ul className="mt-2 flex flex-col gap-1.5">
        {items.map(({ id, node }) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => onSelectNode(id)}
              className="link-quiet text-left font-sans text-[0.8125rem] font-medium text-ink"
            >
              → {node!.title}
            </button>
          </li>
        ))}
      </ul>
    );
  }

  const identityLeft = (
    <div>
      <p className="label text-accent">Case file № IK-001</p>
      <h2 className="mt-2 font-serif text-[1.5rem] leading-[1.18] tracking-[-0.01em] text-ink sm:text-[1.75rem]">
        Iris (Jieun) Kim
      </h2>
      <p className="mt-1 font-sans text-[0.75rem] tracking-[0.06em] text-ink-muted">
        Known on this site as Iris Kim. Earlier work is attributed as Jieun Kim where that is how it was
        originally published.
      </p>
      <div className="mt-5 border-t border-rule-soft pt-4">
        <p className="label mb-2">Standing</p>
        <p className="font-serif text-[1rem] leading-[1.6] text-ink">
          Undergraduate at Rutgers University–New Brunswick, studying Chemical Physics and Mathematics.
        </p>
        <Link href="/about" className="link-quiet mt-3 inline-block font-sans text-[0.8125rem]">
          Open the About page <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );

  const identityRight = (
    <div className="border-l-2 border-rule-soft pl-4">
      <p className="label mb-2">Opening Statement</p>
      <p className="font-serif text-[0.9375rem] leading-[1.6] text-ink-soft italic">
        &ldquo;What fascinates me most about mathematics and physics is their quiet presence in nearly
        everything around us.&rdquo;
      </p>
      <p className="mt-4 font-serif text-[0.9375rem] leading-[1.6] text-ink-soft italic">
        &ldquo;I like asking why things are the way they are, whether the explanations we accept are
        sufficient, and what might become visible if we approach familiar questions from unfamiliar
        directions.&rdquo;
      </p>
      <p className="mt-3 font-sans text-[0.6875rem] text-ink-muted">— from the About page, quoted directly.</p>
    </div>
  );

  const scientificLeft = (
    <div>
      <p className="label mb-2">Scientific Inquiry</p>
      <p className="font-serif text-[0.9375rem] leading-[1.6] text-ink">
        &ldquo;My academic interests lie primarily in the theoretical and mathematical foundations of the
        physical sciences. My previous research has involved computational modeling, signal processing,
        machine learning, and network dynamics.&rdquo;
      </p>
      <p className="mt-3 font-sans text-[0.75rem] text-ink-muted italic">Research on the wall:</p>
      {evidenceList([
        "research/power-spectral-density-eeg-signal-quality",
        "research/consensus-dynamics-in-networks",
        "research/gravitational-waves-binary-black-holes",
      ])}
    </div>
  );

  const scientificRight = (
    <div className="border-l-2 border-rule-soft pl-4">
      <p className="label mb-2">Instruments & Independent Work</p>
      <p className="font-sans text-[0.8125rem] leading-[1.5] text-ink-soft">
        Little Laboratory instruments built on the same physics and chemistry — and, separately, hands-on
        mechanical work with no research claim attached to it.
      </p>
      {evidenceList(["laboratory/quantum-mechanics-explorer", "laboratory/reaction-kinetics", "projects/asymptote-ftc-robotics"])}
    </div>
  );

  const mathLeft = (
    <div>
      <p className="label mb-2">Mathematics & Computation</p>
      <p className="font-serif text-[0.9375rem] leading-[1.6] text-ink">
        &ldquo;I find something extraordinary in the idea that abstract mathematical structures can reveal
        the workings of a world we inhabit every day.&rdquo;
      </p>
      <p className="mt-3 font-sans text-[0.75rem] text-ink-muted italic">The same structure, read twice:</p>
      {evidenceList([
        "concept/superposition",
        "concept/fourier-frequency-domain",
        "laboratory/fourier-explorer",
        "laboratory/wave-superposition",
        "laboratory/gradient-descent",
      ])}
    </div>
  );

  const mathRight = (
    <div className="border-l-2 border-rule-soft pl-4">
      <p className="label mb-2">Where It Meets Perception</p>
      <p className="font-serif text-[0.9375rem] leading-[1.6] text-ink-soft italic">
        &ldquo;Recently, I have been exploring the relationship between mathematics and artistic
        expression, particularly whether mathematical structures might offer ways of understanding
        experiences that resist precise description through language.&rdquo;
      </p>
      {evidenceList(["projects/mathematics-perception-and-expression", "research/perspectives-in-motion"])}
    </div>
  );

  const artLeft = (
    <div>
      <p className="label mb-2">Artistic & Literary Exploration</p>
      <p className="font-serif text-[0.9375rem] leading-[1.6] text-ink">
        &ldquo;Outside my formal studies, I enjoy literature, philosophy, and the visual arts. I am drawn
        to works that question familiar assumptions about identity, existence, morality, and the
        relationship between individuals and the world around them.&rdquo;
      </p>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1">
        <Link href="/bookshelf" className="link-quiet font-sans text-[0.8125rem]">
          The Bookshelf <span aria-hidden="true">→</span>
        </Link>
        <Link href="/films" className="link-quiet font-sans text-[0.8125rem]">
          The Screening Room <span aria-hidden="true">→</span>
        </Link>
      </div>
      <p className="mt-4 font-sans text-[0.75rem] text-ink-muted italic">
        Both collections are kept mostly as bibliographic records for now — original reflections are not
        yet written. One exception is already on the wall:
      </p>
      {evidenceList(["books/cosmos", "projects/generative-art-playground"])}
    </div>
  );

  const artRight = (
    <div className="border-l-2 border-rule-soft pl-4">
      <p className="label mb-2">Cosmos</p>
      <p className="font-serif text-[0.9375rem] leading-[1.6] text-ink-soft italic">
        &ldquo;Carl Sagan&apos;s Cosmos holds a special place in my affection. Its reminder that we are
        made of the same matter as the stars gave words to a sense of belonging I had long been searching
        for. [...] For me, studying the universe is not merely a way of understanding how it works. It is
        also a way of understanding what it means to belong to it.&rdquo;
      </p>
      <p className="mt-3 font-sans text-[0.6875rem] text-ink-muted">— from the About page, quoted directly.</p>
    </div>
  );

  const closingLeft = (
    <div>
      <p className="label mb-2">Open Investigation</p>
      <p className="font-serif text-[1rem] leading-[1.6] text-ink">
        This file does not reach a verdict on who Iris Kim is, and is not meant to. It collects what is
        already written and verified elsewhere on this site, and nothing more — no inferred motivations,
        no diagnosed traits, no completed portrait.
      </p>
      <p className="mt-3 font-serif text-[1rem] leading-[1.6] text-ink">
        Original reflections on the books and films she returns to, and the questions that recur across
        her research, mathematics and art, belong here eventually. They are not written yet, so they are
        not pretended into existence.
      </p>
    </div>
  );

  const closingRight = (
    <div className="flex flex-col items-start gap-5 border-l-2 border-rule-soft pl-4">
      <p className="font-serif text-[1.375rem] leading-[1.3] text-ink italic">The case remains open.</p>
      <button
        type="button"
        onClick={onClose}
        className="border border-rule-soft px-3 py-1.5 font-sans text-[0.75rem] text-ink transition-colors hover:border-accent-soft"
      >
        Close this file — return to the wall
      </button>
    </div>
  );

  const spreads: Spread[] = [
    { key: "identity", srLabel: "Identity", left: identityLeft, right: identityRight },
    { key: "scientific", srLabel: "Scientific inquiry", left: scientificLeft, right: scientificRight },
    { key: "mathematics", srLabel: "Mathematics and computation", left: mathLeft, right: mathRight },
    { key: "artistic", srLabel: "Artistic and literary exploration", left: artLeft, right: artRight },
    { key: "open", srLabel: "Open investigation", left: closingLeft, right: closingRight },
  ];

  return (
    <CaseFolder
      tabLabel="Case IK-001 · Who is Iris Kim?"
      fileLabel="Case file № IK-001"
      ariaLabel="Case file: Who is Iris Kim?"
      spreads={spreads}
      onClose={onClose}
      originRect={originRect}
    />
  );
}
