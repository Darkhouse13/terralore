// ── The GEO export layer: markdown twins for answer engines ────────────────
//
// Every content page gets a plain-markdown twin at <canonical-path>.md — a
// version an LLM crawler or agent can fetch for a few KB and quote with full
// provenance. Citation-friendliness is the product: every twin carries its
// canonical URL, its honest data vintage, its true upstream sources, and a
// one-line citation template.
//
// This module is the ONE source of truth for twin content. It is consumed by:
//   · scripts/build-geo.mjs — writes the twins into public/ (committed),
//     where they serve as static files at the exact .md paths (public assets
//     win over dynamic route segments — verified against the built server);
//   · app/llms.txt + app/llms-full.txt — the machine-readable indexes;
//   · scripts/validate-geo.mjs — regenerates every twin and byte-compares it
//     against the committed file, so a twin can never drift from the data.
//
// Twins import the SAME modules the HTML pages render from (lib/rankings,
// lib/domains, lib/histories, lib/commodities, lib/seo) — factual identity
// with the HTML is by construction, not by convention.
//
// The invariants hold here exactly as they do in the HTML:
//   · absence is never zero — "—" cells and named No-data lists;
//   · vintages are per-row, and mixed-vintage tables say so;
//   · WGI scores are absolute 0–100 scores, never percentile ranks;
//   · the language is highest/lowest, never best/worst.

import { allCountries, getCountry } from "./countries";
import { getDossier } from "./domains";
import { allHistories, getHistory } from "./histories";
import { allRankings, type Ranking } from "./rankings";
import { allCommodities, commoditiesSource, commoditiesUpdated, type Commodity } from "./commodities";
import { NO_DATA_NOTES, TERRITORY_NOTES } from "./territory-notes";
import {
  DOMAIN_META,
  type CountryHistory,
  type CountryMeta,
  type DataSource,
  type DomainKey,
} from "./types";
import {
  SITE_URL,
  routes,
  chronicleDescription,
  clampText,
  commodityDescription,
  dossierDescription,
  rankingDescription,
} from "./seo";
import { formatArea, formatMetric, formatPopulation, formatTonnes } from "./format";

export interface Twin {
  /** URL path of the twin itself, e.g. "/rankings/gdp.md". */
  path: string;
  /** URL path of the canonical HTML page it mirrors. */
  canonicalPath: string;
  /** The twin's own title (used by llms.txt link text). */
  title: string;
  /** One-line description (the same line the HTML page's meta carries). */
  description: string;
  /** Which surface produced it — validators count per kind. */
  kind: "dossier" | "chronicle" | "ranking" | "commodity";
  markdown: string;
}

/** Hard ceiling for /llms-full.txt, enforced by scripts/validate-geo.mjs. */
export const LLMS_FULL_CAP = 1_048_576; // 1 MiB

const CITE_PLACEHOLDER = "<YYYY-MM-DD>";

/** Same junk filter the atlas, sitemap and rankings use. */
function isRealCountry(name: string | undefined | null): boolean {
  return !!name && name !== "-99";
}

/**
 * The citation line every twin ends with. The retrieval date is a literal
 * placeholder for the quoting agent to fill — baking a build date in would
 * assert a retrieval that never happened, and would rot besides.
 */
function citation(title: string, canonicalPath: string): string {
  return `Citation template: Terralore, "${title}", terralore.co${canonicalPath}, retrieved ${CITE_PLACEHOLDER}.`;
}

function sourceLine(s: DataSource): string {
  return `- ${s.label} — ${s.publisher} · ${s.license} · accessed ${s.accessed} · ${s.url}`;
}

/** "23.9%", "1.4%", "0.04%" — the commodity pages' share precision, mirrored. */
function pct(share: number | null): string {
  if (share == null) return "—";
  const p = share * 100;
  return `${p.toFixed(p >= 10 ? 0 : p >= 1 ? 1 : 2)}%`;
}

