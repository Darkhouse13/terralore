// ── The Recorder: diff two corpus states and publish the change record ─────
//
// The Living Record's Layer 3 (docs/living-record.md §3). Diffs the data
// corpus claim by claim between a git ref (default HEAD — the last committed
// state) and the working tree, classifies every difference in the ledger's
// four lanes, and — unless --dry-run — writes the entry to
// public/ledger/<NNNN>.json, regenerates the twins (the ledger surfaces
// derive from the entry), and cuts the new seal.
//
//   NEW      a new observed year for a measure (supersedes the old claim),
//            or a measure/nation newly published
//   REVISED  the same claim — same nation, measure, observed year — with a
//            changed value. Labelled origin:"upstream" (the publisher moved);
//            a Terralore correction must be marked by hand in the entry,
//            because the machinery cannot know intent
//   RETIRED  an observation absent where one stood — value withdrawn to
//            null, a measure or nation dropped, or a later vintage withdrawn
//            so an earlier observation stands again (`now` says which)
//   SOURCE   a source record's label, publisher, url or license moved.
//            `accessed` moving is just the retrieval vintage and is carried
//            by the entry's vintages, not recorded as a source change
//
// Usage:
//   node scripts/record-refresh.mjs --dry-run [--out <path>] [--before <ref>]
//   node scripts/record-refresh.mjs --write --title "…" --summary "…" [--note "…"]…
//
// A RECORDED refresh is a deliberate act: run `npm run refresh-domains`
// first, read this script's dry-run, then --write and commit. The one-liner
// `npm run record-refresh` chains refresh → dry-run for reading.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { snapshotClaims } from "./lib/claims-snapshot.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/* ── args ──────────────────────────────────────────────────────────────────── */
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, dflt = null) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const opts = (name) => args.flatMap((a, i) => (a === `--${name}` && args[i + 1] ? [args[i + 1]] : []));

const beforeRef = opt("before", "HEAD");
const dryRun = flag("dry-run");
const write = flag("write");
if (!dryRun && !write) {
  console.error("record-refresh: pass --dry-run (read the diff) or --write (publish the entry)");
  process.exit(1);
}

/* ── snapshot + diff ───────────────────────────────────────────────────────── */
const before = snapshotClaims(root, beforeRef);
const after = snapshotClaims(root, null);

const changes = [];

// dossier observations, grouped by (code, metric) — the measure's lane
function groupByMeasure(snap) {
  const g = new Map();
  for (const [id, o] of snap.observations) g.set(`${o.code}|${o.metric}`, { id, ...o });
  return g;
}
const gBefore = groupByMeasure(before);
const gAfter = groupByMeasure(after);

for (const [k, a] of gAfter) {
  const b = gBefore.get(k);
  if (!b) {
    changes.push({
      kind: "new",
      domain: a.domain,
      nation: a.code,
      metric: a.metric,
      label: a.label,
      unit: a.unit,
      id: a.id,
      after: { value: a.value, year: a.year },
      origin: "upstream",
    });
  } else if (a.year !== b.year) {
    if (a.year > b.year) {
      changes.push({
        kind: "new",
        domain: a.domain,
        nation: a.code,
        metric: a.metric,
        label: a.label,
        unit: a.unit,
        id: a.id,
        supersedes: b.id,
        before: { value: b.value, year: b.year },
        after: { value: a.value, year: a.year },
        origin: "upstream",
      });
    } else {
      // the later vintage was withdrawn — the retirement of b.id is the fact;
      // `now` records the earlier observation that stands again
      changes.push({
        kind: "retired",
        domain: a.domain,
        nation: a.code,
        metric: a.metric,
        label: a.label,
        unit: a.unit,
        id: b.id,
        before: { value: b.value, year: b.year },
        now: { id: a.id, value: a.value, year: a.year },
        origin: "upstream",
      });
    }
  } else if (a.value !== b.value) {
    changes.push({
      kind: "revised",
      domain: a.domain,
      nation: a.code,
      metric: a.metric,
      label: a.label,
      unit: a.unit,
      id: a.id,
      before: { value: b.value, year: b.year },
      after: { value: a.value, year: a.year },
      origin: "upstream",
    });
  }
}
for (const [k, b] of gBefore) {
  if (gAfter.has(k)) continue;
  changes.push({
    kind: "retired",
    domain: b.domain,
    nation: b.code,
    metric: b.metric,
    label: b.label,
    unit: b.unit,
    id: b.id,
    before: { value: b.value, year: b.year },
    origin: "upstream",
  });
}

// commodity tonnages + world totals — only where not already covered by the
// dossier lane (the estimate-year tonnage IS the dossier claim)
const covered = new Set(changes.map((c) => c.id));
function diffFlat(mapBefore, mapAfter, describe) {
  for (const [id, a] of mapAfter) {
    if (covered.has(id)) continue;
    const b = mapBefore.get(id);
    if (!b) {
      changes.push({ kind: "new", domain: "commodities", ...describe(a), id, after: { value: a.value, year: a.year }, origin: "upstream" });
    } else if (b.value !== a.value) {
      changes.push({ kind: "revised", domain: "commodities", ...describe(a), id, before: { value: b.value, year: b.year }, after: { value: a.value, year: a.year }, origin: "upstream" });
    }
  }
  for (const [id, b] of mapBefore) {
    if (covered.has(id) || mapAfter.has(id)) continue;
    changes.push({ kind: "retired", domain: "commodities", ...describe(b), id, before: { value: b.value, year: b.year }, origin: "upstream" });
  }
}
diffFlat(before.tonnages, after.tonnages, (t) => ({ nation: t.code, metric: t.key, label: `${t.key} tonnage`, unit: "tonnes" }));
diffFlat(before.worldTotals, after.worldTotals, (t) => ({ nation: "WLD", metric: `${t.key}-total`, label: `${t.key} world total`, unit: "tonnes" }));

