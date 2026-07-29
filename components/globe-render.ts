/**
 * The globe's pure renderer — no React, no DOM assumptions beyond a 2D canvas
 * context, so the same code runs on the main thread (fallback) and inside the
 * OffscreenCanvas worker (the normal path). Everything it needs arrives in
 * `RenderState`; colours are resolved to strings *before* they get here so the
 * state is structured-cloneable across the worker boundary.
 */

export const OCEAN_DEEP = "#0a1422";
export const OCEAN_MID = "#0d1728";
export const OCEAN_HIGH = "#16233c";
export const LAND = "rgba(205, 191, 161, 0.92)";
export const LAND_RELIEF = "rgba(90, 80, 60, 0.5)"; // emboss underlay ≈ extrusion sides
export const STROKE = "rgba(6, 7, 11, 0.55)";
export const STROKE_LIT = "rgba(216, 181, 110, 0.6)";
export const HOVER = "#e7c98c";
export const SELECTED = "#d8b56e";
export const GRATICULE = "rgba(216, 181, 110, 0.13)";

export const DEG = Math.PI / 180;

/** Sphere radius / centre — shared with the SVG still's proportions. */
export const radiusFor = (w: number, h: number) => Math.min(0.318 * h, 0.43 * w);
export const centerYFor = (w: number, h: number) => h * (w < 640 ? 0.56 : 0.5);

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
  /** Pre-resolved fill per code when a choropleth layer is on; null = parchment. */
  fills: Record<string, string> | null;
  /** Selection centroid + ring epoch (ms timestamp) for the pulse animation. */
  ringCenter: [number, number] | null;
  ringT0: number;
}

/** Graticule sample points with their trig baked in, computed once. */
const GRAT_LINES: Float64Array[] = (() => {
  const lines: Float64Array[] = [];
  const push = (pts: [number, number][]) => {
    const arr = new Float64Array(pts.length * 4);
    pts.forEach(([lon, lat], i) => {
      arr[i * 4] = Math.sin(lon * DEG);
      arr[i * 4 + 1] = Math.cos(lon * DEG);
      arr[i * 4 + 2] = Math.sin(lat * DEG);
      arr[i * 4 + 3] = Math.cos(lat * DEG);
    });
    lines.push(arr);
  };
  for (let lon = -180; lon < 180; lon += 30) {
    const pts: [number, number][] = [];
    for (let lat = -90; lat <= 90; lat += 3) pts.push([lon, lat]);
    push(pts);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const pts: [number, number][] = [];
    for (let lon = -180; lon <= 180; lon += 3) pts.push([lon, lat]);
    push(pts);
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

  // graticule
  ctx.beginPath();
  for (const line of GRAT_LINES) {
    const n = line.length / 4;
    let pen = false;
    for (let i = 0; i < n; i++) {
      const sinLon = line[i * 4], cosLon = line[i * 4 + 1];
      const sinLa = line[i * 4 + 2], cosLa = line[i * 4 + 3];
      const sindl = sinLon * cosL - cosLon * sinL;
      const cosdl = cosLon * cosL + sinLon * sinL;
      const cosc = sinP * sinLa + cosP * cosLa * cosdl;
      if (cosc < 0.01) { pen = false; continue; }
      const x = cx + r * cosLa * sindl;
      const y = cy - r * (cosP * sinLa - sinP * cosLa * cosdl);
      if (pen) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      pen = true;
    }
  }
  ctx.strokeStyle = GRATICULE;
  ctx.lineWidth = 1;
  ctx.stroke();

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

  // relief underlay — same paths, translated (the emboss ≈ extrusion sides)
  const off = r * 0.006 + 0.8;
  ctx.save();
  ctx.translate(off, off);
  ctx.fillStyle = LAND_RELIEF;
  for (const { p } of paths) ctx.fill(p, "evenodd");
  ctx.restore();

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

  // brass rings pulsing out of a selection
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
      ctx.strokeStyle = `rgba(216,181,110,${(0.5 * (1 - t)).toFixed(3)})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
  }

  // sheen
  const sg = ctx.createRadialGradient(cx - r * 0.24, cy - r * 0.4, r * 0.05, cx, cy, r * 1.4);
  sg.addColorStop(0, "rgba(255,255,255,0.10)");
  sg.addColorStop(0.45, "rgba(255,255,255,0.02)");
  sg.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sg;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.restore();

  // limb
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(207,164,95,0.35)";
  ctx.lineWidth = 1.4;
  ctx.stroke();
}
