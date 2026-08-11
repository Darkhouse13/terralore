// ── Card subjects, assembled from the SAME modules the pages render from ───
// lib/rankings, lib/commodities, lib/compare, lib/histories via the ts-alias
// loader — factual identity with the site is by construction, exactly as the
// GEO twins achieve it (lib/geo.ts). Nothing here computes a new fact; it
// reshapes existing sourced records into composition inputs.
//
// The one derivation of note: THE DATE INDEX. Events carry day precision only
// in their authored `yearLabel` ("24 Dec 1979", "1 Jul 1878") — there is no
// structured day field. The index parses full-string day/month forms only:
// a label that is a bare year, a range, or "c. …" is year-precision and can
// NEVER anchor an "on this day" claim (fabricating day-precision from
// year-precision records is the line docs/statehood-precision-ledger.md
// exists to hold). Measured against the corpus: 1,063 day-precision events
// covering 333 of 366 calendar days; the calendar layer's fallbacks cover
// the rest honestly.

import { allCountries, getCountry } from "@/lib/countries";
import { allHistories, getHistory } from "@/lib/histories";
import { DOMAIN_META } from "@/lib/types";
import { formatMetric, formatTonnes } from "@/lib/format";
import { routes } from "@/lib/seo";
import { clamp } from "./ui.mjs";

/* ── the date index ───────────────────────────────────────────────────────── */

const MONTHS = {
  January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7,
  August: 8, September: 9, October: 10, November: 11, December: 12,
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Sept: 9,
  Oct: 10, Nov: 11, Dec: 12,
};
const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const M = Object.keys(MONTHS).join("|");
// Full-string matches only — a date appearing inside a range or a "c." label
// is not a day-precision claim about the event itself.
const YL_DAY = new RegExp(`^(\\d{1,2})\\s+(${M})\\.?\\s+(\\d{3,4})$`);
const YL_MONTH = new RegExp(`^(${M})\\.?\\s+(\\d{3,4})$`);

function yearText(year, label) {
  if (label) return label;
  return year < 0 ? `${Math.abs(year).toLocaleString("en")} BCE` : String(year);
}

/** One corpus event as a card-ready record, with its parsed date precision. */
function eventEntry(history, meta, era, ev, byId) {
  const yl = ev.yearLabel ?? "";
  let precision = "year";
  let month = null;
  let day = null;
  let m;
  if ((m = yl.match(YL_DAY)) && ev.year > 0) {
    precision = "day";
    day = Number(m[1]);
    month = MONTHS[m[2]];
  } else if ((m = yl.match(YL_MONTH)) && ev.year > 0) {
    precision = "month";
    month = MONTHS[m[1]];
  }
  return {
    code: history.code,
    nationName: meta?.name ?? history.name,
    year: ev.year,
    yearText: yearText(ev.year, ev.yearLabel),
    /** The record's own claim, normalised for display: "24 December 1979". */
    dateText:
      precision === "day"
        ? `${day} ${MONTH_NAMES[month]} ${ev.year}`
        : precision === "month"
          ? `${MONTH_NAMES[month]} ${ev.year}`
          : yearText(ev.year, ev.yearLabel),
    precision,
    month,
    day,
    title: ev.title,
    summary: ev.summary,
    category: ev.category,
    eraTitle: era.title,
    /** The chronicle's own framing, for caption context. */
    historyTagline: history.tagline,
    historyEras: history.eras.length,
    historyEvents: history.eras.reduce((n, e) => n + e.events.length, 0),
    /** Full source labels — the caption's citation voice. */
    sourceLabels: ev.sources
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((s) => s.label),
    /** Unique publishers — the card's provenance line (the trust anchor;
     *  a bare article label like "Jimmu" reads as nonsense on a card). */
    provenance: [
      ...new Set(
        ev.sources
          .map((id) => byId.get(id))
          .filter(Boolean)
          .map((s) => s.publisher ?? s.label),
      ),
    ],
    targetPath: routes.chronicle(history.code),
  };
}

let dateIndexCache = null;

/**
 * Every published event, indexed by parsed precision:
 *   byDay:   "M-D" → entries (day-precision only)
 *   byMonth: M → entries (month-precision only)
 *   all:     every entry (for year-precision anniversary fallback)
 */
export function dateIndex() {
  if (dateIndexCache) return dateIndexCache;
  const byDay = new Map();
  const byMonth = new Map();
  const all = [];
  for (const history of allHistories()) {
    if (history.status !== "published") continue;
    const meta = getCountry(history.code);
    const byId = new Map(history.sources.map((s) => [s.id, s]));
    for (const era of history.eras) {
      for (const ev of era.events) {
        const entry = eventEntry(history, meta, era, ev, byId);
        all.push(entry);
        if (entry.precision === "day") {
          const key = `${entry.month}-${entry.day}`;
          if (!byDay.has(key)) byDay.set(key, []);
          byDay.get(key).push(entry);
        } else if (entry.precision === "month") {
          if (!byMonth.has(entry.month)) byMonth.set(entry.month, []);
          byMonth.get(entry.month).push(entry);
        }
      }
    }
  }
  // Stable order inside each bucket: year, then nation, then title — the
  // selection layer's determinism rests on this ordering being fixed.
  const cmp = (a, b) => a.year - b.year || a.code.localeCompare(b.code) || a.title.localeCompare(b.title);
  for (const list of byDay.values()) list.sort(cmp);
  for (const list of byMonth.values()) list.sort(cmp);
  all.sort(cmp);
  dateIndexCache = { byDay, byMonth, all };
  return dateIndexCache;
}

