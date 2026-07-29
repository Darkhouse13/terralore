#!/usr/bin/env node
// ── The mark ────────────────────────────────────────────────────────────────
// Generates app/icon.png (the favicon, and the logo lib/seo.ts points at from
// the Organization JSON-LD) from the STRATUM signature: a sphere cut in
// section, showing its bands.
//
// The mark it replaces was a gold compass rose on black — the clearest single
// remnant of the navy-and-gold identity, and the one that showed up in a browser
// tab where nothing else about the redesign was visible.
//
// Written as SVG and rasterised with sharp (already present as a Next
// dependency). Kept as a committed PNG rather than an app/icon.tsx route so the
// existing /icon.png URL — which the JSON-LD publisher logo and any cached
// social card already reference — keeps resolving.
//
// Run: node scripts/build-icon.mjs

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const S = 512;
const C = S / 2;
const R = 196;

// STRATUM tokens, as literals — this runs outside the CSS layer.
const DEPTH_6 = "#04161f";
const DEPTH_5 = "#082230";
const SHOAL = "#276f80";
const LIMESTONE = "#ebe9e0";
const COPPER = "#c87244";
const VERDIGRIS = "#57a695";

// The bands, top to bottom: the section reads as strata laid down over time —
// limestone at the surface, then the ramp's three tints, then the deep. Widths
// are unequal on purpose; even bands read as a flag, not as sediment.
const BANDS = [
  { h: 0.14, fill: LIMESTONE, o: 0.94 },
  { h: 0.09, fill: COPPER, o: 0.95 },
  { h: 0.07, fill: DEPTH_5, o: 1 },
  { h: 0.13, fill: VERDIGRIS, o: 0.8 },
  { h: 0.08, fill: DEPTH_5, o: 1 },
  { h: 0.16, fill: SHOAL, o: 0.7 },
  { h: 0.33, fill: DEPTH_5, o: 1 },
];

let y = C - R;
const bands = BANDS.map((b) => {
  const h = b.h * (R * 2);
  const rect = `<rect x="${C - R}" y="${y.toFixed(1)}" width="${R * 2}" height="${(h + 0.5).toFixed(1)}" fill="${b.fill}" opacity="${b.o}"/>`;
  y += h;
  return rect;
}).join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <clipPath id="sphere"><circle cx="${C}" cy="${C}" r="${R}"/></clipPath>
  </defs>
  <rect width="${S}" height="${S}" fill="${DEPTH_6}"/>
  <g clip-path="url(#sphere)">
    ${bands}
  </g>
  <circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="${SHOAL}" stroke-width="7"/>
</svg>`;

const out = join(root, "app/icon.png");
const buf = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
writeFileSync(out, buf);
console.log(`app/icon.png: ${(buf.length / 1024).toFixed(1)} KB (${S}×${S})`);