// source records — methodology/provenance movement (accessed excluded)
const sourceChanges = [];
for (const [k, a] of after.sources) {
  const b = before.sources.get(k);
  if (!b) {
    sourceChanges.push({ domain: a.domain, sourceId: a.id, kind: "added", after: { label: a.label, publisher: a.publisher, url: a.url, license: a.license } });
    continue;
  }
  for (const f of ["label", "publisher", "url", "license"]) {
    if (a[f] !== b[f]) sourceChanges.push({ domain: a.domain, sourceId: a.id, kind: "changed", field: f, before: b[f], after: a[f] });
  }
}
for (const [k, b] of before.sources) {
  if (!after.sources.has(k)) {
    sourceChanges.push({ domain: b.domain, sourceId: b.id, kind: "removed", before: { label: b.label, publisher: b.publisher } });
  }
}

// structural: nations entering/leaving a domain's published set
function nationsByDomain(snap) {
  const m = new Map();
  for (const o of snap.observations.values()) {
    if (!m.has(o.domain)) m.set(o.domain, new Set());
    m.get(o.domain).add(o.code);
  }
  return m;
}
const nb = nationsByDomain(before);
const na = nationsByDomain(after);
const structural = {};
for (const domain of new Set([...nb.keys(), ...na.keys()])) {
  const b = nb.get(domain) ?? new Set();
  const a = na.get(domain) ?? new Set();
  const gained = [...a].filter((c) => !b.has(c)).sort();
  const lost = [...b].filter((c) => !a.has(c)).sort();
  if (gained.length || lost.length) structural[domain] = { gained, lost };
}

/* ── the entry ─────────────────────────────────────────────────────────────── */
const byDomain = {};
const nations = new Set();
for (const c of changes) {
  byDomain[c.domain] ??= { new: 0, revised: 0, retired: 0 };
  byDomain[c.domain][c.kind]++;
  nations.add(c.nation);
}
const counts = {
  new: changes.filter((c) => c.kind === "new").length,
  revised: changes.filter((c) => c.kind === "revised").length,
  retired: changes.filter((c) => c.kind === "retired").length,
  sourceChanges: sourceChanges.length,
  nations: nations.size,
};

// entry number + the after-version the seal will take (same logic as
// build-integrity: today's date, .n suffix past existing archive files)
const ledgerDir = join(root, "public", "ledger");
mkdirSync(ledgerDir, { recursive: true });
const existing = readdirSync(ledgerDir).filter((f) => /^\d{4}\.json$/.test(f));
const n = existing.length + 1;
const slug = String(n).padStart(4, "0");
const today = new Date().toISOString().slice(0, 10);
let afterVersion = today;
{
  const archiveDir = join(root, "public", "integrity");
  for (let i = 2; existsSync(join(archiveDir, `${afterVersion}.json`)); i++) afterVersion = `${today}.${i}`;
}
const beforeManifestRaw = (() => {
  try {
    return execFileSync("git", ["show", `${beforeRef}:public/integrity.json`], { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return null;
  }
})();
const beforeManifest = beforeManifestRaw ? JSON.parse(beforeManifestRaw) : null;

const entry = {
  entry: n,
  slug,
  date: today,
  title: opt("title", `Recorded refresh, ${today}`),
  summary: opt("summary", ""),
  kind: "recorded-refresh",
  corpus: {
    before: beforeManifest ? { version: beforeManifest.version, root: beforeManifest.root } : null,
    // the after seal is cut over a corpus that includes this entry, so the
    // entry can carry its version (deterministic) but not its own hash —
    // /integrity/<version>.json resolves it
    after: { version: afterVersion },
  },
  domains: Object.keys(byDomain).sort(),
  counts,
  vintages: { before: before.updated, after: after.updated },
  structural,
  notes: opts("note"),
  sourceChanges,
  changes,
};

const json = JSON.stringify(entry, null, 1) + "\n";

if (dryRun) {
  const out = opt("out");
  if (out) {
    writeFileSync(out, json);
    console.log(`✓ dry-run: would-be entry #${n} written to ${out} (nothing published)`);
  }
  console.log(
    `dry-run vs ${beforeRef}: ${counts.new} new · ${counts.revised} revised · ${counts.retired} retired · ` +
      `${counts.sourceChanges} source changes · ${counts.nations} nations · domains: ${entry.domains.join(", ") || "none"}`,
  );
  if (Object.keys(structural).length) console.log(`structural: ${JSON.stringify(structural)}`);
  process.exit(0);
}

writeFileSync(join(ledgerDir, `${slug}.json`), json);
console.log(`✓ ledger entry #${n} → public/ledger/${slug}.json`);
console.log(
  `  ${counts.new} new · ${counts.revised} revised · ${counts.retired} retired · ` +
    `${counts.sourceChanges} source changes · ${counts.nations} nations`,
);
console.log("  now: npm run build-geo && npm run build-integrity, then validate + build + commit");
