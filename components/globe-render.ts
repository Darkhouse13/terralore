/**
 * The globe's pure renderer — no React, no DOM assumptions beyond a 2D canvas
 * context, so the same code runs on the main thread (fallback) and inside the
 * OffscreenCanvas worker (the normal path). Everything it needs arrives in
 * `RenderState`; colours are resolved to strings *before* they get here so the
 * state is structured-cloneable across the worker boundary.
 */

/* ── STRATUM palette (see DESIGN.md) ────────────────────────────────────────
   The globe is drawn as a sea chart, not as a lit 3D sphere. Two changes carry
   that: the ocean is a bathymetric ramp, and every landmass is ringed by a
   continental-shelf halo in stepped bands — the "stratum rule" applied to a
   sphere, and the detail that makes this read as cartography at a glance.

   The emboss underlay that used to sit beneath the land (a translated dark
   fill, faking extrusion sides) is gone. It was skeuomorphic depth on a chart
   that now expresses depth for real, and it cost the same per-frame work the
   shelf halo now spends on something meaningful. */
export const OCEAN_DEEP = "#04161f"; // abyssal — the limb
export const OCEAN_MID = "#082230"; // open water
export const OCEAN_HIGH = "#0e3243"; // lit shoulder
export const LAND = "rgba(235, 233, 224, 0.95)"; // limestone
export const SHELF = "39, 111, 128"; // depth-1, as rgb parts for the halo bands
export const STROKE = "rgba(22, 32, 30, 0.5)"; // iron-gall coastline
export const STROKE_LIT = "rgba(227, 154, 103, 0.75)";
export const HOVER = "#f0d3bf"; // limestone warmed toward copper
export const SELECTED = "#e39a67"; // copper-bright — the surveyor's hand
export const GRATICULE = "rgba(39, 111, 128, 0.20)";
export const GRATICULE_PRIME = "rgba(39, 111, 128, 0.42)"; // equator + prime meridian
export const LIMB = "rgba(39, 111, 128, 0.45)";

export const DEG = Math.PI / 180;

/** Sphere radius / centre — shared with the SVG still's proportions. */
export const radiusFor = (w: number, h: number) => Math.min(0.318 * h, 0.43 * w);
// Narrow viewports seat the globe lower: the hero's thesis sits above it, and
// at 360px that paragraph runs to four lines and used to overlap the sphere,
// which made both unreadable. 0.61 clears it.
// NOTE: the SVG still's `translate-y` on mobile must match this offset
// (0.61 - 0.5 = 0.11 → translate-y-[11dvh]) or the handover visibly jumps.
export const centerYFor = (w: number, h: number) => h * (w < 640 ? 0.61 : 0.5);

/**
 * Per-feature render/hit cache. `rings` keeps raw lon/lat for hit-testing on
 * the main thread; `trig` holds each vertex's {sinLon, cosLon, sinLat, cosLat},
 * computed once — with the angle-difference identities a frame's projection
 * then needs zero trigonometry per vertex, only multiplications.
 */
export interface Shape {
  code: string;
  name: string;
  rings: Float64Array[];
  trig: Float64Array[];
  bbox: [number, number, number, number];
}

/** The subset of Shape the renderer needs (rings stay behind for hit tests). */
export interface DrawShape {
  code: string;
  trig: Float64Array[];
  bbox: [number, number, number, number];
}

export interface ViewState {
  lambda: number;
  phi: number;
  scale: number;
}

export interface RenderState {
  view: ViewState;
  hoverCode: string | null;
  selectedCode: string | null;
  /** Pre-resolved fill per code when a choropleth layer is on; null = limestone. */
  fills: Record<string, string> | null;
  /** Selection centroid + ring epoch (ms timestamp) for the pulse animation. */
  ringCenter: [number, number] | null;
  ringT0: number;
}

/**
 * Graticule sample points with their trig baked in, computed once.
 *
 * Split into principal (the equator and the prime meridian) and the rest. Every
 * printed atlas draws those two heavier than the other lines, because they are
 * the origin the rest of the grid is measured from — and on a spinning globe
 * they also give the eye something fixed to orient against.
 */
