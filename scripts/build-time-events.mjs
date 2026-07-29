#!/usr/bin/env node
// ── The Time Globe's corpus: every event, placed in time and space ──────────
// Emits public/data/time-events.json — the file the landing globe lazy-fetches
// the first time a reader touches the time rail. Nothing here is new data:
// it is the same 4,471 verified events the chronicles carry, reshaped for the
// sphere (period buckets + nation codes; the client already holds every
// nation's centroid and every category's pigment, so neither is duplicated).
//
// Two invariants this script enforces loudly rather than silently:
//
//  1. Period bucketing MUST match lib/chronology.ts exactly — the rail links
//     each period to /timeline/<slug>, and a drifted slug is a dead link on
//     the most visible surface of the site. The constants and functions below
//     are clones; if chronology.ts changes its floors, change these.
//  2. France lives in lib/histories/france.ts (TypeScript, not JSON), which a
//     .mjs build script cannot import. It is parsed structurally, and every
//     assumption is asserted — a refactor of that file fails this build
//     instead of quietly dropping a nation from the globe.
//
// Run: node scripts/build-time-events.mjs   (chained into `npm run build-data`)

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// ── period bucketing — cloned from lib/chronology.ts ────────────────────────
const MILLENNIUM_FLOOR = -1000;
const DEEP_TIME_FLOOR = -10000;
const DECADE_FLOOR = 1800;

const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

function periodFor(year) {
  if (year < DEEP_TIME_FLOOR) {
    return { slug: "deep-prehistory", label: "Deep prehistory", start: -Number.MAX_SAFE_INTEGER, end: DEEP_TIME_FLOOR - 1 };
  }
  if (year < MILLENNIUM_FLOOR) {
    const idx = Math.floor((-year - 1) / 1000) + 1;
    return { slug: `${ordinal(idx)}-millennium-bce`, label: `The ${ordinal(idx)} millennium BCE`, start: -(idx * 1000) + 1, end: -((idx - 1) * 1000) };
  }
  if (year < 0) {
    const idx = Math.floor((-year - 1) / 100) + 1;
    return { slug: `${ordinal(idx)}-century-bce`, label: `The ${ordinal(idx)} century BCE`, start: -(idx * 100) + 1, end: -((idx - 1) * 100) };
  }
  if (year >= DECADE_FLOOR) {
    const start = Math.floor(year / 10) * 10;
    return { slug: `${start}s`, label: `The ${start}s`, start, end: start + 9 };
  }
  const idx = Math.floor(year / 100) + 1;
  return { slug: `${ordinal(idx)}-century`, label: `The ${ordinal(idx)} century`, start: (idx - 1) * 100, end: idx * 100 - 1 };
}

// ── gather events: 183 JSON histories ───────────────────────────────────────
const CATEGORIES = new Set([
  "founding", "independence", "war", "politics", "religion",
  "culture", "economy", "colonization", "migration", "disaster",
]);

const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

const dataDir = join(root, "lib/histories/data");
const events = []; // { year, code, cat, title, eraId }

for (const file of readdirSync(dataDir).filter((f) => f.endsWith(".json"))) {
  const h = JSON.parse(readFileSync(join(dataDir, file), "utf8"));
  if (h.status !== "published") continue;
  for (const era of h.eras ?? []) {
    for (const ev of era.events ?? []) {
      if (!CATEGORIES.has(ev.category)) fail(`${file}: unknown category "${ev.category}"`);
      events.push({ year: ev.year, code: h.code, cat: ev.category, title: ev.title, eraId: era.id });
    }
  }
}

// ── France: structural parse of the one TypeScript history ──────────────────
{
  const src = readFileSync(join(root, "lib/histories/france.ts"), "utf8");
  // Era blocks begin at their id field; each block runs to the next era's id.
  const eraStarts = [...src.matchAll(/^      id: "([a-z0-9-]+)",$/gm)];
  if (eraStarts.length === 0) fail("france.ts: no era ids matched — file shape changed, update this parser");
  let fraCount = 0;
  eraStarts.forEach((m, i) => {
    const eraId = m[1];
    const from = m.index;
    const to = i + 1 < eraStarts.length ? eraStarts[i + 1].index : src.length;
    const block = src.slice(from, to);
    // Events inside an era: year / title / category triplets.
    const evRe = /year: (-?\d+),[\s\S]*?title: "((?:[^"\\]|\\.)*)",[\s\S]*?category: "([a-z]+)"/g;
    let e;
    while ((e = evRe.exec(block))) {
      const cat = e[3];
      if (!CATEGORIES.has(cat)) fail(`france.ts/${eraId}: unknown category "${cat}"`);
      events.push({ year: Number(e[1]), code: "FRA", cat, title: e[2].replace(/\\"/g, '"'), eraId });
      fraCount++;
    }
  });
  // The chronicle masthead states 19 sourced events; if france.ts grows or the
  // regex rots, this trips rather than silently shipping a hollow France.
  if (fraCount < 15 || fraCount > 40) fail(`france.ts: parsed ${fraCount} events — outside sanity range, parser likely broken`);
}

// Every code must exist in the atlas (an unknown code is corruption — fail),
// but a nation without a centroid is a display limitation, not an error: its
// events simply have nowhere to bloom on the sphere. Skip them AUDIBLY — a
// silent skip is how a nation vanishes from a feature without anyone deciding
// it should.
const countries = JSON.parse(readFileSync(join(root, "data/countries.json"), "utf8"));
const noCentroid = new Map();
for (let i = events.length - 1; i >= 0; i--) {
  const c = countries[events[i].code];
  if (!c) fail(`event "${events[i].title}" references unknown code ${events[i].code}`);
  if (!c.latlng) {
    noCentroid.set(events[i].code, (noCentroid.get(events[i].code) ?? 0) + 1);
    events.splice(i, 1);
  }
}
for (const [code, n] of noCentroid) {
  console.log(`  ⚠ ${code}: ${n} event(s) skipped — no centroid in countries.json, nowhere to pulse`);
}

// ── bucket into periods, oldest first ───────────────────────────────────────
events.sort((a, b) => a.year - b.year);
const periodOrder = [];
const bySlug = new Map();
for (const ev of events) {
  const p = periodFor(ev.year);
  let bucket = bySlug.get(p.slug);
  if (!bucket) {
    bucket = { ...p, events: [] };
    bySlug.set(p.slug, bucket);
    periodOrder.push(bucket);
  }
  bucket.events.push(ev);
}

// ── emit ────────────────────────────────────────────────────────────────────
// Compact tuple encoding: the client resolves centroids from countries.json
// (already loaded for the globe) and pigments from CATEGORY_META (already in
// the bundle) — this file carries only what nothing else does.
const out = {
  periods: periodOrder.map((p) => {
    const counts = new Map();
    for (const e of p.events) counts.set(e.cat, (counts.get(e.cat) ?? 0) + 1);
    let dom = null, domN = 0;
    for (const [cat, n] of counts) if (n > domN) { domN = n; dom = cat; }
    return { slug: p.slug, label: p.label, count: p.events.length, dominant: dom };
  }),
  // events[i] belongs to periods[i]: [code, year, category, title, eraId]
  events: periodOrder.map((p) => p.events.map((e) => [e.code, e.year, e.cat, e.title, e.eraId])),
};

mkdirSync(join(root, "public/data"), { recursive: true });
const json = JSON.stringify(out);
writeFileSync(join(root, "public/data/time-events.json"), json);

const total = events.length;
console.log(
  `time-events.json: ${total.toLocaleString("en")} events across ${periodOrder.length} periods, ${(json.length / 1024).toFixed(0)} KB raw`,
);
