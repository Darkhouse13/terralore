// ── Dossier ↔ chronicle cross-talk ──────────────────────────────────────────
//
// The two depths held the same nation and never spoke to each other. A GDP
// series that falls off a cliff in 1997 sat one click away from a chronicle
// entry naming the Asian financial crisis, and neither knew the other existed.
//
// This is that link, modelled as **data rather than hand-paired exceptions**:
// one table maps each dossier domain to the event categories that can plausibly
// move its indicators, and everything else is derived. Adding a domain or a
// category changes one table; it does not require revisiting 184 nations.
//
// Deliberately conservative. An annotation is an invitation to go and read the
// sourced account, never a claim that the event *caused* the movement in the
// series — the corpus does not assert causation and neither does this. The UI
// wording ("in the archive") carries the same care.
//
// Build-time only: every input is committed JSON, and the output is passed
// through the SSG page as props. Nothing here is fetched at runtime.
//
// SPLIT DELIBERATELY: this module is imported by the client-side Dossier for
// `annotationsForSeries`, so nothing in it may touch `lib/histories` — the
// registry statically imports all 183 history files, and a client import here
// bundles the entire ~5.8 MB corpus into every dossier visitor's browser.
// That is not hypothetical: it shipped, and the dossier's JS payload measured
// 6.5 MB before this split. `annotationsFor`, the one function that reads the
// corpus, lives in lib/annotations-server.ts.

import type { DomainKey, EventCategory } from "./types";

/**
 * Which event categories can move which domain's indicators.
 *
 * The test applied to each pair was "would a reader looking at this chart find
 * this kind of event a plausible thing to have happened to it?" — not "is there
 * a causal mechanism", which is a claim the corpus does not make.
 */
export const DOMAIN_CATEGORIES: Record<DomainKey, EventCategory[]> = {
  economy: ["economy", "war", "disaster", "independence", "politics", "colonization"],
  society: ["disaster", "war", "migration", "politics", "independence"],
  governance: ["politics", "independence", "war", "colonization"],
  technology: ["culture", "economy", "politics"],
  geography: ["disaster", "economy"],
  resources: ["economy", "colonization", "war"],
  military: ["war", "independence", "politics"],
};

/**
 * The reverse direction: from a chronicle event's category to the metric most
 * worth opening beside it. Only categories with an honest destination appear —
 * a religion or culture event has no indicator that speaks to it, and inventing
 * a link would be worse than offering none.
 *
 * The keys must exist in the built domain files; `metricLinkFor` returns a hash
 * the dossier already knows how to restore (see Dossier's URL mirroring).
 */
const CATEGORY_METRIC: Partial<Record<EventCategory, { domain: DomainKey; key: string }>> = {
  economy: { domain: "economy", key: "gdp" },
  war: { domain: "military", key: "milExpPctGdp" },
  independence: { domain: "economy", key: "gdpPerCapita" },
  colonization: { domain: "economy", key: "gdpPerCapita" },
  disaster: { domain: "society", key: "lifeExpectancy" },
  migration: { domain: "society", key: "population" },
};

export interface EventAnnotation {
  year: number;
  /** Display year as authored ("1997", "c. 600 BCE"). */
  yearLabel: string;
  title: string;
  category: EventCategory;
  categoryLabel: string;
  tint: string;
  /** The era this event belongs to, for the chronicle deep link. */
  eraId: string;
}

/**
 * The annotations that belong on one metric's chart: relevant to the domain,
 * inside the series' own span, and capped so a dense century cannot bury the
 * data under its own footnotes.
 *
 * `max` is small on purpose. The chart is the subject; these are margin marks.
 */
export function annotationsForSeries(
  all: EventAnnotation[],
  domain: DomainKey,
  minYear: number,
  maxYear: number,
  max = 4,
): EventAnnotation[] {
  const allowed = new Set(DOMAIN_CATEGORIES[domain] ?? []);
  const inWindow = all.filter(
    (a) => allowed.has(a.category) && a.year >= minYear && a.year <= maxYear,
  );
  if (inWindow.length <= max) return inWindow;

  // Too many: keep an even spread across the window rather than the first N,
  // so the marks describe the whole series instead of crowding its left edge.
  const step = (inWindow.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => inWindow[Math.round(i * step)]).filter(
    (a, i, arr) => arr.indexOf(a) === i,
  );
}

/** Where a chronicle event should send a reader who wants the numbers. */
export function metricLinkFor(
  code: string,
  category: EventCategory,
): { href: string; label: string } | null {
  const target = CATEGORY_METRIC[category];
  if (!target) return null;
  return {
    // The dossier restores this exact state from the hash on load.
    href: `/country/${code}#m=${target.key}&tab=${target.domain}`,
    label: "See the data",
  };
}
