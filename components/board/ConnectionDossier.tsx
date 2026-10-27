"use client";

import Link from "next/link";

import type { BoardEdge, BoardNode } from "@/lib/board/types";

import { CaseFileShell } from "./CaseFileShell";
import { categoryLabel } from "./boardLayout";
import { INSTRUMENT_GLYPH_VIEWBOX, instrumentGlyphs } from "./instrumentGlyphs";

/**
 * The "examine connection" dossier — opened only for a verified editorial
 * edge, never a visitor-drawn one (that stays in the quick corner panel,
 * since it is a private annotation, not a curated finding). Every word
 * here comes from the edge's own note and the two nodes' own summaries;
 * nothing is written fresh for this view.
 */
export function ConnectionDossier({
  edge,
  fromNode,
  toNode,
  onSelectNode,
  onClose,
}: {
  edge: BoardEdge;
  fromNode: BoardNode;
  toNode: BoardNode;
  onSelectNode: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <CaseFileShell
      tabLabel="Relationship file"
      ariaLabel={`Examining the connection between ${fromNode.title} and ${toNode.title}`}
      onClose={onClose}
    >
      <p className="label text-accent">{edge.kind} connection</p>
      <h2 className="mt-2 max-w-[34ch] font-serif text-[1.5rem] leading-[1.18] tracking-[-0.01em] text-ink sm:text-[1.75rem]">
        {fromNode.title} <span className="text-ink-muted">↔</span> {toNode.title}
      </h2>

      <blockquote className="mt-6 border-l-2 border-accent/60 pl-4 font-serif text-[1.0625rem] leading-[1.6] text-ink italic sm:text-[1.1875rem]">
        {edge.note}
      </blockquote>

      <div className="mt-8 grid gap-6 border-t border-rule-soft pt-6 sm:grid-cols-2">
        <Exhibit node={fromNode} onOpen={() => onSelectNode(fromNode.id)} />
        <Exhibit node={toNode} onOpen={() => onSelectNode(toNode.id)} />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-rule-soft pt-5">
        <p className="font-sans text-[0.75rem] text-ink-muted italic">
          Grounded in text already published on this site — nothing here is a new interpretation.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="font-sans text-[0.8125rem] text-ink underline decoration-rule underline-offset-[0.25em] transition-colors hover:text-accent hover:decoration-accent"
        >
          Return to the wall
        </button>
      </div>
    </CaseFileShell>
  );
}

function Exhibit({ node, onOpen }: { node: BoardNode; onOpen: () => void }) {
  const glyph = instrumentGlyphs[node.id];
  const isIllustrative = node.category === "laboratory" || node.category === "project";

  return (
    <div className="flex flex-col gap-2">
      <p className="label text-ink-muted">{categoryLabel[node.category]}</p>
      <button type="button" onClick={onOpen} className="link-quiet text-left font-serif text-[1.0625rem] font-medium text-ink">
        {node.title}
      </button>
      <p className="font-serif text-[0.875rem] leading-[1.5] text-ink-soft">{node.summary}</p>

      {glyph ? (
        <figure className="mt-1">
          <svg
            viewBox={INSTRUMENT_GLYPH_VIEWBOX}
            className="h-10 w-full"
            role="img"
            aria-label={`${node.title}'s own default curve`}
            preserveAspectRatio="none"
          >
            <path d={glyph} fill="none" stroke="var(--color-accent)" strokeWidth="1.5" />
          </svg>
          {isIllustrative ? (
            <figcaption className="mt-1 font-sans text-[0.6875rem] leading-snug text-ink-muted italic">
              An illustrative mathematical curve from this instrument&apos;s own default parameters — not a
              measurement.
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      {node.href ? (
        <Link href={node.href} className="link-quiet mt-1 inline-block font-sans text-[0.75rem]">
          Open this page <span aria-hidden="true">→</span>
        </Link>
      ) : null}
    </div>
  );
}
