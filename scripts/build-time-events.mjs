#!/usr/bin/env node
// ── UNCHAINED 2026-08-14 — kept as reference, run by nothing ────────────────
// The globe this fed does not exist (STRATA: no globe, no canvas, no WebGL),
// so its output was read by no surface. `public/data/time-events.json` is
// deleted and this script is no longer chained into `npm run build-data`;
// running it re-creates a 385 KB file nobody fetches. It survives for the
// France-parsing pattern that scripts/lib/sources.mjs and
// scripts/audit-statehood.mjs cite by name, and because branch
// `sovereignty-bar-wip` patches it. See DECISIONS.md D15. Do not re-chain it
// without a consumer.
//
// ── The Time Globe's corpus: every event, placed in time and space ──────────
// Emitted public/data/time-events.json — the file the landing globe lazy-fetched
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
// Run: node scripts/build-time-events.mjs   (unchained — see the note above)

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

// code → { f: formation year, i?: [[start, end], …] }
// `f` is the sourced statehood anchor — the earliest named polity the nation
// traces itself to — falling back to `founding.year` for any history that does
// not yet carry a statehood block. `i` are formalised losses of external
// sovereignty (protectorate, annexation, partition), which is what lets the
// globe render a nation as present-but-not-sovereign rather than as unborn.
const statehood = {};

/** Compact a history's statehood claim, or fall back to its founding year. */
const statehoodFor = (h, file) => {
  const st = h.statehood;
  if (!st) {
    return typeof h.founding?.year === "number" ? { f: h.founding.year } : null;
  }
  if (typeof st.formation?.year !== "number") fail(`${file}: statehood.formation.year is not a number`);
  const out = { f: st.formation.year };
  const ints = st.interruptions ?? [];
  if (ints.length) {
    out.i = ints.map((iv) => {
      if (typeof iv.start !== "number" || typeof iv.end !== "number") {
        fail(`${file}: statehood interruption with non-numeric start/end`);
      }
      return [iv.start, iv.end];
    });
  }
  return out;
};

for (const file of readdirSync(dataDir).filter((f) => f.endsWith(".json"))) {
  const h = JSON.parse(readFileSync(join(dataDir, file), "utf8"));
  if (h.status !== "published") continue;
  const s = statehoodFor(h, file);
  if (s) statehood[h.code] = s;
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
  const f = src.match(/founding: \{[\s\S]*?year: (-?\d+),/);
  if (!f) fail("france.ts: founding year not found — file shape changed, update this parser");
  // The statehood block, parsed from the same file with the same discipline:
  // if it is absent the fallback is founding.year, but if it is *present and
  // unparseable* that is a rotted parser, not a missing claim — say so loudly.
  const stIdx = src.indexOf("\n  statehood: {");
  if (stIdx === -1) {
    statehood.FRA = { f: Number(f[1]) };
  } else {
    const block = src.slice(stIdx, src.indexOf("\n  },", stIdx));
    const fy = block.match(/formation: \{[\s\S]*?year: (-?\d+),/);
    if (!fy) fail("france.ts: statehood present but formation.year not found — update this parser");
    const out = { f: Number(fy[1]) };
    const spans = [...block.matchAll(/start: (-?\d+),\s*\n\s*end: (-?\d+),/g)].map((m) => [
      Number(m[1]),
      Number(m[2]),
    ]);
    if (/interruptions: \[/.test(block) && spans.length === 0) {
      fail("france.ts: statehood.interruptions present but no start/end pairs parsed — update this parser");
    }
    if (spans.length) out.i = spans;
    statehood.FRA = out;
  }
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
    return { slug: p.slug, label: p.label, start: p.start, end: p.end, count: p.events.length, dominant: dom };
  }),
  // events[i] belongs to periods[i]: [code, year, category, title, eraId]
  events: periodOrder.map((p) => p.events.map((e) => [e.code, e.year, e.cat, e.title, e.eraId])),
  // The corpus's own sourced statehood claim per nation — what lets the globe
  // shade the world by which states existed yet, and which of them were under
  // foreign rule at the time. Authored in each history's `statehood` block
  // (falling back to `founding`); nations without a history make no claim and
  // get none, which is why the rail carries a caption rather than a legend.
  statehood,
};

mkdirSync(join(root, "public/data"), { recursive: true });
const json = JSON.stringify(out);
writeFileSync(join(root, "public/data/time-events.json"), json);

const total = events.length;
console.log(
  `time-events.json: ${total.toLocaleString("en")} events across ${periodOrder.length} periods, ${(json.length / 1024).toFixed(0)} KB raw`,
);