function yearText(year: number, label?: string): string {
  if (label) return label;
  return year < 0 ? `${Math.abs(year).toLocaleString("en")} BCE` : String(year);
}

/* ── ranking twins ────────────────────────────────────────────────────────── */

function rankingTwin(r: Ranking): Twin {
  const canonicalPath = routes.ranking(r.slug);
  const title = `${r.label} by nation — world ranking`;
  const description = rankingDescription(r);
  const mixed = r.years != null && r.years.min !== r.years.max;
  const isWgi = r.sources.some((s) => s.id === "wb-wgi");

  const L: string[] = [
    `# ${title}`,
    "",
    description,
    "",
    `Canonical: ${SITE_URL}${canonicalPath}`,
    `Updated: ${r.updated} (the ${DOMAIN_META[r.domain].label.toLowerCase()} domain's last refresh)`,
    "",
    `Definition: ${r.definition}`,
    `Unit: ${r.unit}. Ordered highest to lowest — a ranking of figures, not a grading of nations. Ties share a rank.`,
    "",
  ];

  if (isWgi) {
    L.push(
      "Note: these are the Worldwide Governance Indicators' absolute 0–100 scores — " +
        "anchored to two hypothetical benchmark performers, not percentile ranks — and they " +
        "aggregate perception surveys and expert assessments: model estimates of what is " +
        "perceived, not direct measurements. The ranking order is computed by Terralore " +
        "from those scores.",
      "",
    );
  }
  if (mixed) {
    L.push(
      `Note: this table mixes vintages — each publisher carries a nation's latest available ` +
        `year, so observations run from ${r.years!.min} to ${r.years!.max}. Every row shows its own.`,
      "",
    );
  }
  if (r.isMineral) {
    L.push(
      "Note: the USGS names only the producers it lists; a nation absent here is not " +
        "recorded as producing none — any output elsewhere sits inside the published world " +
        `total. Shares of world production, with the "Rest of world" remainder: ` +
        `${SITE_URL}${routes.commodity(r.commoditySlug!)}.md`,
      "",
    );
  }

  L.push(`## Ranking (${r.rows.length} ${r.isMineral ? "producers listed" : "nations"})`, "");
  L.push("| Rank | Nation | Value | Observed |", "|---|---|---|---|");
  for (const row of r.rows) {
    L.push(`| ${row.rank} | ${row.name} | ${formatMetric(row.value, r.unit)} | ${row.year ?? "—"} |`);
  }
  L.push("");

  if (r.noData.length > 0) {
    L.push(
      `## No data (${r.noData.length} nations)`,
      "",
      "These nations publish no figure for this indicator in the sources below. Absence " +
        "is a fact about the world's statistical apparatus, not a zero — they are not ranked.",
      "",
    );
    for (const n of r.noData) {
      L.push(`- ${n.name}${n.note ? ` — ${n.note}` : ""}`);
    }
    L.push("");
  }

  if (r.aliasKeys.length > 0) {
    L.push(
      `The same figures appear identically in the dossier's ${DOMAIN_META[r.domain].label} tab and its ` +
        `${r.aliasKeys.map((a) => DOMAIN_META[a.domain].label).join(" and ")} tab.`,
      "",
    );
  }

  L.push("## Sources", "");
  for (const s of r.sources) L.push(sourceLine(s));
  L.push("", citation(title, canonicalPath), "");

  return { path: `${canonicalPath}.md`, canonicalPath, title, description, kind: "ranking", markdown: L.join("\n") };
}

/* ── commodity twins ──────────────────────────────────────────────────────── */

