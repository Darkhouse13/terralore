// Independent integrity check for authored history data.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFrance } from "./lib/sources.mjs";

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
const infos = [];
const err = (f, m) => { console.log(`  ✗ [${f}] ${m}`); errors++; };
const warn = (f, m) => { console.log(`  ⚠ [${f}] ${m}`); warnings++; };
/** Not a defect — a divergence worth keeping visible rather than silent. */
const info = (f, m) => { infos.push(`  · [${f}] ${m}`); };

// ── the statehood editorial floors (docs/statehood-deepening-plan.md §3) ────
//
// Two rules, both about where a claim that shades the globe is allowed to
// rest. Neither is a purge of Wikipedia: the corpus cites it deliberately and
// the D-series decisions accept it. The rule is narrower — no *formation*
// claim rests on Wikipedia alone, and no formation before 1800 rests on a
// single publisher, because a deep anchor is where one wrong page does the
// most damage and is least likely to be caught by a reader who knows better.
//
// Each floor ships as a **warning** in the commit that introduces it and flips
// to an **error** in the commit that pays its debt — the mechanism the
// statehood pass used for its coverage check. A floor that went straight to
// error would have made the instrument commit red on arrival, which teaches
// everyone to run the validator with their eyes closed. A floor that stayed a
// warning forever would be decoration. The flip is one constant, and the
// batch that flips it is named beside it.
const TWO_SOURCE_FLOOR_YEAR = 1800;
const TWO_SOURCE_FLOOR_IS_ERROR = true; // paid: the source-tier uplift
const YEAR_LABEL_IS_ERROR = true; // paid: the precision sweep
const WIKIPEDIA_ONLY_IS_ERROR = true; // paid: the source-tier uplift
const NON_SOVEREIGN_REQUIRED = false; // → true when the four territories are flagged (batch 5)

/** A floor that is a warning today and an error once its debt is paid. */
const gated = (isError) => (f, m) => (isError ? err(f, m) : warn(f, m));

/**
 * REMAINS — formations the source-tier floors could not be raised on, each
 * with what was tried. This is the SKIPPED discipline of the statehood pass
 * applied to sourcing: a floor with a silent exception is not a floor, and a
 * floor nobody can meet is a floor set wrong. Seven rows, against 85
 * formations that started below a floor.
 *
 * The common shape: a named precursor polity that mainstream reference works
 * discuss without dating the way this corpus does. New World Encyclopedia has
 * Madagascar's Merina but starts them in the 1790s, not with Andriamanelo;
 * Country Studies has Burundi without the phrase "Kingdom of Burundi". A
 * second publisher that does not actually support the claim is worse than an
 * honest gap, because it *looks* like corroboration.
 *
 * A row leaves this table the moment someone finds a second publisher. Do not
 * add a row to silence a warning — add it only after a real search, and write
 * down what the search covered.
 */
const REMAINS = {
  BFA: "Mossi oral tradition dates the Ouagadougou dynasty anywhere from the 11th to the 15th century (D12); NWE's Mossi and Burkina Faso entries and World History Encyclopedia's Mossi Kingdoms describe the kingdoms without naming Oubri or a date",
  BDI: "Ntare I's foundation c. 1680 is carried by Wikipedia; NWE's Burundi entry and the LOC Country Study cover the monarchy without the founding date, and the searchable alternatives are wiki mirrors",
  GRL: "the 2009 Self-Government Act is a Danish statute; NWE's Greenland entry stops at Home Rule in 1979 and the Naalakkersuisut and Statsministeriet pages did not answer a fetch",
  MDG: "NWE's Madagascar entry begins the Merina ascendancy in the 1790s rather than with Andriamanelo, so it corroborates the polity but not the anchor",
  RWA: "neither NWE's Rwanda entry nor the LOC Country Study names the Nyiginya dynasty",
  UZB: "NWE's Uzbekistan and Bukhara entries and WHE's Bukhara cover the city, not the 1501 Shaybanid khanate",
  VNM: "Âu Lạc is absent from NWE's Vietnam entry, WHE's Ancient Vietnam and the LOC Country Study under that name",
};

/**
 * Entities that are NOT sovereign states — dependencies and autonomous
 * territories whose statehood block records the birth of their own
 * institutions rather than statehood itself. They render dimmed from
 * formation onward instead of limestone.
 *
 * This is an allowlist rather than a free-text flag on purpose: adding a fifth
 * territory means consciously editing this file, which is where the boundary
 * between *functioning statehood* and *administered territory* is written down
 * (DECISIONS.md D13). De-facto states whose recognition is contested — Taiwan,
 * Kosovo, Palestine, Northern Cyprus, Somaliland — are functioning states and
 * do NOT belong here.
 */
const NON_SOVEREIGN = new Set(["NCL", "GRL", "FLK", "PRI"]);

const normPublisher = (p) =>
  (p ?? "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");

const hostOf = (u) => {
  try { return new URL(u).host.toLowerCase(); } catch { return ""; }
};

const isWikipedia = (s) =>
  normPublisher(s?.publisher).includes("wikipedia") || /(^|\.)wikipedia\.org$/.test(hostOf(s?.url));

