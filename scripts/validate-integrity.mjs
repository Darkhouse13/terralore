// ── The Seal's gate: the committed manifest must match the committed corpus ─
//
// Recomputes every hash build-integrity.mjs would cut and compares against
// public/integrity.json. Wired into `npm run ci` (not plain validate): any
// state that ships is sealed, while intermediate commits inside a mission
// need not each cut a version (docs/living-record.md §2.3). A failure here
// means: run `npm run build-integrity` and commit the new seal.
//
// Also asserts: the archive copy of the current version is byte-identical
// (append-only means the current seal is IN the archive), and
// data/corpus-version.json (the stamp lib/seo.ts wires into JSON-LD) agrees
// with the manifest.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { corpusFiles } from "./lib/corpus-files.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

let errors = 0;
const err = (m) => {
  console.log(`  ✗ ${m}`);
  errors++;
};

const manifestPath = join(root, "public", "integrity.json");
if (!existsSync(manifestPath)) {
  console.log("  ✗ public/integrity.json missing — run npm run build-integrity");
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

let drift = 0;
for (const [path, hash] of Object.entries(manifest.files)) {
  const abs = join(root, path);
  if (!existsSync(abs)) {
    err(`sealed file missing: ${path}`);
    continue;
  }
  if (sha256(readFileSync(abs)) !== hash) {
    drift++;
    if (drift <= 5) err(`sealed file changed since version ${manifest.version}: ${path}`);
  }
}
if (drift > 5) err(`…and ${drift - 5} more changed files`);

// files the corpus now holds that the seal never saw (a new nation, a new
// bundle class) — the same listing the builder cuts from, so nothing can be
// sealed by one and invisible to the other.
for (const f of corpusFiles(root)) {
  if (!(f in manifest.files)) err(`unsealed corpus file: ${f}`);
}
if (drift) console.log("    → the corpus moved; cut a new seal: npm run build-integrity");

// files present in the corpus but not in the seal (a new nation, a new bundle)
// are caught by re-running the builder's own listing logic cheaply: the root
// over the manifest's own lines must still match.
const canonical =
  Object.keys(manifest.files)
    .sort()
    .map((f) => `${manifest.files[f]}  ${f}`)
    .join("\n") + "\n";
if (sha256(canonical) !== manifest.root) {
  err("manifest root does not match its own file list — the manifest was hand-edited");
}

const archive = join(root, "public", "integrity", `${manifest.version}.json`);
if (!existsSync(archive)) {
  err(`archive copy missing: public/integrity/${manifest.version}.json (the archive is append-only)`);
} else if (readFileSync(archive, "utf8") !== readFileSync(manifestPath, "utf8")) {
  err(`archive copy of ${manifest.version} differs from public/integrity.json`);
}

const stampPath = join(root, "data", "corpus-version.json");
if (!existsSync(stampPath)) {
  err("data/corpus-version.json missing — run npm run build-integrity");
} else {
  const stamp = JSON.parse(readFileSync(stampPath, "utf8"));
  if (stamp.version !== manifest.version || stamp.root !== manifest.root) {
    err("data/corpus-version.json disagrees with public/integrity.json");
  }
}

console.log(
  `✓ seal: version ${manifest.version} · root ${manifest.root.slice(0, 16)}… · ` +
    `${Object.keys(manifest.files).length} files verified`,
);
console.log(`\n${errors} error(s) in the seal.`);
process.exit(errors ? 1 : 0);
