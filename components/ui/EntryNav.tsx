import Link from "next/link";

import type { Entry } from "@/lib/types";

/** Previous / next within the same collection, in index order. */
export function EntryNav({
  previous,
  next,
  label,
}: {
  previous?: Entry;
  next?: Entry;
  label: string;
}) {
  if (!previous && !next) return null;
  return (
    <nav
      aria-label={label}
      className="no-print mt-16 grid gap-6 border-t border-rule pt-6 sm:grid-cols-2"
    >
      <div>
        {next ? (
          <Link href={next.href} className="entry-row group block">
            <span className="label block">← Newer</span>
            <span className="entry-title mt-1 inline-block font-serif text-[1.0625rem] leading-snug">
              {next.title}
            </span>
          </Link>
        ) : null}
      </div>
      <div className="sm:text-right">
        {previous ? (
          <Link href={previous.href} className="entry-row group block">
            <span className="label block">Older →</span>
            <span className="entry-title mt-1 inline-block font-serif text-[1.0625rem] leading-snug">
              {previous.title}
            </span>
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
