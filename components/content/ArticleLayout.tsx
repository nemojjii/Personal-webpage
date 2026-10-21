import type { ReactNode } from "react";

import {
  TableOfContents,
  TableOfContentsDisclosure,
} from "@/components/ui/TableOfContents";
import { TOC_MIN, type TocItem } from "@/lib/toc";

/**
 * The reading layout shared by research projects, essays and notes:
 * one measured column, with the outline in the right margin on wide screens
 * and folded under the masthead on narrow ones.
 */
export function ArticleLayout({
  header,
  children,
  toc = [],
  id = "entry",
}: {
  header?: ReactNode;
  children: ReactNode;
  toc?: TocItem[];
  id?: string;
}) {
  const hasToc = toc.length >= TOC_MIN;

  return (
    <div
      className={`mx-auto grid w-full max-w-[40rem] gap-x-14 ${
        hasToc ? "xl:max-w-[57rem] xl:grid-cols-[minmax(0,40rem)_13rem]" : ""
      }`}
    >
      <article id={id} className="min-w-0">
        {header}
        {hasToc ? <TableOfContentsDisclosure items={toc} /> : null}
        {children}
      </article>
      {hasToc ? <TableOfContents items={toc} /> : null}
    </div>
  );
}
