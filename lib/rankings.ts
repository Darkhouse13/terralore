// ── The rankings surface: every dossier metric, read across nations ─────────
//
// Build-time only (SSG). The dossier answers "what is true of this nation?";
// these pages answer the inverse — for one indicator, every nation that has a
// published figure, ordered highest to lowest. Assembled from the same
// committed domain files that feed the dossier (data/domains/*.json via
// lib/domains), NOT from the derived series files: the series index drops any
// nation whose trailing series is shorter than two points, and nineteen
// nations hold a real literacy figure with no chartable series. A ranking
// that silently lost them would be a wrong claim, not a gap.
//
// Honesty rules enforced here, at compute time, so a bad state fails the
// build rather than publishing a wrong table:
//
//   * **Absence is never zero.** Only nations with a published value are
//     ranked; the rest are listed apart, with the NO_DATA_NOTES explanation
//     where one exists. (USGS mineral metrics are the exception in form, not
//     substance: the MCS names producers only, so non-producers are covered
//     by the commodity page's "Rest of world" note instead of a 170-nation
//     list that would misread as a data gap.)
//   * **Vintages differ per nation** in these datasets — every row carries
//     its own observation year, and the page says so when years are mixed.
//   * **Ties share a rank** (competition ranking): two equal values are the
//     same observation, and inventing an order between them would be a claim
//     the data does not make.
//   * Every metric key must have a slug in data/ranking-slugs.json, and every
//     alias pair must be byte-identical across its two domain files — the
//     same invariants scripts/validate-rankings.mjs asserts offline.

import type { DataSource, DomainKey, Metric } from "./types";
import { allDomainFiles, type DomainFile } from "./domains";
import { allCountries } from "./countries";
import { METRIC_DEFS } from "./metric-defs";
import { NO_DATA_NOTES } from "./territory-notes";
import { commodityByMetricKey } from "./commodity-meta";
import { rankingAliases, rankingSlug } from "./ranking-meta";

export interface RankedRow {
  /** Competition rank, 1 = highest value; ties share a rank. */
  rank: number;
  code: string;
  name: string;
  flag: string | null;
  value: number;
  /** The vintage of THIS nation's observation — they differ across rows. */
  year: number | null;
}

export interface NoDataRow {
  code: string;
  name: string;
  flag: string | null;
  /** The written explanation for the gap, where one exists (NO_DATA_NOTES). */
  note: string | null;
}

export interface Ranking {
  key: string;
  slug: string;
  domain: DomainKey;
  label: string;
  unit: string;
  /** Plain-language definition from lib/metric-defs.ts — required, not optional. */
  definition: string;
  /** The domain file's refresh date — the honest lastmod for this page. */
  updated: string;
  /** The true upstream publisher(s) this metric's figures rest on. */
  sources: DataSource[];
  /** Other dossier metric keys carrying identical data (alias pairs). */
  aliasKeys: { key: string; domain: DomainKey }[];
  rows: RankedRow[];
  noData: NoDataRow[];
  /** USGS MCS physical production — producers-only data, see noData caveat. */
  isMineral: boolean;
  /** /commodities slug when this metric has a commodity page. */
  commoditySlug: string | null;
  /** Observation-year spread across ranked rows; min !== max ⇒ mixed vintages. */
  years: { min: number; max: number } | null;
}

function fail(msg: string): never {
  throw new Error(`lib/rankings: ${msg}`);
}

/** Same junk filter the atlas and sitemap use for Natural Earth sentinel rows. */
function isRealCountry(name: string | undefined | null): boolean {
  return !!name && name !== "-99";
}

/** One metric's per-nation observations inside a domain file. */
function collect(file: DomainFile, key: string) {
  const perCode = new Map<string, { value: number | null; year: number | null }>();
  const sourceIds = new Set<string>();
  let label = "";
  let unit = "";
  for (const [code, entry] of Object.entries(file.data)) {
    const m = entry.metrics.find((x: Metric) => x.key === key);
    if (!m) continue;
    perCode.set(code, { value: m.value, year: m.year });
    sourceIds.add(m.sourceId);
    label ||= m.label;
    unit ||= m.unit;
  }
  return { perCode, sourceIds, label, unit };
}

