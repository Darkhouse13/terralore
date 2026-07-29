// Renders public/globe-still.svg — a static orthographic view of the globe,
// generated from the same countries.geo.json and the same palette as the live
// renderer (components/globe-render.ts), framed at its opening point of view
// (lat 24, lng 14).
//
// Why it exists: this is the landing page's zero-JS first paint, and it is the
// LCP element. The canvas globe mounts behind it and crossfades in once it has
// drawn the identical frame — so the still must match globe-render's palette
// and proportions exactly, or the handover visibly jumps.
//
// STRATUM: ocean is a bathymetric ramp, land is limestone, and every coastline
// carries the three-band continental-shelf halo. The halo is drawn here as
// three stacked strokes of the same path, which is precisely what the canvas
// renderer does with its merged coast Path2D.
//
// Run: node scripts/build-globe-still.mjs   (after build-data.mjs)

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const geo = JSON.parse(readFileSync(join(root, 'public/data/countries.geo.json'), 'utf8'));

// ── the view — GlobeScene's settled pointOfView ────────────────────────────
const LAT0 = (24 * Math.PI) / 180;
const LNG0 = (14 * Math.PI) / 180;
const SIZE = 1000; // viewBox
const R = 448; // sphere radius in viewBox units
const CX = SIZE / 2;
const CY = SIZE / 2;

const sinLat0 = Math.sin(LAT0);
const cosLat0 = Math.cos(LAT0);

/**
 * Orthographic projection. Returns screen [x, y] plus the great-circle cosine
 * (cosc >= 0 means the point faces the viewer).
 */
function project(lngDeg, latDeg) {
  const lat = (latDeg * Math.PI) / 180;
  const lng = (lngDeg * Math.PI) / 180;
  const dl = lng - LNG0;
  const sinLat = Math.sin(lat);
  const cosLat = Math.cos(lat);
  const cosc = sinLat0 * sinLat + cosLat0 * cosLat * Math.cos(dl);
  let x = R * cosLat * Math.sin(dl);
  let y = R * (cosLat0 * sinLat - sinLat0 * cosLat * Math.cos(dl));
  return [x, y, cosc];
}

/**
 * Ring → SVG path. Points on the back hemisphere are pushed out to the limb
 * along their screen direction, so shapes that straddle the horizon hug the
 * sphere's edge instead of folding back on themselves. (True horizon clipping
 * needs arc insertion; for a static still this reads identically.)
 */
function ringPath(ring) {
  let d = '';
  let prevX = null;
  let prevY = null;
  let any = false;
  let anyVisible = false;

  for (const [lng, lat] of ring) {
    let [x, y, cosc] = project(lng, lat);
    if (cosc >= 0) anyVisible = true;
    else {
      const len = Math.hypot(x, y) || 1;
      x = (x / len) * R;
      y = (y / len) * R;
    }
    const sx = +(CX + x).toFixed(1);
    const sy = +(CY - y).toFixed(1);
    // Drop near-invisible moves — most of the byte budget for no visual change.
    // 2 viewBox units is ~1.4 px at the size this renders, and the canvas
    // renderer decimates on the same principle, so the handover stays stable.
    // This is the LCP element, so its bytes are the most expensive on the site.
    if (prevX !== null && Math.abs(sx - prevX) < 2 && Math.abs(sy - prevY) < 2) continue;
    d += (any ? 'L' : 'M') + sx + ' ' + sy;
    any = true;
    prevX = sx;
    prevY = sy;
  }
  if (!anyVisible) return ''; // wholly behind the sphere
  return d ? d + 'Z' : '';
}

function featurePath(geometry) {
  const polys =
    geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  let d = '';
  for (const poly of polys) for (const ring of poly) d += ringPath(ring);
  return d;
}

