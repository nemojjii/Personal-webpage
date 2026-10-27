"use client";

import type { BoardGraph, BoardNode } from "@/lib/board/types";
import { neighborsOf } from "@/lib/board/graph.ts";

import { categoryLabel } from "./boardLayout";

const CATEGORY_ORDER = ["case", "research", "project", "laboratory", "concept", "book"] as const;

/**
 * A flat, fully keyboard-operable alternative to the canvas: every node and
 * every one of its connections as plain buttons and links, grouped by
 * category. Reaches the same information the canvas does, for anyone who
 * would rather not drag things around (or cannot).
 */
export function BoardListView({
  graph,
  nodes,
  selectedId,
  onSelect,
}: {
  graph: BoardGraph;
  nodes: BoardNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const visibleIds = new Set(nodes.map((n) => n.id));

  return (
    <div className="flex flex-col gap-8">
      {CATEGORY_ORDER.map((category) => {
        const inCategory = nodes.filter((n) => n.category === category);
        if (inCategory.length === 0) return null;
        return (
          <section key={category}>
            <h3 className="label border-b border-rule-soft pb-2">{categoryLabel[category]}</h3>
            <ul className="mt-3 flex flex-col gap-4">
              {inCategory.map((node) => {
                const neighbors = neighborsOf(graph, node.id).filter((n) => visibleIds.has(n.node.id));
                return (
                  <li key={node.id} id={`board-list-${node.id}`}>
                    <button
                      type="button"
                      onClick={() => onSelect(node.id)}
                      aria-pressed={node.id === selectedId}
                      className={`text-left font-sans text-[0.9375rem] font-medium ${
                        node.id === selectedId ? "text-accent" : "text-ink hover:text-accent-soft"
                      }`}
                    >
                      {node.title}
                    </button>
                    <p className="mt-0.5 font-serif text-[0.875rem] leading-[1.45] text-ink-soft">
                      {node.summary}
                    </p>
                    {neighbors.length > 0 ? (
                      <ul className="mt-2 flex flex-col gap-2">
                        {neighbors.map(({ node: other, edge }) => (
                          <li key={edge.id} className="border-l-2 border-rule-soft pl-3">
                            <button
                              type="button"
                              onClick={() => onSelect(other.id)}
                              className="link-quiet text-left font-sans text-[0.8125rem] font-medium text-ink"
                            >
                              → {other.title}
                            </button>
                            <p className="mt-0.5 font-serif text-[0.8125rem] leading-[1.4] text-ink-soft">
                              {edge.note}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1.5 font-sans text-[0.75rem] text-ink-muted italic">
                        No curated connections.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
