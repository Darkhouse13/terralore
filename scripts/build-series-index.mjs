// Build the compare-mode series index. For every dossier metric we emit one
// small JSON file — public/data/series/<key>.json — mapping each country to its
// trailing time series for that metric. The dossier's metric modal fetches a
// single file lazily (only when the reader enters "compare"), so dossier pages
// stay lean while any nation's series is available on demand.
//
// Pure derivative of data/domains/*.json (themselves committed). Re-run via
// `npm run build-series`; it is also chained into `npm run build-domains`.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const countries = JSON.parse(
  readFileSync(join(root, "data/countries.json"), "utf8"),
);

const domainDir = join(root, "data/domains");
const files = readdirSync(domainDir).filter((f) => f.endsWith(".json"));

// metric key → { key, label, unit, countries: { CODE: {name,flag,value,year,series} } }
const index = new Map();
// metric keys must be globally unique (they become file names + the client's
// only lookup handle). Fail loudly if two domains ever collide.
const keyDomain = new Map();

for (const f of files) {
  const domain = JSON.parse(readFileSync(join(domainDir, f), "utf8"));
  for (const [code, entry] of Object.entries(domain.data)) {
    for (const m of entry.metrics) {
      // only chartable series are worth comparing
      if (!Array.isArray(m.series) || m.series.length < 2) continue;

      const prev = keyDomain.get(m.key);
      if (prev && prev !== domain.domain) {
        throw new Error(
          `Metric key collision: "${m.key}" in both ${prev} and ${domain.domain}. ` +
            `Series files are keyed by metric key alone — keys must be unique.`,
        );
      }
      keyDomain.set(m.key, domain.domain);

      if (!index.has(m.key)) {
        index.set(m.key, {
          key: m.key,
          label: m.label,
          unit: m.unit,
          countries: {},
        });
      }
      const meta = countries[code];
      index.get(m.key).countries[code] = {
        name: meta?.name ?? code,
        flag: meta?.flag ?? null,
        value: m.value,
        year: m.year,
        series: m.series,
      };
    }
  }
}

const outDir = join(root, "public/data/series");
mkdirSync(outDir, { recursive: true });

let total = 0;
let widest = 0;
for (const payload of index.values()) {
  // insert countries in name order so the picker iterates alphabetically
  const codes = Object.keys(payload.countries).sort((a, b) =>
    payload.countries[a].name.localeCompare(payload.countries[b].name),
  );
  const sorted = {};
  for (const code of codes) sorted[code] = payload.countries[code];
  payload.countries = sorted;

  writeFileSync(join(outDir, `${payload.key}.json`), JSON.stringify(payload));
  total++;
  widest = Math.max(widest, codes.length);
}

console.log(
  `✓ series index: ${total} metrics → public/data/series/ (up to ${widest} nations each)`,
);
