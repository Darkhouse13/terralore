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
 * Build a domain whose metrics all come from the World Bank Indicators API.
 * @param domain     domain key, e.g. "economy"
 * @param indicators [{ key, label, unit, id }]
 * @param source     DataSource describing the World Bank dataset
 */
export async function buildWbDomain(domain, indicators, source, { seriesLen = 16 } = {}) {
  const codes = loadCountryCodes();
  const fetched = {};
  for (const ind of indicators) {
    process.stdout.write(`  ${domain} · ${ind.id} (${ind.key})… `);
    fetched[ind.key] = await fetchIndicator(ind.id);
    console.log(`${fetched[ind.key].size} territories`);
  }

  const data = {};
  for (const code of codes) {
    const metrics = [];
    for (const ind of indicators) {
      const e = fetched[ind.key].get(code);
      if (!e) continue; // no observation for this country → omit (UI shows "—")
      metrics.push({
        key: ind.key,
        label: ind.label,
        value: e.value,
        unit: ind.unit,
        year: e.year,
        series: e.series.slice(-seriesLen),
        sourceId: source.id,
      });
    }
    if (metrics.length) data[code] = { metrics };
  }

  const payload = { domain, updated: today(), sources: { [source.id]: source }, data };
  writeDomain(domain, payload);
  return payload;
}
