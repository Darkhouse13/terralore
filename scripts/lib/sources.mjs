// ── Every source the corpus cites, as one flat list ────────────────────────
// The history corpus keeps its sources in 183 JSON files plus france.ts, which
// is TypeScript and so invisible to a readdir. Both the link auditor and the
// precision auditor need the same enumeration, so it lives here once.
//
// France is parsed structurally with loud assertions — the same discipline
// scripts/build-time-events.mjs uses. A refactor of that file fails these
// instruments instead of quietly dropping a nation from them.

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const dataDir = join(root, "lib/histories/data");

export const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

/**
 * France, parsed out of TypeScript into the same shape the JSON files hold —
 * enough of it for the instruments: code, status, sources, statehood.
 */
export function readFrance() {
  const src = readFileSync(join(root, "lib/histories/france.ts"), "utf8");

  const sources = [];
  // Each source literal: { id: "…", label: "…", publisher: "…", url: "…", kind: "…" }
  const block = src.match(/\n {2}sources: \[([\s\S]*?)\n {2}\],/);
  if (!block) fail("france.ts: sources array not found — file shape changed, update this parser");
  for (const m of block[1].matchAll(
    /\{ id: "([^"]+)", label: "((?:[^"\\]|\\.)*)", publisher: "((?:[^"\\]|\\.)*)", url: "([^"]+)", kind: "([^"]+)" \}/g,
  )) {
    sources.push({ id: m[1], label: m[2], publisher: m[3], url: m[4], kind: m[5] });
  }
  if (sources.length === 0) fail("france.ts: no source literals matched — file shape changed");

  const stBlock = src.match(/ {2}statehood: \{([\s\S]*?)\n {2}\},/);
  let statehood = null;
  if (stBlock) {
    const body = stBlock[1];
    const f = body.match(/formation: \{([\s\S]*?)\n {4}\}/);
    if (!f) fail("france.ts: statehood.formation not found — file shape changed");
    const pick = (key, text) => {
      const m = text.match(new RegExp(`${key}:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
      return m ? m[1] : undefined;
    };
    const year = f[1].match(/year: (-?\d+)/);
    if (!year) fail("france.ts: statehood.formation.year not found");
    const srcList = f[1].match(/sources: \[([^\]]*)\]/);
    statehood = {
      formation: {
        year: Number(year[1]),
        yearLabel: pick("yearLabel", f[1]),
        label: pick("label", f[1]),
        detail: pick("detail", f[1]),
        sources: srcList ? [...srcList[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]) : [],
      },
    };
    const ints = body.match(/interruptions: \[([\s\S]*?)\n {4}\]/);
    if (ints) {
      statehood.interruptions = [...ints[1].matchAll(/\{([\s\S]*?)\}/g)].map((m) => {
        const t = m[1];
        const s = t.match(/start: (-?\d+)/);
        const e = t.match(/end: (-?\d+)/);
        const sl = t.match(/sources: \[([^\]]*)\]/);
        return {
          start: s ? Number(s[1]) : NaN,
          end: e ? Number(e[1]) : NaN,
          label: pick("label", t),
          sources: sl ? [...sl[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : [],
        };
      });
    }
  }

  const founding = src.match(/founding: \{[\s\S]*?year: (-?\d+),/);
  if (!founding) fail("france.ts: founding year not found — file shape changed");

  return {
    code: "FRA",
    name: "France",
    status: "published",
    founding: { year: Number(founding[1]) },
    sources,
    statehood,
  };
}

/**
 * Every published history, JSON plus France, in file order.
 * @returns {{file:string, history:any}[]}
 */
export function readHistories() {
  const out = [];
  for (const file of readdirSync(dataDir).filter((f) => f.endsWith(".json")).sort()) {
    out.push({ file, history: JSON.parse(readFileSync(join(dataDir, file), "utf8")) });
  }
  out.push({ file: "france.ts", history: readFrance() });
  return out;
}

/**
 * Flat citation list: one row per (file, source). `statehood` marks a source
 * that a formation or interruption claim depends on — the auditor's priority
 * lane, since a dead URL there is a shading claim with no evidence behind it.
 */
export function readCitations() {
  const rows = [];
  for (const { file, history } of readHistories()) {
    const stIds = new Set();
    const st = history.statehood;
    if (st) {
      for (const id of st.formation?.sources ?? []) stIds.add(id);
      for (const iv of st.interruptions ?? []) for (const id of iv.sources ?? []) stIds.add(id);
    }
    for (const s of history.sources ?? []) {
      rows.push({
        file,
        code: history.code,
        id: s.id,
        label: s.label,
        publisher: s.publisher,
        kind: s.kind,
        url: s.url ?? null,
        statehood: stIds.has(s.id),
      });
    }
  }
  return rows;
}
