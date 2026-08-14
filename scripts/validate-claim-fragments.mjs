// ── Post-build check: every promised claim fragment resolves ───────────────
//
// The claims bundles promise that each claim's URL fragment exists as an
// element id on its canonical page. This asserts it against the prerendered
// HTML — the same output surface validate-seams reads — so a fragment can
// never 404 into thin air on the live site.
//
// Run after `next build` (wired into `npm run ci` beside the seam check):
//   node --import ./scripts/lib/ts-alias-loader.mjs scripts/validate-claim-fragments.mjs
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const appDir = join(root, ".next", "server", "app");
if (!existsSync(appDir)) {
  console.error(`validate-claim-fragments: ${appDir} not found — run next build first`);
  process.exit(1);
}

const { allClaimBundles } = await import("../lib/claims.ts");

let errors = 0;
let checked = 0;
const err = (m) => {
  if (errors < 25) console.log(`  ✗ ${m}`);
  errors++;
};

for (const b of allClaimBundles()) {
  const htmlPath = join(appDir, `${b.canonicalPath.replace(/^\//, "")}.html`);
  if (!existsSync(htmlPath)) {
    err(`${b.canonicalPath}: no prerendered HTML at ${htmlPath}`);
    continue;
  }
  const html = readFileSync(htmlPath, "utf8");
  for (const fragment of new Set(b.fragments)) {
    checked++;
    if (!html.includes(`id="${fragment}"`)) {
      err(`${b.canonicalPath}#${fragment} does not resolve — promised by ${b.path}`);
    }
  }
}

if (errors > 25) console.log(`  …and ${errors - 25} more`);
console.log(`✓ claim fragments: ${checked.toLocaleString("en")} checked against prerendered HTML`);
console.log(`\n${errors} unresolved fragment(s).`);
process.exit(errors ? 1 : 0);