/** A stable identity for one event record (the ledger's unit of "used"). */
export function eventKey(entry) {
  return `${entry.code}:${entry.year}:${entry.title}`;
}

/* ── on-this-day subject ──────────────────────────────────────────────────── */

/**
 * The composition + caption input for one selected entry. `kind` is the
 * honesty tier the calendar layer selected under:
 *   day   — the record itself carries this day+month;
 *   month — the record carries the month only ("this month in 1945");
 *   year  — a round anniversary of a year-precision record ("N years ago").
 */
export function onThisDaySubject(entry, kind, date) {
  const monthName = MONTH_NAMES[date.month];
  const years = date.year - entry.year;
  const eyebrowText =
    kind === "day"
      ? `On this day · ${date.day} ${monthName}`
      : kind === "month"
        ? `This month in history · ${monthName}`
        : `${years} years ago`;
  return {
    type: "on-this-day",
    kind,
    seed: `otd-${eventKey(entry)}`,
    eyebrowText,
    dateText: entry.dateText,
    event: entry,
    yearsAgo: years,
    targetPath: entry.targetPath,
  };
}

/* ── ranking subject ──────────────────────────────────────────────────────── */

export function rankingSubject(r) {
  return {
    type: "ranking",
    seed: `rk-${r.slug}`,
    surfaceKey: `rk-${r.slug}`,
    slug: r.slug,
    label: r.label,
    domainLabel: DOMAIN_META[r.domain].label,
    unit: r.unit,
    rows: r.rows.slice(0, 10).map((row) => ({ rank: row.rank, name: row.name, value: row.value, year: row.year })),
    totalRanked: r.rows.length,
    mixedYears: r.years != null && r.years.min !== r.years.max,
    isMineral: r.isMineral,
    /** WGI scores are absolute 0–100 model estimates, never percentile ranks —
     *  every surface that shows them must say so (lib/geo.ts carries the full
     *  note; cards and captions carry the short form). */
    isWgi: r.sources.some((src) => src.id === "wb-wgi"),
    updated: r.updated,
    definition: r.definition,
    sourceLabels: r.sources.map((s) => s.label),
    provenance: [...new Set(r.sources.map((s) => s.publisher ?? s.label))],
    targetPath: routes.ranking(r.slug),
  };
}

/* ── commodity subject ────────────────────────────────────────────────────── */

/** "23.9%", "1.4%", "0.04%" — the commodity pages' share precision, mirrored. */
function pct(share) {
  if (share == null) return "—";
  const p = share * 100;
  return `${p.toFixed(p >= 10 ? 0 : p >= 1 ? 1 : 2)}%`;
}

export function commoditySubject(c, source, updated) {
  // Top producers by estimate-year share; withheld figures cannot draw a bar
  // honestly, so they are left to the page (the caption's URL carries them).
  const listed = c.producers
    .filter((p) => p.shareEstimate != null)
    .slice(0, 8)
    .map((p) => ({
      name: p.name,
      sharePct: (p.shareEstimate ?? 0) * 100,
      shareText: pct(p.shareEstimate),
      valueText: p.estimate != null ? formatTonnes(p.estimate) : null,
    }));
  return {
    type: "commodity",
    seed: `cm-${c.slug}`,
    surfaceKey: `cm-${c.slug}`,
    slug: c.slug,
    name: c.name,
    detail: c.detail,
    estimateYear: c.years.estimate,
    reportedYear: c.years.reported,
    worldText: `${formatTonnes(c.world.estimate)} (${c.years.estimate} est.)`,
    topThreeText: pct(c.topThreeShare),
    producers: listed,
    listedCount: c.producers.length,
    restSharePct: c.restOfWorld.shareEstimate * 100,
    restShareText: pct(c.restOfWorld.shareEstimate),
    sourceLabel: source.label,
    provenance: [source.publisher ?? source.label],
    updated,
    targetPath: routes.commodity(c.slug),
  };
}

/* ── compare subject ──────────────────────────────────────────────────────── */

/** The most familiar metric both nations publish — the OG card's rule. */
function headlineRow(page) {
  const rows = page.domains.flatMap((d) => d.rows).filter((r) => r.a.value != null && r.b.value != null);
  for (const key of ["gdpPerCapita", "lifeExpectancy", "gdp", "population"]) {
    const hit = rows.find((r) => r.key === key);
    if (hit) return hit;
  }
  return rows[0] ?? null;
}

