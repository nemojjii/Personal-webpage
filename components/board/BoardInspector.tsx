"use client";

import Link from "next/link";
import { useState } from "react";

import type { Neighbor } from "@/lib/board/graph";
import type { UserEdge } from "@/lib/board/localBoard";
import type { BoardNode } from "@/lib/board/types";

import { categoryLabel } from "./boardLayout";

export function BoardInspector({
  node,
  neighbors,
  userEdges,
  resolveNode,
  note,
  onSetNote,
  onSelect,
  onFocusNeighborhood,
  onClearFocus,
  focused,
  connectFrom,
  onStartConnect,
  onCancelConnect,
  onRemoveUserEdge,
}: {
  node: BoardNode | null;
  neighbors: Neighbor[];
  userEdges: UserEdge[];
  resolveNode: (id: string) => BoardNode | undefined;
  note: string;
  onSetNote: (text: string) => void;
  onSelect: (id: string) => void;
  onFocusNeighborhood: () => void;
  onClearFocus: () => void;
  focused: boolean;
  connectFrom: string | null;
  onStartConnect: () => void;
  onCancelConnect: () => void;
  onRemoveUserEdge: (edgeId: string) => void;
}) {
  const [draftNote, setDraftNote] = useState(note);

  if (!node) {
    return (
      <aside className="border border-rule-soft bg-surface/40 p-5">
        <p className="font-serif text-[0.9375rem] leading-[1.5] text-ink-soft italic">
          Select a node — on the canvas, or from the list view — to read what it is and what it connects to.
        </p>
      </aside>
    );
  }

  const isConnecting = connectFrom !== null;
  const isConnectingFromThis = connectFrom === node.id;

  return (
    <aside className="flex flex-col gap-5 border border-rule bg-paper p-5">
      <div>
        <p className="label">{categoryLabel[node.category]}</p>
        <h2 className="mt-1 font-serif text-[1.25rem] leading-[1.25] tracking-[-0.01em] text-ink">
          {node.title}
        </h2>
        <p className="mt-1 font-serif text-[0.9375rem] leading-[1.4] text-ink-soft italic">{node.subtitle}</p>
        <p className="mt-3 font-serif text-[0.9375rem] leading-[1.55] text-ink-soft">{node.summary}</p>
        {node.href ? (
          <Link href={node.href} className="link-quiet mt-3 inline-block font-sans text-[0.8125rem]">
            Open this page <span aria-hidden="true">→</span>
          </Link>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-rule-soft pt-4">
        <button
          type="button"
          onClick={focused ? onClearFocus : onFocusNeighborhood}
          className="border border-rule-soft px-3 py-1.5 font-sans text-[0.75rem] text-ink transition-colors hover:border-accent-soft"
        >
          {focused ? "Show everything" : "Focus this neighborhood"}
        </button>
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

      <div className="border-t border-rule-soft pt-4">
        <p className="label">Connections ({neighbors.length})</p>
        {neighbors.length === 0 ? (
          <p className="mt-2 font-serif text-[0.875rem] text-ink-soft italic">
            Deliberately unconnected — a real page on this site, not forced into a relationship it does not
            have.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-3">
            {neighbors.map(({ node: other, edge }) => (
              <li key={edge.id} className="border-l-2 border-rule-soft pl-3">
                <button
                  type="button"
                  onClick={() => onSelect(other.id)}
                  className="link-quiet text-left font-sans text-[0.8125rem] font-medium text-ink"
                >
                  {other.title}
                </button>
                <p className="mt-1 font-serif text-[0.8125rem] leading-[1.45] text-ink-soft">{edge.note}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {userEdges.length > 0 ? (
        <div className="border-t border-rule-soft pt-4">
          <p className="label">Your connections ({userEdges.length})</p>
          <ul className="mt-2 flex flex-col gap-2">
            {userEdges.map((edge) => {
              const otherId = edge.from === node.id ? edge.to : edge.from;
              const other = resolveNode(otherId);
              return (
                <li key={edge.id} className="flex items-start justify-between gap-2 border-l-2 border-accent-soft pl-3">
                  <div>
                    <button
                      type="button"
                      onClick={() => onSelect(otherId)}
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
        </div>
      ) : null}

      <div className="border-t border-rule-soft pt-4">
        <label htmlFor="board-note" className="label">
          Your note
        </label>
        <textarea
          id="board-note"
          value={draftNote}
          onChange={(e) => setDraftNote(e.target.value)}
          onBlur={() => onSetNote(draftNote)}
          placeholder="Private to this browser — never published."
          rows={3}
          maxLength={500}
          className="mt-2 w-full border border-rule-soft bg-surface/40 p-2 font-serif text-[0.875rem] leading-[1.4] text-ink outline-none focus-visible:border-accent-soft"
        />
      </div>
    </aside>
  );
}
