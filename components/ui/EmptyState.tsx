import type { ReactNode } from "react";

/**
 * Used wherever a section has no content yet. Quiet by design — it should
 * read as a deliberate pause rather than a missing piece.
 */
export function EmptyState({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="border-l border-rule py-1 pl-5">
      <p className="font-serif text-[1.0625rem] text-ink-soft italic">{children}</p>
      {hint ? (
        <p className="mt-1.5 font-sans text-[0.8125rem] text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}
