import Link from "next/link";
import type { ReactNode } from "react";

/**
 * A hairline section heading: small-caps label, rule, optional trailing link.
 */
export function SectionHeading({
  children,
  action,
  as: Tag = "h2",
}: {
  children: ReactNode;
  action?: { label: string; href: string };
  as?: "h2" | "h3";
}) {
  return (
    <div className="flex items-baseline gap-4 border-b border-rule pb-2.5">
      {/* A size and weight step above the shared `label` utility (used
          as-is for tags, badges and stage markers elsewhere): this is the
          one label on a page that introduces a whole section rather than
          annotating an item within one, and at the smaller, lighter default
          it read as weaker than the item titles beneath it. */}
      <Tag className="label !font-sans !text-[0.75rem] !font-semibold">{children}</Tag>
      <span className="flex-1" aria-hidden="true" />
      {action ? (
        <Link
          href={action.href}
          className="label link-quiet shrink-0 !text-ink-soft hover:!text-accent"
        >
          {action.label}
          <span aria-hidden="true"> →</span>
        </Link>
      ) : null}
    </div>
  );
}
