// Shared helpers for the data-domain builders. Each builder fetches authoritative
// open data, normalises it to our canonical ADM0_A3 codes, and writes a committed
// JSON file under data/domains/ that the app imports at build time.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { fetchIndicator } from './wb.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The canonical set of country codes the app knows about. */
export function loadCountryCodes() {
  const countries = JSON.parse(readFileSync(join(root, 'data/countries.json'), 'utf8'));
  return new Set(Object.keys(countries));
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Write a finished domain file (and ensure the directory exists). */
export function writeDomain(domain, payload) {
  mkdirSync(join(root, 'data/domains'), { recursive: true });
  writeFileSync(join(root, `data/domains/${domain}.json`), JSON.stringify(payload));
  console.log(`✓ ${domain}: ${Object.keys(payload.data).length} countries → data/domains/${domain}.json`);
}

/**
 * Drop observations that fall below a magnitude the indicator cannot take, and
 * report every drop by name.
 *
 * This exists for upstream scale artefacts, not for values we dislike. Somalia's
 * education-spending share arrives from UIS as 8×10⁻⁶ % of GDP — six orders of
 * magnitude below the next-lowest country on earth, which is a denomination
 * error in the national submission, not a finding about Somali schools. Passing
 * it through would print "0.0%" on the dossier: a confident, false, sourced-
 * looking claim. Omitting it prints "—", which is what we actually know.
 *
 * The bar for adding a floor is that the value be *impossible*, not merely
 * extreme; the real low end of every one of these series stays.
 */
function applyFloor(map, floor, label) {
  for (const [code, e] of map) {
    const kept = e.series.filter((p) => p.value >= floor);
    if (kept.length === e.series.length) continue;
    const dropped = e.series.length - kept.length;
    if (!kept.length) {
      map.delete(code);
      console.log(`\n    ⚠ ${label}: ${code} dropped — all ${dropped} points below floor ${floor}`);
      continue;
    }
    e.series = kept;
    e.value = kept[kept.length - 1].value;
    e.year = kept[kept.length - 1].year;
    console.log(`\n    ⚠ ${label}: ${code} — ${dropped} point(s) below floor ${floor} discarded`);
  }
}

/**
 * Build a domain whose metrics all come from the World Bank Indicators API.
 * @param domain     domain key, e.g. "economy"
 * @param indicators [{ key, label, unit, id, source?, wbSource?, floor? }] — an
 *                   indicator may carry its own `source` (the true upstream
 *                   provider WB redistributes, e.g. UNESCO/ITU); otherwise the
 *                   domain `source` is used. `wbSource` pins the API database id
 *                   for series held outside the default WDI database. `floor`
 *                   discards observations below a magnitude the indicator cannot
 *                   physically take — see the note below.
 * @param source     default DataSource describing the World Bank dataset
 */
export async function buildWbDomain(domain, indicators, source, { seriesLen = 16 } = {}) {
  const codes = loadCountryCodes();
  const fetched = {};
  for (const ind of indicators) {
    process.stdout.write(`  ${domain} · ${ind.id} (${ind.key})… `);
    fetched[ind.key] = await fetchIndicator(ind.id, { wbSource: ind.wbSource });
    if (ind.floor != null) applyFloor(fetched[ind.key], ind.floor, `${domain}/${ind.key}`);
    console.log(`${fetched[ind.key].size} territories`);
  }

  const sources = {};
  const data = {};
  for (const code of codes) {
    const metrics = [];
    for (const ind of indicators) {
      const e = fetched[ind.key].get(code);
      if (!e) continue; // no observation for this country → omit (UI shows "—")
      const src = ind.source ?? source;
      sources[src.id] ??= src; // only sources actually referenced make the file
      metrics.push({
        key: ind.key,
        label: ind.label,
        value: e.value,
        unit: ind.unit,
        year: e.year,
        series: e.series.slice(-seriesLen),
        sourceId: src.id,
      });
    }
    if (metrics.length) data[code] = { metrics };
  }

  const payload = { domain, updated: today(), sources, data };
  writeDomain(domain, payload);
  return payload;
}
