#!/usr/bin/env node
// ── The precision auditor ──────────────────────────────────────────────────
// The rule this instrument enforces (docs/statehood-deepening-plan.md §2):
//
//   A date more precise than its cited sources support is a fabrication of
//   precision, EVEN WHEN THE DATE IS CORRECT.
//
// Guinea is the case that produced the rule. Its statehood block says
// "2 October 1958" and cites a source that states 1 November 1958 — the date
// the United States recognised the new republic. The label is true about the
// world and false about the citation, and the two are not the same kind of
// true. The corpus's whole claim on a reader's trust is that every assertion
// traces to something someone actually read; an unsupported day is a small
// hole in exactly that.
//
// This script cannot decide whether a source supports a date — that is reading,
// and reading is content work. What it can do is make the worklist exhaustive
// and track it to zero. It enumerates every statehood claim that asserts a
// precision finer than a year (a day, a month, or a direct quotation), pairs
// it with the sources that claim cites, and diffs the list against the ledger
// at docs/statehood-precision-ledger.md.
//
// A ledger row records the claim text it verified. Edit the claim and the row
// goes stale and reopens — so the ledger cannot drift out of agreement with the
// corpus the way a hand-kept table would.
//
// Usage:
//   node scripts/audit-precision.mjs             the full worklist
//   node scripts/audit-precision.mjs --pending   only what is unverified
//   node scripts/audit-precision.mjs --json      machine-readable
//   node scripts/audit-precision.mjs --ledger    scaffold ledger rows to stdout

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { readHistories, root } from "./lib/sources.mjs";

const argv = new Set(process.argv.slice(2));
const LEDGER = join(root, "docs/statehood-precision-ledger.md");

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const M = MONTHS.join("|");

// "2 October 1958", "October 2, 1958", "October 1958" — and the BCE/CE forms
// the corpus uses for deep anchors.
const DAY_FIRST = new RegExp(`\\b(\\d{1,2})\\s+(${M})\\s+(\\d{3,4})\\b`, "g");
const MONTH_FIRST = new RegExp(`\\b(${M})\\s+(\\d{1,2}),\\s*(\\d{3,4})\\b`, "g");
const MONTH_ONLY = new RegExp(`\\b(${M})\\s+(\\d{3,4})\\b`, "g");
/** “…” or "…" of four words or more — a quotation is a precision claim too. */
const QUOTED = /[“"]([^”"]{16,240})[”"]/g;

/** Every distinct precision claim inside one statehood block. */
function claimsFor(code, st) {
  const out = [];
  const add = (path, kind, text, sources) => out.push({ code, path, kind, text, sources });

  const blockSources = new Set(st.formation?.sources ?? []);
  for (const iv of st.interruptions ?? []) for (const s of iv.sources ?? []) blockSources.add(s);
  const all = [...blockSources];

  const scan = (path, text, sources) => {
    if (!text) return;
    const seen = new Set();
    for (const m of text.matchAll(DAY_FIRST)) {
      seen.add(m.index);
      add(path, "day", m[0], sources);
    }
    for (const m of text.matchAll(MONTH_FIRST)) {
      seen.add(m.index);
      add(path, "day", m[0], sources);
    }
    for (const m of text.matchAll(MONTH_ONLY)) {
      // Skip a month already consumed by a day-precision match.
      if ([...seen].some((i) => m.index >= i - 3 && m.index <= i + 4)) continue;
      add(path, "month", m[0], sources);
    }
    for (const m of text.matchAll(QUOTED)) add(path, "quote", m[1], sources);
  };

  const f = st.formation;
  if (f) {
    scan("formation.yearLabel", f.yearLabel, f.sources ?? []);
    scan("formation.label", f.label, f.sources ?? []);
    // `detail` may lean on any source the block cites, per §2.
    scan("formation.detail", f.detail, all);
  }
  (st.interruptions ?? []).forEach((iv, i) => {
    scan(`interruptions[${i}].label`, iv.label, iv.sources ?? []);
    scan(`interruptions[${i}].detail`, iv.detail, all);
  });
  return out;
}

// ── gather ─────────────────────────────────────────────────────────────────
const rows = [];
const yearMismatches = [];
const sourceUrl = new Map(); // `${code}:${id}` → url

for (const { file, history: h } of readHistories()) {
  if (!h.statehood) continue;
  for (const s of h.sources ?? []) sourceUrl.set(`${h.code}:${s.id}`, s.url ?? "(print)");

  const st = h.statehood;
  const f = st.formation;
  // The mechanical check: does `yearLabel` name the same year as `year`?
  // Validator territory from §5.3 on; reported here too so one run shows both.
  if (f && typeof f.year === "number" && f.yearLabel) {
    const years = [...f.yearLabel.matchAll(/\d{1,4}/g)].map((m) => Number(m[0]));
    const want = Math.abs(f.year);
    if (years.length && !years.includes(want)) {
      yearMismatches.push({ code: h.code, file, year: f.year, yearLabel: f.yearLabel });
    }
  }

  for (const c of claimsFor(h.code, st)) rows.push({ ...c, file });
}

const keyOf = (r) => `${r.code}:${r.path}`;
// A claim id must be unique; two dates in one detail sentence share a path.
const counts = new Map();
for (const r of rows) {
  const base = keyOf(r);
  const n = (counts.get(base) ?? 0) + 1;
  counts.set(base, n);
  r.id = n === 1 ? base : `${base}#${n}`;
}

// ── ledger ─────────────────────────────────────────────────────────────────
/** id → { text, by, note } */
function readLedger() {
  const map = new Map();
  if (!existsSync(LEDGER)) return map;
  for (const line of readFileSync(LEDGER, "utf8").split("\n")) {
    const m = line.match(/^\|\s*`([^`]+)`\s*\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|/);
    if (!m) continue;
    map.set(m[1].trim(), {
      kind: m[2].trim(),
      text: m[3].trim().replace(/^`|`$/g, ""),
      by: m[4].trim(),
      note: m[5].trim(),
    });
  }
  return map;
}

const ledger = readLedger();

for (const r of rows) {
  const entry = ledger.get(r.id);
  if (!entry) {
    r.state = "unverified";
  } else if (entry.text !== r.text) {
    r.state = "stale";
    r.was = entry.text;
  } else if (!entry.by || entry.by === "—") {
    r.state = "unverified";
  } else {
    r.state = "verified";
    r.by = entry.by;
    r.note = entry.note;
  }
}

const orphans = [...ledger.keys()].filter((k) => !rows.some((r) => r.id === k));

// ── output ─────────────────────────────────────────────────────────────────
const pending = rows.filter((r) => r.state !== "verified");
const shown = argv.has("--pending") ? pending : rows;

if (argv.has("--json")) {
  console.log(JSON.stringify({ rows, orphans, yearMismatches }, null, 1));
  process.exit(0);
}

if (argv.has("--ledger")) {
  console.log("| Claim | Kind | Text | Verified by | Note |");
  console.log("|---|---|---|---|---|");
  for (const r of rows) {
    const e = ledger.get(r.id);
    const by = r.state === "verified" ? e.by : "—";
    const note = r.state === "verified" ? e.note : "";
    console.log(`| \`${r.id}\` | ${r.kind} | ${r.text} | ${by} | ${note} |`);
  }
  process.exit(0);
}

