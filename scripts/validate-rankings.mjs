// Independent integrity check for the /rankings slug layer.
// Mirrors validate-domains.mjs: offline, against the committed files, so a bad
// slug map fails `npm run validate` before a page is ever rendered.
//
// The invariants:
//   1. TOTAL COVERAGE — every metric key in data/domains/*.json has a slug in
//      data/ranking-slugs.json, and every slug entry names a key that exists.
//      A metric without a URL is an unpublished ranking; a slug without a
//      metric is a dead page waiting to 404.
//   2. KEBAB-CASE — lowercase letters and digits, single hyphens.
//   3. NO "-rate" SUFFIX — the family convention is the bare noun (literacy,
//      fertility, inflation); a stray "-rate" here and not there is exactly
//      the inconsistency a hand-authored map exists to prevent.
//   4. UNIQUENESS — no two keys share a slug, UNLESS `aliases` declares one to
//      be the same indicator as the other; then they MUST share it.
//   5. ALIAS IDENTITY — an alias pair must be byte-identical per nation
//      (value AND year) across its two domain files. The moment a refresh
//      makes them diverge, the shared page stops being honest and this check
//      forces a conscious decision instead of a silent one.
//   6. DEFINITIONS — every page-owning key has an entry in lib/metric-defs.ts
//      (checked textually; the TS module cannot be imported from node).

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mapPath = join(root, "data/ranking-slugs.json");
const domainDir = join(root, "data/domains");

if (!existsSync(mapPath) || !existsSync(domainDir)) {
  console.log("missing data/ranking-slugs.json or data/domains — nothing to validate.");
  process.exit(0);
}

let errors = 0;
const err = (m) => { console.log(`  ✗ ${m}`); errors++; };

const map = JSON.parse(readFileSync(mapPath, "utf8"));
const slugs = map.slugs ?? {};
const aliases = map.aliases ?? {};

// ── the domain files: every metric key, and per-key per-nation observations ─
const domainOfKey = new Map(); // key → domain
const obsOfKey = new Map(); // key → Map(code → "value@year")
for (const f of readdirSync(domainDir).filter((x) => x.endsWith(".json"))) {
  const d = JSON.parse(readFileSync(join(domainDir, f), "utf8"));
  for (const [code, entry] of Object.entries(d.data ?? {})) {
    for (const m of entry.metrics ?? []) {
      if (!domainOfKey.has(m.key)) {
        domainOfKey.set(m.key, d.domain);
        obsOfKey.set(m.key, new Map());
      }
      obsOfKey.get(m.key).set(code, `${m.value}@${m.year}`);
    }
  }
}

// 1 — total coverage, both directions
for (const key of domainOfKey.keys()) {
  if (!(key in slugs)) err(`metric "${key}" (${domainOfKey.get(key)}) has no slug — its ranking page cannot exist`);
}
for (const key of Object.keys(slugs)) {
  if (!domainOfKey.has(key)) err(`slug map names "${key}", which exists in no domain file — a dead page`);
}

// 2 + 3 — slug shape
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
for (const [key, slug] of Object.entries(slugs)) {
  if (!KEBAB.test(slug)) err(`"${key}" → "${slug}" is not kebab-case`);
  if (slug.endsWith("-rate")) err(`"${key}" → "${slug}" carries the banned "-rate" suffix (house convention: the bare noun)`);
}

// 4 — uniqueness, modulo declared aliases
const keysOfSlug = new Map();
for (const [key, slug] of Object.entries(slugs)) {
  if (!keysOfSlug.has(slug)) keysOfSlug.set(slug, []);
  keysOfSlug.get(slug).push(key);
}
for (const [slug, keys] of keysOfSlug) {
  if (keys.length === 1) continue;
  const covered = keys.filter((k) => aliases[k] && keys.includes(aliases[k]));
  if (keys.length - covered.length > 1) {
    err(`slug "${slug}" is shared by [${keys.join(", ")}] without an alias declaring them the same indicator`);
  }
}

// alias source and target must actually share their slug
for (const [source, target] of Object.entries(aliases)) {
  if (!(source in slugs)) err(`alias source "${source}" is not in the slug map`);
  if (!(target in slugs)) err(`alias target "${target}" is not in the slug map`);
  if (target in aliases) err(`alias target "${target}" is itself an alias — chains are not allowed`);
  if (slugs[source] !== slugs[target]) {
    err(`alias ${source} → ${target} but their slugs differ ("${slugs[source]}" vs "${slugs[target]}")`);
  }
}

// 5 — alias identity: same nations, same values, same years
for (const [source, target] of Object.entries(aliases)) {
  const a = obsOfKey.get(source);
  const b = obsOfKey.get(target);
  if (!a || !b) continue; // already reported under coverage
  const codes = new Set([...a.keys(), ...b.keys()]);
  for (const code of codes) {
    if (a.get(code) !== b.get(code)) {
      err(
        `alias pair ${source}/${target} diverges at ${code} (${a.get(code)} vs ${b.get(code)}) — ` +
          `a shared page is only honest while the data is identical; split the pages or fix the build`,
      );
    }
  }
}

// 6 — every page-owning key has a definition in lib/metric-defs.ts
const defsSrc = readFileSync(join(root, "lib/metric-defs.ts"), "utf8");
const defined = new Set([...defsSrc.matchAll(/^\s{2}([a-zA-Z][a-zA-Z0-9]*):/gm)].map((m) => m[1]));
for (const key of Object.keys(slugs)) {
  if (key in aliases) continue; // its page is the target's page
  if (!defined.has(key)) err(`"${key}" has no definition in lib/metric-defs.ts — its page would render a fallback`);
}

const pages = new Set(Object.entries(slugs).filter(([k]) => !(k in aliases)).map(([, s]) => s)).size;
console.log(
  `✓ ranking slugs: ${Object.keys(slugs).length} metric keys → ${pages} pages ` +
    `(${Object.keys(aliases).length} alias pair(s), identity verified)`,
);
console.log(`\n${errors} error(s) in the rankings slug layer.`);
process.exit(errors ? 1 : 0);
