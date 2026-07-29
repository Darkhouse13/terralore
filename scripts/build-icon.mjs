#!/usr/bin/env node
// ── The mark ────────────────────────────────────────────────────────────────
// Generates every raster/vector form of the Terralore mark from one geometry:
//
//   app/icon0.svg       the favicon — TRANSPARENT, circular, `sizes="any"`.
//                       This is what a browser tab actually shows; SVG keeps
//                       the bands crisp at 16px where a downscaled PNG smears.
//   app/icon1.png       512px transparent raster — the Organization logo the
//                       JSON-LD points at (Google wants a raster) and the
//                       fallback for browsers that skip SVG favicons.
//   app/favicon.ico     16+32+48 PNG-encoded ICO — the file browsers weight
//                       most heavily for the tab, served FIRST in the head, and
//                       the one place the old gold compass survived longest
//                       (a binary matches no grep; it sat there through two
//                       redesign passes). Same PNG-in-ICO structure the old
//                       file used, so compatibility is proven by its own past.
//   app/apple-icon.png  180px on a SOLID deep ground. Deliberate: iOS
//                       composites transparency onto black and does its own
//                       corner masking, so a transparent apple-touch-icon
//                       renders as a mangled black square. Solid is correct
//                       here and only here.
//
// The mark itself is the STRATUM signature reduced to its legible minimum: a
// sphere cut in section, five bands, ringed by the shoal. Five, not the seven
// the first cut had — at 16px a 3%-tall band is sub-pixel mush, and a favicon
// that only reads at 512px is a poster, not a favicon.
//
// The replaced mark was a gold compass rose on black — the old identity's
// logo, which survived two redesign passes in app/apple-icon.png because a
// binary file matches no grep.
//
// Run: node scripts/build-icon.mjs   (chained into `npm run build-data`)

import { writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// STRATUM tokens as literals — this runs outside the CSS layer.
const DEPTH_6 = "#04161f";
const DEPTH_5 = "#082230";
const SHOAL = "#276f80";
const LIMESTONE = "#ebe9e0";
const COPPER = "#c87244";
const VERDIGRIS = "#57a695";

/**
 * One geometry, parameterised only by canvas size.
 *
 * Band edges are fractions of the sphere's diameter, tuned for the 16px tab:
 * the limestone cap and the deep bottom are the two big fields that carry the
 * silhouette on dark and light tab bars respectively; copper and verdigris are
 * the two thin signals between them; the shoal ring draws the circle's edge on
 * any ground, which is what lets the background be transparent without the
 * mark dissolving into a matching backdrop.
 */
function markSvg(size, { background = null } = {}) {
  const c = size / 2;
  const r = size * 0.46;
  const stroke = Math.max(1, size * 0.036);
  const top = c - r;
  const d = r * 2;

  const BANDS = [
    [0.0, 0.28, LIMESTONE],
    [0.28, 0.37, COPPER],
    [0.37, 0.47, DEPTH_5],
    [0.47, 0.59, VERDIGRIS],
    [0.59, 1.0, DEPTH_5],
  ];

  const bands = BANDS.map(
    ([a, b, fill]) =>
      `<rect x="0" y="${(top + a * d).toFixed(2)}" width="${size}" height="${((b - a) * d + 0.75).toFixed(2)}" fill="${fill}"/>`,
  ).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <title>Terralore</title>
  <defs><clipPath id="s"><circle cx="${c}" cy="${c}" r="${r}"/></clipPath></defs>
  ${background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : ""}
  <g clip-path="url(#s)">${bands}</g>
  <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${SHOAL}" stroke-width="${stroke}"/>
</svg>`;
}

// ── the favicon: transparent SVG ────────────────────────────────────────────
const svg = markSvg(48);
writeFileSync(join(root, "app/icon0.svg"), svg);

// ── the logo raster: 512, transparent ───────────────────────────────────────
const png = await sharp(Buffer.from(markSvg(512))).png({ compressionLevel: 9 }).toBuffer();
writeFileSync(join(root, "app/icon1.png"), png);

// The old single-file name is superseded by the numbered pair; leave nothing
// behind to double-emit.
rmSync(join(root, "app/icon.png"), { force: true });

// ── the apple icon: 180, solid ground ───────────────────────────────────────
const apple = await sharp(Buffer.from(markSvg(180, { background: DEPTH_6 })))
  .png({ compressionLevel: 9 })
  .toBuffer();
writeFileSync(join(root, "app/apple-icon.png"), apple);

// ── the .ico: 16 + 32 + 48, PNG-encoded ─────────────────────────────────────
const icoSizes = [16, 32, 48];
const icoPngs = [];
for (const sz of icoSizes) {
  icoPngs.push(await sharp(Buffer.from(markSvg(sz))).png({ compressionLevel: 9 }).toBuffer());
}
const dir = Buffer.alloc(6 + 16 * icoSizes.length);
dir.writeUInt16LE(0, 0); // reserved
dir.writeUInt16LE(1, 2); // type: icon
dir.writeUInt16LE(icoSizes.length, 4);
let offset = dir.length;
icoSizes.forEach((sz, i) => {
  const e = 6 + i * 16;
  dir.writeUInt8(sz === 256 ? 0 : sz, e); // width
  dir.writeUInt8(sz === 256 ? 0 : sz, e + 1); // height
  dir.writeUInt8(0, e + 2); // palette
  dir.writeUInt8(0, e + 3); // reserved
  dir.writeUInt16LE(1, e + 4); // planes
  dir.writeUInt16LE(32, e + 6); // bpp
  dir.writeUInt32LE(icoPngs[i].length, e + 8);
  dir.writeUInt32LE(offset, e + 12);
  offset += icoPngs[i].length;
});
const ico = Buffer.concat([dir, ...icoPngs]);
writeFileSync(join(root, "app/favicon.ico"), ico);

// ── legibility proof: render the SVG at tab size, upscaled for human review ──
const proof = await sharp(Buffer.from(svg), { density: 72 })
  .resize(16, 16)
  .png()
  .toBuffer();
const proofBig = await sharp(proof).resize(256, 256, { kernel: "nearest" }).png().toBuffer();
writeFileSync(join(root, "design-review/icon-16px-proof.png"), proofBig);

console.log(
  `icon0.svg ${(svg.length / 1024).toFixed(1)} KB · icon1.png ${(png.length / 1024).toFixed(1)} KB (512, transparent) · favicon.ico ${(ico.length / 1024).toFixed(1)} KB (16+32+48) · apple-icon.png ${(apple.length / 1024).toFixed(1)} KB (180, solid) · 16px proof written`,
);
