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

/**
 * Physical tonnage, over the eight orders of magnitude mineral production
 * actually spans — from 163 tonnes of US gold to 980 million tonnes of
 * Australian iron ore. Stepping through t → kt → Mt keeps three significant
 * figures at every scale; printing either end in the other's unit would be
 * unreadable.
 */
export function formatTonnes(n: number | null): string {
  if (n == null) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e6) return (n / 1e6).toFixed(abs >= 1e7 ? 0 : 1) + " Mt";
  if (abs >= 1e4) return (n / 1e3).toFixed(abs >= 1e5 ? 0 : 1) + " kt";
  return NF.format(Math.round(n)) + " t";
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
    // Gross enrolment: enrolment over the official school-age population, so a
    // country with repeaters or over-age pupils legitimately exceeds 100%.
    case "% gross":
      return formatPercent(value);
    case "years":
      return formatYears(value);
    case "people":
      return formatPopulation(value);
    case "km²":
      return formatArea(value);
    case "tonnes":
      return formatTonnes(value);
    case "ratio":
      return value.toFixed(1);
    // A point on a bounded index (the WGI's 0–100 governance scores). One
    // decimal: the underlying estimates carry margins of error wide enough that
    // more precision would be a lie told in typography.
    case "score":
      return value.toFixed(1);
    // Small rates that the default integer rounding would erase entirely:
    // Niger has 0.04 physicians per 1,000 people, and "0" is a different and
    // much worse claim than "0.04". Two decimals below 10, one above.
    case "per 1,000":
      return value >= 10 ? value.toFixed(1) : value.toFixed(2);
    case "per 1,000 births":
      return value.toFixed(1);
    default:
      return NF.format(Math.round(value));
  }
}
