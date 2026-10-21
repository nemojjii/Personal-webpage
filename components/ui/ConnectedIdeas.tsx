import Link from "next/link";

import { connections, formatDate } from "@/lib/content";
import { type Collection, type Entry, collectionMeta } from "@/lib/types";

import { SectionHeading } from "./SectionHeading";

const GROUP_ORDER: Collection[] = ["research", "projects", "writings", "notebook", "books", "films"];
const GROUP_LABEL: Record<Collection, string> = {
  research: "Related research",
  projects: "Related projects",
  writings: "Related writings",
  notebook: "Related notes",
  books: "Related books",
  films: "Related films",
};

function ConnectionLink({ entry }: { entry: Entry }) {
  return (
    <li className="entry-row">
      <Link href={entry.href} className="group block py-2">
        <span className="entry-title font-serif text-[1.0625rem] leading-snug">
          {entry.collection === "notebook" ? (
            <span className="mr-2 font-mono text-[0.75rem] text-ink-muted tnum">
              {entry.number}
            </span>
          ) : null}
          {entry.title}
        </span>
        {entry.date ? (
          <span className="ml-2 font-sans text-[0.6875rem] text-ink-muted">
            {formatDate(entry.date, "short")}
          </span>
        ) : null}
      </Link>
    </li>
  );
}

/**
 * The connected-ideas panel shown at the foot of every entry.
 *
 * Relations are written once — a `related:` list in frontmatter — and the
 * reverse direction is derived, so both entries show the link. Entries that
 * share a tag but are not explicitly linked appear separately, as a weaker
 * form of connection.
 */
export function ConnectedIdeas({ entry }: { entry: Entry }) {
  const { all, byCollection, sharedTags } = connections(entry);
  if (!all.length && !sharedTags.length) return null;

  const groups = GROUP_ORDER.filter((c) => byCollection[c].length > 0);

  return (
    <section className="no-print mt-20" aria-labelledby="connected-ideas">
      <SectionHeading>
        <span id="connected-ideas">Connected ideas</span>
      </SectionHeading>

      {groups.length ? (
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
        </div>
      ) : null}

      {sharedTags.length ? (
        <div className="mt-8">
          <h3 className="label mb-2">Elsewhere under the same tags</h3>
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
    </section>
  );
}
