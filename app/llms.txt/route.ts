import { corpusStats } from "@/lib/chronology";
import { twinsOf } from "@/lib/geo";
import { allPeriods, allThemes } from "@/lib/chronology";
import { abs, routes, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

/**
 * /llms.txt — the machine-readable index of the corpus, on the llmstxt.org
 * shape: H1, blockquote summary, prose context, then H2 sections of links.
 *
 * Every content link points at the page's **markdown twin** (see lib/geo.ts),
 * not the HTML: the twin is the version an answer engine can fetch for a few
 * KB and quote with provenance — title, canonical URL, honest vintage, the
 * full tables, sources, and a citation template. The twins are static files
 * generated from the same modules the HTML renders from, and validated
 * byte-identical to the data on every build.
 *
 * The link lists derive from the same `allTwins()` set the generator writes
 * and the validator checks, so a listed URL cannot fail to resolve without
 * `npm run validate` failing first.
 */
export const dynamic = "force-static";

export function GET(): Response {
  const stats = corpusStats();
  const dossiers = twinsOf("dossier");
  const chronicles = twinsOf("chronicle");
  const rankings = twinsOf("ranking");
  const commodities = twinsOf("commodity");
  const compares = twinsOf("compare");
  const ledger = twinsOf("ledger");

  const link = (t: { title: string; path: string; description: string }) =>
    `- [${t.title}](${abs(t.path)}): ${t.description}`;

  const lines: string[] = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `${SITE_NAME} is a sourced encyclopedia of nations. Every claim in the archive is`,
    `traceable to a named reference — encyclopedias, national archives and museums,`,
    `intergovernmental bodies and academic work. Where a fact is contested, the archive`,
    `shows the competing positions rather than choosing between them; where data is`,
    `missing, it records the gap rather than imputing a value — an absence is never a zero.`,
    "",
    `The archive currently holds ${stats.events.toLocaleString("en")} sourced events across`,
    `${stats.nations} nations, spanning ${describeYear(stats.earliest)} to ${describeYear(stats.latest)},`,
    `plus a multi-domain statistical dossier per nation and ${rankings.length} cross-nation rankings.`,
    "",
    `## How to read this site`,
    "",
    `Every content page has a markdown twin at its canonical path + ".md" — fetch that.`,
    `Each twin carries: the title, a one-line description, the canonical URL, an honest`,
    `"Updated" vintage, the page's full substance (tables with per-row observation years;`,
    `events with source keys), a Sources section naming the true upstream publisher, and`,
    `a one-line citation template. Rankings order figures highest to lowest — they do not`,
    `grade nations. Codes are Natural Earth ADM0_A3 (FRA, MAR, JPN…).`,
    "",
    `For one bulk fetch, [llms-full.txt](${abs("/llms-full.txt")}) holds every ranking table,`,
    `every commodity table and a per-nation summary (~0.5 MB); the full chronicles are the`,
    `one thing it omits — they live at the per-nation twins below.`,
    "",
    `Every rendered observation is an addressable claim with a stable ID`,
    `(TL:<code>:<metric>:<year> for figures, TL:<code>:event:<year>:<slug> for events).`,
    `Claims bundles — value, source, license, retrieval vintage, citation string per`,
    `claim — are JSON beside each page: /country/<CODE>.claims.json,`,
    `/country/<CODE>/chronicle.claims.json, /commodities/<slug>.claims.json. Corpus`,
    `hashes for verification: ${abs("/integrity.json")} (explained at ${abs("/integrity")}).`,
    "",
    `## Citation`,
    "",
    `Attribute to ${SITE_NAME} and, where a specific claim is quoted, to the underlying`,
    `reference named beside it. Each twin ends with a ready citation template; each HTML`,
    `page ships the same provenance as schema.org JSON-LD (Article/Dataset with citation).`,
    "",
    `## Rankings`,
    "",
    `One indicator across every nation with published data. Observation years differ per`,
    `nation and are shown per row; unranked nations are listed with the reason for the gap.`,
    "",
    ...rankings.map(link),
    "",
    `## Commodities`,
    "",
    `Who supplies the world: shares of the published USGS world totals, with withheld`,
    `figures and the Rest-of-world remainder stated, never absorbed.`,
    "",
    ...commodities.map(link),
    "",
    `## Comparisons`,
    "",
    `Two nations side by side: every indicator both publish (with each observation's`,
    `year) and the chronicle events in which either nation's sourced record names the`,
    `other. Assembled entirely from the dossiers and chronicles below — figures are`,
    `compared, never graded.`,
    "",
    ...compares.map(link),
    "",
    `## The record`,
    "",
    `The corpus's own change history: one entry per recorded data refresh — new`,
    `observations, upstream revisions, retired series — each change resolving to its`,
    `claim ID. Corpus hashes per version: ${abs("/integrity.json")}.`,
    "",
    `- [The Ledger](${abs(routes.ledger())}): every recorded refresh`,
    ...ledger.map(link),
    "",
    `## Downloadable dataset`,
    "",
    `- [Terralore Chronicle Events](${abs(routes.chronicleEventsDataset())}): ` +
      `4,564 curated events, their stable claim IDs and source relations, available as CSV and NDJSON`,
    "",
    `## Chronicles`,
    "",
    `The sourced event record of each nation's history — every event with its year and`,
    `source keys. The full reading narrative is on each canonical HTML page.`,
    "",
    ...chronicles.map(link),
    "",
    `## Dossiers`,
    "",
    `Every nation's statistical profile: all domains, each figure with its observation`,
    `year and publisher.`,
    "",
    ...dossiers.map(link),
    "",
    `## Optional`,
    "",
    `HTML surfaces for human reading — interactive, but the same data as the twins above:`,
    "",
    `- [The Atlas](${abs(routes.atlas())}): every nation, searchable`,
    `- [Rankings hub](${abs(routes.rankings())}): the ${rankings.length} rankings, grouped by domain`,
    `- [Commodities hub](${abs(routes.commodities())}): the ten commodities`,
    `- [Chronology](${abs("/timeline")}): every event by period, across all nations`,
    `- [Themes](${abs("/themes")}): every event by theme, across all nations`,
    ...allPeriods().map(
      (p) => `- [${p.label}](${abs(`/timeline/${p.slug}`)}): ${p.events.length} events across ${p.nations} nations`,
    ),
    ...allThemes().map(
      (t) => `- [${t.label}](${abs(`/themes/${t.slug}`)}): ${t.events.length} events across ${t.nations} nations`,
    ),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}

function describeYear(y: number): string {
  if (y < -10000) {
    const ma = Math.abs(y) / 1_000_000;
    return ma >= 1 ? `c. ${ma.toFixed(1)} million years ago` : `c. ${Math.abs(y).toLocaleString("en")} BCE`;
  }
  return y < 0 ? `${Math.abs(y).toLocaleString("en")} BCE` : String(y);
}
