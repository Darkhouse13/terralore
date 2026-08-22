// ── The sealed set: which files ARE the corpus ─────────────────────────────
// One listing, shared by build-integrity.mjs (cuts the seal) and
// validate-integrity.mjs (asserts it), so a file class cannot be sealed by
// one and invisible to the other. See docs/living-record.md §2.1.
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export function corpusFiles(root) {
  function listDir(dir, filter) {
    const abs = join(root, dir);
    if (!existsSync(abs)) return [];
    return readdirSync(abs)
      .filter((f) => statSync(join(abs, f)).isFile() && filter(f))
      .map((f) => `${dir}/${f}`);
  }
  function listCountrySubfiles(name) {
    const dir = join(root, "public", "country");
    if (!existsSync(dir)) return [];
    const out = [];
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      if (statSync(p).isDirectory() && existsSync(join(p, name))) {
        out.push(`public/country/${entry}/${name}`);
      }
    }
    return out;
  }
  function listTree(dir, filter) {
    const abs = join(root, dir);
    if (!existsSync(abs)) return [];
    const out = [];
    const visit = (current, relative) => {
      for (const entry of readdirSync(current)) {
        const full = join(current, entry);
        const path = `${relative}/${entry}`;
        if (statSync(full).isDirectory()) visit(full, path);
        else if (filter(entry)) out.push(path);
      }
    };
    visit(abs, dir);
    return out;
  }

  return [
    // (a) the source corpus — repo paths, verifiable in the public git history
    ...listDir("lib/histories/data", (f) => f.endsWith(".json")),
    "lib/histories/france.ts",
    "data/countries.json",
    ...listDir("data/domains", (f) => f.endsWith(".json")),
    "data/commodities.json",
    "data/compare-pairs.json",
    "data/compare-aliases.json",
    "data/ranking-slugs.json",
    // ledger entries live in public/ (fetchable at /ledger/<slug>.json — the
    // committed file IS the record) and are sealed like every derivation
    ...listDir("public/ledger", (f) => f.endsWith(".json")),
    // sent letters are records too: the archived copy of what was mailed,
    // append-only like the entries they digest
    ...listDir("public/ledger/letter", (f) => f.endsWith(".html") || f.endsWith(".txt")),
    // (b) the published derivations — fetchable at the same path on the live
    // site without the public/ prefix
    ...listDir("public/country", (f) => f.endsWith(".claims.json") || f.endsWith(".md")),
    ...listCountrySubfiles("chronicle.claims.json"),
    ...listCountrySubfiles("chronicle.md"),
    ...listDir("public/commodities", (f) => f.endsWith(".claims.json") || f.endsWith(".md")),
    ...listDir("public/rankings", (f) => f.endsWith(".md")),
    ...listDir("public/compare", (f) => f.endsWith(".md")),
    ...listTree("public/datasets/chronicle-events", () => true),
  ].sort();
}
