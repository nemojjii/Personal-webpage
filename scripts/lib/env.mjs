/**
 * Reads credentials from ~/academic-site/.env.local only — no other path,
 * no conversation history, no fallback. `.env.local` matches the `.env*`
 * pattern in .gitignore, so it is never committed; this loader does not
 * write the file, and nothing here ever prints a variable's value.
 *
 * KEY=value, one per line, optional quotes, optional comments and blank
 * lines. No dependency on `dotenv` — this is small enough not to need one.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const ENV_PATH = path.join(ROOT, ".env.local");

function parseEnvFile(text) {
  const out = {};
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/**
 * Loads one named credential from .env.local. Returns `{ ok: true, value }`
 * or `{ ok: false, reason }` — `reason` is safe to print (it never contains
 * the value itself, only what's wrong: file missing, variable missing, or
 * the value is empty/a placeholder).
 */
export function readCredential(name) {
  if (!fs.existsSync(ENV_PATH)) {
    return { ok: false, reason: `.env.local not found at ${ENV_PATH}` };
  }
  let data;
  try {
    data = parseEnvFile(fs.readFileSync(ENV_PATH, "utf8"));
  } catch (e) {
    return { ok: false, reason: `could not read .env.local: ${e.code || e.message}` };
  }
  const value = data[name];
  if (value === undefined) {
    return { ok: false, reason: `${name} is not set in .env.local` };
  }
  const trimmed = value.trim();
  const looksLikePlaceholder =
    !trimmed ||
    /^your[-_\s]/i.test(trimmed) ||
    /^(changeme|placeholder|todo|tbd)$/i.test(trimmed) ||
    /^x+$/i.test(trimmed) ||
    /^<.*>$/.test(trimmed);
  if (looksLikePlaceholder) {
    return { ok: false, reason: `${name} is set in .env.local but looks empty or still a placeholder` };
  }
  return { ok: true, value: trimmed };
}

/** Replaces a credential's value wherever it appears in a string, for safe logging. */
export function redact(text, ...secrets) {
  let out = text;
  for (const s of secrets) {
    if (s) out = out.split(s).join("***REDACTED***");
  }
  return out;
}
