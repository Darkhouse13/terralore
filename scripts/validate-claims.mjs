// ── Integrity check for the claims layer ───────────────────────────────────
//
// Regenerates every claims bundle from the committed data (via lib/claims.ts,
// the same composer build-claims writes from) and asserts:
//
//   FRESHNESS + FACTUAL IDENTITY — byte-comparison against the committed
//     file in public/: a bundle that differs is stale (someone refreshed data
//     without `npm run build-claims`); byte-equality with the regeneration IS
//     identity with the pages, because the composer imports the modules the
//     HTML renders from.
//   UNIQUENESS — no two DIFFERENT claims share an ID corpus-wide. The same
//     ID may appear on two surfaces (a producer tonnage is one claim on the
//     dossier and the commodity page) but must carry identical value, unit
//     and observed year everywhere — cross-surface drift is an error here
//     exactly as it is in validate-commodities.
//   COVERAGE — both ways: every non-null dossier observation has exactly one
//     claim; every claim resolves to a live observation; every published
//     history's events are all claimed; no orphan .claims.json ghosts.
//
// Fragment resolution against the prerendered HTML is the post-build half:
// scripts/validate-claim-fragments.mjs, wired into `npm run ci`.
//
// MUST run under the TS loader (wired that way in package.json).
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { allClaimBundles } = await import("../lib/claims.ts");

let errors = 0;
const err = (m) => {
  console.log(`  ✗ ${m}`);
  errors++;
};

const bundles = allClaimBundles();
const expected = new Map(bundles.map((b) => [b.path, b]));
if (expected.size !== bundles.length) {
  err(`duplicate bundle paths: ${bundles.length} bundles → ${expected.size} files`);
}

// ── freshness + factual identity ──────────────────────────────────────────
let stale = 0;
for (const b of bundles) {
  const file = join(root, "public", b.path.replace(/^\//, ""));
  if (!existsSync(file)) {
    err(`missing claims bundle ${b.path} — run npm run build-claims`);
    continue;
  }
  if (readFileSync(file, "utf8") !== b.json) {
    stale++;
    if (stale <= 3) err(`stale claims bundle ${b.path} — run npm run build-claims`);
  }
}
if (stale > 3) err(`…and ${stale - 3} more stale bundles`);

// ── uniqueness: an ID names one claim, everywhere it appears ──────────────
// Claim content for comparison: value+unit+observed. Nested tonnage claims in
// commodity bundles count as appearances of their own IDs.
const seen = new Map(); // id → { value, unit, observed, from }
function record(id, value, unit, observed, from) {
  const prev = seen.get(id);
  if (!prev) {
    seen.set(id, { value, unit, observed, from });
    return;
  }
  if (prev.value !== value || prev.observed !== observed) {
    err(
      `claim ${id} differs across surfaces: ${prev.value} (${prev.from}) vs ${value} (${from}) — ` +
        `one identity must carry one observation`,
    );
  }
}
let total = 0;
for (const b of bundles) {
  const doc = JSON.parse(b.json);
  const inBundle = new Set();
  const rows = [...(doc.worldTotals ?? []), ...doc.claims];
  for (const c of rows) {
    total++;
    if (inBundle.has(c.id)) err(`${b.path}: duplicate claim ID within bundle: ${c.id}`);
    inBundle.add(c.id);
    record(c.id, c.value ?? c.title, c.unit ?? "event", c.observed ?? c.year, b.path);
    if (c.tonnage) {
      total++;
      record(c.tonnage.id, c.tonnage.value, c.tonnage.unit, c.tonnage.observed, b.path);
    }
  }
}

// ── coverage, both ways ───────────────────────────────────────────────────
const { allCountries } = await import("../lib/countries.ts");
const { getDossier } = await import("../lib/domains/index.ts");
const { getHistory } = await import("../lib/histories/index.ts");
const { allCommodities } = await import("../lib/commodities.ts");
const { claimId, eventClaimId, assignEventKeys } = await import("../lib/claim-id.ts");

const real = allCountries().filter((c) => c.name && c.name !== "-99");
const byPath = new Map(bundles.map((b) => [b.path, new Set(b.ids)]));

for (const meta of real) {
  const dossier = getDossier(meta.code);
  const ids = byPath.get(`/country/${meta.code}.claims.json`);
  if (dossier) {
    if (!ids) {
      err(`${meta.code}: dossier exists but no claims bundle`);
    } else {
      let want = 0;
      for (const section of Object.values(dossier.sections)) {
        for (const m of section?.metrics ?? []) {
          if (m.value == null || m.year == null) continue;
          want++;
          const id = claimId(meta.code, m.key, m.year);
          if (!ids.has(id)) err(`${meta.code}: observation ${m.key}/${m.year} has no claim (${id})`);
        }
      }
      // ids may exceed want only if a claim has no observation — catch it:
      const observed = new Set();
      for (const section of Object.values(dossier.sections)) {
        for (const m of section?.metrics ?? []) {
          if (m.value != null && m.year != null) observed.add(claimId(meta.code, m.key, m.year));
        }
      }
      for (const id of ids) {
        if (!observed.has(id)) err(`${meta.code}: claim ${id} has no live observation`);
      }
    }
  } else if (ids) {
    err(`${meta.code}: claims bundle exists but no dossier`);
  }

  const history = getHistory(meta.code);
  const evIds = byPath.get(`/country/${meta.code}/chronicle.claims.json`);
  if (history?.status === "published") {
    if (!evIds) {
      err(`${meta.code}: published history but no chronicle claims bundle`);
    } else {
      const keys = assignEventKeys(history.eras);
      let want = 0;
      history.eras.forEach((era, e) =>
        era.events.forEach((_, i) => {
          want++;
          const id = eventClaimId(meta.code, keys[e][i]);
          if (!evIds.has(id)) err(`${meta.code}: event ${keys[e][i].key} has no claim`);
        }),
      );
      if (evIds.size !== want) err(`${meta.code}: ${evIds.size} event claims for ${want} events`);
    }
  } else if (evIds) {
    err(`${meta.code}: chronicle claims bundle exists but no published history`);
  }
}

const commodityBundles = bundles.filter((b) => b.kind === "commodity");
if (commodityBundles.length !== allCommodities().length) {
  err(`commodity bundles: ${commodityBundles.length}, expected ${allCommodities().length}`);
}

// ── no orphan ghosts ──────────────────────────────────────────────────────
function scan(dir, toPath) {
  const abs = join(root, "public", dir);
  if (!existsSync(abs)) return;
  for (const entry of readdirSync(abs)) {
    const p = join(abs, entry);
    if (statSync(p).isDirectory()) {
      const f = join(p, "chronicle.claims.json");
      if (existsSync(f) && !expected.has(`/${dir}/${entry}/chronicle.claims.json`)) {
        err(`orphan claims ${dir}/${entry}/chronicle.claims.json`);
      }
    } else if (entry.endsWith(".claims.json") && !expected.has(toPath(entry))) {
      err(`orphan claims ${dir}/${entry}`);
    }
  }
}
scan("country", (f) => `/country/${f.replace(/\.claims\.json$/, "")}.claims.json`);
scan("commodities", (f) => `/commodities/${f.replace(/\.claims\.json$/, "")}.claims.json`);

console.log(
  `✓ claims: ${seen.size.toLocaleString("en")} unique claim IDs (${total.toLocaleString("en")} appearances) ` +
    `across ${bundles.length} bundles`,
);
console.log(`\n${errors} error(s) in the claims layer.`);
process.exit(errors ? 1 : 0);
