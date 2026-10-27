"use client";

import { useRef } from "react";

import { useDialogA11y } from "./useDialogA11y";

/**
 * The folder chrome shared by every case file and connection dossier: a tab
 * sticking up out of the paper, a layered-paper backing, a close action,
 * and the accessibility contract (focus trap, Escape, focus restore) from
 * useDialogA11y. Only the inside — the actual sections — differs per file.
 */
export function CaseFileShell({
  tabLabel,
  ariaLabel,
  onClose,
  children,
  maxWidthClassName = "max-w-[46rem]",
}: {
  tabLabel: string;
  ariaLabel: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useDialogA11y(containerRef, onClose);

  return (
    <div
      className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-black/55 p-3 sm:items-center sm:p-8"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`relative my-auto w-full ${maxWidthClassName} pt-7`}>
        {/* The tab — overlapping the folder's top edge. */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-7 -translate-y-1/2 rotate-[-0.6deg] border border-rule-soft bg-paper px-3 py-1 shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
        >
          <span className="label whitespace-nowrap text-ink-muted">{tabLabel}</span>
        </div>

        {/* Two sheets stacked behind the main one. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 top-7 translate-x-[6px] translate-y-[8px] rotate-[0.9deg] border border-rule-soft bg-paper"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 top-7 translate-x-[3px] translate-y-[4px] rotate-[-0.5deg] border border-rule-soft bg-paper"
        />

        <div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          tabIndex={-1}
          className="relative border border-rule bg-paper p-6 shadow-[0_28px_70px_rgba(0,0,0,0.45)] outline-none sm:p-9"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close file — return to the wall"
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-rule-soft font-sans text-[1rem] text-ink-soft hover:border-accent-soft hover:text-ink"
          >
            ×
          </button>
          {children}
        </div>
      </div>
    </div>
  );
}
