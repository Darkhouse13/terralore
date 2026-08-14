// ── The Seal: cut the corpus manifest ──────────────────────────────────────
//
// The Living Record's Layer 2 (docs/living-record.md §2). Hashes every corpus
// file — the source data (histories, domains, commodities, countries, ledger)
// and the published derivations a reader actually fetches (claims bundles,
// markdown twins) — into public/integrity.json, with a root hash over the
// whole set, the seal timestamp, and the data vintages.
//
// The honest claim is tamper-EVIDENCE, not tamper-proofing: every seal is
// archived append-only in public/integrity/<version>.json and committed to
// the public git history, so the corpus cannot be silently rewritten — a
// rewritten file hashes differently than the manifest everyone already has.
//
// Root construction (deliberately boring, verifiable with sha256sum alone):
//   root = SHA-256 of the file list in canonical form — "<sha256>  <path>"
//   lines, sorted bytewise by path, LF-joined, one trailing newline.
//
// Idempotent: if no hashed file changed since the current manifest, nothing
// is written (the seal's version and timestamp are facts about when the
// corpus changed, not about when the script ran). A changed corpus cuts a
// new version: the date, with .2/.3… on a same-day reseal.
//
// Chained at the end of `npm run build-domains`; run alone after content
// edits via `npm run build-integrity`. `npm run ci` fails if the committed
// manifest does not match the committed corpus (validate-integrity.mjs).
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { corpusFiles } from "./lib/corpus-files.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/* ── the hashed set — one listing, shared with validate-integrity ─────────── */
const files = corpusFiles(root);

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

const hashes = {};
for (const f of files) hashes[f] = sha256(readFileSync(join(root, f)));

const canonical = files.map((f) => `${hashes[f]}  ${f}`).join("\n") + "\n";
const rootHash = sha256(canonical);

/* ── vintages ──────────────────────────────────────────────────────────────── */

const vintages = {};
for (const f of files.filter((x) => x.startsWith("data/domains/"))) {
  const d = JSON.parse(readFileSync(join(root, f), "utf8"));
  vintages[d.domain] = d.updated;
}
vintages.commodities = JSON.parse(readFileSync(join(root, "data/commodities.json"), "utf8")).updated;
{
  let latest = "";
  for (const f of files.filter((x) => x.startsWith("lib/histories/data/"))) {
    const m = readFileSync(join(root, f), "utf8").match(/"updated":\s*"([0-9-]+)"/);
    if (m && m[1] > latest) latest = m[1];
  }
  vintages.histories = latest;
}

/* ── idempotence + versioning ─────────────────────────────────────────────── */

const currentPath = join(root, "public", "integrity.json");
const current = existsSync(currentPath) ? JSON.parse(readFileSync(currentPath, "utf8")) : null;

if (current && current.root === rootHash) {
  console.log(`✓ seal unchanged: corpus root ${rootHash.slice(0, 16)}… is already version ${current.version}`);
  process.exit(0);
}

const today = new Date().toISOString().slice(0, 10);
let version = today;
const archiveDir = join(root, "public", "integrity");
mkdirSync(archiveDir, { recursive: true });
for (let n = 2; existsSync(join(archiveDir, `${version}.json`)); n++) version = `${today}.${n}`;

const manifest = {
  version,
  sealed: new Date().toISOString(),
  root: rootHash,
  rootConstruction:
    'SHA-256 of the file list in canonical form: "<sha256>  <path>" lines, sorted by path, ' +
    "LF-joined, one trailing newline — reproducible with sha256sum alone. Paths under public/ " +
    "are fetchable at the same path on https://terralore.co (without the public/ prefix); " +
    "repo paths are verifiable in the public git history at " +
    "https://github.com/Darkhouse13/terralore. How to verify: https://terralore.co/integrity",
  previous: current ? { version: current.version, root: current.root } : null,
  counts: { files: files.length },
  vintages,
  files: hashes,
};

const json = JSON.stringify(manifest, null, 1) + "\n";
writeFileSync(currentPath, json);
writeFileSync(join(archiveDir, `${version}.json`), json);
// The tiny version stamp lib/seo.ts wires into every Dataset node — small
// enough to import anywhere without dragging the manifest along.
writeFileSync(
  join(root, "data", "corpus-version.json"),
  JSON.stringify({ version, root: rootHash, sealed: manifest.sealed }, null, 1) + "\n",
);

console.log(
  `✓ seal cut: version ${version} · root ${rootHash.slice(0, 16)}… · ${files.length} files hashed` +
    (current ? ` · supersedes ${current.version}` : " · first seal"),
);
