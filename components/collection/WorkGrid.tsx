import type { WorkCardData } from "@/lib/types";

import { WorkCard } from "./WorkCard";

const COLUMNS = {
  /** The Bookshelf: fewer, larger covers, so the type on them can be read. */
  books: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  /** The Screening Room: a denser wall of posters. */
  films: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  /** A strip of recent additions on the homepage. */
  strip: "grid-cols-3 sm:grid-cols-6",
  /** Four recent works beneath each space on the Collection landing page. */
  recent: "grid-cols-2 sm:grid-cols-4",
} as const;

export function WorkGrid({
  items,
  variant = "books",
  showKind = false,
  className = "",
}: {
  items: WorkCardData[];
  variant?: keyof typeof COLUMNS;
  showKind?: boolean;
  className?: string;
}) {
  return (
    <ul className={`grid gap-x-5 gap-y-9 sm:gap-x-7 ${COLUMNS[variant]} ${className}`}>
      {items.map((item) => (
        <WorkCard key={item.ref} item={item} showKind={showKind} />
      ))}
    </ul>
  );
}