function commodityTwin(c: Commodity): Twin {
  const canonicalPath = routes.commodity(c.slug);
  const title = `${c.name} — who supplies the world`;
  const description = commodityDescription(c);
  const source = commoditiesSource();
  const { reported: yr, estimate: ye } = c.years;

  const cell = (v: number | null, share: number | null, withheld: boolean) =>
    withheld ? "withheld (W)" : v == null ? "—" : `${formatTonnes(v)} · ${pct(share)}`;
  const restCell = (v: number, share: number) =>
    v <= 0 ? "below the table's rounding" : `${formatTonnes(v)} · ${pct(share)}`;

  const withheld = c.producers.filter((p) => p.reportedWithheld || p.estimateWithheld);

  const L: string[] = [
    `# ${title}`,
    "",
    description,
    "",
    `Canonical: ${SITE_URL}${canonicalPath}`,
    `Updated: ${commoditiesUpdated()} (USGS Mineral Commodity Summaries edition)`,
    "",
    `What is measured: the MCS statistics row "${c.detail}" — mine production in tonnes, ` +
      `what left mines in each calendar year. Not reserves in the ground, and not refined or ` +
      `smelted output. ${ye} is the USGS estimate; ${yr} is the reported figure.`,
    "",
    `World total: ${formatTonnes(c.world.estimate)} (${ye} est.) · ${formatTonnes(c.world.reported)} (${yr}).`,
    `Shares are computed against the published world total itself, never against the sum of listed producers.`,
    "",
    `## Producers (${c.producers.length} listed)`,
    "",
    `| Rank | Nation | ${yr} | ${ye} est. |`,
    "|---|---|---|---|",
  ];

  c.producers.forEach((p, i) => {
    L.push(
      `| ${i + 1} | ${p.name} | ${cell(p.reported, p.shareReported, p.reportedWithheld)} | ` +
        `${cell(p.estimate, p.shareEstimate, p.estimateWithheld)} |`,
    );
  });
  L.push(
    `| — | Rest of world | ${restCell(c.restOfWorld.reported, c.restOfWorld.shareReported)} | ` +
      `${restCell(c.restOfWorld.estimate, c.restOfWorld.shareEstimate)} |`,
    "",
    "Rest of world is the published world total minus the producers listed: the MCS " +
      `"Other countries" aggregate, withheld figures, and production this atlas does not ` +
      "file under a separate entity. It is real, published tonnage not attributable to a " +
      "single nation here.",
    "",
  );

  if (withheld.length > 0) {
    L.push(
      `${withheld.map((p) => p.name).join(", ")}: ${withheld.length === 1 ? "its" : "their"} ` +
        `figure is withheld by the USGS ("W") to avoid disclosing company proprietary data. ` +
        "A withheld figure is an absence in this table, never a zero; where the USGS folds " +
        "withheld production into its world total, that tonnage sits inside Rest of world.",
      "",
    );
  }

  L.push("## Sources", "", sourceLine(source), "", citation(title, canonicalPath), "");
  return { path: `${canonicalPath}.md`, canonicalPath, title, description, kind: "commodity", markdown: L.join("\n") };
}

/* ── dossier twins ────────────────────────────────────────────────────────── */

