"use client";

import Link from "next/link";
import { useState } from "react";

import type { Neighbor } from "@/lib/board/graph";
import type { UserEdge } from "@/lib/board/localBoard";
import type { BoardEdge, BoardNode } from "@/lib/board/types";

import { categoryLabel } from "./boardLayout";

export type InspectorSelection =
  | { kind: "node"; node: BoardNode; neighbors: Neighbor[]; userEdges: UserEdge[]; note: string }
  | { kind: "edge"; edge: BoardEdge | UserEdge; isUserEdge: boolean; fromNode: BoardNode; toNode: BoardNode };

/**
 * The editorial detail view — a floating panel on desktop, a bottom sheet
 * on mobile, present only while something is selected so the canvas owns
 * the screen the rest of the time.
 */
export function BoardInspector({
  selection,
  resolveNode,
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
  selection: InspectorSelection | null;
  resolveNode: (id: string) => BoardNode | undefined;
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
  if (!selection) return null;

  return (
    <aside
      role="dialog"
      aria-label={selection.kind === "node" ? `About ${selection.node.title}` : "About this connection"}
      className="fixed inset-x-0 bottom-0 z-20 flex max-h-[75vh] flex-col gap-5 overflow-y-auto border-t border-rule bg-paper p-5 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] sm:absolute sm:inset-x-auto sm:top-4 sm:right-4 sm:bottom-4 sm:max-h-none sm:w-[23rem] sm:rounded-[2px] sm:border sm:shadow-lg"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full border border-rule-soft font-sans text-[0.875rem] text-ink-soft hover:border-accent-soft hover:text-ink"
      >
        ×
      </button>

      {selection.kind === "node" ? (
        <NodeView
          key={selection.node.id}
          node={selection.node}
          neighbors={selection.neighbors}
          userEdges={selection.userEdges}
          resolveNode={resolveNode}
          note={selection.note}
          onSetNote={onSetNote}
          onSelectNode={onSelectNode}
          onFocusNeighborhood={onFocusNeighborhood}
          onClearFocus={onClearFocus}
          focused={focused}
          connectFrom={connectFrom}
          onStartConnect={onStartConnect}
          onCancelConnect={onCancelConnect}
          onRemoveUserEdge={onRemoveUserEdge}
        />
      ) : (
        <EdgeView selection={selection} onSelectNode={onSelectNode} onRemoveUserEdge={onRemoveUserEdge} />
      )}
    </aside>
  );
}

function NodeView({
  node,
  neighbors,
  userEdges,
  resolveNode,
  note,
  onSetNote,
  onSelectNode,
  onFocusNeighborhood,
  onClearFocus,
  focused,
  connectFrom,
  onStartConnect,
  onCancelConnect,
  onRemoveUserEdge,
}: {
  node: BoardNode;
  neighbors: Neighbor[];
  userEdges: UserEdge[];
  resolveNode: (id: string) => BoardNode | undefined;
  note: string;
  onSetNote: (text: string) => void;
  onSelectNode: (id: string) => void;
  onFocusNeighborhood: () => void;
  onClearFocus: () => void;
  focused: boolean;
  connectFrom: string | null;
  onStartConnect: () => void;
  onCancelConnect: () => void;
  onRemoveUserEdge: (edgeId: string) => void;
}) {
  const [draftNote, setDraftNote] = useState(note);

  const isConnecting = connectFrom !== null;
  const isConnectingFromThis = connectFrom === node.id;

  return (
    <>
      <div className="pr-8">
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
                  onClick={() => onSelectNode(other.id)}
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
    </>
  );
}

function EdgeView({
  selection,
  onSelectNode,
  onRemoveUserEdge,
}: {
  selection: Extract<InspectorSelection, { kind: "edge" }>;
  onSelectNode: (id: string) => void;
  onRemoveUserEdge: (edgeId: string) => void;
}) {
  const { edge, isUserEdge, fromNode, toNode } = selection;
  return (
    <>
      <div className="pr-8">
        <p className="label">{isUserEdge ? "Your connection" : "Editorial connection"}</p>
        <div className="mt-2 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => onSelectNode(fromNode.id)}
            className="link-quiet text-left font-serif text-[1.0625rem] font-medium text-ink"
          >
            {fromNode.title}
          </button>
          <span className="font-sans text-[0.75rem] text-ink-muted" aria-hidden="true">
            ↓ connects to
          </span>
          <button
            type="button"
            onClick={() => onSelectNode(toNode.id)}
            className="link-quiet text-left font-serif text-[1.0625rem] font-medium text-ink"
          >
            {toNode.title}
          </button>
        </div>
        {!isUserEdge ? (
          <p className="mt-3 font-sans text-[0.6875rem] tracking-[0.08em] text-accent uppercase">
            {"kind" in edge ? edge.kind : ""}
          </p>
        ) : null}
        <p className="mt-2 font-serif text-[0.9375rem] leading-[1.55] text-ink-soft">
          {"note" in edge ? edge.note : edge.label}
        </p>
      </div>

      {isUserEdge ? (
        <div className="border-t border-rule-soft pt-4">
          <button
            type="button"
            onClick={() => onRemoveUserEdge(edge.id)}
            className="border border-rule-soft px-3 py-1.5 font-sans text-[0.75rem] text-ink-soft hover:border-accent hover:text-accent"
          >
            Remove this connection
          </button>
        </div>
      ) : (
        <p className="border-t border-rule-soft pt-4 font-sans text-[0.75rem] text-ink-muted italic">
          Grounded in text already published elsewhere on the site — see the two pages above.
        </p>
      )}
    </>
  );
}
