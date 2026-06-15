const NF = new Intl.NumberFormat("en-US");

export function formatPopulation(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + " bn";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1) + " m";
  if (n >= 1_000) return NF.format(Math.round(n / 1000) * 1000);
  return NF.format(n);
}

export function formatArea(n: number | null): string {
  if (n == null) return "—";
  return NF.format(Math.round(n)) + " km²";
}

export function formatUSD(n: number | null): string {
  if (n == null) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e12) return "$" + (n / 1e12).toFixed(2) + " T";
  if (abs >= 1e9) return "$" + (n / 1e9).toFixed(abs >= 1e10 ? 0 : 1) + " B";
  if (abs >= 1e6) return "$" + (n / 1e6).toFixed(abs >= 1e7 ? 0 : 1) + " M";
  return "$" + NF.format(Math.round(n));
}

export function formatPercent(n: number | null, digits = 1): string {
  if (n == null) return "—";
  return n.toFixed(digits) + "%";
}

export function formatYears(n: number | null): string {
  if (n == null) return "—";
  return n.toFixed(1) + " yrs";
}

/** Format a metric value according to its unit (see lib/types.ts Metric.unit). */
export function formatMetric(value: number | null, unit: string): string {
  if (value == null) return "—";
  switch (unit) {
    case "USD":
      return formatUSD(value);
    case "%":
    case "% of GDP":
      return formatPercent(value);
    case "years":
      return formatYears(value);
    case "people":
      return formatPopulation(value);
    case "km²":
      return formatArea(value);
    case "ratio":
      return value.toFixed(1);
    default:
      return NF.format(Math.round(value));
  }
}
