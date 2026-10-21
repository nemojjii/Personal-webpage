import Link from "next/link";

import { VisibilityMark } from "@/components/ui/VisibilityMark";
import type { WorkCardData } from "@/lib/types";
import { secondaryTitle, titleLang } from "@/lib/works";

import { WorkCover } from "./WorkCover";

/** One book or film in a grid: cover, title, the other title, who made it. */
export function WorkCard({
  item,
  showKind = false,
}: {
  item: WorkCardData;
  /** Say whether it is a book or a film — for mixed lists such as a thematic collection. */
  showKind?: boolean;
}) {
  const second = secondaryTitle(item);
  return (
    <li className="entry-row">
      <Link href={item.href} className="group block">
        <WorkCover
          work={item}
          className="transition-opacity duration-300 group-hover:opacity-[0.92]"
        />
        <div className="mt-3">
          {showKind ? (
            <span className="label mb-1 block !text-ink-muted">
              {item.collection === "books" ? "Book" : "Film"}
            </span>
          ) : null}
          <h3
            lang={titleLang(item.title)}
            className="font-serif text-[1.0625rem] leading-[1.3] tracking-[-0.005em]"
          >
            <span className="entry-title">{item.title}</span>
          </h3>
          {second ? (
            <p className="mt-0.5 font-serif text-[0.875rem] leading-snug text-ink-muted italic">
              {second}
            </p>
          ) : null}
          {item.creator || item.year ? (
            <p className="mt-1.5 font-sans text-[0.75rem] text-ink-soft">
              {item.creator}
              {item.creator && item.year ? <span className="text-ink-muted"> · </span> : null}
              {item.year ? <span className="text-ink-muted tnum">{item.year}</span> : null}
            </p>
          ) : null}
          <VisibilityMark visibility={item.visibility} className="mt-2" />
        </div>
      </Link>
    </li>
  );
}
