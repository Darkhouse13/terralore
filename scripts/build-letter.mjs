// ── Build one Ledger Letter from its entry ─────────────────────────────────
//   node --import ./scripts/lib/ts-alias-loader.mjs scripts/build-letter.mjs --entry 0001
//   (or: npm run build-letter -- --entry 0001)
//
// Writes the four artifacts (see scripts/lib/letter.mjs):
//   public/ledger/letter/<NNNN>.html + .txt   — the archived, served copies
//   data/letters/<NNNN>.campaign.html + .txt  — what the send uploads
//
// Building is not sending: the send is its own deliberate act
// (docs/newsletter-ops.md), exactly as recording is.
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildLetter } from "./lib/letter.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const idx = process.argv.indexOf("--entry");
const slug = idx > -1 ? process.argv[idx + 1] : null;
if (!slug || !/^\d{4}$/.test(slug)) {
  console.error("usage: build-letter.mjs --entry <NNNN>   (e.g. --entry 0001)");
  process.exit(1);
}

const letter = buildLetter(slug, root);

const pubDir = join(root, "public", "ledger", "letter");
const dataDir = join(root, "data", "letters");
mkdirSync(pubDir, { recursive: true });
mkdirSync(dataDir, { recursive: true });

writeFileSync(join(pubDir, `${slug}.html`), letter.html.page);
writeFileSync(join(pubDir, `${slug}.txt`), letter.text.page);
writeFileSync(join(dataDir, `${slug}.campaign.html`), letter.html.campaign);
writeFileSync(join(dataDir, `${slug}.campaign.txt`), letter.text.campaign);

console.log(`✓ letter № ${slug} — "${letter.subject}"`);
console.log(`  public/ledger/letter/${slug}.html (${letter.html.page.length.toLocaleString("en")} B) + .txt`);
console.log(`  data/letters/${slug}.campaign.html + .txt`);
