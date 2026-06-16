// Merges Natural Earth country polygons with the mledoze/countries metadata
// into two clean artifacts the app consumes:
//   public/data/countries.geo.json  — slim geometry keyed by canonical `code`
//   data/countries.json             — basic-info metadata keyed by `code`
//
// Canonical code = Natural Earth ADM0_A3 (ISO_A3 is "-99" for France, Norway…).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { codeAlias, REMAP } from './lib/codes.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const geo = JSON.parse(readFileSync(join(root, 'scripts/raw/countries.geojson'), 'utf8'));
const meta = JSON.parse(readFileSync(join(root, 'scripts/raw/mledoze-countries.json'), 'utf8'));

// Code reconciliation (codeAlias, REMAP) lives in scripts/lib/codes.mjs so the
// data-domain builders share one source of truth.

const metaByCca3 = new Map(meta.map((m) => [m.cca3, m]));

// Resolve a usable continent, demoting mledoze's "Seven seas (open ocean)"
// pseudo-continent to the record's region so ocean states group sensibly.
const pickContinent = (m, p) => {
  const c = (m?.continents && m.continents[0]) ?? p.CONTINENT ?? null;
  return c === "Seven seas (open ocean)" ? m?.region ?? c : c;
};

const slimFeatures = [];
const metadata = {};

for (const f of geo.features) {
  const p = f.properties;
  const rawCode = p.ADM0_A3 && p.ADM0_A3 !== '-99' ? p.ADM0_A3 : p.ISO_A3;
  const code = REMAP[rawCode] ?? rawCode;
  const mlKey = REMAP[rawCode] ?? (rawCode in codeAlias ? codeAlias[rawCode] : rawCode);
  const m = mlKey ? metaByCca3.get(mlKey) : undefined;

  const name = m?.name?.common ?? p.NAME_LONG ?? p.NAME ?? p.ADMIN;

  slimFeatures.push({
    type: 'Feature',
    properties: { code, name },
    geometry: f.geometry,
  });

  // Relabeled polygons that contribute geometry only:
  //  - ISR → Palestine's metadata comes from the PSX polygon.
  //  - SAH → the Western Sahara polygon renders as part of Morocco (MAR);
  //    Morocco's metadata (incl. its own population) comes from the real MAR polygon.
  if (rawCode === 'ISR' || rawCode === 'SAH') continue;

  metadata[code] = {
    code,
    iso2: m?.cca2 ?? (p.ISO_A2 !== '-99' ? p.ISO_A2 : null),
    name,
    officialName: m?.name?.official ?? p.FORMAL_EN ?? name,
    capital: m?.capital ?? [],
    region: m?.region ?? p.CONTINENT ?? null,
    subregion: m?.subregion ?? p.SUBREGION ?? null,
    // mledoze files small ocean states under the pseudo-continent "Seven seas
    // (open ocean)"; fall back to their region (e.g. Mauritius/Seychelles → Africa).
    continent: pickContinent(m, p),
    population: p.POP_EST ?? null, // Natural Earth est. (~2017)
    area: m?.area ?? null, // km²
    flag: m?.flag ?? null, // emoji
    languages: m?.languages ? Object.values(m.languages) : [],
    currencies: m?.currencies
      ? Object.entries(m.currencies).map(([c, v]) => ({ code: c, name: v.name, symbol: v.symbol }))
      : [],
    demonym: m?.demonyms?.eng?.m ?? null,
    latlng: m?.latlng ?? null,
    borders: m?.borders ?? [],
    independent: m?.independent ?? null,
    unMember: m?.unMember ?? null,
  };
}

mkdirSync(join(root, 'data'), { recursive: true });
writeFileSync(
  join(root, 'public/data/countries.geo.json'),
  JSON.stringify({ type: 'FeatureCollection', features: slimFeatures })
);
writeFileSync(join(root, 'data/countries.json'), JSON.stringify(metadata, null, 0));
// Client-fetchable copy for the globe's selection card.
writeFileSync(join(root, 'public/data/countries.json'), JSON.stringify(metadata));

const matched = Object.values(metadata).filter((m) => m.flag).length;
console.log(`features: ${slimFeatures.length}, metadata: ${Object.keys(metadata).length}, with flag/meta: ${matched}`);
