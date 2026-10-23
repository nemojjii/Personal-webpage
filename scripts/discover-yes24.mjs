#!/usr/bin/env node
/**
 * YES24 Korean-edition cover discovery for the 27 Bookshelf entries. Local,
 * one-shot, read-only — writes a JSON candidate file for a human to look
 * at, never edits content/ directly (Phase 8.3 §4/§9).
 *
 * Strategy per book: search by title (and title+author) with
 * /v1/goods/itemList, score the results, then confirm the best (and any
 * closely-scoring alternates — never silently pick one for a book flagged
 * as commonly re-translated) against /v1/goods/itemDetail?searchType=ISBN13
 * for edition-accurate fields and the cover/sideCover/backCover URLs.
 *
 * Usage:
 *   node scripts/discover-yes24.mjs [outputPath]
 *
 * Reads YES24_API_KEY from ~/academic-site/.env.local — see
 * scripts/lib/env.mjs. Stops with no network call at all if the key is
 * missing or looks like a placeholder; never prints the key.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { readCredential, redact } from "./lib/env.mjs";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = process.argv[2] || "/tmp/yes24-discovery.json";
const API = "https://apis.yes24.com/v1";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Titles the earlier audit flagged as commonly re-translated/re-published:
// keep every plausible candidate for these, never auto-pick one.
const MULTI_EDITION_SLUGS = new Set([
  "the-book-of-disquiet",
  "no-longer-human",
  "the-stranger",
  "demian",
  "cosmos",
  "the-great-gatsby",
]);

const cred = readCredential("YES24_API_KEY");
if (!cred.ok) {
  console.error(`YES24: stopping — ${cred.reason}`);
  console.error("Add YES24_API_KEY=<your key> to ~/academic-site/.env.local and re-run.");
  process.exit(1);
}
const KEY = cred.value;

async function yes24(endpoint, params = {}) {
  const url = new URL(API + endpoint);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  const safeUrl = redact(url.toString(), KEY);
  let res;
  try {
    res = await fetch(url, { headers: { "X-Api-Key": KEY } });
  } catch (e) {
    return { ok: false, status: 0, error: String(e), safeUrl };
  }
  if (res.status === 401) {
    console.error("YES24: 401 Unauthorized — YES24_API_KEY appears invalid or not accepted. Stopping all further YES24 requests.");
    process.exit(1);
  }
  if (res.status === 429) {
    console.error("YES24: 429 rate-limited, waiting 3s…");
    await sleep(3000);
    return yes24(endpoint, params);
  }
  let body;
  try {
    body = await res.json();
  } catch {
    return { ok: false, status: res.status, error: "non-JSON response", safeUrl };
  }
  if (!res.ok || body.success === false) {
    return { ok: false, status: res.status, error: body.message || body.errorCode || "unknown error", safeUrl };
  }
  return { ok: true, data: body.data, safeUrl };
}

/** Korean national ISBN prefixes — 978-89 (pre-2016) and 979-11 (since). */
export const isKoreanIsbn = (isbn13) => /^(97889|97911)/.test(isbn13 || "");

function scoreItem(book, item) {
  let score = 0;
  const reasons = [];
  const norm = (s) => (s || "").replace(/\s+/g, "").toLowerCase();
  const authorSurname = norm((book.author || "").split(/[,\s]+/).pop());
  if (authorSurname && norm(item.author).includes(authorSurname)) {
    score += 2;
    reasons.push("author matches");
  }
  if (item.title && (norm(item.title).includes(norm(book.titleEn)) || norm(book.titleEn || "").includes(norm(item.title)))) {
    score += 1;
    reasons.push("title overlaps titleEn");
  }
  // The Korean display title against the result's own title — both in
  // Korean script, so unlike the author check above this one actually
  // works for a Korean edition, and it is the strongest single signal that
  // a Korean-market result is the right book rather than an unrelated one
  // that happens to also carry a Korean ISBN.
  const coreTitle = norm(book.title).replace(/\(.*?\)|\[.*?\]/g, "");
  if (coreTitle.length >= 2 && item.title && norm(item.title).includes(coreTitle)) {
    score += 4;
    reasons.push("Korean display title found in result title");
  }
  if (item.cover) {
    score += 1;
    reasons.push("has cover image");
  }
  // She asked for Korean-language editions preferred where available. This
  // has to outweigh the author/title checks above, which are Latin-text
  // comparisons: a Korean edition's author field is in Korean script
  // ("한강"), so it never matches a catalogued Latin name ("Han Kang") and
  // would otherwise lose to an English-market import of the same book with
  // a Latin author credit — exactly backwards from what she asked for.
  if (isKoreanIsbn(item.isbn13)) {
    score += 5;
    reasons.push("Korean ISBN prefix (978-89 / 979-11)");
  }
  return { score, reasons };
}

