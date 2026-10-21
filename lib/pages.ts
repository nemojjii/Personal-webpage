import "server-only";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/**
 * Singleton pages (About, and anything else you add) are plain MDX files in
 * content/pages/. They go through exactly the same renderer as the
 * collections, so mathematics, figures and cross-references all work.
 */
export interface SingletonPage {
  title?: string;
  intro?: string;
  body: string;
}

export function getPage(name: string): SingletonPage | undefined {
  for (const ext of [".mdx", ".md"]) {
    const file = path.join(process.cwd(), "content", "pages", `${name}${ext}`);
    if (!fs.existsSync(file)) continue;
    const { data, content } = matter(fs.readFileSync(file, "utf8"));
    return {
      title: data.title ? String(data.title) : undefined,
      intro: data.intro ? String(data.intro) : undefined,
      body: content,
    };
  }
  return undefined;
}
