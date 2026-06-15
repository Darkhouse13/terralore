// Access layer for the per-nation data dossier. Mirrors lib/histories: each
// domain is a committed JSON file (built by scripts/build-<domain>.mjs) keyed on
// canonical ADM0_A3 codes. Register a new domain by importing its file and adding
// it to FILES — the dossier assembles whatever exists for a country.
import type {
  CountryDossier,
  DataSource,
  DomainKey,
  DomainSection,
  Metric,
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
