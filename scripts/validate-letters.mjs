// ── The letters' gate: committed artifacts are fresh, paired and neutral ───
//
// The twin pattern (geo/claims precedent): every committed letter is
// regenerated from its entry and byte-compared — freshness IS identity. Then:
//   · all four artifacts exist per letter (page/campaign × html/text)
//   · a letter's entry exists, and its cited seal version resolves
//   · LANGUAGE — the ledger's law binds the letter (living-record §3.1):
//     no grading words anywhere in the generated prose
//   · the campaign variants carry {{ UnsubscribeURL }}; the page variants
//     carry none of listmonk's template syntax
//   · no tracking pixel, no rewritten links (the privacy page's promise)
//
// Wired into `npm run validate`. Runs under the TS loader.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildLetter } from "./lib/letter.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

let errors = 0;
const err = (m) => {
  console.log(`  ✗ ${m}`);
  errors++;
};

const pubDir = join(root, "public", "ledger", "letter");
const slugs = existsSync(pubDir)
  ? readdirSync(pubDir)
      .filter((f) => /^\d{4}\.html$/.test(f))
      .map((f) => f.replace(/\.html$/, ""))
      .sort()
  : [];

const BANNED = /\b(improved?|improving|worsen(ed|ing)?|better|worse|best|worst|progress(ed)?|declin(e|ed|ing))\b/i;

for (const slug of slugs) {
  const fresh = buildLetter(slug, root);
  const artifacts = [
    [join(pubDir, `${slug}.html`), fresh.html.page],
    [join(pubDir, `${slug}.txt`), fresh.text.page],
    [join(root, "data", "letters", `${slug}.campaign.html`), fresh.html.campaign],
    [join(root, "data", "letters", `${slug}.campaign.txt`), fresh.text.campaign],
  ];
  for (const [file, want] of artifacts) {
    if (!existsSync(file)) {
      err(`letter ${slug}: missing ${file.replace(root + "/", "")}`);
      continue;
    }
    const have = readFileSync(file, "utf8");
    if (have !== want)
      err(`letter ${slug}: ${file.replace(root + "/", "")} is stale — rerun build-letter --entry ${slug}`);
  }

  for (const [label, text] of [
    ["page html", fresh.html.page],
    ["page text", fresh.text.page],
    ["campaign html", fresh.html.campaign],
    ["campaign text", fresh.text.campaign],
  ]) {
    const m = text.match(BANNED);
    if (m) err(`letter ${slug} ${label}: banned grading word "${m[0]}"`);
  }

  if (!fresh.html.campaign.includes("{{ UnsubscribeURL }}"))
    err(`letter ${slug}: campaign html missing {{ UnsubscribeURL }}`);
  if (!fresh.text.campaign.includes("{{ UnsubscribeURL }}"))
    err(`letter ${slug}: campaign text missing {{ UnsubscribeURL }}`);
  if (/\{\{/.test(fresh.html.page) || /\{\{/.test(fresh.text.page))
    err(`letter ${slug}: page variant leaks template syntax`);
  if (/TrackView|TrackLink|\/campaign\/.*\/px\.png/.test(fresh.html.campaign))
    err(`letter ${slug}: tracking construct in campaign html (the privacy promise bans it)`);
}

console.log(
  errors === 0
    ? `✓ letters: ${slugs.length} letter${slugs.length === 1 ? "" : "s"} fresh, paired, neutral, untracked`
    : `${errors} letter error(s)`,
);
process.exit(errors ? 1 : 0);
