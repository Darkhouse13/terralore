import { allCountries } from "@/lib/countries";
import { getHistory } from "@/lib/histories";
import { allPeriods, allThemes, corpusStats } from "@/lib/chronology";
import { abs, routes, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

/**
 * /llms.txt — a plain-text index of the corpus for answer engines.
 *
 * The convention (llmstxt.org) is a single markdown file at the origin root that
 * describes what a site holds and links the canonical, readable version of each
 * document. It is a complement to sitemap.xml, not a replacement: the sitemap
 * tells a crawler which URLs exist, this tells a model what they contain and
 * which one to read.
 *
 * We deliberately point every nation at its **chronicle** rather than its
 * journey — the chronicle is the server-rendered document that actually carries
 * the prose and the citations.
 */
export const dynamic = "force-static";

export function GET(): Response {
  const stats = corpusStats();

  const nations = allCountries()
    .filter((c) => c.name && c.name !== "-99")
    .map((c) => ({ meta: c, history: getHistory(c.code) }))
    .filter((n) => n.history?.status === "published")
    .sort((a, b) => a.meta.name.localeCompare(b.meta.name));

  const lines: string[] = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `${SITE_NAME} is a sourced encyclopedia of nations. Every claim in the archive is`,
    `traceable to a named reference — encyclopedias, national archives and museums,`,
    `intergovernmental bodies and academic work. Where a fact is contested, the archive`,
    `shows the competing positions rather than choosing between them; where data is`,
    `missing, it records the gap rather than imputing a value.`,
    "",
    `The archive currently holds ${stats.events.toLocaleString("en")} sourced events across`,
    `${stats.nations} nations, spanning ${describeYear(stats.earliest)} to ${describeYear(stats.latest)}.`,
    "",
    `## How to read this site`,
    "",
    `Each nation is published at three depths:`,
    "",
    `- **Dossier** (\`/country/<CODE>\`) — sourced indicators across economy, society,`,
    `  technology, geography, resources and military, each with its publisher and data vintage.`,
    `- **Chronicle** (\`/country/<CODE>/chronicle\`) — the full history as one document:`,
    `  every era, event, figure and reference. **This is the canonical readable version**`,
    `  and the right page to quote.`,
    `- **Time-journey** (\`/country/<CODE>/history\`) — the same material as an interactive,`,
    `  piloted experience. Rendered one moment at a time, so prefer the chronicle for reading.`,
    "",
    `Codes are Natural Earth \`ADM0_A3\` (e.g. \`FRA\`, \`MAR\`, \`JPN\`).`,
    "",
    `## Citation`,
    "",
    `Attribute to ${SITE_NAME} and, where a specific claim is quoted, to the underlying`,
    `reference named beside it in the chronicle's reference list. Every chronicle carries`,
    `schema.org \`Article\` markup whose \`citation\` array lists those references with their`,
    `originating publishers.`,
    "",
    `## Browse the archive`,
    "",
    `- [The Atlas](${abs(routes.atlas())}): every nation, searchable`,
    `- [Chronology](${abs("/timeline")}): every event by period, across all nations`,
    `- [Themes](${abs("/themes")}): every event by theme, across all nations`,
    "",
    `### By period`,
    "",
    ...allPeriods().map(
      (p) =>
        `- [${p.label}](${abs(`/timeline/${p.slug}`)}): ${p.events.length} events across ${p.nations} nations`,
    ),
    "",
    `### By theme`,
    "",
    ...allThemes().map(
      (t) =>
        `- [${t.label}](${abs(`/themes/${t.slug}`)}): ${t.events.length} events across ${t.nations} nations`,
    ),
    "",
    `## Nations`,
    "",
    ...nations.map(
      ({ meta, history }) =>
        `- [${meta.name}](${abs(routes.chronicle(meta.code))}): ${history!.tagline}`,
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
