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
// carry the bulk tonnage (iron ore, bauxite, phosphate).
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

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const today = () => new Date().toISOString().slice(0, 10);

// The ScienceBase item for the current MCS data release. Bump this once a year
// when the next edition lands; the file URL inside it carries a content hash and
// is resolved from the item rather than hardcoded, so a re-upload cannot break
// the build silently.
const SB_ITEM = '696a75d5d4be0228872d3bf8'; // Mineral Commodity Summaries 2026
const FILE_RE = /Commodities_Data\.csv$/i;

const USGS = {
  id: 'usgs-mcs',
  label: 'Mineral Commodity Summaries 2026',
  publisher: 'U.S. Geological Survey',
  url: 'https://www.usgs.gov/centers/national-minerals-information-center',
  license: 'Public domain (U.S. Government work)',
  accessed: today(),
};

/**
 * The ten commodities, each pinned to the exact `Statistics_detail` row it wants.
 * The pin matters: copper's table carries mine AND refinery production, and iron
 * ore's carries usable ore AND iron content. Matching loosely would silently add
 * the two together.
 */
const COMMODITIES = [
  { key: 'prodCopper',     label: 'Copper (mined)',    commodity: 'Copper',         detail: 'Mine production' },
  { key: 'prodIronOre',    label: 'Iron ore',          commodity: 'Iron Ore',       detail: 'Mine production: Usable ore' },
  { key: 'prodGold',       label: 'Gold (mined)',      commodity: 'Gold',           detail: 'Mine production' },
  { key: 'prodLithium',    label: 'Lithium (mined)',   commodity: 'Lithium',        detail: 'Mine production' },
  { key: 'prodCobalt',     label: 'Cobalt (mined)',    commodity: 'Cobalt',         detail: 'Mine production' },
  { key: 'prodNickel',     label: 'Nickel (mined)',    commodity: 'Nickel',         detail: 'Mine production' },
  { key: 'prodRareEarths', label: 'Rare earths',       commodity: 'Rare Earths',    detail: 'Mine production' },
  { key: 'prodBauxite',    label: 'Bauxite',           commodity: 'Bauxite',        detail: 'Bauxite, mine production' },
  { key: 'prodZinc',       label: 'Zinc (mined)',      commodity: 'Zinc',           detail: 'Mine production' },
  { key: 'prodPhosphate',  label: 'Phosphate rock',    commodity: 'Phosphate Rock', detail: 'Mine production' },
];

// Everything is published in tonnes, in three denominations. Bauxite's "dry
// tons" is a moisture convention, not a different mass unit.
const SCALE = {
  'metric tons': 1,
  'thousand metric tons': 1e3,
  'thousand metric dry tons': 1e3,
  'million metric tons': 1e6,
};

// MCS country names that are not the atlas's names. Aggregates and Israel are
// mapped to null — deliberately absent rather than accidentally missing.
const NAME_TO_CODE = {
  Burma: 'MMR',
  'Congo (Kinshasa)': 'COD',
  'Korea, Republic of': 'KOR',
  Turkey: 'TUR',
  Israel: null, // no ISR entity in this atlas — see the header note
  'Other countries': null,
  'World total': null,
};

// ── A minimal RFC 4180 reader (no dependencies; the file quotes commas) ──────
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift();
  return rows
    .filter((r) => r.length === header.length)
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

async function fetchText(url, decode = false) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(180000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!decode) return await res.text();
      // The release is Windows-1252, not UTF-8: em dashes arrive as 0x97.
      return new TextDecoder('windows-1252').decode(await res.arrayBuffer());
    } catch (e) {
      if (attempt === 5) throw new Error(`${url} → ${e.message}`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

console.log('USGS Mineral Commodity Summaries — physical production\n');

const item = JSON.parse(await fetchText(`https://www.sciencebase.gov/catalog/item/${SB_ITEM}?format=json`));
const file = (item.files ?? []).find((f) => FILE_RE.test(f.name ?? ''));
if (!file) throw new Error(`no Commodities_Data.csv in ScienceBase item ${SB_ITEM}`);
console.log(`  source file: ${file.name} (${(file.size / 1e6).toFixed(1)} MB)`);

const rows = parseCsv(await fetchText(file.url, true));
console.log(`  ${rows.length} rows parsed\n`);

const countries = JSON.parse(readFileSync(join(root, 'data/countries.json'), 'utf8'));
const byName = {};
for (const [code, meta] of Object.entries(countries)) byName[meta.name] = code;

const unresolved = new Set();
const skipped = new Set();
/** code → metric[] to merge */
const additions = {};

for (const c of COMMODITIES) {
  // World production rows only: the "Salient Statistics—United States" section
  // is a different table with different definitions.
  const rs = rows.filter(
    (r) =>
      r.Commodity === c.commodity &&
      r.Section.startsWith('World') &&
      r.Statistics === 'Production' &&
      r.Statistics_detail === c.detail,
  );
  if (!rs.length) throw new Error(`${c.commodity}/${c.detail}: no rows — has the MCS schema changed?`);

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
  data.sources[USGS.id] = USGS;
  data.updated = today();
  writeFileSync(path, JSON.stringify(data));
}

console.log(
  `\n✓ resources: ${added} mineral metrics across ${Object.keys(additions).length} nations` +
    `${newCountries ? ` (${newCountries} of them had no resources entry before)` : ''}`,
);
