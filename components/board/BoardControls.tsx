"use client";

import { categoryLabel } from "./boardLayout";

const CATEGORIES = ["research", "project", "laboratory", "concept", "book"] as const;

export function BoardControls({
  search,
  onSearchChange,
  activeCategories,
  onToggleCategory,
  viewMode,
  onSetViewMode,
  onZoomIn,
  onZoomOut,
  onResetLayout,
  onFitToView,
  hasPersonalData,
  onClearPersonal,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  activeCategories: Set<string>;
  onToggleCategory: (category: string) => void;
  viewMode: "canvas" | "list";
  onSetViewMode: (mode: "canvas" | "list") => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetLayout: () => void;
  onFitToView: () => void;
  hasPersonalData: boolean;
  onClearPersonal: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-rule-soft pb-4">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="board-search" className="sr-only">
          Search the board
        </label>
        <input
          id="board-search"
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search titles and summaries…"
          className="min-w-[13rem] flex-1 border border-rule-soft bg-paper px-3 py-1.5 font-sans text-[0.8125rem] text-ink outline-none focus-visible:border-accent-soft"
        />

        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((category) => {
            const active = activeCategories.has(category);
            return (
              <button
                key={category}
                type="button"
                aria-pressed={active}
                onClick={() => onToggleCategory(category)}
                className={`border px-2.5 py-1 font-sans text-[0.75rem] transition-colors ${
                  active
                    ? "border-accent-soft bg-surface text-ink"
                    : "border-rule-soft text-ink-soft hover:border-rule"
                }`}
              >
                {categoryLabel[category]}
              </button>
            );
          })}
        </div>

        <div role="group" aria-label="View" className="ml-auto flex border border-rule-soft font-sans text-[0.75rem]">
          <button
            type="button"
            aria-pressed={viewMode === "canvas"}
            onClick={() => onSetViewMode("canvas")}
            className={`px-3 py-1.5 ${viewMode === "canvas" ? "bg-ink text-paper" : "text-ink"}`}
          >
            Canvas
          </button>
          <button
            type="button"
            aria-pressed={viewMode === "list"}
            onClick={() => onSetViewMode("list")}
            className={`border-l border-rule-soft px-3 py-1.5 ${viewMode === "list" ? "bg-ink text-paper" : "text-ink"}`}
          >
            List
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        {viewMode === "canvas" ? (
          <div className="flex flex-wrap items-center gap-3 font-sans text-[0.8125rem]">
            <span className="inline-flex border border-rule-soft">
              <button type="button" onClick={onZoomOut} aria-label="Zoom out" className="px-2.5 py-1 text-ink hover:bg-surface">
                −
              </button>
              <button type="button" onClick={onZoomIn} aria-label="Zoom in" className="border-l border-rule-soft px-2.5 py-1 text-ink hover:bg-surface">
                +
              </button>
            </span>
            <button type="button" onClick={onFitToView} className="text-ink underline decoration-rule underline-offset-[0.25em] transition-colors hover:text-accent hover:decoration-accent">
              Fit to view
            </button>
            <button type="button" onClick={onResetLayout} className="text-ink underline decoration-rule underline-offset-[0.25em] transition-colors hover:text-accent hover:decoration-accent">
              Reset layout
            </button>
          </div>
        ) : (
          <span />
        )}

        {hasPersonalData ? (
          <button
            type="button"
            onClick={onClearPersonal}
            className="font-sans text-[0.75rem] text-ink-muted underline decoration-rule underline-offset-[0.25em] transition-colors hover:text-accent hover:decoration-accent"
          >
            Clear your notes and connections
          </button>
        ) : null}
      </div>
    </div>
  );
}
