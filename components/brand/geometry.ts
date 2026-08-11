// ── ZENITH — the mark's geometry, frozen ────────────────────────────────────
// Source of truth: docs/brand/exploration-svgs/zenith-primary.svg (96 grid)
// and zenith-favicon-32.svg (32 grid); construction tables in DESIGN.md,
// "The brand mark — ZENITH". The geometry is final: paths here are the
// exploration paths cleaned (merged into one `d`, coordinates untouched),
// never redrawn. `scripts/build-icon.mjs` embeds the same two paths for the
// raster pipeline — if one ever changes (it should not), change both.

export interface ZenithCut {
  /** Square viewBox edge, in grid units. */
  viewBox: number;
  /** Horizon + dome + meridians, one path. */
  path: string;
  /** Stroke width, in grid units — part of the drawing, never scaled alone. */
  stroke: number;
  /** The zenith dot. */
  dot: { cx: number; cy: number; r: number };
}

/** The primary cut — renders at ≥ 28 px. */
export const ZENITH_FULL: ZenithCut = {
  viewBox: 96,
  path: "M8 66 H88 M16 66 A32 32 0 0 1 80 66 M48 66 V34 M30 66 A18 32 0 0 1 48 34 M48 34 A18 32 0 0 1 66 66",
  stroke: 5.5,
  dot: { cx: 48, cy: 21, r: 4.5 },
};

/** The compact cut — its own drawing for 14–28 px, heavier stroke ratio. */
export const ZENITH_COMPACT: ZenithCut = {
  viewBox: 32,
  path: "M2 23.5 H30 M6 23.5 A10 10 0 0 1 26 23.5 M16 23.5 V13.5 M10.5 23.5 A5.5 10 0 0 1 16 13.5 M16 13.5 A5.5 10 0 0 1 21.5 23.5",
  stroke: 2.75,
  dot: { cx: 16, cy: 8.5, r: 2 },
};

// The brand colours as literals, for contexts outside the CSS layer (the OG
// pipeline renders with satori, which has no CSS custom properties). These are
// the Stratum tokens — the exploration hexes map onto them (see DESIGN.md):
// cream #F2EAD9 → chalk, orange #C75B28 → copper, ink/navy → ink / depth-6.
export const BRAND = {
  chalk: "#e6ecea", // mark on the deep
  ink: "#16201e", // mark on limestone
  copper: "#c87244", // the zenith dot — the only accent
  deep: "#04161f", // dark ground (depth-6)
  limestone: "#ebe9e0", // light ground (land-0)
} as const;
