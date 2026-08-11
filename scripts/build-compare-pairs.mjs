// ── Derive the /compare pair set → data/compare-pairs.json ─────────────────
//
// The pair set is DATA, not a runtime computation: which comparisons this
// atlas publishes is an editorial decision with a permanence obligation, so
// it is derived here deterministically, committed, and validated offline
// (scripts/validate-compare.mjs) — the same contract as ranking-slugs.
//
// Three tiers:
//
//   1  every land-border neighbour pair. Source: the `borders` field of
//      data/countries.json (mledoze/countries via build-data.mjs, ISO3),
//      reconciled to canonical ADM0_A3 (BORDER_MAP / BORDER_DROP below) and
//      symmetrised by union. Ten spot cases are asserted against the CIA
//      World Factbook's land-boundary lists at the bottom of this file — a
//      countries.json refresh that breaks adjacency fails this build, not a
//      reader's trust.
//   2  every pair within the G20's nation members present in the atlas
//      (the EU and AU are members but not nations; no pages for them).
//   3  a curated seed of high-interest pairs not covered above, each with
//      its inclusion reason recorded in the JSON.
//
// The thin-content gate: a pair publishes only if the two nations share at
// least GATE_THRESHOLD ranked metrics (both sides non-null for the same
// metric key, counted across data/domains/*.json). Pairs failing the gate
// are written to `dropped` with the measured count — recorded, not silently
// missing. See docs/compare-surface.md for the threshold's rationale; the
// short form: the observed distribution has three regimes (0 shared —
// no statistical apparatus overlap; 5 — Taiwan's IMF-only headline set;
// 24+ — every pair of full-coverage nations), and 10 sits in the empirical
// gap: above "one domain's headline metrics", below the full-coverage
// floor, so pages appear or disappear only on real coverage changes.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const countries = JSON.parse(readFileSync(join(root, "data/countries.json"), "utf8"));

export const GATE_THRESHOLD = 10;

// mledoze border codes → canonical ADM0_A3. GUF is French Guiana — an
// integral department of France, so its Brazilian and Surinamese borders are
// French land borders (France's longest is with Brazil). HKG/MAC map to CHN
// and vanish as self-pairs.
const BORDER_MAP = { UNK: "KOS", SSD: "SDS", GUF: "FRA", HKG: "CHN", MAC: "CHN" };
// Border references to entities this atlas does not file separately:
//   ESH — Western Sahara (presented within Morocco; see TERRITORY_NOTES.MAR);
//   ISR — no ISR entity in this atlas (see scripts/lib/codes.mjs REMAP);
//         mapping its borders to PSE would assert land borders (e.g.
//         Lebanon–Palestine) that do not exist, so they are dropped instead;
//   GIB — Gibraltar is a British Overseas Territory, not part of the UK
//         proper the way GUF is part of France; no ESP–GBR land pair.
const BORDER_DROP = new Set(["ESH", "ISR", "GIB"]);
// Pairs the source data asserts but the world does not: mledoze lists a
// Sri Lanka–India land border; none exists (the Palk Strait separates them).
// The comparison itself is worth publishing — it re-enters as Tier 3.
const TIER1_EXCLUDE = new Map([["IND-LKA", "mledoze lists a land border; India and Sri Lanka are separated by the Palk Strait"]]);

// The G20's nation members (the EU and AU seats are not nations).
const G20 = "ARG AUS BRA CAN CHN DEU FRA GBR IDN IND ITA JPN KOR MEX RUS SAU TUR USA ZAF".split(" ");

