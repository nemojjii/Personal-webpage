import { titleLang } from "@/lib/works";

export interface CoverWork {
  collection: "books" | "films";
  title: string;
  creator?: string;
  year?: number;
  image?: string;
}

/**
 * A book cover or film poster, 2:3. When no image has been added the cover
 * is set in type instead — a spine and a title for a book, a dark title card
 * for a film — so the shelf holds together before any imagery exists, and
 * nothing is ever shown that could be mistaken for an official cover.
 *
 * The typographic version is decorative: the card or masthead beside it
 * already carries the title for assistive technology.
 */
export function WorkCover({
  work,
  eager = false,
  className = "",
}: {
  work: CoverWork;
  /** Load immediately — for the one cover above the fold on a detail page. */
  eager?: boolean;
  className?: string;
}) {
  if (work.image) {
    const noun = work.collection === "books" ? "Cover of" : "Poster for";
    return (
      <div className={`aspect-2/3 overflow-hidden border border-rule-soft bg-surface ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- local file, sized by its box */}
        <img
          src={work.image}
          alt={`${noun} ${work.title}`}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const lang = titleLang(work.title);

  if (work.collection === "books") {
    return (
      <div
        aria-hidden="true"
        className={`relative flex aspect-2/3 flex-col justify-between overflow-hidden border border-rule bg-surface py-3 pr-3 pl-6 ${className}`}
      >
        {/* The spine. */}
        <span className="absolute inset-y-0 left-2.5 w-px bg-rule" />
        <span className="absolute inset-y-0 left-[0.95rem] w-px bg-rule-soft" />
        <span
          lang={lang}
          className="line-clamp-6 font-serif text-[0.9375rem] leading-[1.28] text-ink [text-wrap:balance]"
        >
          {work.title}
        </span>
        <span className="mt-3 flex flex-col gap-y-1">
          {work.creator ? (
            <span className="line-clamp-2 font-sans text-[0.625rem] leading-[1.35] tracking-[0.08em] uppercase text-ink-soft">
              {work.creator}
            </span>
          ) : null}
          {work.year ? (
            <span className="font-mono text-[0.625rem] text-ink-muted tnum">{work.year}</span>
          ) : null}
        </span>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`relative flex aspect-2/3 flex-col justify-end overflow-hidden bg-ink p-4 text-paper ${className}`}
    >
      {/* A hairline frame, like the edge of a title card. */}
      <span className="pointer-events-none absolute inset-2 border border-paper/15" />
      {work.year ? (
        <span className="absolute top-4 right-4 font-mono text-[0.625rem] text-paper/55 tnum">
          {work.year}
        </span>
      ) : null}
      <span
        lang={lang}
        className="line-clamp-5 font-serif text-[0.9375rem] leading-[1.28] text-paper [text-wrap:balance]"
      >
        {work.title}
      </span>
      {work.creator ? (
        <span className="mt-2 line-clamp-2 font-sans text-[0.625rem] leading-[1.35] tracking-[0.08em] uppercase text-paper/60">
          {work.creator}
        </span>
      ) : null}
    </div>
  );
}
