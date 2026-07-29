#!/usr/bin/env node
// ── The statehood worklist ─────────────────────────────────────────────────
// The progress instrument for docs/statehood-plan.md. For every published
// history it prints the two dates that the plan exists to reconcile:
//
//   founding.year   "the current sovereign state dates from" — used verbatim
//                   by the dossier hero, the atlas index and the country card.
//   first era       where the nation's own chronicle actually opens.
//
// The gap between them is the distortion the Time Globe's existence shading
// currently renders: 151 of 183 nations carry founding.year >= 1800, and for
// 149 of those the chronicle opens 300+ years earlier. Sorted by that gap, this
// table is the order in which the corpus is most obviously wrong.
//
// `statehood` is the sourced block that answers the other question — when the
// polity this nation traces itself to was formed, and when (if ever) its
// sovereignty was formally interrupted. This script reports coverage of it.
//
// Usage:
//   node scripts/audit-statehood.mjs              full table
//   node scripts/audit-statehood.mjs --missing    only rows still lacking it
//   node scripts/audit-statehood.mjs --codes      bare codes, one per line
//   node scripts/audit-statehood.mjs --json       machine-readable

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "lib/histories/data");

const args = new Set(process.argv.slice(2));
const onlyMissing = args.has("--missing");
const asCodes = args.has("--codes");
const asJson = args.has("--json");

const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

/** @type {{code:string,name:string,file:string,founding:number,firstEra:number,statehood:null|{formation:number,interruptions:number}}[]} */
const rows = [];

const summarise = (h, file) => {
  if (h.status !== "published") return null;
  if (typeof h.founding?.year !== "number") fail(`${file}: founding.year is not a number`);
  const firstEra = Math.min(...(h.eras ?? []).map((e) => e.startYear));
  if (!Number.isFinite(firstEra)) fail(`${file}: no era startYear to read`);
  const s = h.statehood
    ? {
        formation: h.statehood.formation?.year ?? NaN,
        interruptions: (h.statehood.interruptions ?? []).length,
      }
    : null;
  return { code: h.code, name: h.name, file, founding: h.founding.year, firstEra, statehood: s };
};

for (const file of readdirSync(dataDir).filter((f) => f.endsWith(".json")).sort()) {
  const h = JSON.parse(readFileSync(join(dataDir, file), "utf8"));
  const row = summarise(h, file);
  if (row) rows.push(row);
}

// France is the one history authored in TypeScript; parse it structurally with
// loud assertions, exactly as scripts/build-time-events.mjs does, so a refactor
// of that file fails this audit instead of quietly dropping a nation from it.
{
  const src = readFileSync(join(root, "lib/histories/france.ts"), "utf8");
  const f = src.match(/founding: \{[\s\S]*?year: (-?\d+),/);
  if (!f) fail("france.ts: founding year not found — file shape changed, update this parser");
  const eras = [...src.matchAll(/^      startYear: (-?\d+),$/gm)].map((m) => Number(m[1]));
  if (eras.length === 0) fail("france.ts: no era startYear matched — file shape changed");
  const st = src.match(/statehood: \{[\s\S]*?formation: \{[\s\S]*?year: (-?\d+),/);
  const interruptions = src.match(/statehood: \{[\s\S]*?interruptions: \[([\s\S]*?)\n {2}\],/);
  rows.push({
    code: "FRA",
    name: "France",
    file: "france.ts",
    founding: Number(f[1]),
    firstEra: Math.min(...eras),
    statehood: st
      ? {
          formation: Number(st[1]),
          interruptions: interruptions ? (interruptions[1].match(/start:/g) ?? []).length : 0,
        }
      : null,
  });
}

const gap = (r) => r.founding - r.firstEra;
rows.sort((a, b) => gap(b) - gap(a) || a.code.localeCompare(b.code));

const shown = onlyMissing ? rows.filter((r) => !r.statehood) : rows;

if (asJson) {
  console.log(JSON.stringify(shown, null, 2));
  process.exit(0);
}
if (asCodes) {
  for (const r of shown) console.log(r.code);
  process.exit(0);
}

const yr = (n) => (n < 0 ? `${-n} BCE` : `${n}`);
const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);

const RULE = "─".repeat(96);
console.log(
  `\n${pad("CODE", 5)}${pad("NATION", 25)}${padL("FOUNDING", 12)}${padL("1ST ERA", 14)}${padL("GAP", 12)}   STATEHOOD`,
);
console.log(RULE);
for (const r of shown) {
  const s = r.statehood
    ? `✓ ${yr(r.statehood.formation)}${r.statehood.interruptions ? ` · ${r.statehood.interruptions} interruption(s)` : ""}`
    : "—";
  console.log(
    pad(r.code, 5) +
      pad(r.name.length > 23 ? `${r.name.slice(0, 22)}…` : r.name, 25) +
      padL(yr(r.founding), 12) +
      padL(yr(r.firstEra), 14) +
      padL(gap(r).toLocaleString("en"), 12) +
      "   " +
      s,
  );
}

const withBlock = rows.filter((r) => r.statehood);
const deep = rows.filter((r) => r.founding < 1800);
const distorted = rows.filter((r) => r.founding >= 1800 && gap(r) >= 300);
console.log(RULE);
console.log(
  `${withBlock.length}/${rows.length} published histories carry \`statehood\`  ` +
    `(${rows.length - withBlock.length} to go)`,
);
console.log(
  `  ${deep.length} found before 1800 · ${distorted.length} carry a 300+ year gap between founding and chronicle`,
);
const interrupted = withBlock.filter((r) => r.statehood.interruptions > 0);
if (withBlock.length) {
  const total = withBlock.reduce((n, r) => n + r.statehood.interruptions, 0);
  console.log(`  ${interrupted.length} nation(s) with ${total} sourced interruption(s) of sovereignty`);
}
console.log();
