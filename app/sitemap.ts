import type { MetadataRoute } from "next";

import { allEntries, allTags } from "@/lib/content";
import { navigation, secondaryNavigation, site } from "@/site.config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url.replace(/\/$/, "");
  const now = new Date();

  const staticRoutes = [...navigation, ...secondaryNavigation, { href: "/tags" }].map(
    (item) => ({
      url: `${base}${item.href === "/" ? "" : item.href}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: item.href === "/" ? 1 : 0.7,
    }),
  );

  const entryRoutes = allEntries().map((entry) => ({
    url: `${base}${entry.href}`,
    lastModified: entry.updated || entry.date ? new Date(entry.updated || entry.date) : now,
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  const tagRoutes = allTags().map((tag) => ({
    url: `${base}/tags/${tag.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.3,
  }));

  return [...staticRoutes, ...entryRoutes, ...tagRoutes];
}
