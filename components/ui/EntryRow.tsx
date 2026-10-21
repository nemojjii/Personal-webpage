import Link from "next/link";

import { formatDate } from "@/lib/content";
import { type Entry, projectStages } from "@/lib/types";

import { StatusBadge } from "./StatusBadge";
import { TagList } from "./TagList";
import { VisibilityMark } from "./VisibilityMark";

/** The per-collection marker shown in the left column of an index row. */
function Marker({ entry }: { entry: Entry }) {
  if (entry.collection === "research") return <StatusBadge status={entry.status} />;
  if (entry.collection === "projects")
    return (
      <span className="font-sans text-[0.6875rem] font-medium tracking-[0.12em] uppercase text-ink-soft">
        {projectStages[entry.stage].label}
      </span>
    );
  if (entry.collection === "books")
    return (
      <span className="font-sans text-[0.75rem] text-ink-soft">
        {entry.author}
        {entry.year ? <span className="text-ink-muted"> · {entry.year}</span> : null}
      </span>
    );
  if (entry.collection === "films")
    return (
      <span className="font-sans text-[0.75rem] text-ink-soft">
        {entry.director}
        {entry.year ? <span className="text-ink-muted"> · {entry.year}</span> : null}
      </span>
    );
  return null;
}

/**
 * One row in a content index. Shared by Research, Projects, tag pages and the
 * homepage so that every list on the site reads the same way.
 */
export function EntryRow({
  entry,
  compact = false,
}: {
  entry: Entry;
  compact?: boolean;
}) {
  const hasArea =
    (entry.collection === "research" || entry.collection === "projects") && Boolean(entry.area);
  const hasMeta = hasArea || (!compact && entry.tags.length > 0);

  return (
    <li className="entry-row border-b border-rule-soft last:border-b-0">
      <article className="grid gap-x-8 py-6 sm:grid-cols-[9rem_1fr] sm:py-7">
        <div className="mb-2 flex items-baseline gap-x-3 sm:mb-0 sm:flex-col sm:items-start sm:gap-y-2 sm:pt-[0.45rem]">
          <Marker entry={entry} />
          <VisibilityMark visibility={entry.visibility} />
          {entry.date ? (
            <time
              dateTime={entry.date}
              className="font-sans text-[0.75rem] text-ink-muted"
            >
              {formatDate(entry.date, "short")}
            </time>
          ) : null}
        </div>

        <div>
          <h3 className="font-serif text-[1.3rem] leading-[1.25] tracking-[-0.005em] sm:text-[1.4rem]">
            <Link href={entry.href} className="entry-title">
              {entry.title}
            </Link>
          </h3>

          {entry.subtitle ? (
            <p className="mt-1 font-serif text-[1.0625rem] leading-snug text-ink-soft italic">
              {entry.subtitle}
            </p>
          ) : null}

          {entry.summary && !compact ? (
            <p className="mt-2.5 max-w-[34rem] font-serif text-[1.0625rem] leading-[1.6] text-ink-soft">
              {entry.summary}
            </p>
          ) : null}

          {hasMeta ? (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              {hasArea ? (
                <span className="font-sans text-[0.75rem] text-ink-muted">
                  {(entry as { area?: string }).area}
                </span>
              ) : null}
              {!compact ? <TagList tags={entry.tags} size="xs" /> : null}
            </div>
          ) : null}
        </div>
      </article>
    </li>
  );
}

export function EntryList({
  entries,
  compact = false,
  className = "",
}: {
  entries: Entry[];
  compact?: boolean;
  className?: string;
}) {
  return (
    <ul className={`border-t border-rule ${className}`}>
      {entries.map((entry) => (
        <EntryRow key={entry.ref} entry={entry} compact={compact} />
      ))}
    </ul>
  );
}
