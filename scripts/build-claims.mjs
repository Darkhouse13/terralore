// ── Build the claims layer: per-surface claim bundles into public/ ─────────
//
// Writes every bundle lib/claims.ts composes to public/<canonical>.claims.json,
// where it serves as a static file (the markdown-twin pattern — public assets
// win over dynamic route segments). Committed, so deploys carry them
// regardless of the host's build command; scripts/validate-claims.mjs
// regenerates and byte-compares on every `npm run validate`.
//
// Chained into `npm run build-domains` (data refresh ⇒ claims refresh) and
// runnable alone via `npm run build-claims`.
//
// MUST run under the TS loader:
//   node --import ./scripts/lib/ts-alias-loader.mjs scripts/build-claims.mjs
import { writeFileSync, mkdirSync, readdirSync, rmSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { allClaimBundles } = await import("../lib/claims.ts");

const bundles = allClaimBundles();

let bytes = 0;
let claims = 0;
const expected = new Set();
for (const b of bundles) {
  const out = join(root, "public", b.path.replace(/^\//, ""));
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, b.json);
  bytes += Buffer.byteLength(b.json, "utf8");
  claims += b.ids.length;
  expected.add(b.path);
}

// Prune stale bundles — a removed nation or commodity must not leave a ghost
// file claiming to be current. Only the managed shapes are touched.
let pruned = 0;
function prune(dir, toPath) {
  const abs = join(root, "public", dir);
  if (!existsSync(abs)) return;
  for (const entry of readdirSync(abs)) {
    const p = join(abs, entry);
    if (entry.endsWith(".claims.json") && statSync(p).isFile() && !expected.has(toPath(entry))) {
      rmSync(p);
      pruned++;
      console.log(`  pruned stale claims ${dir}/${entry}`);
    }
  }
}
prune("country", (f) => `/country/${f.replace(/\.claims\.json$/, "")}.claims.json`);
prune("commodities", (f) => `/commodities/${f.replace(/\.claims\.json$/, "")}.claims.json`);
// chronicle bundles live one level deeper: public/country/<CODE>/chronicle.claims.json
const countryDir = join(root, "public", "country");
if (existsSync(countryDir)) {
  for (const entry of readdirSync(countryDir)) {
    const sub = join(countryDir, entry);
    if (statSync(sub).isDirectory()) {
      const f = join(sub, "chronicle.claims.json");
      if (existsSync(f) && !expected.has(`/country/${entry}/chronicle.claims.json`)) {
        rmSync(f);
        pruned++;
        console.log(`  pruned stale claims country/${entry}/chronicle.claims.json`);
      }
    }
  }
}

const byKind = {};
for (const b of bundles) byKind[b.kind] = (byKind[b.kind] ?? 0) + 1;
console.log(
  `✓ claims: ${claims.toLocaleString("en")} claim IDs in ${bundles.length} bundles (${Object.entries(byKind)
    .map(([k, n]) => `${n} ${k}`)
    .join(", ")}) → public/ · ${(bytes / 1024).toFixed(0)} KB` + (pruned ? ` · ${pruned} pruned` : ""),
);
