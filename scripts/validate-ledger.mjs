// ── The Ledger's gate: entries are consistent, sequential and neutral ──────
//
// Asserts on every committed entry in public/ledger/:
//   · entry numbers are 1..N with no gaps; slug matches the filename
//   · counts match the changes array they summarize
//   · every change carries the fields its kind requires, and its claim ID
//     matches the TL: grammar
//   · corpus.before names a version that exists in the seal archive
//   · LANGUAGE — validator-enforced neutrality (living-record §3.1): the
//     entry's prose fields (title, summary, notes) and the ledger surfaces'
//     generated sentences may not grade: no improved/worsened/better/worse/
//     best/worst/progress/decline. Values are published, revised, withdrawn;
//     bounded scales move in points. (describeChange in lib/ledger.ts is
//     exercised against every committed change so a wording regression fails
//     here, not on a reader's screen.)
//
// Wired into `npm run validate`. Runs under the TS loader (describeChange).
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { describeChange } = await import("../lib/ledger.ts");

let errors = 0;
const err = (m) => {
  console.log(`  ✗ ${m}`);
  errors++;
};

const dir = join(root, "public", "ledger");
const files = existsSync(dir) ? readdirSync(dir).filter((f) => /^\d{4}\.json$/.test(f)).sort() : [];

const BANNED = /\b(improved?|improving|worsen(ed|ing)?|better|worse|best|worst|progress(ed)?|declin(e|ed|ing))\b/i;
const ID_RE = /^TL:[A-Z0-9]{3}:[A-Za-z0-9-]+:-?\d+$/;

let n = 0;
for (const f of files) {
  n++;
  const e = JSON.parse(readFileSync(join(dir, f), "utf8"));
  const name = `ledger/${f}`;

  if (e.entry !== n) err(`${name}: entry number ${e.entry}, expected ${n} (sequential, no gaps)`);
  if (`${e.slug}.json` !== f) err(`${name}: slug "${e.slug}" does not match filename`);
  if (!e.date || !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) err(`${name}: missing/malformed date`);
  if (!e.title) err(`${name}: missing title`);

  // counts ↔ changes
  const want = { new: 0, revised: 0, retired: 0 };
  for (const c of e.changes ?? []) {
    if (!(c.kind in want)) {
      err(`${name}: unknown change kind "${c.kind}"`);
      continue;
    }
    want[c.kind]++;
    if (!ID_RE.test(c.id)) err(`${name}: malformed claim ID "${c.id}"`);
    if (c.kind === "revised" && (!c.before || !c.after)) err(`${name}: revised ${c.id} missing before/after`);
    if (c.kind === "new" && !c.after) err(`${name}: new ${c.id} missing after`);
    if (c.kind === "retired" && !c.before) err(`${name}: retired ${c.id} missing before`);
    if (c.origin !== "upstream" && c.origin !== "terralore") err(`${name}: ${c.id} origin "${c.origin}"`);
    // the generated sentence obeys the language law too
    const sentence = describeChange(c);
    const hit = sentence.match(BANNED);
    if (hit) err(`${name}: generated wording for ${c.id} contains "${hit[0]}"`);
  }
  for (const k of Object.keys(want)) {
    if ((e.counts?.[k] ?? -1) !== want[k]) err(`${name}: counts.${k}=${e.counts?.[k]} but changes hold ${want[k]}`);
  }
  if ((e.counts?.sourceChanges ?? -1) !== (e.sourceChanges?.length ?? 0)) {
    err(`${name}: counts.sourceChanges disagrees with sourceChanges[]`);
  }

  // prose neutrality
  for (const [field, text] of [
    ["title", e.title],
    ["summary", e.summary],
    ...(e.notes ?? []).map((t, i) => [`notes[${i}]`, t]),
  ]) {
    const hit = (text ?? "").match(BANNED);
    if (hit) err(`${name}: ${field} contains "${hit[0]}" — the ledger records, it does not grade`);
  }

  // the before seal must exist in the archive
  if (e.corpus?.before?.version) {
    const seal = join(root, "public", "integrity", `${e.corpus.before.version}.json`);
    if (!existsSync(seal)) {
      err(`${name}: corpus.before ${e.corpus.before.version} not in the seal archive`);
    } else {
      const m = JSON.parse(readFileSync(seal, "utf8"));
      if (m.root !== e.corpus.before.root) err(`${name}: corpus.before root disagrees with archived seal`);
    }
  }
}

console.log(`✓ ledger: ${n} entr${n === 1 ? "y" : "ies"} checked`);
console.log(`\n${errors} error(s) in the ledger.`);
process.exit(errors ? 1 : 0);
