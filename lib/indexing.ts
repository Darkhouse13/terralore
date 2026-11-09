import { getCountry } from "@/lib/countries";

/**
 * The index surface — the one place that decides which pages ask Google to
 * index them (docs/seo/growth-loop.md, 2026-11-09).
 *
 * Why so few: since the August 2026 spam update Google holds ~99% of the site
 * at "Crawled - currently not indexed", and it judges a domain as a whole
 * ("individual pages … match the overall quality of other pages on the
 * domain"). Templated pages built at scale from public data — dossiers,
 * rankings, timeline and theme buckets — are the pattern that update targets.
 * Its stated remedy is to exclude them from Search. Every page stays live,
 * linked and followable; only `noindex` and the sitemap change.
 *
 * The chronicles kept are the ones aimed at the audience we are building
 * (Europe + North America, plus nations our reels already anchor). To widen
 * the surface later, add to the lists below — one place, no route edits.
 */

const CHRONICLE_CONTINENTS = new Set(["Europe", "North America"]);
const CHRONICLE_EXTRAS = new Set([
  "FRA", // its history is authored in TS, and France belongs in any cut
  "AUS",
  "NZL",
  "JPN",
  "KOR",
  "CYP",
  "MNG",
  "IRN",
]);

/**
 * Google-only. Bing still ranks these pages (positions 4-7 on rankings,
 * timeline periods and non-target chronicles, Bing Webmaster 2026-11-09), and
 * Bing feeds ChatGPT and Copilot search, so the generic robots tag stays
 * index,follow and only `googlebot` gets noindex.
 */
export const NOINDEX = {
  robots: { index: true, follow: true, googleBot: { index: false, follow: true } },
} as const;

export function chronicleIndexable(code: string): boolean {
  if (CHRONICLE_EXTRAS.has(code)) return true;
  const continent = getCountry(code)?.continent;
  return !!continent && CHRONICLE_CONTINENTS.has(continent);
}

/** Data dossiers: templated from World Bank / USGS series — out of the index. */
export function dossierIndexable(_code: string): boolean {
  return false;
}

/** Timeline period pages: derived listings of chronicle events — out. */
export function timelinePeriodIndexable(_slug: string): boolean {
  return false;
}

/** Theme pages (per-category listings): derived — out. */
export function themeIndexable(_slug: string): boolean {
  return false;
}
