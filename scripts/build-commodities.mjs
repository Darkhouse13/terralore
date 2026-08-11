// ── USGS commodities — the world table behind /commodities ──────────────────
//
// build-minerals.mjs answers "what does this nation dig?" and deliberately
// drops the MCS aggregate rows: "World total" and "Other countries" are not
// nations, so they have no place in a per-nation domain file. But they are
// exactly what "who supplies the world" needs — a producer's share is honest
// only when the denominator is the **published MCS world total**, not the sum
// of whichever producers happen to be listed. This builder keeps those rows.
//
// It writes data/commodities.json: per commodity, the world total for both
// years (the reported year and the USGS estimate), the published
// "Other countries" aggregate, and the full producer table — including
// producers whose figure the USGS withholds ("W"), because a withheld figure
// is a fact worth showing and is not the same fact as zero.
//
// Reconciliation, enforced here where every row is still in hand: for each
// commodity and year, the sum of all named producers (including any the atlas
// skips, e.g. Israel) plus "Other countries" must equal the published world
// total within rounding. If it does not, the table's meaning has changed and
// the build must stop rather than publish shares of the wrong denominator.
//
// Run: node scripts/build-commodities.mjs
//      (chained into `npm run build-domains` after build-minerals.mjs)

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COMMODITIES,
  NAME_TO_CODE,
  SCALE,
  USGS,
  loadMcsRows,
  worldProductionRows,
  worldTotalRows,
} from './lib/mcs.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const today = () => new Date().toISOString().slice(0, 10);

// MCS rounds the world total to few significant figures — zinc's is printed
// "13,000" thousand tonnes, a nearest-1,000 rounding, while its parts sum to
// 12,540 — so "within rounding" must be read off the printed precision of the
// total itself: half its last significant digit, plus a small allowance for the
// parts being independently rounded too. A breach beyond that means a schema
// change or a double-counted row, not rounding.
const PARTS_ROUNDING = 0.005; // the parts' own accumulated rounding, as a share of world

/** Half the last printed digit of a raw MCS figure ("13,000" → 500), scaled. */
function halfStep(raw, scale) {
  const digits = raw.replace(/,/g, '').trim();
  const dot = digits.indexOf('.');
  const step =
    dot >= 0
      ? 10 ** -(digits.length - dot - 1)
      : 10 ** (digits.length - digits.replace(/0+$/, '').length);
  return (step / 2) * scale;
}

console.log('USGS Mineral Commodity Summaries — world production table\n');

const rows = await loadMcsRows();

const countries = JSON.parse(readFileSync(join(root, 'data/countries.json'), 'utf8'));
const byName = {};
for (const [code, meta] of Object.entries(countries)) byName[meta.name] = code;

/** "1,234" → 1234·scale; "W" → withheld; "—" / anything else → nil (absent). */
function readValue(r, commodity) {
  const scale = SCALE[r.Unit];
  if (scale == null) throw new Error(`${commodity}: unknown unit "${r.Unit}"`);
  const raw = (r.Value ?? '').replace(/,/g, '').trim();
  if (/^\d+(\.\d+)?$/.test(raw)) return { value: Number(raw) * scale };
  if (raw.toUpperCase() === 'W') return { withheld: true };
  return {};
}

const out = [];

