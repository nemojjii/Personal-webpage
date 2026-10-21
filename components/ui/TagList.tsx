import Link from "next/link";

import { normalizeTag } from "@/lib/content";

export function TagList({
  tags,
  className = "",
  size = "sm",
}: {
  tags: readonly string[];
  className?: string;
  size?: "sm" | "xs";
}) {
  if (!tags.length) return null;
  return (
    <ul className={`flex flex-wrap items-center gap-x-2 gap-y-1.5 ${className}`}>
      {tags.map((tag) => (
        <li key={tag}>
          <Link
            href={`/tags/${normalizeTag(tag)}`}
            className={`inline-block border border-rule px-2 py-[2px] font-sans text-ink-soft
                        transition-colors duration-200 hover:border-accent-soft hover:text-accent
                        ${size === "xs" ? "text-[0.6875rem]" : "text-[0.75rem]"}`}
          >
            {tag}
          </Link>
        </li>
      ))}
    </ul>
  );
}
