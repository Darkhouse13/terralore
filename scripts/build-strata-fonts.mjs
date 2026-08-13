// Build the Strata face subsets — the three faces of the P3 contract
// (docs/design/p3-contract.html), self-hosted as committed files in
// assets/fonts/. No runtime Google Fonts anywhere (house rule).
//
//   Bricolage Grotesque  — display  (variable; browsers keep auto optical sizing)
//   Schibsted Grotesk    — body     (variable wght 400–900; we use 400/500/700)
//   IBM Plex Mono        — data     (static 400 + 500)
//
// Two output families per face:
//   *.woff2         — the site faces, loaded via next/font/local in app/fonts.ts
//   *-social-*.ttf  — satori-compatible static instances for lib/og.tsx and
//                     scripts/lib/social/ (satori cannot read woff2 or variable
//                     fonts; instances are pinned per weight)
//
// Run:  npm i --no-save subset-font   (deliberately not a dependency — this
//       script runs once per font-change, not per build)
//       node scripts/build-strata-fonts.mjs <dir-with-source-ttfs>
//
// Sources (Google Fonts github, OFL):
//   ofl/bricolagegrotesque/BricolageGrotesque[opsz,wdth,wght].ttf
//   ofl/schibstedgrotesk/SchibstedGrotesk[wght].ttf
//   ofl/ibmplexmono/IBMPlexMono-{Regular,Medium}.ttf
//
// The charset is deliberately broader than the corpus's measured use — the
// social recipe's set (printable ASCII + Latin-1 + Latin Extended-A + the
// typographic extras) plus the contract's own UI glyphs (arrows, pointers,
// the proof-flip ⟲, the ∝ of the core legend) — so a new diacritic in a
// history edit or a new UI glyph does not knock a glyph out of the face.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const subsetFont = (await import("subset-font")).default;

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, "assets", "fonts");
const SRC = process.argv[2];
if (!SRC) {
  console.error("usage: node scripts/build-strata-fonts.mjs <dir-with-source-ttfs>");
  process.exit(1);
}

// ---- charset ---------------------------------------------------------------
let chars = "";
for (let c = 0x20; c <= 0x7e; c++) chars += String.fromCharCode(c); // ASCII
for (let c = 0xa0; c <= 0xff; c++) chars += String.fromCharCode(c); // Latin-1
for (let c = 0x100; c <= 0x17f; c++) chars += String.fromCharCode(c); // Latin Ext-A
chars += "ʿ–—‘’“”…·•°′″‰₂€×−"; // the social recipe's extras
chars += "↑↓←→▲▼◄►⟲∝≠≤≥"; // the contract's UI glyphs

// ---- sources ---------------------------------------------------------------
function src(nameFragment) {
  const f = fs.readdirSync(SRC).find((n) => decodeURIComponent(n).includes(nameFragment));
  if (!f) throw new Error(`source ttf matching "${nameFragment}" not found in ${SRC}`);
  return fs.readFileSync(path.join(SRC, f));
}
const bricolage = src("BricolageGrotesque");
const schibsted = src("SchibstedGrotesk");
const plexRegular = src("IBMPlexMono-Regular");
const plexMedium = src("IBMPlexMono-Medium");

// ---- outputs ---------------------------------------------------------------
const JOBS = [
  // site faces (woff2). The display face is pinned to the contract's one
  // weight (800) and normal width; opsz stays variable so browsers keep
  // automatic optical sizing from 17px bed headers up to the 56px stamp.
  {
    src: bricolage,
    out: "bricolage-display.woff2",
    format: "woff2",
    axes: { wght: 800, wdth: 100, opsz: { min: 12, max: 96 } },
  },
  {
    src: schibsted,
    out: "schibsted-body.woff2",
    format: "woff2",
    axes: { wght: { min: 400, max: 700 } },
  },
  { src: plexRegular, out: "plexmono-400.woff2", format: "woff2" },
  { src: plexMedium, out: "plexmono-500.woff2", format: "woff2" },
  // satori faces (static sfnt instances)
  {
    src: bricolage,
    out: "bricolage-social-800.ttf",
    format: "sfnt",
    axes: { wght: 800, opsz: 36, wdth: 100 },
  },
  { src: schibsted, out: "schibsted-social-400.ttf", format: "sfnt", axes: { wght: 400 } },
  { src: schibsted, out: "schibsted-social-700.ttf", format: "sfnt", axes: { wght: 700 } },
  { src: plexRegular, out: "plexmono-social-400.ttf", format: "sfnt" },
  { src: plexMedium, out: "plexmono-social-500.ttf", format: "sfnt" },
];

fs.mkdirSync(OUT, { recursive: true });
for (const job of JOBS) {
  const buf = await subsetFont(job.src, chars, {
    targetFormat: job.format,
    ...(job.axes ? { variationAxes: job.axes } : {}),
  });
  fs.writeFileSync(path.join(OUT, job.out), buf);
  console.log(`${job.out.padEnd(28)} ${(buf.length / 1024).toFixed(1)} KB`);
}
console.log("done — commit assets/fonts/ and keep the woff2 names stable (next/font/local paths).");