for (const c of COMMODITIES) {
  const rs = worldProductionRows(rows, c);

  // name → { year → { value? , withheld? } }
  const table = new Map();
  for (const r of rs) {
    const year = Number(r.Year);
    if (!Number.isFinite(year)) continue;
    if (!table.has(r.Country)) table.set(r.Country, new Map());
    table.get(r.Country).set(year, readValue(r, c.commodity));
  }

  // The world total lives under a "rounded" detail variant, so it is absent
  // from `table` (which holds the plain-detail rows) and looked up on its own.
  const world = new Map();
  for (const r of worldTotalRows(rows, c)) {
    const year = Number(r.Year);
    if (!Number.isFinite(year)) continue;
    const v = readValue(r, c.commodity);
    if (v.value != null) {
      // Half the last printed digit — a fact about the published figure,
      // persisted so lib/commodities.ts and the validator reconcile against
      // the same precision this builder does.
      v.rounding = halfStep(r.Value, SCALE[r.Unit]);
      v.tolerance = v.rounding + PARTS_ROUNDING * v.value;
    }
    world.set(year, v);
  }
  const years = [...world.keys()].filter((y) => world.get(y).value != null).sort((a, b) => a - b);
  if (years.length !== 2) {
    throw new Error(`${c.commodity}: expected a reported + an estimate world total, got years [${years}]`);
  }
  const [reportedYear, estimateYear] = years;

  const other = table.get('Other countries') ?? new Map();

  // ── Reconcile against the published world total, both years ──────────────
  for (const year of years) {
    let named = 0;
    let withheld = 0;
    for (const [name, byYear] of table) {
      if (name === 'World total' || name === 'Other countries') continue;
      const v = byYear.get(year);
      named += v?.value ?? 0;
      if (v?.withheld) withheld++;
    }
    const { value: total, tolerance } = world.get(year);
    const sum = named + (other.get(year)?.value ?? 0);
    // Withheld figures are inside the published total but cannot be inside the
    // sum, so with any "W" in the column the sum may only fall short, never over.
    const off = withheld ? sum - total : Math.abs(sum - total);
    if (off > tolerance) {
      throw new Error(
        `${c.commodity} ${year}: named producers + "Other countries" = ${sum} but the published ` +
          `world total is ${total} (off by ${Math.abs(sum - total)}, beyond its printed rounding of ±${tolerance})`,
      );
    }
    console.log(
      `  ${c.key.padEnd(16)} ${year}: reconciles to world total ` +
        `(off by ${((Math.abs(sum - total) / total) * 100).toFixed(2)}%, within its printed rounding` +
        `${withheld ? `; ${withheld} withheld figure(s) inside the total` : ''})`,
    );
  }

  // ── The producer table the atlas can publish ──────────────────────────────
  const producers = [];
  for (const [name, byYear] of table) {
    if (name in NAME_TO_CODE && NAME_TO_CODE[name] === null) continue; // aggregates + Israel
    const code = NAME_TO_CODE[name] ?? byName[name];
    if (!code) {
      // A page of shares must not silently fold a renamed nation into "Rest of
      // world" — that is a wrong claim, not a gap. Stop instead.
      throw new Error(`${c.commodity}: MCS country "${name}" matches no atlas nation — add it to NAME_TO_CODE`);
    }
    const rep = byYear.get(reportedYear) ?? {};
    const est = byYear.get(estimateYear) ?? {};
    if (rep.value == null && est.value == null && !rep.withheld && !est.withheld) continue; // nil both years
    const p = { code };
    if (rep.value != null) p.reported = rep.value;
    else if (rep.withheld) p.reportedWithheld = true;
    if (est.value != null) p.estimate = est.value;
    else if (est.withheld) p.estimateWithheld = true;
    producers.push(p);
  }
  producers.sort((a, b) => (b.estimate ?? b.reported ?? -1) - (a.estimate ?? a.reported ?? -1));

  const entry = {
    key: c.key,
    commodity: c.commodity,
    detail: c.detail,
    years: { reported: reportedYear, estimate: estimateYear },
    world: { reported: world.get(reportedYear).value, estimate: world.get(estimateYear).value },
    rounding: { reported: world.get(reportedYear).rounding, estimate: world.get(estimateYear).rounding },
    producers,
  };
  const oc = { reported: other.get(reportedYear)?.value, estimate: other.get(estimateYear)?.value };
  if (oc.reported != null || oc.estimate != null) entry.otherCountries = oc;
  out.push(entry);

  const withheld = producers.filter((p) => p.reportedWithheld || p.estimateWithheld).length;
  console.log(
    `  ${c.key.padEnd(16)} ${String(producers.length).padStart(3)} producers listed` +
      `${withheld ? ` (${withheld} with a withheld year)` : ''}\n`,
  );
}

const path = join(root, 'data/commodities.json');
writeFileSync(
  path,
  JSON.stringify({ updated: today(), source: { ...USGS, accessed: today() }, commodities: out }, null, 1),
);
console.log(`✓ data/commodities.json: ${out.length} commodities`);
