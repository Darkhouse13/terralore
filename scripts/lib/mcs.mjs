// Shared access to the USGS **Mineral Commodity Summaries** data release.
//
// Two builders read the same MCS table: build-minerals.mjs (per-nation tonnage,
// merged into the resources domain) and build-commodities.mjs (world totals and
// the full producer table behind /commodities). They must be looking at the
// same edition of the same file, or the dossier and the commodity pages drift
// apart — so the ScienceBase item id, the commodity row pins, the unit table
// and the country-name reconciliation all live here, once. The annual chore of
// bumping to the next MCS edition is a one-line edit to SB_ITEM below.

// The ScienceBase item for the current MCS data release. Bump this once a year
// when the next edition lands; the file URL inside it carries a content hash and
// is resolved from the item rather than hardcoded, so a re-upload cannot break
// the build silently.
export const SB_ITEM = '696a75d5d4be0228872d3bf8'; // Mineral Commodity Summaries 2026

const FILE_RE = /Commodities_Data\.csv$/i;

export const USGS = {
  id: 'usgs-mcs',
  label: 'Mineral Commodity Summaries 2026',
  publisher: 'U.S. Geological Survey',
  url: 'https://www.usgs.gov/centers/national-minerals-information-center',
  license: 'Public domain (U.S. Government work)',
};

/**
 * The ten commodities, each pinned to the exact `Statistics_detail` row it wants.
 * The pin matters: copper's table carries mine AND refinery production, and iron
 * ore's carries usable ore AND iron content. Matching loosely would silently add
 * the two together.
 */
export const COMMODITIES = [
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
export const SCALE = {
  'metric tons': 1,
  'thousand metric tons': 1e3,
  'thousand metric dry tons': 1e3,
  'million metric tons': 1e6,
};

// MCS country names that are not the atlas's names. Aggregates and Israel are
// mapped to null — deliberately absent rather than accidentally missing.
// (Israel produces phosphate rock, and this atlas has no ISR entity — the
// Natural Earth ISR polygon is presented as Palestine; see scripts/lib/codes.mjs
// REMAP. Filing Israeli production under Palestine would be a factual error, so
// nothing is filed at all and the tonnage stays inside the world total.)
export const NAME_TO_CODE = {
  Burma: 'MMR',
  'Congo (Kinshasa)': 'COD',
  'Korea, Republic of': 'KOR',
  Turkey: 'TUR',
  Israel: null,
  'Other countries': null,
  'World total': null,
};

/**
 * Select one commodity's world-production rows: the "Salient Statistics—United
 * States" section is a different table with different definitions, so only the
 * `World` section rows pinned to the commodity's `Statistics_detail` qualify.
 * Throws when a pin matches nothing — the signal that the MCS schema moved.
 */
export function worldProductionRows(rows, c) {
  const rs = rows.filter(
    (r) =>
      r.Commodity === c.commodity &&
      r.Section.startsWith('World') &&
      r.Statistics === 'Production' &&
      r.Statistics_detail === c.detail,
  );
  if (!rs.length) throw new Error(`${c.commodity}/${c.detail}: no rows — has the MCS schema changed?`);
  return rs;
}

/**
 * The published world-total rows for a commodity. MCS files them under a
 * "rounded" variant of the detail — `Mine production: rounded` — except when
 * the detail already contains a colon, where the suffix joins with a comma
 * (`Mine production: Usable ore, rounded`). Try both; exactly one must exist.
 */
export function worldTotalRows(rows, c) {
  for (const detail of [`${c.detail}: rounded`, `${c.detail}, rounded`]) {
    const rs = rows.filter(
      (r) =>
        r.Commodity === c.commodity &&
        r.Section.startsWith('World') &&
        r.Statistics === 'Production' &&
        r.Statistics_detail === detail &&
        r.Country === 'World total',
    );
    if (rs.length) return rs;
  }
  throw new Error(`${c.commodity}/${c.detail}: no "World total" rows — has the MCS schema changed?`);
}

// ── A minimal RFC 4180 reader (no dependencies; the file quotes commas) ──────
export function parseCsv(text) {
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

export async function fetchText(url, decode = false) {
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

/** Resolve the CSV from the ScienceBase item and return its parsed rows. */
export async function loadMcsRows(log = console.log) {
  const item = JSON.parse(await fetchText(`https://www.sciencebase.gov/catalog/item/${SB_ITEM}?format=json`));
  const file = (item.files ?? []).find((f) => FILE_RE.test(f.name ?? ''));
  if (!file) throw new Error(`no Commodities_Data.csv in ScienceBase item ${SB_ITEM}`);
  log(`  source file: ${file.name} (${(file.size / 1e6).toFixed(1)} MB)`);
  const rows = parseCsv(await fetchText(file.url, true));
  log(`  ${rows.length} rows parsed\n`);
  return rows;
}