// ── graticule — meridians + parallels every 30°, as globe-render draws ─────
// Split into principal (equator + prime meridian) and the rest, matching the
// renderer's two-pass treatment: an atlas always draws those two heavier.
function graticulePaths(principal) {
  let d = '';
  for (let lng = -180; lng < 180; lng += 30) {
    if ((lng === 0) !== principal) continue;
    const ring = [];
    for (let lat = -90; lat <= 90; lat += 2) ring.push([lng, lat]);
    const p = openPath(ring);
    if (p) d += p;
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    if ((lat === 0) !== principal) continue;
    const ring = [];
    for (let lng = -180; lng <= 180; lng += 2) ring.push([lng, lat]);
    const p = openPath(ring);
    if (p) d += p;
  }
  return d;
}

/** Like ringPath but leaves the path open and skips hidden segments. */
function openPath(points) {
  let d = '';
  let pen = false;
  for (const [lng, lat] of points) {
    const [x, y, cosc] = project(lng, lat);
    if (cosc < 0.01) {
      pen = false;
      continue;
    }
    const sx = +(CX + x).toFixed(1);
    const sy = +(CY - y).toFixed(1);
    d += (pen ? 'L' : 'M') + sx + ' ' + sy;
    pen = true;
  }
  return d;
}

// ── compose ────────────────────────────────────────────────────────────────
const land = geo.features.map((f) => featurePath(f.geometry)).join('');
const grat = graticulePaths(false);
const gratPrime = graticulePaths(true);

// The shelf halo: three stepped bands of shoal tint, widest and faintest first.
//
// These reference the coastline geometry via <use> rather than repeating the
// `d` attribute. That matters a lot here: the land path is ~90 KB, this file is
// the landing page's LCP element, and emitting it four times took the still
// from 96 KB to 362 KB. <use> keeps exactly one copy of the geometry and lets
// each band override only its stroke.
const SHELF_BANDS = [
  [Math.max(1, R * 0.030), 0.10],
  [Math.max(1, R * 0.017), 0.15],
  [Math.max(1, R * 0.007), 0.24],
];
const shelf = SHELF_BANDS.map(
  ([w, a]) =>
    `<use href="#coast" fill="none" stroke="rgba(39,111,128,${a})" stroke-width="${w.toFixed(1)}" stroke-linejoin="round" stroke-linecap="round"/>`,
).join('\n');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" role="img" aria-label="A bathymetric globe centred on Africa and Europe">
<defs>
<radialGradient id="ocean" cx="42%" cy="38%" r="75%">
<stop offset="0%" stop-color="#0e3243"/>
<stop offset="55%" stop-color="#082230"/>
<stop offset="100%" stop-color="#04161f"/>
</radialGradient>
<radialGradient id="atmo" cx="50%" cy="50%" r="50%">
<stop offset="78%" stop-color="rgba(39,111,128,0)"/>
<stop offset="92%" stop-color="rgba(39,111,128,0.18)"/>
<stop offset="100%" stop-color="rgba(39,111,128,0)"/>
</radialGradient>
<radialGradient id="sheen" cx="38%" cy="30%" r="70%">
<stop offset="0%" stop-color="rgba(214,238,238,0.07)"/>
<stop offset="45%" stop-color="rgba(214,238,238,0.015)"/>
<stop offset="100%" stop-color="rgba(214,238,238,0)"/>
</radialGradient>
<clipPath id="disc"><circle cx="${CX}" cy="${CY}" r="${R}"/></clipPath>
<path id="coast" d="${land}"/>
</defs>
<circle cx="${CX}" cy="${CY}" r="${R + 46}" fill="url(#atmo)"/>
<circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#ocean)"/>
<g clip-path="url(#disc)">
<path d="${grat}" fill="none" stroke="rgba(39,111,128,0.20)" stroke-width="1"/>
<path d="${gratPrime}" fill="none" stroke="rgba(39,111,128,0.42)" stroke-width="1.2"/>
${shelf}
<use href="#coast" fill="rgba(235,233,224,0.95)" stroke="rgba(22,32,30,0.5)" stroke-width="1.1" fill-rule="evenodd"/>
<circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#sheen)"/>
</g>
<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="rgba(39,111,128,0.45)" stroke-width="1.4"/>
</svg>`;

const out = join(root, 'public/globe-still.svg');
writeFileSync(out, svg);
console.log(`globe-still.svg: ${(svg.length / 1024).toFixed(1)} KB, ${geo.features.length} features`);