const pad = (s, n) => String(s).padEnd(n);
const RULE = "─".repeat(110);

console.log(`\n${pad("CLAIM", 40)}${pad("KIND", 7)}${pad("TEXT", 30)}SOURCES`);
console.log(RULE);
for (const r of shown) {
  const srcs = r.sources.map((id) => id).join(", ") || "«none»";
  const mark = r.state === "verified" ? "✓" : r.state === "stale" ? "↻" : " ";
  console.log(
    `${mark} ${pad(r.id.length > 37 ? `${r.id.slice(0, 36)}…` : r.id, 38)}${pad(r.kind, 7)}${pad(
      r.text.length > 28 ? `${r.text.slice(0, 27)}…` : r.text,
      30,
    )}${srcs}`,
  );
  if (r.state === "stale") console.log(`    ↻ ledger verified "${r.was}" — the claim now reads "${r.text}"`);
}
console.log(RULE);

const byKind = (k) => rows.filter((r) => r.kind === k).length;
console.log(
  `${rows.length} precision claim(s) across ${new Set(rows.map((r) => r.code)).size} statehood blocks ` +
    `(${byKind("day")} day · ${byKind("month")} month · ${byKind("quote")} quotation)`,
);
console.log(
  `${rows.length - pending.length} verified · ${pending.filter((r) => r.state === "unverified").length} unverified · ` +
    `${pending.filter((r) => r.state === "stale").length} stale`,
);

if (yearMismatches.length) {
  console.log(`\n✗ ${yearMismatches.length} yearLabel(s) do not name their own \`year\`:`);
  for (const m of yearMismatches) console.log(`    ${m.code}  year ${m.year}  yearLabel "${m.yearLabel}"`);
}
if (orphans.length) {
  console.log(`\n⚠ ${orphans.length} ledger row(s) name a claim the corpus no longer carries:`);
  for (const o of orphans) console.log(`    ${o}`);
}
console.log();

process.exit(argv.has("--pending") && pending.length ? 1 : 0);
