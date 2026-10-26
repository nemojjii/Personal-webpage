import Link from "next/link";

import { type ExperimentLink, connections, formatDate } from "@/lib/content";
import { type Collection, type Entry, collectionMeta, relationKinds } from "@/lib/types";

import { SectionHeading } from "./SectionHeading";

const GROUP_ORDER: Collection[] = ["research", "projects", "books", "films"];
const GROUP_LABEL: Record<Collection, string> = {
  research: "Related research",
  projects: "Related projects",
  books: "Related books",
  films: "Related films",
};

function ConnectionLink({ entry }: { entry: Entry }) {
  return (
    <li className="entry-row">
      <Link href={entry.href} className="group block py-2">
        <span className="entry-title font-serif text-[1.0625rem] leading-snug">{entry.title}</span>
        {entry.date ? (
          <span className="ml-2 font-sans text-[0.6875rem] text-ink-muted">
            {formatDate(entry.date, "short")}
          </span>
        ) : null}
      </Link>
    </li>
  );
}

/** A Little Laboratory experiment, with the kind of connection and why. */
function ExperimentLinkItem({ link }: { link: ExperimentLink }) {
  return (
    <li className="entry-row">
      <Link href={link.experiment.href} className="group block py-2">
        <span className="entry-title font-serif text-[1.0625rem] leading-snug">
          {link.experiment.title}
        </span>
        {link.kind ? (
          <span className="ml-2 font-sans text-[0.6875rem] tracking-[0.08em] uppercase text-accent">
            {relationKinds[link.kind].label}
          </span>
        ) : null}
      </Link>
      {link.note ? (
        <p className="max-w-[34rem] pb-2 font-sans text-[0.8125rem] leading-relaxed text-ink-soft">
          {link.note}
        </p>
      ) : null}
    </li>
  );
}

/**
 * The connected-ideas panel shown at the foot of every entry.
 *
 * Relations are written once — a `related:` list in frontmatter, or an
 * experiment's own `related` list — and the reverse direction is derived, so
 * both sides show the link. Entries that merely share a tag appear
 * separately and are labelled as suggestions, not as connections anyone has
 * vouched for.
 */
export function ConnectedIdeas({ entry }: { entry: Entry }) {
  const { all, byCollection, experiments, sharedTags } = connections(entry);
  if (!all.length && !experiments.length && !sharedTags.length) return null;

  const groups = GROUP_ORDER.filter((c) => byCollection[c].length > 0);

  return (
    <section className="no-print mt-20" aria-labelledby="connected-ideas">
      <SectionHeading>
        <span id="connected-ideas">Connected ideas</span>
      </SectionHeading>

      {groups.length || experiments.length ? (
        <div className="mt-7 flex flex-wrap gap-x-10 gap-y-8">
          {groups.map((collection) => (
            <div key={collection} className="min-w-[13rem] flex-1 basis-[17rem]">
              <h3 className="label mb-1.5 border-b border-rule-soft pb-1.5">
                {GROUP_LABEL[collection]}
              </h3>
              <ul>
                {byCollection[collection].map((e) => (
                  <ConnectionLink key={e.ref} entry={e} />
                ))}
              </ul>
            </div>
          ))}
          {experiments.length ? (
            <div className="min-w-[13rem] flex-1 basis-[17rem]">
              <h3 className="label mb-1.5 border-b border-rule-soft pb-1.5">Related experiments</h3>
              <ul>
                {experiments.map((link) => (
                  <ExperimentLinkItem key={link.experiment.slug} link={link} />
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {sharedTags.length ? (
        <div className="mt-8">
          <h3 className="label mb-1">Elsewhere under the same tags</h3>
          <p className="mb-2.5 font-sans text-[0.75rem] text-ink-muted">
            Suggested because they share a tag — not an editorial connection.
          </p>
          <ul className="flex flex-col gap-y-1">
            {sharedTags.slice(0, 6).map((e) => (
              <li key={e.ref} className="entry-row">
                <Link href={e.href} className="group inline-flex items-baseline gap-2">
                  <span className="font-sans text-[0.6875rem] tracking-[0.1em] uppercase text-ink-muted">
                    {collectionMeta[e.collection].singular}
                  </span>
                  <span className="entry-title font-serif text-[1.0625rem]">{e.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-8">
        <Link href="/connected-ideas" className="link-quiet font-sans text-[0.8125rem]">
          See this on the full Investigation Board <span aria-hidden="true">→</span>
        </Link>
      </p>
    </section>
  );
}
