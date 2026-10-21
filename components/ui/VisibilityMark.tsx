import type { Visibility } from "@/lib/types";

/**
 * Marks a draft or private entry. It can only ever appear in development:
 * production never loads a non-public entry in the first place, so there is
 * nothing for it to mark there.
 */
export function VisibilityMark({
  visibility,
  className = "",
}: {
  visibility: Visibility;
  className?: string;
}) {
  if (visibility === "public") return null;
  return (
    <span
      className={`inline-block border border-dashed border-accent-soft px-1.5 py-px font-sans text-[0.625rem] tracking-[0.12em] uppercase text-accent ${className}`}
    >
      {visibility}
    </span>
  );
}
