"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type { Neighbor } from "@/lib/board/graph";
import type { UserEdge } from "@/lib/board/localBoard";
import type { BoardNode } from "@/lib/board/types";

import { CaseFileShell } from "./CaseFileShell";
import { categoryLabel } from "./boardLayout";
import { INSTRUMENT_GLYPH_VIEWBOX, instrumentGlyphs } from "./instrumentGlyphs";

const OPEN_LABEL: Record<string, string> = {
  research: "Open the complete research page",
  laboratory: "Open the interactive experiment",
  project: "Open the complete project page",
  book: "Open in the Bookshelf",
};

/**
 * The case file opened when an artifact is selected — a folder taken off
 * the wall and opened on a desk. Four sections, each built only from data
 * that already exists: Document (the node's own verified summary),
 * Supporting Material (a real curve or cover, when one exists — omitted
 * otherwise, never invented), Connections (every verified editorial
 * relationship this artifact has), and Personal Notes (this visitor's own,
 * private, browser-local annotations and connections).
 */
export function ArtifactCaseFile({
  node,
  index,
  neighbors,
  userEdges,
  resolveNode,
  note,
  onSetNote,
  onSelectNode,
  onClose,
  onFocusNeighborhood,
  onClearFocus,
  focused,
  connectFrom,
  onStartConnect,
  onCancelConnect,
  onRemoveUserEdge,
}: {
  node: BoardNode;
  index: number;
  neighbors: Neighbor[];
  userEdges: UserEdge[];
  resolveNode: (id: string) => BoardNode | undefined;
  note: string;
  onSetNote: (text: string) => void;
  onSelectNode: (id: string) => void;
  onClose: () => void;
  onFocusNeighborhood: () => void;
  onClearFocus: () => void;
  focused: boolean;
  connectFrom: string | null;
  onStartConnect: () => void;
  onCancelConnect: () => void;
  onRemoveUserEdge: (edgeId: string) => void;
}) {
  const [draftNote, setDraftNote] = useState(note);
  const [coverFailed, setCoverFailed] = useState(false);
  const glyph = instrumentGlyphs[node.id];
  const isIllustrative = node.category === "laboratory" || node.category === "project";
  const isConnecting = connectFrom !== null;
  const isConnectingFromThis = connectFrom === node.id;
  const fileNumber = String(index + 1).padStart(2, "0");

  return (
    <CaseFileShell
      tabLabel={`Case file № ${fileNumber} · ${categoryLabel[node.category]}`}
      ariaLabel={`Case file: ${node.title}`}
      onClose={onClose}
    >
      {/* Cover */}
      <div className="pr-8">
        <p className="label text-accent">{categoryLabel[node.category]}</p>
        <h2 className="mt-1 max-w-[30ch] font-serif text-[1.5rem] leading-[1.2] tracking-[-0.01em] text-ink sm:text-[1.75rem]">
          {node.title}
        </h2>
        <p className="mt-1.5 font-serif text-[1rem] leading-[1.4] text-ink-soft italic">{node.subtitle}</p>
      </div>

      {/* Document / Overview */}
      <div className="mt-6 border-t border-rule-soft pt-5">
        <p className="label mb-2">Document</p>
        <p className="font-serif text-[1.0625rem] leading-[1.6] text-ink">{node.summary}</p>
        {node.href ? (
          <Link href={node.href} className="link-quiet mt-3 inline-block font-sans text-[0.8125rem]">
            {OPEN_LABEL[node.category] ?? "Open this page"} <span aria-hidden="true">→</span>
          </Link>
        ) : null}
      </div>

      {/* Supporting Material — omitted entirely when none exists, never invented. */}
      {glyph || (node.coverImage && !coverFailed) ? (
        <div className="mt-6 border-t border-rule-soft pt-5">
          <p className="label mb-2">Supporting Material</p>
          {glyph ? (
            <>
              <svg
                viewBox={INSTRUMENT_GLYPH_VIEWBOX}
                className="h-14 w-full"
                role="img"
                aria-label={`${node.title}'s own default curve`}
                preserveAspectRatio="none"
              >
                <path d={glyph} fill="none" stroke="var(--color-accent)" strokeWidth="1.5" />
              </svg>
              {isIllustrative ? (
                <p className="mt-1 font-sans text-[0.75rem] leading-snug text-ink-muted italic">
                  An illustrative mathematical curve from this artifact&apos;s own default parameters — not a
                  measurement.
                </p>
              ) : null}
            </>
          ) : (
            <div className="relative h-40 w-28 border border-rule-soft">
              <Image
                src={node.coverImage!}
                alt={`Cover of ${node.title}`}
                fill
                sizes="112px"
                className="object-cover"
                onError={() => setCoverFailed(true)}
              />
            </div>
          )}
        </div>
      ) : null}

      {/* Connections */}
      <div className="mt-6 border-t border-rule-soft pt-5">
        <div className="flex items-center justify-between gap-3">
          <p className="label">Connections ({neighbors.length})</p>
          {neighbors.length > 0 ? (
            <button
              type="button"
              onClick={focused ? onClearFocus : onFocusNeighborhood}
              className="font-sans text-[0.75rem] text-ink-muted underline decoration-rule underline-offset-[0.25em] hover:text-accent hover:decoration-accent"
            >
              {focused ? "Show everything" : "Focus this neighborhood"}
            </button>
          ) : null}
        </div>
        {neighbors.length === 0 ? (
          <p className="mt-2 font-serif text-[0.9375rem] text-ink-soft italic">
            Deliberately unconnected — a real page on this site, not forced into a relationship it does not
            have.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-3">
            {neighbors.map(({ node: other, edge }) => (
              <li key={edge.id} className="border-l-2 border-accent/50 pl-3">
                <button
                  type="button"
                  onClick={() => onSelectNode(other.id)}
                  className="link-quiet text-left font-serif text-[0.9375rem] font-medium text-ink"
                >
                  {other.title}
                </button>
                <p className="mt-1 font-sans text-[0.8125rem] leading-[1.45] text-ink-soft">{edge.note}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Personal Notes — this visitor's own, private, browser-local annotations. */}
      <div className="mt-6 border-t border-rule-soft pt-5">
        <p className="label mb-2">Personal Notes</p>
        <p className="font-sans text-[0.6875rem] text-ink-muted italic">
          Yours alone — kept in this browser, never published, clearly separate from the file above.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {isConnectingFromThis ? (
            <button
              type="button"
              onClick={onCancelConnect}
              className="border border-accent-soft bg-surface px-3 py-1.5 font-sans text-[0.75rem] text-ink"
            >
              Cancel — pick a node to connect to
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartConnect}
              disabled={isConnecting}
              className="border border-rule-soft px-3 py-1.5 font-sans text-[0.75rem] text-ink transition-colors hover:border-accent-soft disabled:opacity-40"
            >
              Draw your own connection from here
            </button>
          )}
        </div>

        {userEdges.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-2">
            {userEdges.map((edge) => {
              const otherId = edge.from === node.id ? edge.to : edge.from;
              const other = resolveNode(otherId);
              return (
                <li
                  key={edge.id}
                  className="flex items-start justify-between gap-2 border-l-2 border-accent-soft pl-3"
                >
                  <div>
                    <button
                      type="button"
                      onClick={() => onSelectNode(otherId)}
                      className="link-quiet text-left font-sans text-[0.8125rem] font-medium text-ink"
                    >
                      {other?.title ?? otherId}
                    </button>
                    <p className="mt-1 font-serif text-[0.8125rem] leading-[1.45] text-ink-soft">{edge.label}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveUserEdge(edge.id)}
                    aria-label={`Remove your connection to ${other?.title ?? otherId}`}
                    className="font-sans text-[0.75rem] text-ink-muted hover:text-accent"
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        <label htmlFor="case-file-note" className="sr-only">
          Your note on {node.title}
        </label>
        <textarea
          id="case-file-note"
          value={draftNote}
          onChange={(e) => setDraftNote(e.target.value)}
          onBlur={() => onSetNote(draftNote)}
          placeholder="Private to this browser — never published."
          rows={3}
          maxLength={500}
          className="mt-3 w-full border border-rule-soft bg-surface/40 p-2 font-serif text-[0.875rem] leading-[1.4] text-ink outline-none focus-visible:border-accent-soft"
        />
      </div>
    </CaseFileShell>
  );
}