// Tier 3: curated high-interest pairs not already covered. The reason is
// published into the JSON — a pair with no stateable reason does not belong
// here. How to add one: docs/compare-surface.md.
const TIER3 = [
  ["AUS", "NZL", "trans-Tasman neighbours; the standing comparison in both publics"],
  ["GBR", "NZL", "settlement-era ties and diaspora"],
  ["IRL", "USA", "Irish-American diaspora"],
  ["PHL", "USA", "colonial period (1898–1946) and diaspora"],
  ["GBR", "JAM", "colonial history and the Windrush-era diaspora"],
  ["ESP", "ITA", "similar-sized Mediterranean economies, frequent comparison"],
  ["ESP", "GBR", "five centuries of entangled history, from the Armada to Gibraltar"],
  ["GBR", "PRT", "the Anglo-Portuguese alliance of 1373, the oldest still in force"],
  ["DNK", "SWE", "Øresund neighbours with centuries of shared history, no land border"],
  ["EST", "FIN", "Gulf of Finland neighbours with close linguistic kinship"],
  ["DNK", "ISL", "in union until 1944"],
  ["ISL", "NOR", "Iceland's settlement-era origin"],
  ["CYP", "GRC", "shared language and deep state-to-state ties"],
  ["GBR", "NLD", "Anglo-Dutch maritime entanglement, wars to William of Orange"],
  ["BRA", "PRT", "colonial tie and shared language"],
  ["ESP", "MEX", "colonial tie (New Spain)"],
  ["ARG", "ESP", "colonial tie and twentieth-century migration"],
  ["DZA", "FRA", "132 years of colonial entanglement and a large diaspora"],
  ["FRA", "MAR", "protectorate history (1912–1956) and diaspora"],
  ["FRA", "VNM", "colonial Indochina and the war that ended it"],
  ["EGY", "GBR", "occupation, protectorate and Suez"],
  ["AGO", "PRT", "colonial tie to 1975"],
  ["IDN", "NLD", "the Dutch East Indies and the independence war"],
  ["JPN", "TWN", "colonial period 1895–1945"],
  ["IND", "LKA", "strait neighbours with millennia of shared history (no land border — see Tier 1 exclusions)"],
  ["NGA", "ZAF", "Africa's two largest economies"],
  ["IRN", "SAU", "the Gulf's two largest states, frequent comparison"],
  ["CHN", "TWN", "the cross-strait comparison"],
  ["BGD", "PAK", "one state from 1947 to 1971"],
  ["CUB", "USA", "entangled from 1898 to the present"],
  ["USA", "VNM", "the war and the normalisation that followed"],
  ["FRA", "HTI", "colonial Saint-Domingue and the independence indemnity"],
  ["CYN", "CYP", "the island's two administrations"],
];

const isReal = (code) => {
  const c = countries[code];
  return !!c && c.name && c.name !== "-99";
};
const slugOf = (a, b) => {
  const [x, y] = [a, b].sort();
  return `${x.toLowerCase()}-vs-${y.toLowerCase()}`;
};

// ── Tier 1: land-border neighbours ─────────────────────────────────────────
const tier1 = new Set();
for (const c of Object.values(countries)) {
  for (const raw of c.borders ?? []) {
    if (BORDER_DROP.has(raw)) continue;
    const b = BORDER_MAP[raw] ?? raw;
    if (!countries[b]) throw new Error(`border code ${raw} (from ${c.code}) maps to nothing — extend BORDER_MAP or BORDER_DROP`);
    if (b === c.code) continue; // CHN via HKG/MAC
    const key = [c.code, b].sort().join("-");
    if (!TIER1_EXCLUDE.has(key)) tier1.add(key);
  }
}

// Spot checks against the CIA World Factbook land-boundary lists (checked by
// hand, 2026-08): the atlas's derived adjacency must reproduce these exactly.
// GIB is deliberately absent from ESP (dropped above); PSE stands in for the
// Gaza boundary on EGY per this atlas's entity model.
const SPOT = {
  USA: "CAN MEX",
  PRT: "ESP",
  GBR: "IRL",
  KOR: "PRK",
  ESP: "AND FRA MAR PRT",
  CHN: "AFG BTN IND KAZ KGZ LAO MMR MNG NPL PAK PRK RUS TJK VNM",
  SRB: "BGR BIH HRV HUN KOS MKD MNE ROU",
  ZAF: "BWA LSO MOZ NAM SWZ ZWE",
  EGY: "LBY PSE SDN",
  ARM: "AZE GEO IRN TUR",
};
for (const [code, want] of Object.entries(SPOT)) {
  const got = [...tier1]
    .filter((p) => p.split("-").includes(code))
    .map((p) => p.split("-").find((x) => x !== code))
    .sort()
    .join(" ");
  if (got !== want) {
    throw new Error(`adjacency spot check failed for ${code}:\n  derived: ${got}\n  factbook: ${want}`);
  }
}

