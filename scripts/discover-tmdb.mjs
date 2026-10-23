#!/usr/bin/env node
/**
 * TMDB poster discovery for the 40 Screening Room entries. Local, one-shot,
 * read-only against TMDB — writes nothing to content/, only to a JSON file
 * under the scratch output path given on the command line (or /tmp by
 * default). Never touches production content directly: the point of this
 * script is a candidate list for a human to look at, per Phase 8.3 §5/§9.
 *
 * Usage:
 *   node scripts/discover-tmdb.mjs [outputPath]
 *
 * Reads TMDB_API_KEY (v3) from ~/academic-site/.env.local — see
 * scripts/lib/env.mjs. Stops with no network call at all if the key is
 * missing or looks like a placeholder; never prints the key.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { readCredential, redact } from "./lib/env.mjs";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = process.argv[2] || "/tmp/tmdb-discovery.json";
const API = "https://api.themoviedb.org/3";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const cred = readCredential("TMDB_API_KEY");
if (!cred.ok) {
  console.error(`TMDB: stopping — ${cred.reason}`);
  console.error("Add TMDB_API_KEY=<your v3 key> to ~/academic-site/.env.local and re-run.");
  process.exit(1);
}
const KEY = cred.value;

async function tmdb(endpoint, params = {}) {
  const url = new URL(API + endpoint);
  url.searchParams.set("api_key", KEY);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  const safeUrl = redact(url.toString(), KEY); // for logging only; the real `url` is used for the request
  let res;
  try {
    res = await fetch(url);
  } catch (e) {
    return { ok: false, status: 0, error: String(e), safeUrl };
  }
  if (res.status === 401) {
    console.error("TMDB: 401 Unauthorized — TMDB_API_KEY appears invalid. Stopping all further TMDB requests.");
    process.exit(1);
  }
  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("retry-after") || 2);
    console.error(`TMDB: 429 rate-limited, waiting ${retryAfter}s…`);
    await sleep((retryAfter + 0.5) * 1000);
    return tmdb(endpoint, params);
  }
  if (!res.ok) {
    return { ok: false, status: res.status, error: await res.text().catch(() => ""), safeUrl };
  }
  return { ok: true, data: await res.json(), safeUrl };
}

function scoreCandidate(film, c) {
  let score = 0;
  const reasons = [];
  const releaseYear = c.release_date ? Number(c.release_date.slice(0, 4)) : null;
  if (film.year && releaseYear === film.year) {
    score += 3;
    reasons.push("year exact");
  } else if (film.year && releaseYear && Math.abs(releaseYear - film.year) <= 1) {
    score += 1;
    reasons.push("year ±1");
  }
  if (film.language && c.original_language === film.language) {
    score += 2;
    reasons.push("original_language matches");
  }
  const norm = (s) => (s || "").toLowerCase().trim();
  // The catalogue's own original-title field, when it has one.
  if (film.titleOriginal && norm(c.original_title) === norm(film.titleOriginal)) {
    score += 2;
    reasons.push("original_title exact match");
  }
  // Some entries carry the original title in `title` itself (a Korean film
  // whose display title already is its original title, so `titleOriginal`
  // is left empty rather than repeating it) — check that too, or a Korean
  // original gets no credit for matching its own TMDB original_title at all.
  if (!film.titleOriginal && film.title && norm(c.original_title) === norm(film.title)) {
    score += 2;
    reasons.push("display title exact-matches original_title (no separate titleOriginal on file)");
  }
  if (film.titleEn && (norm(c.title).includes(norm(film.titleEn)) || norm(film.titleEn).includes(norm(c.title)))) {
    score += 1;
    reasons.push("English title overlaps");
  }
  return { score, reasons };
}

async function discoverOne(film) {
  const queries = [film.titleOriginal, film.titleEn, film.title].filter((q, i, a) => q && a.indexOf(q) === i);
  const seen = new Map();
  const queryErrors = [];
  for (const q of queries) {
    const r = await tmdb("/search/movie", { query: q, include_adult: false });
    // One query failing (or matching nothing) does not end the search —
    // the others in the list are still tried.
    if (!r.ok) {
      queryErrors.push(`"${q}": HTTP ${r.status}`);
      continue;
    }
    for (const c of r.data.results || []) if (!seen.has(c.id)) seen.set(c.id, c);
    await sleep(120);
  }
  if (seen.size === 0 && queryErrors.length === queries.length) {
    return { ...film, status: "SEARCH_FAILED", detail: `every query failed: ${queryErrors.join("; ")}` };
  }
  const candidates = [...seen.values()].map((c) => ({ ...c, ...scoreCandidate(film, c) }));
  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    return { ...film, status: "NO_RESULTS", detail: "TMDB search returned nothing for any of the tried titles" };
  }

  const top = candidates[0];
  const runnerUp = candidates[1];
  const ambiguous = runnerUp && top.score - runnerUp.score <= 1 && top.score < 5;

  // Confirm against the full movie record, and pull poster images by language.
  const [detail, images] = await Promise.all([
    tmdb(`/movie/${top.id}`),
    tmdb(`/movie/${top.id}/images`, {
      include_image_language: [film.language, "en", "ko", null].filter((v, i, a) => a.indexOf(v) === i).join(","),
    }),
  ]);
  await sleep(120);

  if (!detail.ok || !images.ok) {
    return { ...film, status: "DETAIL_FAILED", tmdbId: top.id, detail: `HTTP ${detail.status}/${images.status}` };
  }

  const posterUrl = (p) => (p ? `https://image.tmdb.org/t/p/w500${p}` : null);
  const byLang = new Map();
  for (const p of images.data.posters || []) {
    const lang = p.iso_639_1 || "none";
    if (!byLang.has(lang) || p.vote_average > byLang.get(lang).vote_average) byLang.set(lang, p);
  }
  const wanted = [film.language, "en", "ko"].filter((v, i, a) => v && a.indexOf(v) === i);
  const posterCandidates = wanted
    .filter((lang) => byLang.has(lang))
    .map((lang) => {
      const p = byLang.get(lang);
      return {
        language: lang,
        role: lang === film.language ? "original-language theatrical" : lang === "ko" ? "Korean release" : "English",
        url: posterUrl(p.file_path),
        width: p.width,
        height: p.height,
        voteAverage: p.vote_average,
      };
    });

  return {
    ...film,
    status: ambiguous ? "AMBIGUOUS" : "MATCHED",
    tmdbId: top.id,
    confidence: top.score >= 5 ? "HIGH" : top.score >= 3 ? "MEDIUM" : "LOW",
    matchScore: top.score,
    matchReasons: top.reasons,
    matchedTitle: detail.data.title,
    matchedOriginalTitle: detail.data.original_title,
    matchedYear: detail.data.release_date?.slice(0, 4),
    matchedOriginalLanguage: detail.data.original_language,
    tmdbUrl: `https://www.themoviedb.org/movie/${top.id}`,
    posterCandidates,
    alternates: ambiguous
      ? candidates.slice(1, 3).map((c) => ({ id: c.id, title: c.title, original_title: c.original_title, year: c.release_date?.slice(0, 4), score: c.score }))
      : [],
    source: "TMDB",
    retrievedOn: new Date().toISOString().slice(0, 10),
  };
}

async function main() {
  const dir = path.join(ROOT, "content", "films");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx") && !f.startsWith("_")).sort();
  console.log(`TMDB discovery: ${files.length} films, key loaded (length ${KEY.length}, not shown).`);

  const results = [];
  for (const f of files) {
    const { data } = matter(fs.readFileSync(path.join(dir, f), "utf8"));
    const film = {
      slug: f.replace(".mdx", ""),
      title: data.title,
      titleOriginal: data.titleOriginal || "",
      titleEn: data.titleEn || "",
      director: data.director,
      year: data.year || null,
      language: data.language || null,
    };
    process.stderr.write(`  ${film.slug}… `);
    try {
      const r = await discoverOne(film);
      results.push(r);
      process.stderr.write(r.status + "\n");
    } catch (e) {
      results.push({ ...film, status: "ERROR", detail: String(e) });
      process.stderr.write("ERROR: " + e.message + "\n");
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
  const tally = results.reduce((acc, r) => ((acc[r.status] = (acc[r.status] || 0) + 1), acc), {});
  console.log("\nTally:", tally);
  console.log("Written:", OUT);
}

main();
