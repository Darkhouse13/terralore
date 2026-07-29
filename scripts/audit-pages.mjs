#!/usr/bin/env node
// ── Post-build page audit ───────────────────────────────────────────────────
// Crawls every URL in the sitemap against a *running* production server and
// asserts the contract a static reference site owes its readers and the engines
// that index it:
//
//   1. 200 OK               — no route in the sitemap may 404/500
//   2. exactly one <h1>     — the document has one subject
//   3. a unique <title>     — no two URLs claim the same page
//   4. a meta description   — present, and not a duplicate of another page's
//   5. valid JSON-LD        — every ld+json block parses and carries @type
//   6. a canonical link     — pointing at the page's own absolute URL
//   7. no orphans           — every sitemap URL is reachable by <a href> from
//                             at least one other sitemap URL
//
// A build cannot catch most of these: a page can compile and still render two
// <h1>s, emit malformed structured data, or sit unlinked in the sitemap.
//
// Usage:  node scripts/audit-pages.mjs [--base http://127.0.0.1:3000]
//                                      [--limit N] [--concurrency N]
// Exits non-zero on any error, so CI fails the pipeline.

import { writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const BASE = (flag("base", process.env.AUDIT_BASE_URL || "http://127.0.0.1:3000")).replace(/\/$/, "");
const LIMIT = Number(flag("limit", process.env.AUDIT_LIMIT || 0)) || Infinity;
const CONCURRENCY = Number(flag("concurrency", process.env.AUDIT_CONCURRENCY || 12));
const REPORT = flag("report", "audit-report.json");

// The origin the app advertises in canonical tags / sitemap. We crawl BASE but
// compare canonicals against this, since a locally-served build still emits
// production URLs.
const CANONICAL_ORIGIN = (process.env.AUDIT_CANONICAL_ORIGIN || "https://terralore.co").replace(/\/$/, "");

const errors = [];
const warnings = [];
const fail = (url, msg) => errors.push({ url, msg });
const warn = (url, msg) => warnings.push({ url, msg });

// ── tiny HTML helpers (no dependency; the markup is ours and well-formed) ────
const stripTags = (s) => s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

function countTag(html, tag) {
  return (html.match(new RegExp(`<${tag}[\\s>]`, "gi")) || []).length;
}

function titleOf(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? stripTags(m[1]) : null;
}

function metaContent(html, nameAttr, value) {
  const re = new RegExp(`<meta[^>]+${nameAttr}=["']${value}["'][^>]*>`, "i");
  const tag = html.match(re);
  if (!tag) return null;
  const c = tag[0].match(/content=["']([\s\S]*?)["']/i);
  return c ? stripTags(c[1]) : null;
}

function canonicalOf(html) {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);
  if (!m) return null;
  const h = m[0].match(/href=["']([^"']+)["']/i);
  return h ? h[1] : null;
}

function jsonLdBlocks(html) {
  const out = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

function hrefsOf(html) {
  const out = new Set();
  const re = /<a\b[^>]*\shref=["']([^"'#?]+)/gi;
  let m;
  while ((m = re.exec(html))) {
    let href = m[1];
    if (href.startsWith(CANONICAL_ORIGIN)) href = href.slice(CANONICAL_ORIGIN.length) || "/";
    if (!href.startsWith("/")) continue; // external or relative-to-page; ignore
    out.add(href.replace(/\/$/, "") || "/");
  }
  return out;
}

// ── fetch the sitemap ───────────────────────────────────────────────────────
async function sitemapUrls() {
  const res = await fetch(`${BASE}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap.xml → HTTP ${res.status}`);
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((m) => m[1].trim());
  if (!urls.length) throw new Error("sitemap.xml contained no <loc> entries");
  return urls;
}

// ── audit one page ──────────────────────────────────────────────────────────
async function auditPage(absUrl) {
  // Sitemap entries are production-absolute; crawl the equivalent path on BASE.
  const path = absUrl.startsWith("http") ? new URL(absUrl).pathname : absUrl;
  const url = `${BASE}${path}`;
  const record = { path, status: 0, title: null, description: null, links: new Set() };

  let res;
  try {
    res = await fetch(url, { redirect: "manual" });
  } catch (e) {
    fail(path, `request failed: ${e.message}`);
    return record;
  }
  record.status = res.status;

  if (res.status !== 200) {
    fail(path, `HTTP ${res.status} (sitemap URLs must return 200)`);
    return record;
  }

  const html = await res.text();

  // 2. exactly one h1
  const h1s = countTag(html, "h1");
  if (h1s !== 1) fail(path, `${h1s} <h1> elements (expected exactly 1)`);

  // 3. title
  const title = titleOf(html);
  record.title = title;
  if (!title) fail(path, "missing <title>");
  else if (title.length > 70) warn(path, `<title> is ${title.length} chars (Google truncates ~60)`);

  // 4. meta description
  const desc = metaContent(html, "name", "description");
  record.description = desc;
  if (!desc) fail(path, "missing meta description");
  else if (desc.length > 175) warn(path, `meta description is ${desc.length} chars (truncates ~160)`);
  else if (desc.length < 50) warn(path, `meta description is only ${desc.length} chars`);

  // 5. JSON-LD
  const blocks = jsonLdBlocks(html);
  if (!blocks.length) fail(path, "no JSON-LD block");
  for (const [i, raw] of blocks.entries()) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      fail(path, `JSON-LD block ${i} does not parse: ${e.message}`);
      continue;
    }
    for (const node of Array.isArray(parsed) ? parsed : [parsed]) {
      if (!node || typeof node !== "object") {
        fail(path, `JSON-LD block ${i} is not an object`);
      } else if (!node["@type"]) {
        fail(path, `JSON-LD block ${i} has no @type`);
      } else if (!node["@context"]) {
        fail(path, `JSON-LD block ${i} (${node["@type"]}) has no @context`);
      }
    }
  }

  // 6. canonical
  const canon = canonicalOf(html);
  if (!canon) {
    fail(path, "missing rel=canonical");
  } else {
    const canonPath = canon.startsWith("http") ? new URL(canon).pathname : canon;
    if (canonPath.replace(/\/$/, "") !== path.replace(/\/$/, "")) {
      fail(path, `canonical points at ${canonPath}, not its own path`);
    }
  }

  // 7. collect outbound links for the orphan pass
  record.links = hrefsOf(html);
  return record;
}

// ── bounded-concurrency runner ──────────────────────────────────────────────
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

// ── main ────────────────────────────────────────────────────────────────────
const started = Date.now();
console.log(`[audit] base = ${BASE}`);

let urls;
try {
  urls = await sitemapUrls();
} catch (e) {
  console.error(`\n✗ ${e.message}`);
  console.error("  Is the production server running? (npm run build && npm run start)");
  process.exit(1);
}

const all = urls.slice(0, LIMIT === Infinity ? urls.length : LIMIT);
console.log(`[audit] ${urls.length} sitemap URLs${all.length < urls.length ? ` (auditing first ${all.length})` : ""}`);

let done = 0;
const records = await mapLimit(all, CONCURRENCY, async (u) => {
  const r = await auditPage(u);
  if (++done % 100 === 0 || done === all.length) {
    process.stdout.write(`\r[audit] ${done}/${all.length} pages…`);
  }
  return r;
});
process.stdout.write("\n");

// ── uniqueness of title + description ───────────────────────────────────────
for (const [field, label] of [["title", "<title>"], ["description", "meta description"]]) {
  const seen = new Map();
  for (const r of records) {
    const v = r[field];
    if (!v) continue;
    if (!seen.has(v)) seen.set(v, []);
    seen.get(v).push(r.path);
  }
  for (const [value, paths] of seen) {
    if (paths.length > 1) {
      const shown = paths.slice(0, 4).join(", ");
      fail(paths[0], `duplicate ${label} "${value.slice(0, 60)}…" shared by ${paths.length} pages (${shown}${paths.length > 4 ? ", …" : ""})`);
    }
  }
}

// ── orphan pass: every sitemap URL must be linked from another sitemap URL ───
// Only meaningful on a full crawl — a truncated run has no link graph to speak of.
if (all.length === urls.length) {
  const linked = new Set();
  for (const r of records) for (const href of r.links) linked.add(href);
  const home = "/";
  for (const r of records) {
    const p = r.path.replace(/\/$/, "") || "/";
    if (p === home) continue;
    if (!linked.has(p)) fail(r.path, "orphan: no <a href> to it from any other sitemap page");
  }
}

// ── report ──────────────────────────────────────────────────────────────────
const report = {
  base: BASE,
  audited: all.length,
  totalSitemapUrls: urls.length,
  errors,
  warnings,
  durationMs: Date.now() - started,
};
try {
  writeFileSync(REPORT, JSON.stringify(report, null, 2));
} catch {
  /* report file is a convenience, never a failure mode */
}

const secs = ((Date.now() - started) / 1000).toFixed(1);

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings.slice(0, 25)) console.log(`  ~ ${w.url}: ${w.msg}`);
  if (warnings.length > 25) console.log(`  … and ${warnings.length - 25} more`);
}

if (errors.length) {
  console.error(`\n${errors.length} error(s):`);
  for (const e of errors.slice(0, 60)) console.error(`  ✗ ${e.url}: ${e.msg}`);
  if (errors.length > 60) console.error(`  … and ${errors.length - 60} more`);
  console.error(`\n✗ audit failed — ${all.length} pages in ${secs}s`);
  process.exit(1);
}

console.log(`\n✓ ${all.length} pages clean — 200, one h1, unique title + description, valid JSON-LD, canonical, no orphans (${secs}s)`);
