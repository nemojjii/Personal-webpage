"use client";

import type { BoardNode } from "@/lib/board/types";
import type { UserEdge } from "@/lib/board/localBoard";

/**
 * The quick corner panel for a visitor's own connection — a private,
 * casual annotation, so it stays light rather than opening the full case
 * file used for artifacts and verified editorial connections.
 */
export function BoardInspector({
  edge,
  fromNode,
  toNode,
  onSelectNode,
  onClose,
  onRemoveUserEdge,
}: {
  edge: UserEdge | null;
  fromNode: BoardNode | null;
  toNode: BoardNode | null;
  onSelectNode: (id: string) => void;
  onClose: () => void;
  onRemoveUserEdge: (edgeId: string) => void;
}) {
  if (!edge || !fromNode || !toNode) return null;

  return (
    <aside
      role="dialog"
      aria-label={`Your connection between ${fromNode.title} and ${toNode.title}`}
      className="fixed inset-x-0 bottom-0 z-20 flex max-h-[75vh] flex-col gap-4 overflow-y-auto border-t border-rule bg-paper p-5 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] sm:absolute sm:inset-x-auto sm:top-4 sm:right-4 sm:bottom-auto sm:max-h-none sm:w-[22rem] sm:rounded-[2px] sm:border sm:shadow-lg"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full border border-rule-soft font-sans text-[0.875rem] text-ink-soft hover:border-accent-soft hover:text-ink"
      >
        ×
      </button>

      <div className="pr-8">
        <p className="label">Your connection</p>
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
        <p className="mt-2 font-serif text-[0.9375rem] leading-[1.55] text-ink-soft">{edge.label}</p>
      </div>

      <div className="border-t border-rule-soft pt-4">
        <button
          type="button"
          onClick={() => onRemoveUserEdge(edge.id)}
          className="border border-rule-soft px-3 py-1.5 font-sans text-[0.75rem] text-ink-soft hover:border-accent hover:text-accent"
        >
          Remove this connection
        </button>
      </div>
    </aside>
  );
}