const GRAT_LINES: { pts: Float64Array; principal: boolean }[] = (() => {
  const lines: { pts: Float64Array; principal: boolean }[] = [];
  const push = (pts: [number, number][], principal: boolean) => {
    const arr = new Float64Array(pts.length * 4);
    pts.forEach(([lon, lat], i) => {
      arr[i * 4] = Math.sin(lon * DEG);
      arr[i * 4 + 1] = Math.cos(lon * DEG);
      arr[i * 4 + 2] = Math.sin(lat * DEG);
      arr[i * 4 + 3] = Math.cos(lat * DEG);
    });
    lines.push({ pts: arr, principal });
  };
  for (let lon = -180; lon < 180; lon += 30) {
    const pts: [number, number][] = [];
    for (let lat = -90; lat <= 90; lat += 3) pts.push([lon, lat]);
    push(pts, lon === 0);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const pts: [number, number][] = [];
    for (let lon = -180; lon <= 180; lon += 3) pts.push([lon, lat]);
    push(pts, lat === 0);
  }
  return lines;
})();

type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export function renderGlobe(
  ctx: Ctx2D,
  width: number,
  height: number,
  dpr: number,
  shapes: DrawShape[],
  state: RenderState,
  now: number,
): void {
  const { view, hoverCode, selectedCode, fills, ringCenter, ringT0 } = state;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const cx = width / 2, cy = centerYFor(width, height);
  const r = radiusFor(width, height) * view.scale;
  const { lambda, phi } = view;
  const sinP = Math.sin(phi * DEG), cosP = Math.cos(phi * DEG);
  const sinL = Math.sin(lambda * DEG), cosL = Math.cos(lambda * DEG);

  // ocean
  const og = ctx.createRadialGradient(cx - r * 0.16, cy - r * 0.24, r * 0.1, cx, cy, r);
  og.addColorStop(0, OCEAN_HIGH);
  og.addColorStop(0.55, OCEAN_MID);
  og.addColorStop(1, OCEAN_DEEP);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = og;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  // The graticule is drawn AFTER the land, further down — an atlas rules its
  // grid over the whole sheet, land included, because the grid is the reference
  // frame and the land is what is being referenced. Drawing it underneath (as
  // this did) turns every landmass into an opaque sticker sitting on the map
  // rather than part of it.
  const drawGraticule = () => {
    for (const principal of [false, true]) {
      ctx.beginPath();
      let drew = false;
      for (const line of GRAT_LINES) {
        if (line.principal !== principal) continue;
        const g = line.pts;
        const n = g.length / 4;
        let pen = false;
        for (let i = 0; i < n; i++) {
          const sinLon = g[i * 4], cosLon = g[i * 4 + 1];
          const sinLa = g[i * 4 + 2], cosLa = g[i * 4 + 3];
          const sindl = sinLon * cosL - cosLon * sinL;
          const cosdl = cosLon * cosL + sinLon * sinL;
          const cosc = sinP * sinLa + cosP * cosLa * cosdl;
          if (cosc < 0.01) { pen = false; continue; }
          const x = cx + r * cosLa * sindl;
          const y = cy - r * (cosP * sinLa - sinP * cosLa * cosdl);
          if (pen) ctx.lineTo(x, y); else ctx.moveTo(x, y);
          pen = true;
          drew = true;
        }
      }
      if (!drew) continue;
      ctx.strokeStyle = principal ? GRATICULE_PRIME : GRATICULE;
      ctx.lineWidth = principal ? 1.2 : 1;
      ctx.stroke();
    }
  };

  // land — one projection pass per frame; sub-pixel vertices decimated
  const paths: { code: string; p: Path2D }[] = [];
  for (const s of shapes) {
    const [a, b0, c, d] = s.bbox;
    const bcLon = (a + c) / 2, bcLat = (b0 + d) / 2;
    let dLon = Math.abs(bcLon - lambda) % 360;
    if (dLon > 180) dLon = 360 - dLon;
    const span = Math.max(c - a, d - b0) / 2;
    const dist = Math.hypot(dLon * Math.cos(bcLat * DEG), bcLat - phi);
    if (dist - span > 92) continue;

    const p = new Path2D();
    let any = false;
    for (const tg of s.trig) {
      const n = tg.length / 4;
      let px = -1, py = -1, started = false;
      for (let i = 0; i < n; i++) {
        const sinLon = tg[i * 4], cosLon = tg[i * 4 + 1];
        const sinLa = tg[i * 4 + 2], cosLa = tg[i * 4 + 3];
        const sindl = sinLon * cosL - cosLon * sinL;
        const cosdl = cosLon * cosL + sinLon * sinL;
        const cosc = sinP * sinLa + cosP * cosLa * cosdl;
        let dx = r * cosLa * sindl;
        let dy = r * (cosP * sinLa - sinP * cosLa * cosdl);
        if (cosc < 0) {
          const len = Math.hypot(dx, dy) || 1;
          dx = (dx / len) * r;
          dy = (dy / len) * r;
        }
        const x = cx + dx, y = cy - dy;
        if (started && Math.abs(x - px) < 0.9 && Math.abs(y - py) < 0.9 && i !== n - 1) continue;
        if (started) p.lineTo(x, y); else p.moveTo(x, y);
        started = true;
        px = x; py = y;
      }
      if (started) { p.closePath(); any = true; }
    }
    if (any) paths.push({ code: s.code, p });
  }

  // ── The signature: the continental-shelf halo ─────────────────────────────
  // Three stepped bands of shoal tint ringing every coastline — the stratum
  // rule wrapped onto a sphere. It is what makes this read as a bathymetric
  // chart rather than a dark ball with countries on it.
  //
  // All visible landmasses are merged into ONE Path2D first, so each band costs
  // a single wide stroke instead of one per country (~90 visible shapes → 3
  // strokes rather than 270). Wide strokes are the expensive primitive here, so
  // that merge is what keeps this affordable inside the frame budget.
  const coast = new Path2D();
  for (const { p } of paths) coast.addPath(p);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const [width, alpha] of [
    [0.030, 0.10],
    [0.017, 0.15],
    [0.007, 0.24],
  ] as const) {
    ctx.strokeStyle = `rgba(${SHELF},${alpha})`;
    ctx.lineWidth = Math.max(1, r * width);
    ctx.stroke(coast);
  }

  // colour pass
  for (const { code, p } of paths) {
    let fill: string;
    if (code === selectedCode) fill = SELECTED;
    else if (code === hoverCode) fill = HOVER;
    else if (fills) fill = fills[code] ?? LAND;
    else fill = LAND;

    ctx.fillStyle = fill;
    ctx.fill(p, "evenodd");
    const lit = code === selectedCode || code === hoverCode;
    ctx.strokeStyle = lit ? STROKE_LIT : STROKE;
    ctx.lineWidth = lit ? 1.4 : 1;
    ctx.stroke(p);
  }

  // grid over the sheet — see the note at drawGraticule
  drawGraticule();

  // copper rings pulsing out of a selection — the surveyor marking a spot
  if (selectedCode && ringCenter) {
    const [rlat, rlon] = ringCenter;
    const period = 1400;
    const elapsed = now - ringT0;
    for (let k = 0; k < 3; k++) {
      const t = ((elapsed - k * (period / 3)) % period) / period;
      if (t < 0) continue;
      const radius = 4.5 * t;
      ctx.beginPath();
      let pen = false;
      for (let a2 = 0; a2 <= 360; a2 += 6) {
        const lat1 = Math.asin(
          Math.sin(rlat * DEG) * Math.cos(radius * DEG) +
            Math.cos(rlat * DEG) * Math.sin(radius * DEG) * Math.cos(a2 * DEG),
        );
        const lon1 =
          rlon * DEG +
          Math.atan2(
            Math.sin(a2 * DEG) * Math.sin(radius * DEG) * Math.cos(rlat * DEG),
            Math.cos(radius * DEG) - Math.sin(rlat * DEG) * Math.sin(lat1),
          );
        const sindl = Math.sin(lon1 - lambda * DEG);
        const cosdl = Math.cos(lon1 - lambda * DEG);
        const cosc = sinP * Math.sin(lat1) + cosP * Math.cos(lat1) * cosdl;
        if (cosc < 0) { pen = false; continue; }
        const x = cx + r * Math.cos(lat1) * sindl;
        const y = cy - r * (cosP * Math.sin(lat1) - sinP * Math.cos(lat1) * cosdl);
        if (pen) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        pen = true;
      }
      ctx.strokeStyle = `rgba(227, 154, 103,${(0.5 * (1 - t)).toFixed(3)})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
  }

  // sheen — a hint of curvature only. Deliberately weaker than before: a chart
  // is a flat document, and a strong specular highlight fights that reading.
  const sg = ctx.createRadialGradient(cx - r * 0.24, cy - r * 0.4, r * 0.05, cx, cy, r * 1.4);
  sg.addColorStop(0, "rgba(214,238,238,0.07)");
  sg.addColorStop(0.45, "rgba(214,238,238,0.015)");
  sg.addColorStop(1, "rgba(214,238,238,0)");
  ctx.fillStyle = sg;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.restore();

  // limb — a cool shoal edge, where the chart meets the dark
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = LIMB;
  ctx.lineWidth = 1.4;
  ctx.stroke();
}