// ── Tier 2: G20 pairs ──────────────────────────────────────────────────────
for (const g of G20) if (!isReal(g)) throw new Error(`G20 code ${g} is not in the atlas`);
const tier2 = new Set();
for (let i = 0; i < G20.length; i++) {
  for (let j = i + 1; j < G20.length; j++) {
    const key = [G20[i], G20[j]].sort().join("-");
    if (!tier1.has(key)) tier2.add(key);
  }
}

// ── the gate: shared ranked metrics ────────────────────────────────────────
const valuedKeys = new Map(); // code → Set(metric key with a non-null value)
for (const file of readdirSync(join(root, "data/domains")).filter((f) => f.endsWith(".json"))) {
  const domain = JSON.parse(readFileSync(join(root, "data/domains", file), "utf8"));
  for (const [code, entry] of Object.entries(domain.data)) {
    let set = valuedKeys.get(code);
    if (!set) valuedKeys.set(code, (set = new Set()));
    for (const m of entry.metrics) if (m.value != null) set.add(m.key);
  }
}
function sharedMetrics(a, b) {
  const sa = valuedKeys.get(a);
  const sb = valuedKeys.get(b);
  if (!sa || !sb) return 0;
  let n = 0;
  for (const k of sa) if (sb.has(k)) n++;
  return n;
}

// ── assemble, gate, emit ───────────────────────────────────────────────────
const seen = new Set();
const pairs = [];
const dropped = [];
function add(key, tier, reason) {
  if (seen.has(key)) return; // first tier wins; Tier 3 duplicates of 1/2 are no-ops
  seen.add(key);
  const [a, b] = key.split("-");
  for (const code of [a, b]) if (!isReal(code)) throw new Error(`pair ${key}: ${code} is not a real atlas nation`);
  const shared = sharedMetrics(a, b);
  const row = { a, b, slug: slugOf(a, b), tier, ...(reason ? { reason } : {}), sharedMetrics: shared };
  if (shared < GATE_THRESHOLD) {
    dropped.push({ ...row, droppedBecause: `below the thin-content gate: ${shared} shared ranked metrics (threshold ${GATE_THRESHOLD})` });
  } else {
    pairs.push(row);
  }
}
for (const key of [...tier1].sort()) add(key, 1);
for (const key of [...tier2].sort()) add(key, 2);
for (const [a, b, reason] of TIER3) add([a, b].sort().join("-"), 3, reason);

pairs.sort((x, y) => x.slug.localeCompare(y.slug));
dropped.sort((x, y) => x.slug.localeCompare(y.slug));

if (pairs.length < 500 || pairs.length > 900) {
  throw new Error(`published pair count ${pairs.length} is outside the 500–900 contract`);
}

const out = {
  doc:
    "The /compare pair set. Derived by scripts/build-compare-pairs.mjs (tiers, " +
    "adjacency reconciliation, spot checks) and gated on shared ranked metrics; " +
    "validated by scripts/validate-compare.mjs. Edit the script, not this file. " +
    "Slugs order the two ADM0_A3 codes alphabetically; the reverse order 308s.",
  gate: {
    threshold: GATE_THRESHOLD,
    measuredOn: "data/domains/*.json — metric keys where both nations hold a non-null value",
  },
  tier1Exclusions: Object.fromEntries(TIER1_EXCLUDE),
  pairs,
  dropped,
};

writeFileSync(join(root, "data/compare-pairs.json"), JSON.stringify(out, null, 2) + "\n");

const byTier = {};
for (const p of pairs) byTier[p.tier] = (byTier[p.tier] ?? 0) + 1;
console.log(
  `✓ compare pairs: ${pairs.length} published (${Object.entries(byTier)
    .map(([t, n]) => `tier ${t}: ${n}`)
    .join(", ")}) · ${dropped.length} gate-dropped: ${dropped.map((d) => d.slug).join(", ") || "none"}`,
);
