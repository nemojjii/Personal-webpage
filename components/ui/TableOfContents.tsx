"use client";

import { useEffect, useState } from "react";

import { TOC_MIN, type TocItem } from "@/lib/toc";

function useActiveHeading(items: TocItem[]) {
  const [active, setActive] = useState("");

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );

    for (const heading of headings) observer.observe(heading);
    return () => observer.disconnect();
  }, [items]);

  return active;
}

function List({ items, active }: { items: TocItem[]; active: string }) {
  return (
    <ol className="flex flex-col gap-y-2">
      {items.map((item) => (
        <li key={item.id} className={item.depth === 3 ? "pl-4" : ""}>
          <a
            href={`#${item.id}`}
            aria-current={active === item.id ? "location" : undefined}
            className={`block font-sans text-[0.8125rem] leading-snug transition-colors duration-200 ${
              active === item.id ? "text-accent" : "text-ink-soft hover:text-ink"
            }`}
          >
            {item.text}
          </a>
        </li>
      ))}
    </ol>
  );
}

/** Sticky outline for the right margin. Wide screens only. */
export function TableOfContents({ items }: { items: TocItem[] }) {
  const active = useActiveHeading(items);
  if (items.length < TOC_MIN) return null;
  return (
    <nav
      aria-label="Contents"
      className="no-print sticky top-[calc(var(--nav-h)+3rem)] hidden max-h-[70vh] overflow-y-auto xl:block"
    >
      <p className="label mb-3 border-b border-rule-soft pb-2">Contents</p>
      <List items={items} active={active} />
    </nav>
  );
}

/** Collapsed outline shown in the flow of the article on narrow screens. */
export function TableOfContentsDisclosure({ items }: { items: TocItem[] }) {
  const active = useActiveHeading(items);
  if (items.length < TOC_MIN) return null;
  return (
    <details className="no-print group mt-8 border-b border-rule-soft pb-3 xl:hidden">
      <summary className="label flex cursor-pointer list-none items-center justify-between marker:content-none">
        Contents
        <span
          aria-hidden="true"
          className="text-ink-muted transition-transform duration-300 group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="mt-4">
        <List items={items} active={active} />
      </div>
    </details>
  );
}
