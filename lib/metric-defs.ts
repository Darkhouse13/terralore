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

  // governance — Worldwide Governance Indicators, 0–100 absolute scores.
  // Each definition names the estimate for what it is: an aggregate of
  // perception-based surveys and expert assessments, not a measurement.
  wgiVoice:
    "How far citizens can select their government, speak freely, associate and access a free press — a 0–100 score aggregated from survey and expert assessments.",
  wgiStability:
    "Perceived likelihood of political instability or politically motivated violence, scored 0–100 (higher = more stable).",
  wgiEffectiveness:
    "Perceived quality of public services, the civil service and policy implementation, scored 0–100 from survey and expert assessments.",
  wgiRegQuality:
    "Perceived ability of government to write and enforce rules that let the private sector develop, scored 0–100.",
  wgiRuleOfLaw:
    "Perceived confidence in contract enforcement, property rights, the police and the courts, scored 0–100.",
  wgiCorruption:
    "Perceived extent to which public power is used for private gain, scored 0–100 (higher = less corruption perceived).",

  // health
  healthSpendPctGdp:
    "Total health expenditure — public and private together — as a share of GDP.",
  physicians:
    "Practising physicians per 1,000 people, from the most recent year a count was reported.",
  underFiveMortality:
    "Deaths before a child's fifth birthday, per 1,000 live births.",
  measlesImmunisation:
    "Share of children aged 12–23 months who have received a measles vaccination.",
  safeWater:
    "Share of the population using an improved water source on their premises, available when needed and free of contamination.",

  // education
  literacyRate:
    "Share of people aged 15 and over who can read and write a short simple statement about their everyday life. Many high-income countries stopped surveying this, so the figure is often missing rather than low.",
  eduSpendPctGdp:
    "Government spending on education as a share of GDP.",
  primaryEnrolment:
    "Primary enrolment of all ages as a share of the official primary-school-age population — repeaters and over-age pupils can push it above 100%.",
  secondaryEnrolment:
    "Secondary enrolment of all ages as a share of the official secondary-school-age population; it can exceed 100% for the same reason.",
  tertiaryEnrolment:
    "University and college enrolment as a share of the population in the five years after secondary school; mature students can push it above 100%.",

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

  // resources — USGS physical production. The headline year is the USGS
  // estimate; the year before it is the reported figure, and the metric window
  // shows both. Nations that mine none of a commodity carry no card for it.
  prodCopper:
    "Copper mined from ore, by metal content. The latest year is a USGS estimate; the year before it is the reported figure.",
  prodIronOre:
    "Iron ore mined, measured as usable ore rather than iron content — the larger of the two figures USGS publishes. The latest year is an estimate.",
  prodGold:
    "Gold mined, by metal content. The latest year is a USGS estimate.",
  prodLithium:
    "Lithium mined, by lithium content, excluding US output which USGS withholds to protect company data. The latest year is an estimate.",
  prodCobalt:
    "Cobalt mined, by metal content — most of it a by-product of copper and nickel mining. The latest year is a USGS estimate.",
  prodNickel:
    "Nickel mined, by metal content. The latest year is a USGS estimate.",
  prodRareEarths:
    "Rare-earth oxide equivalent mined. Mining is only the first step; separation and refining are concentrated more narrowly still. The latest year is an estimate.",
  prodBauxite:
    "Bauxite mined, in dry tonnes — the ore aluminium is refined from. The latest year is a USGS estimate.",
  prodZinc:
    "Zinc mined, by metal content of concentrates and direct-shipping ores. The latest year is a USGS estimate.",
  prodPhosphate:
    "Phosphate rock mined, the raw material of most fertiliser. The latest year is a USGS estimate.",

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
