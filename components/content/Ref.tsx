import Link from "next/link";

import { getEntryByRef } from "@/lib/content";
import { experimentForRef } from "@/lib/laboratory";
import { collectionMeta } from "@/lib/types";

/**
 * An inline cross-reference to another entry on the site.
 *
 *   See <Ref to="research/consensus-dynamics-in-networks" /> for the
 *   earlier version of this argument.
 *
 * Renders the referenced entry's real title, so a renamed title stays
 * correct everywhere. "laboratory/<slug>" points at an experiment. If the
 * target does not exist the reference degrades to plain text rather than a
 * broken link.
 */
export function Ref({ to, children }: { to: string; children?: React.ReactNode }) {
  const experiment = experimentForRef(to);
  if (experiment) {
    return (
      <Link href={experiment.href} title={`Experiment: ${experiment.title}`}>
        {children ?? experiment.title}
      </Link>
    );
  }

  const entry = getEntryByRef(to);

  if (!entry) {
    return (
      <span className="text-ink-muted" title={`Unresolved reference: ${to}`}>
        {children ?? to}
      </span>
    );
  }

  return (
    <Link href={entry.href} title={`${collectionMeta[entry.collection].singular}: ${entry.title}`}>
      {children ?? entry.title}
    </Link>
  );
}
