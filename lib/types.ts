// ── Country basic metadata (generated, see scripts/build-data.mjs) ─────────
export interface CountryMeta {
  code: string; // canonical ADM0_A3 code (matches geojson + histories)
  iso2: string | null;
  name: string;
  officialName: string;
  capital: string[];
  region: string | null;
  subregion: string | null;
  continent: string | null;
  population: number | null;
  area: number | null; // km²
  flag: string | null; // emoji
  languages: string[];
  currencies: { code: string; name: string; symbol?: string }[];
  demonym: string | null;
  latlng: [number, number] | null;
  borders: string[];
  independent: boolean | null;
  unMember: boolean | null;
}

export type CountryMetaMap = Record<string, CountryMeta>;

// ── Data dossier schema (generated, see scripts/build-<domain>.mjs) ─────────
// Every nation has a multi-domain "dossier" of sourced, dated metrics drawn
// from open data (World Bank, UN, USGS…). History is one domain among these.

export type DomainKey =
  | "economy"
  | "society"
  | "technology"
  | "geography"
  | "resources"
  | "military";

export interface DataSource {
  id: string; // short key, referenced by Metric.sourceId
  label: string;
  publisher: string;
  url: string;
  license: string;
  accessed: string; // ISO date the data was pulled
}

export interface Metric {
  key: string; // stable id, e.g. "gdp"
  label: string; // display label, e.g. "GDP"
  value: number | null; // latest known value (null = no data)
  unit: string; // "USD" | "%" | "% of GDP" | "years" | "people" | …
  year: number | null; // vintage of `value`
  /** Trailing time series for sparklines, oldest → newest. */
  series?: { year: number; value: number }[];
  sourceId: string; // → DataSource.id (must resolve, like history events)
}

export interface DomainSection {
  domain: DomainKey;
  metrics: Metric[];
}

export interface CountryDossier {
  code: string;
  sections: Partial<Record<DomainKey, DomainSection>>;
  sources: Record<string, DataSource>;
  updated: string; // most recent domain refresh
}

// Cross-domain synthesis: where a nation stands on a signature metric, both
// worldwide and among its regional peers. Computed at build time from the full
// dataset (see lib/domains getComparisons).
export interface RankSlot {
  rank: number; // 1 = highest
  total: number; // peers with data
}
export interface Comparison {
  domain: DomainKey;
  key: string;
  label: string;
  value: number;
  unit: string;
  year: number | null;
  global: RankSlot;
  regional: RankSlot | null; // null when the peer group is too small to be meaningful
}

export const DOMAIN_META: Record<DomainKey, { label: string }> = {
  economy: { label: "Economy" },
  society: { label: "Society" },
  technology: { label: "Technology" },
  geography: { label: "Geography" },
  resources: { label: "Resources" },
  military: { label: "Military" },
};

// ── History content schema (authored, verified, sourced) ───────────────────

export type SourceKind =
  | "encyclopedia"
  | "academic"
  | "primary"
  | "museum"
  | "gov"
  | "book"
  | "archive"
  | "reference";

export interface Source {
  id: string; // short cite key, referenced by events/eras
  label: string;
  publisher?: string;
  url?: string;
  kind: SourceKind;
}

// Categories drive the colour + icon language of the timeline.
export type EventCategory =
  | "founding" // formation, unification, statehood
  | "independence"
  | "war" // war, conquest, rupture
  | "politics" // dynasties, revolutions, constitutions
  | "religion"
  | "culture" // art, science, language
  | "economy" // trade, currency, industry
  | "colonization"
  | "migration"
  | "disaster"; // plague, famine, catastrophe

export interface TimelineEvent {
  /** Numeric year for sorting/placement. Negative = BCE. */
  year: number;
  /** Optional display override, e.g. "c. 3100 BCE", "509 BCE". */
  yearLabel?: string;
  endYear?: number;
  title: string;
  summary: string;
  category: EventCategory;
  sources: string[]; // Source.id[]
}

export interface Figure {
  name: string;
  role: string;
  life?: string; // "742–814"
  blurb: string;
  sources?: string[];
}

export interface Era {
  id: string;
  title: string;
  period: string; // human label, e.g. "c. 600 BCE – 50 BCE"
  startYear: number;
  endYear: number;
  /** One-line standfirst beneath the era title. */
  standfirst: string;
  /** Long-form reading paragraphs. */
  body: string[];
  events: TimelineEvent[];
  figures?: Figure[];
  /** A pulled quotation for visual rhythm. */
  pullquote?: { text: string; attribution?: string };
  sources: string[]; // Source.id[] backing this era's narrative
}

export interface QuickFact {
  label: string;
  value: string;
}

export interface CountryHistory {
  code: string;
  name: string;
  /** Editorial subtitle, e.g. "From Gaul to the Fifth Republic". */
  tagline: string;
  /** Standfirst overview, 2–4 sentences. */
  summary: string;
  /** The headline "became a country" moment. */
  founding: {
    label: string;
    yearLabel: string;
    year: number;
    detail: string;
  };
  quickFacts: QuickFact[];
  eras: Era[];
  /** Optional curated set of pivotal figures shown in a gallery. */
  figures?: Figure[];
  sources: Source[];
  status: "published" | "draft";
  /** ISO date this entry was authored / last verified. */
  updated: string;
}

export const CATEGORY_META: Record<
  EventCategory,
  { label: string; tint: string }
> = {
  founding: { label: "Formation", tint: "var(--color-brass)" },
  independence: { label: "Independence", tint: "var(--color-brass-bright)" },
  war: { label: "War & Rupture", tint: "var(--color-crimson)" },
  politics: { label: "Politics & Power", tint: "#7c6a8f" },
  religion: { label: "Religion", tint: "#9a7b4f" },
  culture: { label: "Culture & Ideas", tint: "var(--color-verdigris)" },
  economy: { label: "Economy & Trade", tint: "#6b8f4f" },
  colonization: { label: "Colonisation", tint: "#a85d3c" },
  migration: { label: "Peoples & Migration", tint: "#4f7d8f" },
  disaster: { label: "Catastrophe", tint: "#6d6d6d" },
};
