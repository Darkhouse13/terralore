// ── Flat SVG maps for the Pinterest pins ────────────────────────────────────
// The atlas outlines (public/data/countries.geo.json, ADM0_A3-keyed, 2-dp)
// projected with Equal Earth — an equal-area projection, so a pin never
// inflates the high latitudes the way the Mercator maps it competes with do.
// Pure geometry: (codes → fill) in, one satori <svg> element + per-nation
// anchor points out. Labels are NOT drawn inside the SVG (satori rasterises
// SVG through resvg without our fonts); compositions overlay them as
// absolutely positioned divs at the returned anchors.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { h } from "./ui.mjs";

const geo = JSON.parse(readFileSync(join(process.cwd(), "public/data/countries.geo.json"), "utf8"));

const A1 = 1.340264;
const A2 = -0.081106;
const A3 = 0.000893;
const A4 = 0.003796;
const M = Math.sqrt(3) / 2;
const RAD = Math.PI / 180;

/** Equal Earth, unit sphere → [x, y] with y growing northward. */
export function equalEarth(lon, lat) {
  const l = lon * RAD;
  const t = Math.asin(M * Math.sin(lat * RAD));
  const t2 = t * t;
  const t6 = t2 * t2 * t2;
  const x = (l * Math.cos(t)) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)));
  const y = t * (A1 + A2 * t2 + t6 * (A3 + A4 * t2));
  return [x, y];
}

/**
 * Viewing windows (lon/lat) per continent label in data/countries.json. The
 * window frames the view; every outline in the world file is still drawn and
 * clipped, so neighbours give the region its context.
 */
export const WINDOWS = {
  World: { lon: [-170, 180], lat: [-57, 83] },
  Africa: { lon: [-19, 53], lat: [-36, 38] },
  Europe: { lon: [-25, 45], lat: [34, 71.5] },
  Asia: { lon: [25, 147], lat: [-11, 56] },
  "South America": { lon: [-83, -33], lat: [-56, 13] },
  "North America": { lon: [-168, -52], lat: [7, 72] },
};

function ringsOf(feature) {
  const g = feature.geometry;
  if (!g) return [];
  if (g.type === "Polygon") return [g.coordinates];
  if (g.type === "MultiPolygon") return g.coordinates;
  return [];
}

function ringArea(pts) {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]);
  return a / 2;
}

function ringCentroid(pts) {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const f = pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
    a += f;
    cx += (pts[j][0] + pts[i][0]) * f;
    cy += (pts[j][1] + pts[i][1]) * f;
  }
  if (Math.abs(a) < 1e-9) return pts[0];
  return [cx / (3 * a), cy / (3 * a)];
}

/**
 * Build a map.
 *   window  — a WINDOWS key
 *   width/height — the pixel box the map is fitted into (aspect preserved,
 *                  centred)
 *   fills   — Map(code → css colour); codes absent get `outside`
 *   strokes — optional Map(code → stroke colour) for emphasis
 * Returns { svg, anchors: Map(code → [px, py]), box: {x, y, w, h} }.
 */
export function buildMap({ window: win, width, height, fills, outside, stroke, strokeWidth = 1, emphasis = new Map() }) {
  const w = WINDOWS[win];
  if (!w) throw new Error(`pinmap: unknown window ${win}`);

  // Project the window's outline densely to find its projected bounds.
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i <= 40; i += 1) {
    const lon = w.lon[0] + ((w.lon[1] - w.lon[0]) * i) / 40;
    for (const lat of [w.lat[0], w.lat[1], (w.lat[0] + w.lat[1]) / 2]) {
      const [x, y] = equalEarth(lon, lat);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  const scale = Math.min(width / (maxX - minX), height / (maxY - minY));
  const drawW = (maxX - minX) * scale;
  const drawH = (maxY - minY) * scale;
  const ox = (width - drawW) / 2;
  const oy = (height - drawH) / 2;
  const px = ([lon, lat]) => {
    const [x, y] = equalEarth(lon, lat);
    return [ox + (x - minX) * scale, oy + (maxY - y) * scale];
  };

  const paths = [];
  const anchors = new Map();
  const emphasised = [];
  for (const f of geo.features) {
    const code = f.properties.code;
    let d = "";
    let best = null;
    for (const poly of ringsOf(f)) {
      for (let r = 0; r < poly.length; r += 1) {
        const pts = poly[r].map(px);
        // Skip rings entirely outside the frame — keeps the SVG small.
        const off =
          pts.every((p) => p[0] < -20) ||
          pts.every((p) => p[0] > width + 20) ||
          pts.every((p) => p[1] < -20) ||
          pts.every((p) => p[1] > height + 20);
        if (off) continue;
        d += `M${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L")}Z`;
        if (r === 0) {
          const area = Math.abs(ringArea(pts));
          if (!best || area > best.area) best = { area, c: ringCentroid(pts) };
        }
      }
    }
    if (!d) continue;
    if (best) anchors.set(code, best.c);
    const fill = fills.get(code) ?? outside;
    const el = h("path", {
      d,
      fill,
      stroke: emphasis.get(code) ?? stroke,
      strokeWidth: emphasis.has(code) ? strokeWidth * 3 : strokeWidth,
      strokeLinejoin: "round",
    });
    // Emphasised outlines draw last so their stroke is not covered.
    (emphasis.has(code) ? emphasised : paths).push(el);
  }

  const svg = h(
    "svg",
    { width, height, viewBox: `0 0 ${width} ${height}` },
    ...paths,
    ...emphasised,
  );
  return { svg, anchors, box: { x: ox, y: oy, w: drawW, h: drawH } };
}

/**
 * Nudge badge anchors apart so no two overlap (small states cluster —
 * Gulf, Caribbean, Benelux). Deterministic: walks in the given order and
 * pushes each later badge down/right until it clears the earlier ones.
 */
export function spreadBadges(points, { min = 46, width, height, pad = 30 } = {}) {
  const placed = [];
  for (const p of points) {
    let [x, y] = p.at;
    for (let tries = 0; tries < 24; tries += 1) {
      const hit = placed.find((q) => Math.hypot(q.at[0] - x, q.at[1] - y) < min);
      if (!hit) break;
      const ang = (tries * 137.5 * Math.PI) / 180;
      x = p.at[0] + Math.cos(ang) * min * (1 + tries / 6);
      y = p.at[1] + Math.sin(ang) * min * (1 + tries / 6);
    }
    x = Math.min(Math.max(x, pad), width - pad);
    y = Math.min(Math.max(y, pad), height - pad);
    placed.push({ ...p, from: p.at, at: [x, y] });
  }
  return placed;
}

/**
 * Leader lines for badges pushed off their nation: a dot on the nation's
 * anchor and a thin basalt line to the badge. One absolutely positioned SVG
 * (no text inside — labels stay in the badge divs).
 */
export function leaders(placed, { width, height, color }) {
  const moved = placed.filter((b) => Math.hypot(b.from[0] - b.at[0], b.from[1] - b.at[1]) > 10);
  if (!moved.length) return null;
  return h(
    "svg",
    { width, height, viewBox: `0 0 ${width} ${height}`, style: { position: "absolute", left: 0, top: 0 } },
    ...moved.map((b) =>
      h("line", { x1: b.from[0], y1: b.from[1], x2: b.at[0], y2: b.at[1], stroke: color, strokeWidth: 2.5 }),
    ),
    ...placed.map((b) => h("circle", { cx: b.from[0], cy: b.from[1], r: 5, fill: color, stroke: "#efe7d8", strokeWidth: 1.5 })),
  );
}
