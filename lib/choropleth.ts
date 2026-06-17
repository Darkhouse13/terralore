// Shared choropleth ramp + percentile logic, used by both the 3D globe
// (components/GlobeScene) and the metric window's flat map (components/dossier/
// MetricMap). Kept pure and client-safe (no three.js) so importing the colour
// scale never drags the globe engine into a bundle.

export const CHORO_LOW = [86, 112, 138] as const; // cool steel — low
export const CHORO_HIGH = [233, 198, 120] as const; // warm brass — high
export const CHORO_NODATA = "rgba(120, 120, 132, 0.30)";

/** Interpolate the ramp at t∈[0,1] → an "rgb(…)" string. */
export function choroColor(t: number): string {
  const c = (i: number) => Math.round(CHORO_LOW[i] + (CHORO_HIGH[i] - CHORO_LOW[i]) * t);
  return `rgb(${c(0)}, ${c(1)}, ${c(2)})`;
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
