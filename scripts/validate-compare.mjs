// ── Integrity check for the /compare pair set ──────────────────────────────
//
// Re-asserts, offline and from the committed files alone, every invariant
// the /compare surface stands on. Wired into `npm run validate`; a broken
// invariant fails the gate, not a reader's trust.
//
//   PAIR SET   both nations exist and are real atlas entities; no self-pairs;
//              no pair twice in either order; slug = the two codes sorted
//              alphabetically, lowercased, joined "-vs-"; tiers are 1|2|3 and
//              every Tier-3 pair states its inclusion reason.
//   THE GATE   every published pair's shared-ranked-metric count, recomputed
//              from data/domains/*.json, meets the recorded threshold — and
//              every dropped pair's count is genuinely below it. A domain
//              refresh that changes coverage forces a conscious rebuild
//              (node scripts/build-compare-pairs.mjs), never silent drift.
//   FRESHNESS  the committed sharedMetrics figures equal recomputation.
//   SCALE      the published count sits in the 500–900 contract.
//   ALIASES    every code in data/compare-aliases.json is a real atlas
//              nation, no entry collides with another nation's primary name,
//              and mask lists exist only for codes the matcher can reach.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const countries = JSON.parse(readFileSync(join(root, "data/countries.json"), "utf8"));
const pairsFile = JSON.parse(readFileSync(join(root, "data/compare-pairs.json"), "utf8"));
const aliasFile = JSON.parse(readFileSync(join(root, "data/compare-aliases.json"), "utf8"));

let errors = 0;
const err = (m) => {
  console.log(`  ✗ ${m}`);
  errors++;
};

const isReal = (code) => {
  const c = countries[code];
  return !!c && c.name && c.name !== "-99";
};

// ── pair-set shape ─────────────────────────────────────────────────────────
const { pairs, dropped, gate } = pairsFile;
if (!Number.isInteger(gate?.threshold) || gate.threshold < 1) err("gate.threshold missing or malformed");

const seenUnordered = new Set();
for (const p of [...pairs, ...dropped]) {
  const tag = `${p.a}-${p.b}`;
  if (!isReal(p.a)) err(`${tag}: ${p.a} is not a real atlas nation`);
  if (!isReal(p.b)) err(`${tag}: ${p.b} is not a real atlas nation`);
  if (p.a === p.b) err(`${tag}: self-pair`);
  if (p.a > p.b) err(`${tag}: codes not in alphabetical order`);
  const key = [p.a, p.b].sort().join("-");
  if (seenUnordered.has(key)) err(`${tag}: pair appears twice (in some order)`);
  seenUnordered.add(key);
  const wantSlug = `${p.a.toLowerCase()}-vs-${p.b.toLowerCase()}`;
  if (p.slug !== wantSlug) err(`${tag}: slug "${p.slug}" ≠ canonical "${wantSlug}"`);
  if (![1, 2, 3].includes(p.tier)) err(`${tag}: tier ${p.tier} is not 1|2|3`);
  if (p.tier === 3 && !p.reason) err(`${tag}: Tier-3 pair with no inclusion reason`);
}
for (let i = 1; i < pairs.length; i++) {
  if (pairs[i - 1].slug >= pairs[i].slug) err(`pairs not sorted by slug at ${pairs[i].slug}`);
}

// ── the gate, recomputed ───────────────────────────────────────────────────
const valuedKeys = new Map();
for (const file of readdirSync(join(root, "data/domains")).filter((f) => f.endsWith(".json"))) {
  const domain = JSON.parse(readFileSync(join(root, "data/domains", file), "utf8"));
  for (const [code, entry] of Object.entries(domain.data)) {
    let set = valuedKeys.get(code);
    if (!set) valuedKeys.set(code, (set = new Set()));
    for (const m of entry.metrics) if (m.value != null) set.add(m.key);
  }
}
const shared = (a, b) => {
  const sa = valuedKeys.get(a);
  const sb = valuedKeys.get(b);
  if (!sa || !sb) return 0;
  let n = 0;
  for (const k of sa) if (sb.has(k)) n++;
  return n;
};
for (const p of pairs) {
  const n = shared(p.a, p.b);
  if (n !== p.sharedMetrics) err(`${p.slug}: committed sharedMetrics ${p.sharedMetrics} ≠ recomputed ${n} — rebuild the pair set`);
  if (n < gate.threshold) err(`${p.slug}: published below the gate (${n} < ${gate.threshold}) — rebuild the pair set`);
}
for (const p of dropped) {
  const n = shared(p.a, p.b);
  if (n >= gate.threshold) err(`${p.slug}: dropped but now passes the gate (${n} ≥ ${gate.threshold}) — rebuild the pair set`);
}

// ── scale contract ─────────────────────────────────────────────────────────
if (pairs.length < 500 || pairs.length > 900) err(`published pair count ${pairs.length} outside the 500–900 contract`);

// ── alias table sanity ─────────────────────────────────────────────────────
const primaryNames = new Map(
  Object.values(countries)
    .filter((c) => isReal(c.code))
    .map((c) => [c.name, c.code]),
);
for (const section of ["aliases", "nameOverrides", "masks"]) {
  for (const code of Object.keys(aliasFile[section] ?? {})) {
    if (!isReal(code)) err(`compare-aliases ${section}: ${code} is not a real atlas nation`);
  }
}
for (const [code, list] of Object.entries(aliasFile.aliases ?? {})) {
  for (const alias of list) {
    const owner = primaryNames.get(alias);
    if (owner && owner !== code) err(`compare-aliases: "${alias}" (under ${code}) is ${owner}'s primary name`);
  }
}

const byTier = {};
for (const p of pairs) byTier[p.tier] = (byTier[p.tier] ?? 0) + 1;
console.log(
  `✓ compare pairs: ${pairs.length} published (${Object.entries(byTier)
    .map(([t, n]) => `tier ${t}: ${n}`)
    .join(", ")}), ${dropped.length} gate-dropped, gate ≥${gate.threshold} shared metrics, aliases for ${Object.keys(aliasFile.aliases ?? {}).length} nations`,
);
console.log(`\n${errors} error(s) in the compare surface.`);
process.exit(errors ? 1 : 0);
