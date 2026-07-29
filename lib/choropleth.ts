// Shared choropleth ramp + percentile logic, used by both the globe
// (components/globe-render) and the metric window's flat map (components/dossier/
// MetricMap), so the two views tint identically. Kept pure and client-safe.
//
// STRATUM: the ramp runs verdigris → limestone → copper, which is the palette's
// own semantics rather than an arbitrary gradient — verdigris is "the measured"
// at the low end, copper is "the surveyor's hand" at the high end, and the
// limestone midpoint is the neutral the reading surfaces are built on. Passing
// through a light middle (rather than interpolating dark-to-light) keeps
// adjacent percentile bands distinguishable at the low end, where a straight
// two-colour ramp compresses everything into near-identical darks.

export const CHORO_LOW = [47, 110, 98] as const; // verdigris-deep — low
export const CHORO_MID = [201, 196, 178] as const; // limestone — midpoint
export const CHORO_HIGH = [227, 154, 103] as const; // copper-bright — high
export const CHORO_NODATA = "rgba(116, 134, 141, 0.28)";

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
