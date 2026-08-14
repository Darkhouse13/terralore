// ── Integrity check for the GEO export layer ───────────────────────────────
//
// Regenerates every markdown twin from the committed data (via lib/geo.ts,
// the same module the generator and the llms routes use) and byte-compares it
// against the committed file in public/. One check carries three guarantees:
//
//   FRESHNESS — a twin that differs from what the data now produces is stale:
//     someone rebuilt domains without `npm run build-geo`. Fails loudly.
//   FACTUAL IDENTITY — the twin's figures come from the same modules the HTML
//     renders from, so byte-equality with the regeneration IS identity with
//     the pages. No second bookkeeping.
//   COVERAGE — exactly one twin per canonical content page: every real nation
//     a dossier twin, every published history a chronicle twin, every ranking
//     and commodity a table twin; no orphan .md ghosts in the managed dirs.
//
// Also asserts: llms-full.txt under its size cap, every llms.txt-linked twin
// resolves to a real file (the routes derive links from the same allTwins()
// set checked here), and the neutrality language rule on the twins Terralore
// authors (no "best"/"worst" in ranking or commodity twins).
//
// MUST run under the TS loader (wired that way in package.json):
//   node --import ./scripts/lib/ts-alias-loader.mjs scripts/validate-geo.mjs
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { allTwins, llmsFullText, LLMS_FULL_CAP } = await import("../lib/geo.ts");

let errors = 0;
const err = (m) => {
  console.log(`  ✗ ${m}`);
  errors++;
};

const twins = allTwins();
const expected = new Map(twins.map((t) => [t.path, t]));

// paths must be unique — two twins claiming one file would silently overwrite
if (expected.size !== twins.length) err(`duplicate twin paths: ${twins.length} twins → ${expected.size} files`);

// ── freshness + factual identity: regenerate-and-compare ──────────────────
let stale = 0;
for (const t of twins) {
  const file = join(root, "public", t.path.replace(/^\//, ""));
  if (!existsSync(file)) {
    err(`missing twin ${t.path} — run npm run build-geo`);
    continue;
  }
  if (readFileSync(file, "utf8") !== t.markdown) {
    stale++;
    if (stale <= 3) err(`stale twin ${t.path} — committed file differs from what the data produces; run npm run build-geo`);
  }
}
if (stale > 3) err(`…and ${stale - 3} more stale twins`);

// ── coverage: exactly one twin per canonical content page ─────────────────
const { allCountries } = await import("../lib/countries.ts");
const { getHistory } = await import("../lib/histories/index.ts");
const { allRankings } = await import("../lib/rankings.ts");
const { allCommodities } = await import("../lib/commodities.ts");
const { allComparePages } = await import("../lib/compare.ts");
const { allEntries } = await import("../lib/ledger.ts");

const real = allCountries().filter((c) => c.name && c.name !== "-99");
const published = real.filter((c) => getHistory(c.code)?.status === "published");
const counts = {};
for (const t of twins) counts[t.kind] = (counts[t.kind] ?? 0) + 1;

const want = {
  dossier: real.length,
  chronicle: published.length,
  ranking: allRankings().length,
  commodity: allCommodities().length,
  compare: allComparePages().length,
  ledger: allEntries().length,
};
for (const [kind, n] of Object.entries(want)) {
  if ((counts[kind] ?? 0) !== n) err(`${kind} twins: ${counts[kind] ?? 0}, expected ${n}`);
}

// ── no orphan ghosts in the managed directories ───────────────────────────
function scan(dir, toPath) {
  const abs = join(root, "public", dir);
  if (!existsSync(abs)) return;
  for (const entry of readdirSync(abs)) {
    const p = join(abs, entry);
    if (statSync(p).isDirectory()) {
      const f = join(p, "chronicle.md");
      if (existsSync(f) && !expected.has(`/${dir}/${entry}/chronicle.md`)) {
        err(`orphan twin ${dir}/${entry}/chronicle.md — no canonical page claims it`);
      }
    } else if (entry.endsWith(".md") && !expected.has(toPath(entry))) {
      err(`orphan twin ${dir}/${entry} — no canonical page claims it`);
    }
  }
}
scan("country", (f) => `/country/${f.replace(/\.md$/, "")}.md`);
scan("rankings", (f) => `/rankings/${f.replace(/\.md$/, "")}.md`);
scan("commodities", (f) => `/commodities/${f.replace(/\.md$/, "")}.md`);
scan("compare", (f) => `/compare/${f.replace(/\.md$/, "")}.md`);
scan("ledger", (f) => `/ledger/${f.replace(/\.md$/, "")}.md`);

// ── llms-full.txt under its cap ───────────────────────────────────────────
const fullBytes = Buffer.byteLength(llmsFullText(), "utf8");
if (fullBytes > LLMS_FULL_CAP) {
  err(`llms-full.txt is ${fullBytes.toLocaleString("en")} bytes — over the ${LLMS_FULL_CAP.toLocaleString("en")}-byte cap`);
}

// ── the neutrality rule on twins Terralore authors ────────────────────────
// Ranking and commodity twins are entirely Terralore copy + data labels, so
// "best"/"worst" appearing there is a language-rule breach, not a quotation.
// (Chronicle twins carry authored historical prose and are exempt — a treaty
// described as "the best terms available" is the corpus quoting history.)
// Compare twins are Terralore copy EXCEPT their list lines, which quote the
// corpus (event records, formation labels, source labels) — so those lines
// are stripped before the check, and the ban widens to winner-language,
// which a comparison page must never speak in.
for (const t of twins) {
  if (t.kind !== "ranking" && t.kind !== "commodity" && t.kind !== "compare" && t.kind !== "ledger") continue;
  // Ledger twins additionally ban valuation verbs outright: the record
  // publishes and revises, it never grades a movement (living-record §3.1).
  const banned =
    t.kind === "compare"
      ? /\b(best|worst|winner|loser)\b/i
      : t.kind === "ledger"
        ? /\b(best|worst|improved?|worsen(ed|ing)?|better|worse)\b/i
        : /\b(best|worst)\b/i;
  const text = t.kind === "compare" ? t.markdown.replace(/^- .*$/gm, "") : t.markdown;
  const hit = text.match(banned);
  if (hit) err(`${t.path}: contains "${hit[0]}" — figures are compared or ordered, never graded`);
}

console.log(
  `✓ geo twins: ${twins.length} checked (${Object.entries(counts)
    .map(([k, n]) => `${n} ${k}`)
    .join(", ")}) · llms-full ${(fullBytes / 1024).toFixed(0)} KB of ${(LLMS_FULL_CAP / 1024).toFixed(0)} KB cap`,
);
console.log(`\n${errors} error(s) in the GEO export layer.`);
process.exit(errors ? 1 : 0);