// ── statehood: the Time Globe's existence shading (docs/statehood-plan.md) ───
// `founding` says when the current sovereign state dates from; `statehood`
// says how far back this nation's statehood runs and when it was formally
// interrupted. The shading draws a real claim on the map, so the block is held
// to the same citation rule as every event: no source, no claim. Coverage is
// complete (184/184 as of the statehood pass), so a missing block is an error
// rather than a warning: a new history without one would ship a nation the
// Time Globe shades from `founding` alone, silently reopening the criterion
// inconsistency that whole pass existed to close.
function checkStatehood(file, h, checkRefs) {
  if (h.statehood == null) {
    if (h.status === "published") err(file, "no `statehood` block — see docs/statehood-plan.md");
    return;
  }
  const st = h.statehood;
  const byId = new Map((h.sources ?? []).map((s) => [s.id, s]));

  if ("sovereign" in st) {
    if (st.sovereign !== false) {
      err(file, "statehood.sovereign may only be `false` — omit it for sovereign states");
    }
    if (!NON_SOVEREIGN.has(h.code)) {
      err(
        file,
        `statehood.sovereign is set on ${h.code}, which is not in the validator's non-sovereign allowlist ` +
          `(${[...NON_SOVEREIGN].join(", ")}). Adding a territory is a deliberate edit to this file — see DECISIONS.md D13.`,
      );
    }
  } else if (NON_SOVEREIGN.has(h.code)) {
    gated(NON_SOVEREIGN_REQUIRED)(
      file,
      `${h.code} is allowlisted as non-sovereign but its statehood block does not set \`sovereign: false\``,
    );
  }

  const f = st.formation;
  if (f == null) {
    err(file, "statehood missing `formation`");
  } else {
    if (typeof f.year !== "number" || !Number.isFinite(f.year)) err(file, "statehood.formation.year not a number");
    if (!f.yearLabel?.trim()) err(file, "statehood.formation.yearLabel empty");
    if (!f.label?.trim()) err(file, "statehood.formation.label empty");
    if (!f.sources?.length) err(file, "statehood.formation has no sources");
    checkRefs(f.sources, "statehood.formation");
    if (typeof f.year === "number" && f.year > CURRENT_YEAR) err(file, `statehood.formation.year ${f.year} is in the future`);

    // The display label and the shading year must be the same claim. "c. 3100
    // BCE", "788 CE" and "660 BCE (traditional)" all satisfy this; a label that
    // names no year, or a different one, means the globe and the page disagree.
    if (typeof f.year === "number" && f.yearLabel) {
      const named = [...String(f.yearLabel).matchAll(/\d{1,4}/g)].map((m) => Number(m[0]));
      if (!named.includes(Math.abs(f.year))) {
        gated(YEAR_LABEL_IS_ERROR)(
          file,
          `statehood.formation.yearLabel "${f.yearLabel}" does not name its own year (${f.year})`,
        );
      }
    }

    // ── the two editorial floors ──
    const cited = (f.sources ?? []).map((id) => byId.get(id)).filter(Boolean);
    const publishers = new Set(cited.map((s) => normPublisher(s.publisher)).filter(Boolean));
    const remains = REMAINS[h.code];
    if (typeof f.year === "number" && f.year < TWO_SOURCE_FLOOR_YEAR && publishers.size < 2) {
      gated(TWO_SOURCE_FLOOR_IS_ERROR && !remains)(
        file,
        `statehood.formation is dated ${f.year} (before ${TWO_SOURCE_FLOOR_YEAR}) but cites ${publishers.size} publisher(s) — ` +
          (remains ? `REMAINS: ${remains}` : "deep anchors need two independent publishers"),
      );
    }
    if (cited.length && cited.every(isWikipedia)) {
      gated(WIKIPEDIA_ONLY_IS_ERROR && !remains)(
        file,
        "statehood.formation rests on Wikipedia alone — " +
          (remains ? `REMAINS: ${remains}` : "add a second publisher (gov, encyclopedia, museum, academic)"),
      );
    }
    if (remains && publishers.size >= 2 && !cited.every(isWikipedia)) {
      warn(file, `${h.code} is listed in REMAINS but now meets both source-tier floors — delete its row`);
    }
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

  // §3.2 of the plan asserts that an interruption's end is *usually* the
  // existing `founding.year` — the restoration is the thing `founding` records.
  // Where it is not, that is legitimate (Egypt, Vietnam, Iran, Armenia,
  // Georgia and the pre-1800 restorations all end long before the modern
  // state), but it should be visible rather than silent, because the other way
  // it can happen is a typo in a year nobody reads twice.
  const last = ints[ints.length - 1];
  if (last && typeof h.founding?.year === "number" && last.end !== h.founding.year) {
    info(file, `last interruption ends ${last.end}; founding.year is ${h.founding.year}`);
  }
}

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

  checkStatehood(file, h, checkRefs);

  for (const s of h.sources) if (!used.has(s.id)) warn(file, `unused source "${s.id}"`);

  const eventCount = h.eras.reduce((n, e) => n + e.events.length, 0);
  console.log(`✓ ${file}: ${h.code} — ${h.eras.length} eras, ${eventCount} events, ${h.sources.length} sources`);
}

// France is authored in TypeScript, so a readdir of lib/histories/data cannot
// see it — which for four missions meant the one history everything else
// treats as the reference case was the one history this validator never read.
// Its statehood block is held to exactly the same floors as the other 183.
{
  const fr = readFrance();
  const ids = new Set(fr.sources.map((s) => s.id));
  const checkRefs = (arr, where) => {
    for (const id of arr ?? []) if (!ids.has(id)) err("france.ts", `${where} references unknown source id "${id}"`);
  };
  checkStatehood("france.ts", fr, checkRefs);
  console.log(`✓ france.ts: ${fr.code} — statehood block, ${fr.sources.length} sources`);
}

if (infos.length) {
  console.log(
    "\nRestorations that do not land on `founding.year` " +
      "(legitimate wherever the modern state postdates the restoration — kept visible, not silenced):",
  );
  for (const line of infos) console.log(line);
}

console.log(`\n${errors} error(s), ${warnings} warning(s), ${infos.length} info line(s) across ${files.length + 1} files.`);
process.exit(errors ? 1 : 0);
