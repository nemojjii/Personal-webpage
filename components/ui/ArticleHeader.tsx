import type { ReactNode } from "react";

import { TagList } from "./TagList";

/**
 * The masthead of a single entry — research project, essay or note.
 * `meta` items are separated by hairline dots.
 */
export function ArticleHeader({
  eyebrow,
  title,
  subtitle,
  summary,
  meta = [],
  actions,
  tags = [],
  children,
}: {
  eyebrow?: ReactNode;
  title: string;
  subtitle?: string;
  summary?: string;
  meta?: ReactNode[];
  /** Screen-only controls (printing, downloads) shown after the metadata. */
  actions?: ReactNode;
  tags?: readonly string[];
  children?: ReactNode;
}) {
  const items = meta.filter(Boolean);
  return (
    <header className="border-b border-rule pb-8">
      {eyebrow ? <div className="mb-5">{eyebrow}</div> : null}

      <h1 className="max-w-[26ch] font-serif text-display leading-[1.05] tracking-[-0.018em] text-balance">
        {title}
      </h1>

      {subtitle ? (
        <p className="mt-3.5 max-w-[38ch] font-serif text-[1.25rem] leading-[1.35] text-ink-soft italic sm:text-[1.4rem]">
          {subtitle}
        </p>
      ) : null}

      {summary ? (
        <p className="mt-6 max-w-[34rem] font-serif text-[1.125rem] leading-[1.6] text-ink-soft">
          {summary}
        </p>
      ) : null}

      {items.length || actions ? (
        <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 font-sans text-[0.75rem] text-ink-muted">
          {items.map((item, i) => (
            <span key={i} className="flex items-center gap-x-3">
              {i > 0 ? <span aria-hidden="true">·</span> : null}
              {item}
            </span>
          ))}
          {actions ? (
            <span className="no-print flex items-center gap-x-3">
              {items.length ? <span aria-hidden="true">·</span> : null}
              {actions}
            </span>
          ) : null}
        </div>
      ) : null}

      {tags.length ? <TagList tags={tags} className="mt-5" size="xs" /> : null}

      {children ? <div className="mt-7">{children}</div> : null}
    </header>
  );
}