function dossierTwin(meta: CountryMeta): Twin {
  const canonicalPath = routes.dossier(meta.code);
  const title = `${meta.name} — national dossier`;
  const dossier = getDossier(meta.code);
  const domainLabels = dossier
    ? (Object.keys(dossier.sections) as DomainKey[]).map((k) => DOMAIN_META[k].label)
    : [];
  const metricCount = dossier
    ? Object.values(dossier.sections).reduce((n, sec) => n + (sec?.metrics.length ?? 0), 0)
    : 0;
  const description = dossierDescription(meta, domainLabels, metricCount);
  const history = getHistory(meta.code);

  const L: string[] = [
    `# ${title}`,
    "",
    description,
    "",
    `Canonical: ${SITE_URL}${canonicalPath}`,
    `Updated: ${dossier?.updated ?? "—"} (latest domain refresh; each figure carries its own observation year)`,
    "",
    "## Overview",
    "",
    `- Official name: ${meta.officialName || meta.name}`,
    `- Capital: ${meta.capital.length ? meta.capital.join(", ") : "—"}`,
    `- Region: ${[meta.subregion ?? meta.region, meta.continent].filter(Boolean).join(", ") || "—"}`,
    `- Population: ${formatPopulation(meta.population)}`,
    `- Area: ${formatArea(meta.area)}`,
    `- Languages: ${meta.languages.length ? meta.languages.join(", ") : "—"}`,
    `- Currency: ${meta.currencies.length ? meta.currencies.map((c) => `${c.name} (${c.code})`).join(", ") : "—"}`,
    "",
  ];

  const territory = TERRITORY_NOTES[meta.code];
  if (territory) L.push(territory.text, "");

  if (!dossier) {
    L.push(
      NO_DATA_NOTES[meta.code] ??
        "No statistical series are published for this territory in the international " +
          "datasets this atlas draws from. The gap is recorded, not imputed.",
      "",
    );
  } else {
    L.push(
      `A "—" is an absence in the source data, never a zero. Each figure shows the year it ` +
        "was observed — vintages differ by indicator and nation.",
      "",
    );
    for (const [domain, section] of Object.entries(dossier.sections)) {
      if (!section) continue;
      L.push(`## ${DOMAIN_META[domain as DomainKey].label}`, "");
      L.push("| Metric | Value | Observed | Source |", "|---|---|---|---|");
      for (const m of section.metrics) {
        const src = dossier.sources[m.sourceId];
        L.push(
          `| ${m.label} | ${formatMetric(m.value, m.unit)} | ${m.value == null ? "—" : (m.year ?? "—")} | ${src?.label ?? m.sourceId} |`,
        );
      }
      L.push("");
    }
    L.push(
      `Every metric above is also ranked across all nations: ${SITE_URL}${routes.rankings()} ` +
        `(markdown twins at /rankings/<metric>.md).`,
      "",
    );
  }

  if (history?.status === "published") {
    L.push(
      `History: "${history.tagline}" — the sourced chronicle is at ` +
        `${SITE_URL}${routes.chronicle(meta.code)}.md (${history.eras.length} eras, ` +
        `${history.eras.reduce((n, e) => n + e.events.length, 0)} events).`,
      "",
    );
  }

  if (dossier) {
    L.push("## Sources", "");
    for (const s of Object.values(dossier.sources)) L.push(sourceLine(s));
    L.push("");
  }
  L.push(citation(title, canonicalPath), "");

  return { path: `${canonicalPath}.md`, canonicalPath, title, description, kind: "dossier", markdown: L.join("\n") };
}

/* ── chronicle twins ──────────────────────────────────────────────────────── */

function chronicleTwin(meta: CountryMeta, history: CountryHistory): Twin {
  const canonicalPath = routes.chronicle(meta.code);
  const title = `The Chronicle of ${meta.name}: ${history.tagline}`;
  const description = chronicleDescription(meta, history);

  const L: string[] = [
    `# ${title}`,
    "",
    description,
    "",
    `Canonical: ${SITE_URL}${canonicalPath}`,
    `Updated: ${history.updated}`,
    "",
    `Founding: ${history.founding.label} — ${history.founding.yearLabel}. ${history.founding.detail}`,
    "",
    history.summary,
    "",
    "This file carries the chronicle's sourced event record — every event with its year, " +
      "summary and source keys (resolved under References below). The full reading " +
      "narrative lives on the canonical page.",
    "",
  ];

  for (const era of history.eras) {
    L.push(`## ${era.title} — ${era.period}`, "", era.standfirst, "");
    for (const ev of era.events) {
      L.push(
        `- ${yearText(ev.year, ev.yearLabel)}: **${ev.title}** — ${ev.summary} [${ev.sources.join(", ")}]`,
      );
    }
    L.push("");
    if (era.figures?.length) {
      L.push("Figures:", "");
      for (const f of era.figures) {
        L.push(`- ${f.name}${f.life ? ` (${f.life})` : ""} — ${f.role}. ${f.blurb}`);
      }
      L.push("");
    }
  }

  L.push("## References", "");
  for (const s of history.sources) {
    L.push(`- [${s.id}] ${s.label}${s.publisher ? ` — ${s.publisher}` : ""}${s.url ? ` · ${s.url}` : ""}`);
  }
  L.push("", citation(title, canonicalPath), "");

  return { path: `${canonicalPath}.md`, canonicalPath, title, description, kind: "chronicle", markdown: L.join("\n") };
}

