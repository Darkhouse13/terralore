// Independent integrity check for authored history data.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "lib/histories/data");

const CATEGORIES = new Set([
  "founding", "independence", "war", "politics", "religion",
  "culture", "economy", "colonization", "migration", "disaster",
]);

/** The corpus's present. Eras run to 2026; nothing may be dated past it. */
const CURRENT_YEAR = 2026;

let errors = 0;
let warnings = 0;
const err = (f, m) => { console.log(`  ✗ [${f}] ${m}`); errors++; };
const warn = (f, m) => { console.log(`  ⚠ [${f}] ${m}`); warnings++; };

const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
for (const file of files) {
  const h = JSON.parse(readFileSync(join(dir, file), "utf8"));
  const ids = new Set(h.sources.map((s) => s.id));
  const used = new Set();

  for (const k of ["code", "name", "tagline", "summary", "founding", "quickFacts", "eras", "sources", "status", "updated"]) {
    if (h[k] == null) err(file, `missing top-level field: ${k}`);
  }
  if (typeof h.founding?.year !== "number") err(file, "founding.year not a number");
  if (!Array.isArray(h.eras) || h.eras.length < 4) err(file, `expected >=4 eras, got ${h.eras?.length}`);

  const checkRefs = (arr, where) => {
    for (const id of arr ?? []) {
      if (!ids.has(id)) err(file, `${where} references unknown source id "${id}"`);
      else used.add(id);
    }
  };

  for (const era of h.eras) {
    for (const k of ["id", "title", "period", "startYear", "endYear", "standfirst", "body", "events", "sources"]) {
      if (era[k] == null) err(file, `era "${era.id}" missing ${k}`);
    }
    if (typeof era.startYear !== "number" || typeof era.endYear !== "number") err(file, `era "${era.id}" non-numeric years`);
    if (!Array.isArray(era.body) || era.body.length === 0) err(file, `era "${era.id}" empty body`);
    checkRefs(era.sources, `era "${era.id}"`);
    for (const e of era.events) {
      if (typeof e.year !== "number") err(file, `event "${e.title}" year not numeric`);
      if (!CATEGORIES.has(e.category)) err(file, `event "${e.title}" bad category "${e.category}"`);
      if (!e.sources?.length) warn(file, `event "${e.title}" has no sources`);
      checkRefs(e.sources, `event "${e.title}"`);
    }
    for (const fig of era.figures ?? []) checkRefs(fig.sources, `figure "${fig.name}"`);
  }
  for (const fig of h.figures ?? []) checkRefs(fig.sources, `top figure "${fig.name}"`);

  // ── statehood: the Time Globe's existence shading (docs/statehood-plan.md) ─
  // `founding` says when the current sovereign state dates from; `statehood`
  // says how far back this nation's statehood runs and when it was formally
  // interrupted. The shading draws a real claim on the map, so the block is
  // held to the same citation rule as every event: no source, no claim.
  // Coverage is complete (184/184 as of the statehood pass), so a missing block
  // is now an error rather than a warning: a new history without one would ship
  // a nation the Time Globe shades from `founding` alone, silently reopening
  // the criterion inconsistency this whole pass existed to close.
  if (h.statehood == null) {
    if (h.status === "published") err(file, "no `statehood` block — see docs/statehood-plan.md");
  } else {
    const st = h.statehood;
    const f = st.formation;
    if (f == null) err(file, "statehood missing `formation`");
    else {
      if (typeof f.year !== "number" || !Number.isFinite(f.year)) err(file, "statehood.formation.year not a number");
      if (!f.yearLabel?.trim()) err(file, "statehood.formation.yearLabel empty");
      if (!f.label?.trim()) err(file, "statehood.formation.label empty");
      if (!f.sources?.length) err(file, "statehood.formation has no sources");
      checkRefs(f.sources, "statehood.formation");
      if (typeof f.year === "number" && f.year > CURRENT_YEAR) err(file, `statehood.formation.year ${f.year} is in the future`);
    }

    const ints = st.interruptions ?? [];
    if (!Array.isArray(ints)) err(file, "statehood.interruptions is not an array");
    let prevEnd = -Infinity;
    ints.forEach((iv, n) => {
      const at = `statehood.interruptions[${n}]`;
      if (typeof iv.start !== "number" || typeof iv.end !== "number") {
        err(file, `${at} start/end not numeric`);
        return;
      }
      if (!(iv.start < iv.end)) err(file, `${at} start ${iv.start} is not before end ${iv.end}`);
      if (!iv.label?.trim()) err(file, `${at} label empty`);
      if (!iv.sources?.length) err(file, `${at} has no sources`);
      checkRefs(iv.sources, at);
      if (iv.end > CURRENT_YEAR) err(file, `${at} end ${iv.end} is in the future`);
      if (typeof f?.year === "number" && iv.start < f.year) {
        err(file, `${at} starts ${iv.start}, before formation ${f.year}`);
      }
      if (iv.start < prevEnd) err(file, `${at} overlaps the previous interruption (starts ${iv.start}, previous ended ${prevEnd})`);
      prevEnd = iv.end;
    });
  }

  for (const s of h.sources) if (!used.has(s.id)) warn(file, `unused source "${s.id}"`);

  const eventCount = h.eras.reduce((n, e) => n + e.events.length, 0);
  console.log(`✓ ${file}: ${h.code} — ${h.eras.length} eras, ${eventCount} events, ${h.sources.length} sources`);
}

console.log(`\n${errors} error(s), ${warnings} warning(s) across ${files.length} files.`);
process.exit(errors ? 1 : 0);
