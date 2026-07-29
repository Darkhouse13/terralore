// ── Non-World-Bank sources ──────────────────────────────────────────────────
// Some nations are absent from the World Bank's country list for political
// rather than statistical reasons, which leaves their dossiers empty even though
// the figures exist and are published by named institutions.
//
// This builder fills those gaps from those institutions directly, and it runs
// AFTER the WB builders so it can add without overwriting. It never invents a
// value and never estimates one: every metric it writes carries the publisher
// that produced it, exactly like every other metric on the site.
//
// Currently: Taiwan, from the IMF World Economic Outlook.
//
// Why not North Korea: the DPRK does not publish national accounts, and neither
// the World Bank nor the IMF estimates them — PRK is absent from WEO entirely.
// The standard reference is the Bank of Korea's annual estimate, which is
// published as a press release rather than a queryable dataset, so it cannot be
// built reproducibly here. North Korea's dossier is already populated across
// society, technology, geography, resources and military from World Bank series
// (the WB does carry its demographic and land data); its economy domain stays
// empty, which is the honest result. See FINAL_REPORT.md.
//
// Run: node scripts/build-nonwb.mjs   (after the six WB domain builders)

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const domainsDir = join(root, 'data/domains');
const today = () => new Date().toISOString().slice(0, 10);

// ── The IMF World Economic Outlook, via the public DataMapper API ────────────
const IMF_SOURCE = {
  id: 'imf-weo',
  label: 'World Economic Outlook',
  publisher: 'International Monetary Fund',
  url: 'https://www.imf.org/en/Publications/WEO',
  license: 'IMF Terms and Conditions',
  accessed: today(),
};

// WEO carries actuals, staff estimates and projections in one continuous series
// and the API does not distinguish them. Capping at 2024 keeps this to years
// that are reported or estimated rather than forecast, and keeps Taiwan directly
// comparable with the World Bank series (2024 vintage) every other nation uses.
const LAST_YEAR = 2024;
const SERIES_YEARS = 16;

/**
 * IMF indicator → our metric. `scale` converts WEO's reporting unit into the
 * unit the rest of the dossier uses (WEO reports GDP in billions and population
 * in millions; every other nation's figures are absolute).
 */
const IMF_METRICS = {
  economy: [
    { key: 'gdp', label: 'GDP', unit: 'USD', id: 'NGDPD', scale: 1e9 },
    { key: 'gdpPerCapita', label: 'GDP per capita', unit: 'USD', id: 'NGDPDPC', scale: 1 },
    { key: 'gdpGrowth', label: 'GDP growth', unit: '%', id: 'NGDP_RPCH', scale: 1 },
    { key: 'inflation', label: 'Inflation', unit: '%', id: 'PCPIPCH', scale: 1 },
  ],
  society: [
    { key: 'population', label: 'Population', unit: 'people', id: 'LP', scale: 1e6 },
  ],
};

// Nations to fill, keyed by our canonical ADM0_A3 → the code the IMF uses.
const TARGETS = { TWN: 'TWN' };

async function imf(indicator) {
  const url = `https://www.imf.org/external/datamapper/api/v1/${indicator}`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const block = json?.values?.[indicator];
      if (!block) throw new Error('no values block');
      return block;
    } catch (err) {
      if (attempt === 4) throw new Error(`${indicator}: ${err.message}`);
      await new Promise((r) => setTimeout(r, 800 * attempt));
    }
  }
}

console.log('Non-WB sources — filling gaps the World Bank does not cover\n');

let added = 0;
for (const [domain, metrics] of Object.entries(IMF_METRICS)) {
  const file = join(domainsDir, `${domain}.json`);
  const data = JSON.parse(readFileSync(file, 'utf8'));

  for (const [ourCode, imfCode] of Object.entries(TARGETS)) {
    const built = [];

    for (const m of metrics) {
      const block = await imf(m.id);
      const row = block[imfCode];
      if (!row) {
        console.log(`  ⚠ ${ourCode}/${m.key}: absent from WEO ${m.id} — left as a gap`);
        continue;
      }

      const points = Object.entries(row)
        .map(([year, value]) => ({ year: Number(year), value }))
        .filter((p) => Number.isFinite(p.year) && p.year <= LAST_YEAR && typeof p.value === 'number')
        .sort((a, b) => a.year - b.year)
        .map((p) => ({ year: p.year, value: p.value * m.scale }));

      if (!points.length) {
        console.log(`  ⚠ ${ourCode}/${m.key}: no usable points — left as a gap`);
        continue;
      }

      const latest = points[points.length - 1];
      built.push({
        key: m.key,
        label: m.label,
        value: latest.value,
        unit: m.unit,
        year: latest.year,
        series: points.slice(-SERIES_YEARS),
        sourceId: IMF_SOURCE.id,
      });
      console.log(
        `  ✓ ${ourCode}/${m.key.padEnd(13)} ${String(latest.year)} = ${latest.value.toLocaleString('en')} (${points.length} pts)`,
      );
    }

    if (!built.length) continue;

    // Add without overwriting: if the World Bank ever starts reporting this
    // nation, its series wins and this becomes a no-op rather than a conflict.
    const existing = data.data[ourCode]?.metrics ?? [];
    const have = new Set(existing.map((x) => x.key));
    const merged = [...existing, ...built.filter((b) => !have.has(b.key))];
    if (merged.length === existing.length) continue;

    data.data[ourCode] = { metrics: merged };
    data.sources[IMF_SOURCE.id] = IMF_SOURCE;
    data.updated = today();
    added += merged.length - existing.length;
  }

  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

console.log(`\n${added} metric(s) added from non-World-Bank sources.`);
