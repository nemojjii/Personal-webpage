import GithubSlugger from "github-slugger";

/** Fewer than this many headings and an outline is noise rather than help. */
export const TOC_MIN = 3;

export interface TocItem {
  depth: 2 | 3;
  text: string;
  id: string;
}

/**
 * Extracts the h2/h3 outline from an MDX body. The ids produced here match
 * the ones rehype-slug generates at render time, so the links resolve.
 */
export function buildToc(body: string): TocItem[] {
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];
  let inFence = false;

  for (const line of body.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;

    const text = match[2]
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/(^|[^*])\*([^*]+)\*/g, "$1$2")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .trim();

    items.push({
      depth: match[1].length === 2 ? 2 : 3,
      text,
      id: slugger.slug(text),
    });
  }

  return items;
}
