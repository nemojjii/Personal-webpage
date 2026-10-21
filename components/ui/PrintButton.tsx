"use client";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print font-sans text-[0.75rem] text-ink-muted underline decoration-rule underline-offset-[0.2em] transition-colors duration-200 hover:text-accent hover:decoration-accent"
    >
      {label}
    </button>
  );
}