async function discoverOne(book) {
  // The plain Korean (or original) title first — this is a Korean
  // bookstore's index, and a romanized author name appended to a Korean
  // title can return nothing even when the title alone would succeed.
  const queries = [book.title, book.titleOriginal, `${book.title} ${book.author}`, book.titleEn].filter(
    (q, i, a) => q && a.indexOf(q) === i,
  );
  const seen = new Map();
  const queryErrors = [];
  for (const q of queries) {
    const r = await yes24("/goods/itemList", { query: q });
    // A single query returning nothing (or failing) is not fatal — Korean
    // bookstore search can be picky about exactly what's in the string, so
    // every query in the list is tried before giving up.
    if (!r.ok) {
      queryErrors.push(`"${q}": ${r.error}`);
      await sleep(150);
      continue;
    }
    const items = r.data?.items || r.data?.item || (Array.isArray(r.data) ? r.data : []);
    for (const it of items) {
      const key = it.isbn13 || it.itemId || it.title;
      if (key && !seen.has(key)) seen.set(key, it);
    }
    await sleep(150);
  }

  if (seen.size === 0) {
    return {
      ...book,
      status: "NO_RESULTS",
      detail:
        queryErrors.length === queries.length
          ? `every query failed: ${queryErrors.join("; ")}`
          : "YES24 keyword search returned nothing for any tried query",
    };
  }

  const candidates = [...seen.values()].map((it) => ({ ...it, ...scoreItem(book, it) }));
  candidates.sort((a, b) => b.score - a.score);

  const keepMultiple = MULTI_EDITION_SLUGS.has(book.slug);
  // Even outside the explicitly flagged multi-edition titles, keep a few
  // runners-up: `scoreItem`'s author check compares Latin text, so it never
  // credits a Korean-script author field ("헤르만 헤세" vs "Hesse") — a
  // genuinely correct Korean literary-press edition can easily score below
  // a study-guide or foreign edition whose author happens to be in Latin
  // script. Verifying three gives a real edition more room to surface.
  const toVerify = keepMultiple ? candidates.slice(0, 4) : candidates.slice(0, 3);

  const verified = [];
  for (const c of toVerify) {
    if (!c.isbn13) {
      verified.push({ ...c, verified: false, note: "no ISBN13 from search result; not confirmed against itemDetail" });
      continue;
    }
    const d = await yes24("/goods/itemDetail", { searchType: "ISBN13", query: c.isbn13 });
    await sleep(150);
    if (!d.ok) {
      verified.push({ ...c, verified: false, note: `itemDetail failed: ${d.error}` });
      continue;
    }
    // The live response nests the single item in data.items[0] (an array,
    // even for a one-ISBN lookup), not in data itself.
    const item = d.data?.items?.[0];
    if (!item) {
      verified.push({ ...c, verified: false, note: "itemDetail returned no item for this ISBN" });
      continue;
    }
    verified.push({
      isbn13: c.isbn13,
      verified: true,
      isKorean: isKoreanIsbn(c.isbn13),
      matchedTitle: item.title,
      matchedAuthor: item.author,
      publisher: item.publisher,
      publishDate: item.publishDate,
      itemStatus: item.itemStatus,
      coverUrl: item.cover || null,
      sideCoverUrl: item.sideCover || null,
      backCoverUrl: item.backCover || null,
      productUrl: item.link || null,
      score: c.score,
      scoreReasons: c.reasons,
    });
  }

  const best = verified.find((v) => v.verified) || verified[0];
  const confidence = !best?.verified ? "UNRESOLVED" : best.score >= 3 ? "HIGH" : best.score >= 1 ? "MEDIUM" : "LOW";

  return {
    ...book,
    status: verified.some((v) => v.verified) ? (keepMultiple && verified.filter((v) => v.verified).length > 1 ? "MULTIPLE_EDITIONS" : "MATCHED") : "UNVERIFIED",
    confidence,
    candidates: verified,
    requiresConfirmation: keepMultiple || confidence !== "HIGH",
    source: "YES24",
    retrievedOn: new Date().toISOString().slice(0, 10),
  };
}

async function main() {
  const dir = path.join(ROOT, "content", "books");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx") && !f.startsWith("_")).sort();
  console.log(`YES24 discovery: ${files.length} books, key loaded (length ${KEY.length}, not shown).`);

  const results = [];
  for (const f of files) {
    const { data } = matter(fs.readFileSync(path.join(dir, f), "utf8"));
    const book = {
      slug: f.replace(".mdx", ""),
      title: data.title,
      titleOriginal: data.titleOriginal || "",
      titleEn: data.titleEn || "",
      author: data.author,
      year: data.year || null,
    };
    process.stderr.write(`  ${book.slug}… `);
    try {
      const r = await discoverOne(book);
      results.push(r);
      process.stderr.write(r.status + "\n");
    } catch (e) {
      results.push({ ...book, status: "ERROR", detail: String(e) });
      process.stderr.write("ERROR: " + e.message + "\n");
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
  const tally = results.reduce((acc, r) => ((acc[r.status] = (acc[r.status] || 0) + 1), acc), {});
  console.log("\nTally:", tally);
  console.log("Written:", OUT);
}

main();
