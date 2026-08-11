// Independent integrity check for data/commodities.json — the world table
// behind /commodities. Mirrors validate-domains.mjs: it re-asserts, on the
// committed files alone, the invariants the builder and lib/commodities.ts
// enforce at build time, so a hand-edit or a partial rebuild is caught by
// `npm run validate` without a network fetch or a Next build.
//
// The load-bearing checks:
//   * shares have the right denominator — listed producers never exceed the
//     published world total beyond rounding (the residual is "Rest of world");
//   * no drift — every producer-year tonnage equals the same nation-year value
//     in the resources domain, in both directions;
//   * no ISR row, ever (the atlas has no Israel entity; see scripts/lib/codes.mjs).
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { COMMODITIES } from "./lib/mcs.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "data/commodities.json");

if (!existsSync(path)) {
  console.log("no data/commodities.json — run scripts/build-commodities.mjs first.");
  process.exit(0);
}

let errors = 0;
const err = (m) => { console.log(`  ✗ ${m}`); errors++; };

const file = JSON.parse(readFileSync(path, "utf8"));
const resources = JSON.parse(readFileSync(join(root, "data/domains/resources.json"), "utf8"));
const countries = JSON.parse(readFileSync(join(root, "data/countries.json"), "utf8"));

// Each MCS figure is independently rounded: the parts may overshoot the world
// total by up to the total's printed precision (persisted per year by the
// builder as `rounding`) plus this allowance for the parts' own rounding.
const PARTS_ROUNDING = 0.005;

for (const k of ["updated", "source", "commodities"]) {
  if (file[k] == null) err(`missing top-level field: ${k}`);
}
if (file.source?.id !== "usgs-mcs") err(`source id is "${file.source?.id}", expected "usgs-mcs"`);

const wanted = new Set(COMMODITIES.map((c) => c.key));
const present = new Set((file.commodities ?? []).map((c) => c.key));
for (const k of wanted) if (!present.has(k)) err(`commodity ${k} missing`);
for (const k of present) if (!wanted.has(k)) err(`unexpected commodity ${k}`);

/** The resources-domain series for one nation+metric, as year → value. */
function dossierSeries(code, key) {
  const m = resources.data[code]?.metrics?.find((x) => x.key === key);
  return new Map((m?.series ?? []).map((p) => [p.year, p.value]));
}

for (const c of file.commodities ?? []) {
  const id = c.key;
  if (typeof c.detail !== "string" || !c.detail) err(`${id}: missing Statistics_detail`);
  if (!(c.years?.reported < c.years?.estimate)) err(`${id}: years must be reported < estimate`);
  for (const y of ["reported", "estimate"]) {
    if (typeof c.world?.[y] !== "number" || c.world[y] <= 0) err(`${id}: bad world total for ${y}`);
    if (typeof c.rounding?.[y] !== "number" || c.rounding[y] < 0) err(`${id}: missing rounding precision for ${y}`);
  }
  if (!Array.isArray(c.producers) || c.producers.length === 0) {
    err(`${id}: no producers`);
    continue;
  }

  let sumReported = 0;
  let sumEstimate = 0;
  const listed = new Set();
  for (const p of c.producers) {
    listed.add(p.code);
    if (p.code === "ISR") err(`${id}: ISR row present — the atlas has no Israel entity`);
    if (!countries[p.code]) err(`${id}: producer ${p.code} not in data/countries.json`);
    if (p.reported == null && p.estimate == null && !p.reportedWithheld && !p.estimateWithheld) {
      err(`${id}/${p.code}: neither a figure nor a withheld flag in either year`);
    }
    const dossier = dossierSeries(p.code, id);
    for (const [year, value] of [
      [c.years?.reported, p.reported],
      [c.years?.estimate, p.estimate],
    ]) {
      if (value == null) continue;
      if (value < 0) err(`${id}/${p.code} ${year}: negative tonnage`);
      if (dossier.get(year) !== value) {
        err(
          `${id}/${p.code} ${year}: ${value} here but ${dossier.get(year) ?? "nothing"} in the ` +
            `resources domain — the two files are from different builds`,
        );
      }
    }
    sumReported += p.reported ?? 0;
    sumEstimate += p.estimate ?? 0;
  }

  // The reverse drift check: a dossier producer missing here would silently
  // land inside "Rest of world", which is a wrong claim rather than a gap.
  for (const [code, entry] of Object.entries(resources.data)) {
    if ((entry.metrics ?? []).some((m) => m.key === id) && !listed.has(code)) {
      err(`${id}: ${code} is a producer in the resources domain but missing here`);
    }
  }

  for (const [sum, y] of [
    [sumReported, "reported"],
    [sumEstimate, "estimate"],
  ]) {
    const world = c.world?.[y];
    if (typeof world !== "number") continue;
    const slack = (c.rounding?.[y] ?? 0) + PARTS_ROUNDING * world;
    if (world - sum < -slack) {
      err(`${id} ${y}: listed producers sum to ${sum}, beyond the world total ${world} even after rounding`);
    }
    const rest = Math.max(0, world - sum);
    const other = c.otherCountries?.[y];
    if (other != null && other > rest + slack) {
      err(`${id} ${y}: "Other countries" (${other}) exceeds the rest-of-world residual (${rest})`);
    }
  }

  const withheld = c.producers.filter((p) => p.reportedWithheld || p.estimateWithheld).length;
  console.log(
    `✓ ${id}: ${c.producers.length} producers, world ${c.world?.estimate} t (${c.years?.estimate} est.)` +
      `${withheld ? `, ${withheld} withheld` : ""}`,
  );
}

console.log(`\n${errors} error(s) in data/commodities.json.`);
process.exit(errors ? 1 : 0);
