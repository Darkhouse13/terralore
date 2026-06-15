// Access layer for the per-nation data dossier. Mirrors lib/histories: each
// domain is a committed JSON file (built by scripts/build-<domain>.mjs) keyed on
// canonical ADM0_A3 codes. Register a new domain by importing its file and adding
// it to FILES — the dossier assembles whatever exists for a country.
import type {
  Comparison,
  CountryDossier,
  DataSource,
  DomainKey,
  DomainSection,
  Metric,
  RankSlot,
} from "../types";
import economy from "@/data/domains/economy.json";
import society from "@/data/domains/society.json";
import technology from "@/data/domains/technology.json";
import geography from "@/data/domains/geography.json";
import resources from "@/data/domains/resources.json";
import military from "@/data/domains/military.json";

interface DomainFile {
  domain: DomainKey;
  updated: string;
  sources: Record<string, DataSource>;
  data: Record<string, { metrics: Metric[] }>;
}

const F = (x: unknown) => x as DomainFile;

// Insertion order = dossier tab order.
const FILES: Partial<Record<DomainKey, DomainFile>> = {
  economy: F(economy),
  society: F(society),
  technology: F(technology),
  geography: F(geography),
  resources: F(resources),
  military: F(military),
};

export function getDomain(code: string, domain: DomainKey): DomainSection | undefined {
  const entry = FILES[domain]?.data[code];
  if (!entry?.metrics?.length) return undefined;
  return { domain, metrics: entry.metrics };
}

/** Assemble every available domain section for a country, with its sources. */
export function getDossier(code: string): CountryDossier | null {
  const sections: Partial<Record<DomainKey, DomainSection>> = {};
  const sources: Record<string, DataSource> = {};
  let updated = "";

  for (const [domain, file] of Object.entries(FILES) as [DomainKey, DomainFile][]) {
    const entry = file.data[code];
    if (!entry?.metrics?.length) continue;
    sections[domain] = { domain, metrics: entry.metrics };
    for (const m of entry.metrics) {
      const s = file.sources[m.sourceId];
      if (s) sources[m.sourceId] = s;
    }
    if (file.updated > updated) updated = file.updated;
  }

  if (Object.keys(sections).length === 0) return null;
  return { code, sections, sources, updated };
}

/** True when at least one domain has a real (non-null) value for this country. */
export function hasDomainData(code: string): boolean {
  return Object.values(FILES).some((file) =>
    file?.data[code]?.metrics.some((m) => m.value != null),
  );
}

/** A single metric, e.g. for a card headline. */
export function getMetric(code: string, domain: DomainKey, key: string): Metric | undefined {
  return FILES[domain]?.data[code]?.metrics.find((m) => m.key === key);
}

// ── Cross-domain synthesis ────────────────────────────────────────────────
// A few signature metrics, each ranked higher-is-first, that place a nation in
// context. Direction is "bigger = #1" — neutral phrasing ("Nth highest") keeps
// it honest for metrics where high isn't necessarily "good" (e.g. military).
const COMPARE: { domain: DomainKey; key: string; label: string }[] = [
  { domain: "economy", key: "gdp", label: "Economy size" },
  { domain: "economy", key: "gdpPerCapita", label: "Income per person" },
  { domain: "society", key: "lifeExpectancy", label: "Life expectancy" },
  { domain: "technology", key: "internetUsers", label: "Internet access" },
  { domain: "military", key: "milExpUsd", label: "Military spending" },
];

/** Rank one country's value for a metric among a set of peers (higher = rank 1). */
function rankAmong(
  codes: string[],
  domain: DomainKey,
  key: string,
  code: string,
): RankSlot | null {
  const file = FILES[domain];
  if (!file) return null;
  const values: number[] = [];
  let mine: number | null = null;
  for (const c of codes) {
    const v = file.data[c]?.metrics.find((m) => m.key === key)?.value;
    if (v == null) continue;
    values.push(v);
    if (c === code) mine = v;
  }
  if (mine == null) return null;
  const rank = values.filter((v) => v > mine!).length + 1;
  return { rank, total: values.length };
}

/** Where this nation stands on each signature metric, worldwide and regionally. */
export function getComparisons(code: string, peerCodes: string[]): Comparison[] {
  const out: Comparison[] = [];
  for (const c of COMPARE) {
    const file = FILES[c.domain];
    const metric = file?.data[code]?.metrics.find((m) => m.key === c.key);
    if (!file || !metric || metric.value == null) continue;
    const global = rankAmong(Object.keys(file.data), c.domain, c.key, code);
    if (!global) continue;
    const regional = rankAmong(peerCodes, c.domain, c.key, code);
    out.push({
      domain: c.domain,
      key: c.key,
      label: c.label,
      value: metric.value,
      unit: metric.unit,
      year: metric.year,
      global,
      regional: regional && regional.total >= 3 ? regional : null,
    });
  }
  return out;
}
