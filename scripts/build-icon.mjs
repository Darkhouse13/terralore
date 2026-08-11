#!/usr/bin/env node
// ── The mark ────────────────────────────────────────────────────────────────
// Generates every raster/vector form of the Terralore mark — ZENITH: horizon,
// dome, meridians, and the copper point at the zenith — from the two frozen
// cuts. Geometry source of truth: docs/brand/exploration-svgs/ and the
// construction tables in DESIGN.md ("The brand mark — ZENITH"); the in-app
// twin of these paths lives in components/brand/geometry.ts. The paths are
// final — clean them, never redraw them.
//
//   app/icon0.svg        the favicon — TRANSPARENT compact cut, theme-adaptive:
//                        ink by default, chalk under prefers-color-scheme:dark,
//                        so it reads on both tab-bar colours. `sizes="any"`.
//   app/favicon.ico      16+32+48 PNG-encoded ICO — the file browsers weight
//                        most heavily. Rasters cannot media-query, so these
//                        sit chalk on a depth-6 rounded plate: legible on any
//                        tab bar by carrying their own ground.
//   app/icon1.png        512 px, full cut with the copper accent on SOLID
//                        depth-6 — the Organization logo the JSON-LD points at
//                        (Google wants a raster that survives any backdrop)
//                        and the fallback for browsers that skip SVG favicons.
//   app/apple-icon.png   180 px on solid depth-6. iOS composites transparency
//                        onto black and does its own corner masking; solid is
//                        correct here and only here… and now everywhere, since
//                        one-colour-on-transparent cannot survive both tab
//                        themes as a raster.
//   public/icon-192.png  manifest icons (app/manifest.ts). The mark is inset
//   public/icon-512.png  to the maskable safe zone — a launcher may crop these
//                        to a circle of 80% of the frame.
//
// The replaced mark was the STRATUM sphere-in-section (and before it, a gold
// compass rose that survived two redesigns inside binaries no grep could see).
//
// Run: node scripts/build-icon.mjs   (chained into `npm run build-data`)

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Stratum tokens as literals — this runs outside the CSS layer.
const CHALK = "#e6ecea";
const INK = "#16201e";
const COPPER = "#c87244";
const DEPTH_6 = "#04161f";

// The two frozen cuts (see components/brand/geometry.ts — keep in step).
const FULL = {
  vb: 96,
  path: "M8 66 H88 M16 66 A32 32 0 0 1 80 66 M48 66 V34 M30 66 A18 32 0 0 1 48 34 M48 34 A18 32 0 0 1 66 66",
  stroke: 5.5,
  dot: { cx: 48, cy: 21, r: 4.5 },
};
const COMPACT = {
  vb: 32,
  path: "M2 23.5 H30 M6 23.5 A10 10 0 0 1 26 23.5 M16 23.5 V13.5 M10.5 23.5 A5.5 10 0 0 1 16 13.5 M16 13.5 A5.5 10 0 0 1 21.5 23.5",
  stroke: 2.75,
  dot: { cx: 16, cy: 8.5, r: 2 },
};

/**
 * One cut as SVG. `margin` (in grid units) pads the viewBox symmetrically —
 * how the plate forms buy clearspace without touching the drawing. `accent`
 * only ever applies to the full cut: the compact cut is one-colour by
 * construction (DESIGN.md).
 */
function markSvg(cut, { fg, accent = false, background = null, radius = 0, margin = 0 } = {}) {
  const vb = cut.vb + margin * 2;
  const dot = accent ? COPPER : fg;
  const plate = background
    ? `<rect x="${-margin}" y="${-margin}" width="${vb}" height="${vb}" rx="${radius}" fill="${background}"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-margin} ${-margin} ${vb} ${vb}">
  <title>Terralore</title>
  ${plate}
  <path d="${cut.path}" fill="none" stroke="${fg}" stroke-width="${cut.stroke}"/>
  <circle cx="${cut.dot.cx}" cy="${cut.dot.cy}" r="${cut.dot.r}" fill="${dot}"/>
</svg>`;
}

const png = (svg, size) =>
  sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

// ── the favicon: transparent SVG, theme-adaptive ────────────────────────────
// A vector favicon may carry a media query; rasters below carry a plate.
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <title>Terralore</title>
  <style>svg{color:${INK}}@media(prefers-color-scheme:dark){svg{color:${CHALK}}}</style>
  <path d="${COMPACT.path}" fill="none" stroke="currentColor" stroke-width="${COMPACT.stroke}"/>
  <circle cx="${COMPACT.dot.cx}" cy="${COMPACT.dot.cy}" r="${COMPACT.dot.r}" fill="currentColor"/>
</svg>`;
writeFileSync(join(root, "app/icon0.svg"), faviconSvg);

// ── the logo raster: 512, full cut, accent, solid ground ────────────────────
const logoSvg = markSvg(FULL, { fg: CHALK, accent: true, background: DEPTH_6, margin: 16 });
writeFileSync(join(root, "app/icon1.png"), await png(logoSvg, 512));

// ── the apple icon: 180, solid ground ───────────────────────────────────────
writeFileSync(join(root, "app/apple-icon.png"), await png(logoSvg, 180));

// ── the manifest icons: 192 + 512, maskable-safe inset ──────────────────────
// Safe zone is the central 80% circle; margin 24 puts the 80-unit horizon at
// 80/144 ≈ 56% of the frame — inside the zone with the dot included.
const maskableSvg = markSvg(FULL, { fg: CHALK, accent: true, background: DEPTH_6, margin: 24 });
writeFileSync(join(root, "public/icon-192.png"), await png(maskableSvg, 192));
writeFileSync(join(root, "public/icon-512.png"), await png(maskableSvg, 512));

// ── the .ico: 16 + 32 + 48, compact cut on a rounded depth-6 plate ──────────
const icoSizes = [16, 32, 48];
const icoSvg = markSvg(COMPACT, { fg: CHALK, background: DEPTH_6, radius: 6, margin: 0 });
const icoPngs = [];
for (const sz of icoSizes) icoPngs.push(await png(icoSvg, sz));
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

// ── proofs: the 16px tab and the 96px circular avatar crop ──────────────────
const proof = await sharp(Buffer.from(icoSvg)).resize(16, 16).png().toBuffer();
const proofBig = await sharp(proof).resize(256, 256, { kernel: "nearest" }).png().toBuffer();
writeFileSync(join(root, "design-review/icon-16px-proof.png"), proofBig);

const avatarMask = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><circle cx="48" cy="48" r="48" fill="#fff"/></svg>`,
);
const avatar = await sharp(
  Buffer.from(markSvg(COMPACT, { fg: CHALK, background: DEPTH_6, margin: 0 })),
)
  .resize(96, 96)
  .composite([{ input: avatarMask, blend: "dest-in" }])
  .png()
  .toBuffer();
writeFileSync(join(root, "design-review/avatar-96px-proof.png"), avatar);

console.log(
  `icon0.svg ${(faviconSvg.length / 1024).toFixed(1)} KB · favicon.ico ${(ico.length / 1024).toFixed(1)} KB (16+32+48, plated) · icon1.png 512 · apple-icon.png 180 · icon-192/512.png (maskable inset) · 16px + avatar proofs written`,
);
