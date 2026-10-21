import Link from "next/link";

import { getEntryByRef } from "@/lib/content";
import { collectionMeta } from "@/lib/types";

/**
 * An inline cross-reference to another entry on the site.
 *
 *   See <Ref to="notebook/002-on-measure-and-attention" /> for the
 *   earlier version of this argument.
 *
 * Renders the referenced entry's real title, so a renamed title stays
 * correct everywhere. If the target does not exist the reference degrades
 * to plain text rather than a broken link.
 */
export function Ref({ to, children }: { to: string; children?: React.ReactNode }) {
  const entry = getEntryByRef(to);

  if (!entry) {
    return (
      <span className="text-ink-muted" title={`Unresolved reference: ${to}`}>
        {children ?? to}
      </span>
    );
  }

  const label =
    entry.collection === "notebook" && !children
      ? `№ ${(entry as { number: string }).number} · ${entry.title}`
      : (children ?? entry.title);

  return (
    <Link href={entry.href} title={`${collectionMeta[entry.collection].singular}: ${entry.title}`}>
      {label}
    </Link>
  );
}
