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

  for (const s of h.sources) if (!used.has(s.id)) warn(file, `unused source "${s.id}"`);

  const eventCount = h.eras.reduce((n, e) => n + e.events.length, 0);
  console.log(`✓ ${file}: ${h.code} — ${h.eras.length} eras, ${eventCount} events, ${h.sources.length} sources`);
}

console.log(`\n${errors} error(s), ${warnings} warning(s) across ${files.length} files.`);
process.exit(errors ? 1 : 0);
