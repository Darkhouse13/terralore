// Renders public/globe-still.svg — a static orthographic view of the globe,
// generated from the same countries.geo.json and the same palette as
// GlobeScene, framed at its opening point of view (lat 24, lng 14).
//
// Why it exists: three.js is ~445 KB of JS and seconds of main-thread work,
// which is the right price for an instrument you are using and the wrong price
// for a first paint. The landing page shows this still instantly; the WebGL
// globe mounts behind it (on idle for desktop, on tap for mobile) and
// crossfades in when ready. The still must therefore look like the globe's
// opening frame, not like a generic map.
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
    // Drop sub-pixel moves — most of the byte budget for zero visual change.
    if (prevX !== null && Math.abs(sx - prevX) < 1.2 && Math.abs(sy - prevY) < 1.2) continue;
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

// ── graticule — meridians + parallels every 30°, as GlobeScene draws ───────
function graticulePaths() {
  let d = '';
  for (let lng = -180; lng < 180; lng += 30) {
    const ring = [];
    for (let lat = -90; lat <= 90; lat += 2) ring.push([lng, lat]);
    const p = openPath(ring);
    if (p) d += p;
  }
  for (let lat = -60; lat <= 60; lat += 30) {
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
const grat = graticulePaths();

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" role="img" aria-label="An antique-style globe centred on Africa and Europe">
<defs>
<radialGradient id="ocean" cx="42%" cy="38%" r="75%">
<stop offset="0%" stop-color="#16233c"/>
<stop offset="55%" stop-color="#0d1728"/>
<stop offset="100%" stop-color="#0a1422"/>
</radialGradient>
<radialGradient id="atmo" cx="50%" cy="50%" r="50%">
<stop offset="78%" stop-color="rgba(207,164,95,0)"/>
<stop offset="92%" stop-color="rgba(207,164,95,0.16)"/>
<stop offset="100%" stop-color="rgba(207,164,95,0)"/>
</radialGradient>
<radialGradient id="sheen" cx="38%" cy="30%" r="70%">
<stop offset="0%" stop-color="rgba(255,255,255,0.10)"/>
<stop offset="45%" stop-color="rgba(255,255,255,0.02)"/>
<stop offset="100%" stop-color="rgba(255,255,255,0)"/>
</radialGradient>
<clipPath id="disc"><circle cx="${CX}" cy="${CY}" r="${R}"/></clipPath>
</defs>
<circle cx="${CX}" cy="${CY}" r="${R + 46}" fill="url(#atmo)"/>
<circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#ocean)"/>
<g clip-path="url(#disc)">
<path d="${grat}" fill="none" stroke="rgba(216,181,110,0.13)" stroke-width="1"/>
<path d="${land}" fill="rgba(205,191,161,0.92)" stroke="rgba(6,7,11,0.55)" stroke-width="1.1" fill-rule="evenodd"/>
<circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#sheen)"/>
</g>
<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="rgba(207,164,95,0.35)" stroke-width="1.4"/>
</svg>`;

const out = join(root, 'public/globe-still.svg');
writeFileSync(out, svg);
console.log(`globe-still.svg: ${(svg.length / 1024).toFixed(1)} KB, ${geo.features.length} features`);
