"use client";

import Link from "next/link";

import type { BoardEdge, BoardNode } from "@/lib/board/types";

import { CaseFolder, type OriginRect, type Spread } from "./CaseFolder";
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
  originRect,
}: {
  edge: BoardEdge;
  fromNode: BoardNode;
  toNode: BoardNode;
  onSelectNode: (id: string) => void;
  onClose: () => void;
  originRect?: OriginRect | null;
}) {
  const spreads: Spread[] = [
    {
      key: "finding",
      srLabel: "The finding",
      left: (
        <div>
          <p className="label text-accent">{edge.kind} connection</p>
          <h2 className="mt-2 max-w-[22ch] font-serif text-[1.375rem] leading-[1.2] tracking-[-0.01em] text-ink sm:text-[1.5rem]">
            {fromNode.title} <span className="text-ink-muted">↔</span> {toNode.title}
          </h2>
          <blockquote className="mt-5 border-l-2 border-accent/60 pl-4 font-serif text-[1rem] leading-[1.6] text-ink italic">
            {edge.note}
          </blockquote>
        </div>
      ),
      right: <Exhibit node={fromNode} onOpen={() => onSelectNode(fromNode.id)} />,
    },
    {
      key: "exhibits",
      srLabel: "The two artifacts",
      left: <Exhibit node={toNode} onOpen={() => onSelectNode(toNode.id)} />,
      right: (
        <div className="border-l-2 border-rule-soft pl-4">
          <p className="font-sans text-[0.75rem] text-ink-muted italic">
            Grounded in text already published on this site — nothing here is a new interpretation.
          </p>
        </div>
      ),
    },
  ];

  return (
    <CaseFolder
      tabLabel="Relationship file"
      fileLabel="Relationship file"
      ariaLabel={`Examining the connection between ${fromNode.title} and ${toNode.title}`}
      spreads={spreads}
      onClose={onClose}
      originRect={originRect}
    />
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
