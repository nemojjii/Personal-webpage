#!/usr/bin/env node
/**
 * TMDB's API terms forbid caching anything obtained through the TMDB API
 * for longer than six months. This site is static — a TMDB poster's URL
 * lives in a book or film's frontmatter indefinitely once added — so that
 * limit cannot be met by the code alone. This script is the compliance
 * process instead: run it periodically (a reminder, not a cron job) and it
 * lists every entry whose `image` is on image.tmdb.org and whose
 * `imageFetched` date is approaching or past the six-month mark, so the
 * entry can be re-checked against TMDB (confirm the poster still exists,
 * re-fetch its URL, bump `imageFetched`) before it becomes stale under the
 * terms.
 *
 * Usage: npm run check-image-freshness
 * Exit code 1 if anything needs attention, so it can gate a release if you
 * want that; 0 otherwise.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CONTENT = path.join(ROOT, "content");
const TMDB_HOST = "image.tmdb.org";
const LIMIT_DAYS = 180; // TMDB's limit
const WARN_DAYS = 150; // start flagging 30 days early

function daysSince(dateStr) {
  const then = new Date(dateStr + "T00:00:00Z").getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / 86_400_000);
}

function hostOf(image) {
  if (!image || !image.startsWith("https://")) return null;
  try {
    return new URL(image).hostname;
  } catch {
    return null;
  }
}

let flagged = 0;
let missingDate = 0;
let checked = 0;

for (const collection of ["books", "films"]) {
  const dir = path.join(CONTENT, collection);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".mdx") || file.startsWith("_")) continue;
    const { data } = matter(fs.readFileSync(path.join(dir, file), "utf8"));
    if (hostOf(data.image) !== TMDB_HOST) continue;
    checked++;
    const slug = file.replace(/\.mdx$/, "");
    if (!data.imageFetched) {
      missingDate++;
      console.log(`MISSING imageFetched  ${collection}/${slug}  (${data.title ?? "?"}) — cannot verify its age`);
      continue;
    }
    const age = daysSince(data.imageFetched);
    if (age === null) {
      missingDate++;
      console.log(`BAD DATE  ${collection}/${slug}  imageFetched="${data.imageFetched}"`);
      continue;
    }
    if (age >= LIMIT_DAYS) {
      flagged++;
      console.log(`OVER LIMIT  ${collection}/${slug}  (${data.title ?? "?"}) — ${age} days since fetched (limit ${LIMIT_DAYS}). Re-fetch from TMDB now.`);
    } else if (age >= WARN_DAYS) {
      flagged++;
      console.log(`DUE SOON    ${collection}/${slug}  (${data.title ?? "?"}) — ${age} days since fetched. Re-fetch within ${LIMIT_DAYS - age} days.`);
    }
  }
}

console.log(`\n${checked} entr${checked === 1 ? "y" : "ies"} use a TMDB image. ${flagged} need attention. ${missingDate} have no (or an unreadable) imageFetched date.`);
process.exit(flagged > 0 || missingDate > 0 ? 1 : 0);
