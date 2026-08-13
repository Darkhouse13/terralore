// Shared choropleth ramp + percentile logic, used by both the globe
// (components/globe-render) and the metric window's flat map (components/dossier/
// MetricMap), so the two views tint identically. Kept pure and client-safe.
//
// STRATA: the ramp is the bed walk itself — sand at the low end, through
// clay, to umber at the high end. Light = low, dark = high: a single
// luminance ordering the eye can read without a legend, drawn entirely from
// the seven pigments. No-data ground is a bone-adjacent neutral lighter than
// any observed value, so absence never reads as a low observation.

export const CHORO_LOW = [226, 211, 184] as const; // sand — low
export const CHORO_MID = [200, 138, 92] as const; // clay — midpoint
export const CHORO_HIGH = [110, 74, 50] as const; // umber — high
export const CHORO_NODATA = "#e9e1d2";

/** Interpolate the three-stop ramp at t∈[0,1] → an "rgb(…)" string. */
export function choroColor(t: number): string {
  const u = t < 0 ? 0 : t > 1 ? 1 : t;
  const [from, to, k] =
    u < 0.5 ? [CHORO_LOW, CHORO_MID, u * 2] : [CHORO_MID, CHORO_HIGH, (u - 0.5) * 2];
  const c = (i: number) => Math.round(from[i] + (to[i] - from[i]) * k);
  return `rgb(${c(0)}, ${c(1)}, ${c(2)})`;
}

/**
 * The ramp as a CSS gradient, sampled from `choroColor` itself.
 *
 * Legends used to hardcode their own stop list, which is how a legend drifts
 * out of step with the map it explains. Deriving it here means the swatch and
 * the fill are the same function by construction.
 */
export function choroGradient(stops = 7): string {
  const parts = Array.from({ length: stops }, (_, i) => {
    const t = i / (stops - 1);
    return `${choroColor(t)} ${(t * 100).toFixed(0)}%`;
  });
  return `linear-gradient(90deg, ${parts.join(", ")})`;
}

/**
 * Rank each country's value into [0,1] so colour spreads evenly even when the
 * underlying values are heavily skewed (e.g. GDP per capita).
 */
export function percentileRanks(values: Record<string, number>): Map<string, number> {
  const entries = Object.entries(values).sort((a, b) => a[1] - b[1]);
  const n = entries.length;
  const m = new Map<string, number>();
  entries.forEach(([code], i) => m.set(code, n <= 1 ? 1 : i / (n - 1)));
  return m;
}
