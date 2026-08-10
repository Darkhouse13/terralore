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
  | "governance"
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
  governance: { label: "Governance" },
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

/**
 * Sourced statehood anchors — what the Time Globe's existence shading reads.
 *
 * `founding` answers "the current sovereign state dates from"; this answers
 * "how far back does this nation's statehood run, and when was it interrupted".
 * Two different questions, and conflating them is what made the globe show
 * Morocco — twelve centuries of dynastic continuity — as not yet existing in
 * the 19th century while Egypt glowed from the Bronze Age. See
 * docs/statehood-plan.md for the editorial criteria; they are not optional.
 */
export interface Statehood {
  /**
   * Present and `false` only for entities that are **not sovereign states** —
   * dependencies and autonomous territories whose block records the birth of
   * their own institutions rather than statehood. Absent (i.e. sovereign) for
   * everything else, INCLUDING de-facto states whose sovereignty is disputed
   * (TWN, KOS, PSE, CYN, SOL): those are functioning states whose recognition
   * is contested, which the corpus already handles in prose, and they keep the
   * standard shading.
   *
   * The allowlist of codes that may carry it lives in
   * `scripts/validate-histories.mjs`, deliberately: adding a fifth territory is
   * a conscious edit to the validator rather than a field someone sets in
   * passing. See DECISIONS.md D13.
   */
  sovereign?: false;
  /**
   * The earliest sourced, NAMED polity from which the modern nation draws a
   * broadly accepted line of identity, seated primarily on its modern
   * territory. A historiographic anchor, not a nationalist one — and a modern
   * date is a finding, not a failure: for states with no precursor polity of
   * continuous identity, `formation.year` legitimately equals `founding.year`.
   */
  formation: {
    year: number; // negative = BCE
    yearLabel: string; // display form, e.g. "788 CE", "c. 3100 BCE"
    label: string; // e.g. "Idrisid dynasty unifies northern Morocco"
    detail?: string; // one sentence of nuance if needed
    sources: string[]; // ids into this file's sources[] — MUST resolve
  };
  /**
   * Formalised losses of external sovereignty between formation and today:
   * colony, protectorate, annexation, incorporation, partition out of
   * existence. NOT wartime military occupation with sovereignty restored at
   * war's end, and not vassalage that left internal statehood intact.
   * Ordered, non-overlapping; `end` is the restoration year, which for most
   * nations is exactly `founding.year`.
   */
  interruptions?: {
    start: number;
    end: number;
    label: string; // e.g. "French and Spanish protectorates"
    sources: string[]; // MUST resolve
  }[];
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
  /** Sourced statehood anchors for the Time Globe's existence shading. */
  statehood?: Statehood;
  quickFacts: QuickFact[];
  eras: Era[];
  /** Optional curated set of pivotal figures shown in a gallery. */
  figures?: Figure[];
  sources: Source[];
  status: "published" | "draft";
  /** ISO date this entry was authored / last verified. */
  updated: string;
}

/**
 * The ten event-category pigments — see DESIGN.md.
 *
 * Drawn from the mineral and earth pigments an atlas or an illuminated
 * manuscript would actually have had. This is a different axis from the
 * three-tint semantic ramp (copper / verdigris / madder); the exception is
 * war, which stays in the madder family because rupture is what madder means.
 *
 * Held as literal hex, not `var(--color-…)`, because these tints are consumed
 * from canvas and generated SVG as well as from CSS, and a custom property
 * resolves in none of those.
 *
 * Three variants, because one pigment cannot do three jobs:
 *
 *   tint   the MARK — bands, dots, rules. Cleared at 3:1 against BOTH grounds,
 *          which is what confines it to the narrow mid-dark window below.
 *   ink    the pigment as SMALL TEXT on limestone (4.5:1). Four of the ten
 *          mark values miss that, so tinting a 0.72rem label with `tint` is a
 *          real accessibility bug, not a near miss.
 *   chalk  the pigment as SMALL TEXT on the deep (4.5:1). ALL ten mark values
 *          miss that — they sit around 3.2:1 — so this one is not optional.
 *
 * The rule: `tint` when the pigment is a shape, `ink`/`chalk` the moment it
 * carries words. scripts/check-contrast.mjs asserts all thirty pairs.
 *
 * The narrow, mid-dark range is not a stylistic tic: a category mark appears on
 * BOTH grounds — the journey and timeline rail sit on the deep, the chronicle
 * and theme pages on limestone — so a single value has to clear 3:1 against
 * #04161F *and* #ebe9e0. `scripts/check-contrast.mjs` asserts all twenty pairs;
 * if you retint one of these, run it.
 */
export const CATEGORY_META: Record<
  EventCategory,
  { label: string; tint: string; ink: string; chalk: string }
> = {
  founding: { label: "Formation", tint: "#8e6e2e", ink: "#806329", chalk: "#987b41" }, // yellow ochre
  independence: { label: "Independence", tint: "#a85b2e", ink: "#9c552b", chalk: "#b26f47" }, // burnt orange
  war: { label: "War & Rupture", tint: "#b0463c", ink: "#ae453b", chalk: "#be675f" }, // madder
  politics: { label: "Politics & Power", tint: "#5464a1", ink: "#5464a1", chalk: "#717eb1" }, // indigo
  religion: { label: "Religion", tint: "#85578a", ink: "#85578a", chalk: "#99729d" }, // tyrian
  culture: { label: "Culture & Ideas", tint: "#2c7566", ink: "#2b7364", chalk: "#4e8b7e" }, // verdigris
  economy: { label: "Economy & Trade", tint: "#566f3c", ink: "#566f3c", chalk: "#71865b" }, // terre verte
  colonization: { label: "Colonisation", tint: "#96583b", ink: "#95573a", chalk: "#a7735a" }, // sienna
  migration: { label: "Peoples & Migration", tint: "#2c6c84", ink: "#2c6c84", chalk: "#54889b" }, // cerulean
  disaster: { label: "Catastrophe", tint: "#5f6d6c", ink: "#5c6a69", chalk: "#778382" }, // graphite
};
