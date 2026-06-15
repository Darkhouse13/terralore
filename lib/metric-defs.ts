// Plain-language definitions for every dossier metric, keyed on the stable
// Metric.key (see scripts/build-<domain>.mjs). Surfaced in the metric card's
// "i" info tooltip so a reader never has to guess what a figure means.
// Keep these short, neutral, and jargon-free — one sentence each.

export const METRIC_DEFS: Record<string, string> = {
  // economy
  gdp: "Gross Domestic Product — the total market value of all goods and services produced in a year, at current prices.",
  gdpPerCapita:
    "GDP divided by population — a rough measure of average economic output per person.",
  gdpGrowth: "Annual percentage change in real (inflation-adjusted) GDP.",
  inflation:
    "Annual change in consumer prices, measured by the consumer price index.",
  tradePctGdp:
    "Exports plus imports as a share of GDP — how integrated the economy is with the world.",

  // society
  population: "Total resident population, mid-year estimate.",
  lifeExpectancy:
    "Years a newborn would live if current mortality patterns held throughout its life.",
  urbanPct: "Share of people living in areas classified as urban.",
  fertility: "Average number of children born per woman over her lifetime.",

  // technology
  rdSpending:
    "Gross expenditure on research & development as a share of GDP.",
  researchers: "Full-time-equivalent researchers per million people.",
  internetUsers:
    "Share of the population that used the internet in the last three months.",
  mobileSubs: "Active mobile-cellular subscriptions per 100 people.",
  highTechExports:
    "Share of manufactured exports classified as high-technology.",

  // geography
  landArea: "Total land area, excluding inland water bodies.",
  forestPct: "Share of land area under forest cover.",
  agriPct:
    "Share of land used for agriculture — arable land, permanent crops and pasture.",
  co2PerCapita:
    "Carbon-dioxide emissions per person, in metric tons per year.",
  renewablePct:
    "Share of total final energy consumption that comes from renewable sources.",

  // resources
  resourceRents:
    "Total natural-resource rents (oil, gas, mineral, forest) as a share of GDP.",
  oilRents:
    "Value of crude oil production minus extraction cost, as a share of GDP.",
  mineralRents:
    "Value of mineral production minus extraction cost, as a share of GDP.",
  forestRents: "Net value of roundwood harvest as a share of GDP.",
  electricityAccess: "Share of the population with access to electricity.",

  // military
  milExpPctGdp: "Military expenditure as a share of GDP.",
  milExpUsd: "Total military expenditure at current prices.",
  armedForces: "Total active armed-forces personnel.",
};

/** The tooltip copy for a metric — its definition, or a sensible fallback. */
export function metricDefinition(
  key: string,
  isEmpty: boolean,
  publisher?: string,
): string {
  if (isEmpty) {
    return "No comparable data is published for this indicator. Disputed and non-UN territories are often absent from these datasets.";
  }
  return (
    METRIC_DEFS[key] ??
    `Latest available figure${publisher ? `, sourced from ${publisher}` : ""}.`
  );
}
