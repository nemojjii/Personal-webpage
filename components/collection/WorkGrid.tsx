import type { WorkCardData } from "@/lib/types";

import { WorkCard } from "./WorkCard";

/**
 * Column classes and the matching `sizes` hint for each grid, worked out
 * from the shell's max width (76rem) and each breakpoint's column count, so
 * a browser downloads an image close to the box it is actually drawn in.
 */
const COLUMNS = {
  /** The Bookshelf: fewer, larger covers, so the type on them can be read. */
  books: {
    cols: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
    sizes: "(min-width: 1024px) 255px, (min-width: 640px) 295px, 45vw",
  },
  /** The Screening Room: a denser wall of posters. */
  films: {
    cols: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
    sizes: "(min-width: 1024px) 200px, (min-width: 640px) 295px, 45vw",
  },
  /** A strip of recent additions on the homepage. */
  strip: {
    cols: "grid-cols-3 sm:grid-cols-6",
    sizes: "(min-width: 640px) 165px, 30vw",
  },
  /** Four recent works beneath each space on the Collection landing page. */
  recent: {
    cols: "grid-cols-2 sm:grid-cols-4",
    sizes: "(min-width: 640px) 255px, 45vw",
  },
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
  const { cols, sizes } = COLUMNS[variant];
  return (
    <ul className={`grid gap-x-5 gap-y-9 sm:gap-x-7 ${cols} ${className}`}>
      {items.map((item) => (
        <WorkCard key={item.ref} item={item} showKind={showKind} sizes={sizes} />
      ))}
    </ul>
  );
}