/* ── the full set ─────────────────────────────────────────────────────────── */

let twinsCache: Twin[] | null = null;

/** Every twin, memoised: dossiers, chronicles, rankings, commodities. */
export function allTwins(): Twin[] {
  if (twinsCache) return twinsCache;
  const out: Twin[] = [];

  for (const meta of allCountries()) {
    if (!isRealCountry(meta.name)) continue;
    out.push(dossierTwin(meta));
    const history = getHistory(meta.code);
    if (history?.status === "published") out.push(chronicleTwin(meta, history));
  }
  for (const r of allRankings()) out.push(rankingTwin(r));
  for (const c of allCommodities()) out.push(commodityTwin(c));

  twinsCache = out;
  return out;
}

export function twinsOf(kind: Twin["kind"]): Twin[] {
  return allTwins().filter((t) => t.kind === kind);
}

/* ── llms-full.txt ────────────────────────────────────────────────────────── */

/**
 * One compact block per nation for /llms-full.txt — tagline, founding, the
 * summary clamped, and where the two full documents live. NOT the chronicle
 * corpus: at ~291k authored words that belongs at the per-nation twins, and
 * this file stays under LLMS_FULL_CAP so an agent can take it in one fetch.
 */
function nationSummary(meta: CountryMeta): string {
  const history = getHistory(meta.code);
  const L = [`### ${meta.name} (${meta.code})`];
  if (history?.status === "published") {
    L.push(
      `${history.tagline}. Founded: ${history.founding.yearLabel} — ${history.founding.label}. ` +
        clampText(history.summary, 320),
    );
    L.push(
      `Dossier: ${SITE_URL}${routes.dossier(meta.code)}.md · Chronicle: ${SITE_URL}${routes.chronicle(meta.code)}.md`,
    );
  } else {
    L.push(NO_DATA_NOTES[meta.code] ?? "No published history; the dossier records what exists.");
    L.push(`Dossier: ${SITE_URL}${routes.dossier(meta.code)}.md`);
  }
  return L.join("\n");
}

/** The concatenated corpus for /llms-full.txt. Size-capped; states its scope. */
export function llmsFullText(): string {
  const rankings = twinsOf("ranking");
  const commodities = twinsOf("commodity");
  const nations = allCountries()
    .filter((c) => isRealCountry(c.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  const L: string[] = [
    "# Terralore — full data export",
    "",
    "> Every ranking table, every commodity production table, and a summary of every",
    "> nation — each figure sourced and dated. One fetch, quotable with provenance.",
    "",
    "What this file contains: all " +
      `${rankings.length} world rankings (full tables with per-row observation years and ` +
      `no-data lists), all ${commodities.length} commodity production tables, and one summary ` +
      `block per nation (${nations.length}).`,
    "What it deliberately omits: the full per-nation chronicles (~291k words of sourced",
    "history) — those live one fetch away at their own markdown twins,",
    `${SITE_URL}/country/<CODE>/chronicle.md, all indexed in ${SITE_URL}/llms.txt.`,
    "",
    "Citation: cite Terralore and the upstream source named in each section's Sources",
    "list. Retrieval dates belong to the citing agent, not this file.",
    "",
    "---",
    "",
    "# World rankings",
    "",
    ...rankings.map((t) => t.markdown + "\n---\n"),
    "# Commodities — who supplies the world",
    "",
    ...commodities.map((t) => t.markdown + "\n---\n"),
    "# Nations",
    "",
    ...nations.map((meta) => nationSummary(meta) + "\n"),
  ];
  return L.join("\n");
}