function buildRanking(
  file: DomainFile,
  key: string,
  countries: Map<string, { name: string; flag: string | null }>,
): Ranking {
  const slug = rankingSlug(key);
  if (!slug) fail(`${file.domain}/${key} has no slug in data/ranking-slugs.json`);

  const definition = METRIC_DEFS[key];
  if (!definition) fail(`${key} has no definition in lib/metric-defs.ts — the page would render a fallback`);

  const { perCode, sourceIds, label, unit } = collect(file, key);

  // The alias identity, re-asserted at build: a shared page must be shared
  // because the figures are the same figures, not because someone said so.
  const aliasKeys: { key: string; domain: DomainKey }[] = [];
  for (const [aliasKey, target] of Object.entries(rankingAliases)) {
    if (target !== key) continue;
    const aliasFile = allDomainFiles().find((f) =>
      Object.values(f.data).some((e) => e.metrics.some((m: Metric) => m.key === aliasKey)),
    );
    if (!aliasFile) fail(`alias "${aliasKey}" exists in no domain file`);
    const alias = collect(aliasFile, aliasKey);
    for (const [code, obs] of perCode) {
      const other = alias.perCode.get(code);
      if (other?.value !== obs.value || other?.year !== obs.year) {
        fail(
          `alias pair ${aliasKey}/${key} diverges at ${code} ` +
            `(${other?.value}@${other?.year} vs ${obs.value}@${obs.year}) — ` +
            `the shared /rankings/${slug} page is only honest while they are identical`,
        );
      }
    }
    if (alias.perCode.size !== perCode.size) {
      fail(`alias pair ${aliasKey}/${key} covers different nation sets`);
    }
    aliasKeys.push({ key: aliasKey, domain: aliasFile.domain });
  }

  const sources = [...sourceIds].map((id) => {
    const s = file.sources[id];
    if (!s) fail(`${file.domain}/${key} references unknown source "${id}"`);
    return s;
  });

  // Ranked rows: only published values, highest first, ties sharing a rank.
  const valued = [...perCode.entries()]
    .filter((e): e is [string, { value: number; year: number | null }] => e[1].value != null)
    .map(([code, obs]) => {
      const c = countries.get(code);
      if (!c) fail(`${file.domain}/${key}: code ${code} is not in the atlas`);
      return { code, name: c.name, flag: c.flag, value: obs.value, year: obs.year };
    })
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));

  const rows: RankedRow[] = valued.map((r, i) => ({
    rank: i > 0 && valued[i - 1].value === r.value ? 0 : i + 1,
    ...r,
  }));
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].rank === 0) rows[i].rank = rows[i - 1].rank;
  }

  const isMineral = commodityByMetricKey.has(key);
  const ranked = new Set(rows.map((r) => r.code));
  // Absence ≠ zero: everything in the atlas that is not ranked is a gap, named
  // as such. Minerals are producers-only data — the honest account of the
  // other ~170 nations is the commodity page's "Rest of world", not this list.
  const noData: NoDataRow[] = isMineral
    ? []
    : [...countries.entries()]
        .filter(([code]) => !ranked.has(code))
        .map(([code, c]) => ({ code, name: c.name, flag: c.flag, note: NO_DATA_NOTES[code] ?? null }))
        .sort((a, b) => a.name.localeCompare(b.name));

  const rowYears = rows.map((r) => r.year).filter((y): y is number => y != null);

  return {
    key,
    slug,
    domain: file.domain,
    label,
    unit,
    definition,
    updated: file.updated,
    sources,
    aliasKeys,
    rows,
    noData,
    isMineral,
    commoditySlug: commodityByMetricKey.get(key)?.slug ?? null,
    years: rowYears.length ? { min: Math.min(...rowYears), max: Math.max(...rowYears) } : null,
  };
}

let cache: Ranking[] | null = null;

/**
 * Every ranking, in dossier order: domains in tab (FILES insertion) order,
 * metrics in their in-file order. Alias keys do not own a page and are folded
 * into the key they alias.
 */
export function allRankings(): Ranking[] {
  if (cache) return cache;

  const countries = new Map(
    allCountries()
      .filter((c) => isRealCountry(c.name))
      .map((c) => [c.code, { name: c.name, flag: c.flag }]),
  );

  const out: Ranking[] = [];
  const seen = new Set<string>();
  for (const file of allDomainFiles()) {
    // metric keys in in-file order (first nation that carries each one)
    const keys: string[] = [];
    for (const entry of Object.values(file.data)) {
      for (const m of entry.metrics) {
        if (!keys.includes(m.key)) keys.push(m.key);
      }
    }
    for (const key of keys) {
      if (key in rankingAliases) continue; // folded into its target's page
      if (seen.has(key)) fail(`metric key "${key}" appears in two domains`);
      seen.add(key);
      out.push(buildRanking(file, key, countries));
    }
  }

  cache = out;
  return out;
}

const bySlug = () => new Map(allRankings().map((r) => [r.slug, r]));
let slugCache: Map<string, Ranking> | null = null;

export function getRanking(slug: string): Ranking | undefined {
  slugCache ??= bySlug();
  return slugCache.get(slug);
}

/** Latest refresh date across every domain — the hub page's honest lastmod. */
export function rankingsUpdated(): string {
  return allDomainFiles()
    .map((f) => f.updated)
    .sort()
    .at(-1)!;
}
