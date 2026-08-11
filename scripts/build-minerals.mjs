// ── USGS minerals — physical production, merged into the resources domain ────
//
// The resources domain was a first cut: World Bank rent shares, which say what
// fraction of an economy comes out of the ground but never what comes out of it.
// A reader looking at the Democratic Republic of the Congo learned that mineral
// rents are a large share of GDP, and had to already know the word "cobalt" to
// know what was being dug.
//
// This adds the tonnage, from the USGS **Mineral Commodity Summaries** — the
// annual world reference, public domain, published as machine-readable tables in
// a ScienceBase data release. Ten strategic commodities: the ones whose world
// map is a story on its own (cobalt, rare earths, lithium) and the ones that
// carry the bulk tonnage (iron ore, bauxite, phosphate). Everything shared with
// the /commodities builder — the ScienceBase item id, the row pins, the name
// reconciliation — lives in scripts/lib/mcs.mjs so the two cannot read
// different editions.
//
// It runs AFTER build-resources.mjs and MERGES, exactly as build-nonwb.mjs does:
// the World Bank rents stay, the tonnages join them, and no value is overwritten.
//
// Three rules the data itself forces:
//
//   * **Absence is not zero.** Most nations produce none of a given commodity.
//     They get no metric at all, not a zero — and where MCS prints an em dash
//     (nil) or "W" (withheld to protect company-proprietary data), that is
//     likewise not a number and is not published as one.
//   * **The latest year is an estimate.** MCS reports the last full year and an
//     estimate for the year just ended. Both are kept, so the metric window
//     shows the reported figure beside the estimate rather than only the
//     estimate; the metric definitions say which is which.
//   * **Israel is skipped and logged.** It produces phosphate rock, and this
//     atlas has no ISR entity — the Natural Earth ISR polygon is presented as
//     Palestine (scripts/lib/codes.mjs REMAP). Filing Israeli production under
//     Palestine would be a factual error, so nothing is filed at all.
//
// Run: node scripts/build-minerals.mjs   (after build-resources.mjs)

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
} from './lib/mcs.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const today = () => new Date().toISOString().slice(0, 10);

console.log('USGS Mineral Commodity Summaries — physical production\n');

const rows = await loadMcsRows();

const countries = JSON.parse(readFileSync(join(root, 'data/countries.json'), 'utf8'));
const byName = {};
for (const [code, meta] of Object.entries(countries)) byName[meta.name] = code;

const unresolved = new Set();
const skipped = new Set();
/** code → metric[] to merge */
const additions = {};

for (const c of COMMODITIES) {
  const rs = worldProductionRows(rows, c);

  // country → { year → tonnes }
  const byCountry = new Map();
  for (const r of rs) {
    if (r.Country in NAME_TO_CODE && NAME_TO_CODE[r.Country] === null) {
      skipped.add(r.Country);
      continue;
    }
    const code = NAME_TO_CODE[r.Country] ?? byName[r.Country];
    if (!code) { unresolved.add(r.Country); continue; }

    const scale = SCALE[r.Unit];
    if (scale == null) throw new Error(`${c.commodity}: unknown unit "${r.Unit}"`);

    // Nil (em dash), withheld ("W"), and anything else non-numeric are absences,
    // not zeros. Values carry thousands separators.
    const raw = (r.Value ?? '').replace(/,/g, '').trim();
    if (!/^\d+(\.\d+)?$/.test(raw)) continue;
    const year = Number(r.Year);
    if (!Number.isFinite(year)) continue;

    if (!byCountry.has(code)) byCountry.set(code, new Map());
    byCountry.get(code).set(year, Number(raw) * scale);
  }

  for (const [code, years] of byCountry) {
    const series = [...years.entries()]
      .map(([year, value]) => ({ year, value }))
      .sort((a, b) => a.year - b.year);
    const latest = series[series.length - 1];
    (additions[code] ??= []).push({
      key: c.key,
      label: c.label,
      value: latest.value,
      unit: 'tonnes',
      year: latest.year,
      series,
      sourceId: USGS.id,
    });
  }
  console.log(`  ${c.key.padEnd(16)} ${String(byCountry.size).padStart(3)} producing nations`);
}

if (unresolved.size) {
  // Loud, not silent: an MCS rename must not quietly delete a nation's tonnage.
  console.log(`\n  ⚠ unmatched MCS country names: ${[...unresolved].join(', ')}`);
}
console.log(`\n  aggregates and non-entities skipped: ${[...skipped].join(', ')}`);

// ── Merge into resources.json ───────────────────────────────────────────────
const path = join(root, 'data/domains/resources.json');
const data = JSON.parse(readFileSync(path, 'utf8'));

let added = 0;
let newCountries = 0;
for (const [code, metrics] of Object.entries(additions)) {
  const entry = data.data[code];
  if (!entry) {
    data.data[code] = { metrics: [...metrics] };
    newCountries++;
    added += metrics.length;
    continue;
  }
  const have = new Set(entry.metrics.map((m) => m.key));
  const fresh = metrics.filter((m) => !have.has(m.key));
  entry.metrics.push(...fresh);
  added += fresh.length;
}

if (added) {
  data.sources[USGS.id] = { ...USGS, accessed: today() };
  data.updated = today();
  writeFileSync(path, JSON.stringify(data));
}

console.log(
  `\n✓ resources: ${added} mineral metrics across ${Object.keys(additions).length} nations` +
    `${newCountries ? ` (${newCountries} of them had no resources entry before)` : ''}`,
);