export function compareSubject(page) {
  const row = headlineRow(page);
  if (!row) return null;
  const max = Math.max(row.a.value ?? 0, row.b.value ?? 0);
  return {
    type: "compare",
    // The strata seed is the pair's own slug — the same strip the pair page
    // and its OG card draw (the brand's reproducibility contract). The
    // ledger key is namespaced separately.
    seed: page.slug,
    surfaceKey: `cp-${page.slug}`,
    slug: page.slug,
    aName: page.a.name,
    bName: page.b.name,
    aFormation: page.a.formation.yearLabel,
    bFormation: page.b.formation.yearLabel,
    metricLabel: row.label,
    metricKey: row.key,
    unit: row.unit,
    aValueText: formatMetric(row.a.value, row.unit),
    bValueText: formatMetric(row.b.value, row.unit),
    aYear: row.a.year,
    bYear: row.b.year,
    aPct: max > 0 ? (Math.max(row.a.value, 0) / max) * 100 : 0,
    bPct: max > 0 ? (Math.max(row.b.value, 0) / max) * 100 : 0,
    bothCount: page.bothCount,
    crossedCount: page.sharedEvents.length,
    updated: page.updated,
    targetPath: routes.comparePair(page.slug),
  };
}

/* ── formation-story subject (carousel) ───────────────────────────────────── */

// The arc of becoming, told in the corpus's own records: per era, the most
// formative event by category priority, earliest first on ties. Capped at 6
// slides; histories run 5–6 eras, so in practice it is one slide per era.
const FORMATION_PRIORITY = ["founding", "independence", "politics", "colonization", "war"];

export function formationSubject(code) {
  const history = getHistory(code);
  if (history?.status !== "published") return null;
  const meta = getCountry(code);
  const byId = new Map(history.sources.map((s) => [s.id, s]));

  const picks = [];
  for (const era of history.eras.slice(0, 6)) {
    let best = null;
    let bestRank = Infinity;
    for (const ev of era.events) {
      const rank = FORMATION_PRIORITY.indexOf(ev.category);
      const r = rank === -1 ? FORMATION_PRIORITY.length : rank;
      if (r < bestRank || (r === bestRank && best && ev.year < best.year)) {
        best = ev;
        bestRank = r;
      }
    }
    if (best) picks.push(eventEntry(history, meta, era, best, byId));
  }

  return {
    type: "formation",
    seed: `fm-${code}`,
    code,
    nationName: meta?.name ?? history.name,
    tagline: history.tagline,
    foundingText: history.founding.yearLabel,
    foundingLabel: history.founding.label,
    events: picks.slice(0, 6),
    updated: history.updated,
    targetPath: routes.chronicle(code),
  };
}

/** Real, descriptive alt text — accessibility first, discovery second. */
export function altText(subject) {
  switch (subject.type) {
    case "on-this-day": {
      const e = subject.event;
      return clamp(
        `${e.dateText}: ${e.title}. ${e.summary} From the sourced chronicle of ${e.nationName} on Terralore.`,
        480,
      );
    }
    case "ranking": {
      const rows = subject.rows.map((r) => `${r.rank}. ${r.name} ${formatMetric(r.value, subject.unit)}`);
      return clamp(
        `Bar chart: ${subject.label}, the ten highest published figures of ${subject.totalRanked} ` +
          `${subject.isMineral ? "producers listed" : "nations ranked"}. ${rows.join("; ")}. ` +
          `${subject.mixedYears ? "Each figure is that nation's latest observation year. " : ""}` +
          `Source: ${subject.provenance.join("; ")}.`,
        480,
      );
    }
    case "commodity": {
      const rows = subject.producers.map((p) => `${p.name} ${p.shareText}`);
      return clamp(
        `Bar chart: world ${subject.name.toLowerCase()} mine production, ${subject.estimateYear} USGS estimate. ` +
          `Shares of the published world total: ${rows.join("; ")}; rest of world ${subject.restShareText}. ` +
          `Source: ${subject.sourceLabel}.`,
        480,
      );
    }
    case "compare":
      return clamp(
        `${subject.aName} and ${subject.bName} side by side: ${subject.metricLabel} ` +
          `${subject.aValueText} (${subject.aYear ?? "—"}) and ${subject.bValueText} (${subject.bYear ?? "—"}), ` +
          `with ${subject.bothCount} shared sourced indicators. Figures compared, never graded.`,
        480,
      );
    case "formation":
      return clamp(
        `${subject.nationName}: ${subject.tagline}. Founding: ${subject.foundingText} — ${subject.foundingLabel}. ` +
          `Key sourced events: ${subject.events.map((e) => `${e.yearText} ${e.title}`).join("; ")}.`,
        480,
      );
    default:
      throw new Error(`altText: unknown subject type ${subject.type}`);
  }
}

/** The junk filter every index shares. */
export function isRealCountry(name) {
  return !!name && name !== "-99";
}

export { MONTH_NAMES };
