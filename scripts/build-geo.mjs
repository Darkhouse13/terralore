// ── Build the GEO export layer: markdown twins into public/ ────────────────
//
// Writes every twin lib/geo.ts composes to public/<canonical-path>.md, where
// it serves as a static file at the exact .md URL (public assets win over
// dynamic route segments — verified against the built server; Next serves
// .md with `text/markdown` from the extension). Committed, like every other
// derived artefact in this repo, so deploys carry them regardless of which
// build command the host runs; scripts/validate-geo.mjs regenerates and
// byte-compares on every `npm run validate`, so a stale twin fails the gate.
//
// Chained into `npm run build-domains` (data refresh ⇒ twin refresh) and
// runnable alone via `npm run build-geo`.
//
// MUST run under the TS loader:
//   node --import ./scripts/lib/ts-alias-loader.mjs scripts/build-geo.mjs
import { writeFileSync, mkdirSync, readdirSync, rmSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { allTwins, llmsFullText, LLMS_FULL_CAP } = await import("../lib/geo.ts");

const twins = allTwins();

// Fail the build before writing anything if the full export breaches its cap —
// a too-big llms-full.txt must not ship, and catching it here beats catching
// it in a validator after the fact.
const full = llmsFullText();
if (Buffer.byteLength(full, "utf8") > LLMS_FULL_CAP) {
  console.error(
    `✗ llms-full.txt would be ${Buffer.byteLength(full, "utf8").toLocaleString("en")} bytes — ` +
      `over the ${LLMS_FULL_CAP.toLocaleString("en")}-byte cap. Trim before shipping.`,
  );
  process.exit(1);
}

let bytes = 0;
const expected = new Set();
for (const t of twins) {
  const out = join(root, "public", t.path.replace(/^\//, ""));
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, t.markdown);
  bytes += Buffer.byteLength(t.markdown, "utf8");
  expected.add(t.path);
}

// Prune stale twins (a removed nation or metric must not leave a ghost file
// claiming to be current). Only the four managed shapes are touched — nothing
// else in public/ is ours to delete.
let pruned = 0;
function pruneDir(dir, toPath) {
  const abs = join(root, "public", dir);
  if (!existsSync(abs)) return;
  for (const entry of readdirSync(abs)) {
    const p = join(abs, entry);
    if (entry.endsWith(".md") && statSync(p).isFile() && !expected.has(toPath(entry))) {
      rmSync(p);
      pruned++;
      console.log(`  pruned stale twin ${dir}/${entry}`);
    }
  }
}
pruneDir("country", (f) => `/country/${f.replace(/\.md$/, "")}.md`);
pruneDir("rankings", (f) => `/rankings/${f.replace(/\.md$/, "")}.md`);
pruneDir("commodities", (f) => `/commodities/${f.replace(/\.md$/, "")}.md`);
pruneDir("compare", (f) => `/compare/${f.replace(/\.md$/, "")}.md`);
pruneDir("ledger", (f) => `/ledger/${f.replace(/\.md$/, "")}.md`); // .md only — entry .json files are the record itself
// chronicle twins live one level deeper: public/country/<CODE>/chronicle.md
const countryDir = join(root, "public", "country");
if (existsSync(countryDir)) {
  for (const entry of readdirSync(countryDir)) {
    const sub = join(countryDir, entry);
    if (statSync(sub).isDirectory()) {
      const f = join(sub, "chronicle.md");
      if (existsSync(f) && !expected.has(`/country/${entry}/chronicle.md`)) {
        rmSync(f);
        pruned++;
        console.log(`  pruned stale twin country/${entry}/chronicle.md`);
      }
    }
  }
}

const byKind = {};
for (const t of twins) byKind[t.kind] = (byKind[t.kind] ?? 0) + 1;
console.log(
  `✓ geo twins: ${twins.length} files (${Object.entries(byKind)
    .map(([k, n]) => `${n} ${k}`)
    .join(", ")}) → public/ · ${(bytes / 1024).toFixed(0)} KB` +
    (pruned ? ` · ${pruned} pruned` : ""),
);
console.log(
  `✓ llms-full.txt: ${(Buffer.byteLength(full, "utf8") / 1024).toFixed(0)} KB of ${(LLMS_FULL_CAP / 1024).toFixed(0)} KB cap`,
);
