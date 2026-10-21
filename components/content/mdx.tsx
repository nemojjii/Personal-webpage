import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { MDXRemote } from "next-mdx-remote/rsc";

import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import smartypants from "remark-smartypants";

import { ConsensusExplorer } from "@/components/viz/ConsensusExplorer";

import { Aside } from "./Aside";
import { Figure } from "./Figure";
import { Ref } from "./Ref";
import { OnForm, OnPeople, StayedWithMe } from "./Reflection";
import { Theorem } from "./Theorem";

/** Shorthands usable in any `$…$` or `$$…$$` block. Extend freely. */
const katexMacros = {
  "\\R": "\\mathbb{R}",
  "\\N": "\\mathbb{N}",
  "\\Z": "\\mathbb{Z}",
  "\\C": "\\mathbb{C}",
  "\\abs": "\\left\\lvert #1 \\right\\rvert",
  "\\norm": "\\left\\lVert #1 \\right\\rVert",
  "\\inner": "\\left\\langle #1, #2 \\right\\rangle",
  "\\dd": "\\mathrm{d}",
};

function Anchor({ href = "", ...props }: ComponentPropsWithoutRef<"a">) {
  const isInternal = href.startsWith("/") || href.startsWith("#");
  if (isInternal) return <Link href={href} {...props} />;
  return <a href={href} target="_blank" rel="noopener noreferrer" {...props} />;
}

/** Markdown images become captioned figures; the alt text is kept for a11y. */
function Image({ src, alt, title }: ComponentPropsWithoutRef<"img">) {
  if (typeof src !== "string") return null;
  return <Figure src={src} alt={alt} caption={title ?? alt ?? undefined} />;
}

/** Components available inside every MDX file without importing anything. */
const components = {
  a: Anchor,
  img: Image,
  Figure,
  Aside,
  Theorem,
  Ref,
  ConsensusExplorer,
  // The Collection's reflection containers — see components/content/Reflection.tsx.
  StayedWithMe,
  OnForm,
  OnPeople,
};

export function Mdx({ source }: { source: string }) {
  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        parseFrontmatter: false,
        mdxOptions: {
          remarkPlugins: [remarkGfm, remarkMath, smartypants],
          remarkRehypeOptions: {
            footnoteLabel: "Notes",
            footnoteLabelTagName: "h2",
            footnoteBackLabel: "Back to the text",
          },
          rehypePlugins: [
            rehypeSlug,
            [
              rehypeAutolinkHeadings,
              {
                behavior: "prepend",
                test: (element: { tagName: string; properties?: { id?: string } }) =>
                  ["h2", "h3"].includes(element.tagName) &&
                  element.properties?.id !== "footnote-label",
                properties: {
                  className: "heading-anchor",
                  "aria-hidden": "true",
                  tabIndex: -1,
                },
                content: { type: "text", value: "§" },
              },
            ],
            [
              rehypeKatex,
              { throwOnError: false, strict: false, macros: katexMacros },
            ],
          ],
        },
      }}
    />
  );
}
