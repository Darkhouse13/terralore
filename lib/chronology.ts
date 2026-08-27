// ── Cross-nation chronology ────────────────────────────────────────────────
// The corpus holds ~4,450 sourced events, but every one of them is reachable
// only from inside its own nation. That makes the most interesting question the
// archive can answer — "what was happening everywhere in 1492?" — impossible to
// ask. This module flattens the whole corpus once, at build time, so events can
// be browsed by period and by theme across every nation at once.
//
// Everything here is derived from already-verified history files. Nothing is
// invented: an event that appears in a chronology view is the same record, with
// the same sources, as the one on its nation's chronicle.

import { allHistories } from "./histories";
import { getCountry } from "./countries";
import type { EventCategory, Source } from "./types";
import { CATEGORY_META } from "./types";

/** A corpus event, tagged with the nation it belongs to. */
export interface WorldEvent {
  year: number;
  yearLabel: string;
  title: string;
  summary: string;
  category: EventCategory;
  /** Resolved source records (not ids) — the view needs labels and urls. */
  sources: Source[];
  code: string;
  nation: string;
  flag: string | null;
  continent: string | null;
  /** The era this event sits in, for context. */
  eraTitle: string;
}

/**
 * A period bucket. Recent history is dense and antiquity is sparse, so the
 * bucket width scales: centuries from 1000 BCE onward, millennia before that.
 * Fixed-width centuries would produce dozens of near-empty deep-time pages and
 * a few overloaded modern ones.
 */
export interface Period {
  slug: string;
  label: string;
  /** Inclusive start year, negative = BCE. */
  start: number;
  /** Inclusive end year. */
  end: number;
}

const MILLENNIUM_FLOOR = -1000; // between here and DEEP_TIME_FLOOR, bucket by 1000 years
/**
 * Before this, bucketing by millennium is meaningless — the corpus reaches back
 * to the Laetoli footprints at 3.6 million years, which would otherwise mint a
 * "3600th millennium BCE" page holding one event. Human-origins material is
 * genuinely one subject, so it gets one page.
 */
const DEEP_TIME_FLOOR = -10000;
/**
 * From here on the archive gets dense — the 20th century alone holds ~1,600
 * events, which as a single page is ~8 MB of HTML. Density is not uniform
 * across history, so the bucket width should not be either: modern history
 * buckets by decade, everything before 1800 by century. It also gives the
 * better page — "the 1940s" is a thing a person looks for; "the 20th century"
 * as a single list is not something anyone reads.
 */
const DECADE_FLOOR = 1800;

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** The period a year falls in. */
export function periodFor(year: number): Period {
  if (year < DEEP_TIME_FLOOR) {
    return {
      slug: "deep-prehistory",
      label: "Deep prehistory",
      start: Number.MIN_SAFE_INTEGER,
      end: DEEP_TIME_FLOOR - 1,
    };
  }
  if (year < MILLENNIUM_FLOOR) {
    // e.g. -3400 → the 4th millennium BCE (-3999..-3000)
    const idx = Math.floor((-year - 1) / 1000) + 1; // 3400 → 4
    const start = -(idx * 1000) + 1;
    const end = -((idx - 1) * 1000);
    return {
      slug: `${ordinal(idx)}-millennium-bce`,
      label: `The ${ordinal(idx)} millennium BCE`,
      start,
      end,
    };
  }
  if (year < 0) {
    const idx = Math.floor((-year - 1) / 100) + 1; // -450 → 5
    const start = -(idx * 100) + 1;
    const end = -((idx - 1) * 100);
    return {
      slug: `${ordinal(idx)}-century-bce`,
      label: `The ${ordinal(idx)} century BCE`,
      start,
      end,
    };
  }
  if (year >= DECADE_FLOOR) {
    const start = Math.floor(year / 10) * 10;
    return {
      slug: `${start}s`,
      label: `The ${start}s`,
      start,
      end: start + 9,
    };
  }
  const idx = Math.floor(year / 100) + 1; // 1492 → 15
  return {
    slug: `${ordinal(idx)}-century`,
    label: `The ${ordinal(idx)} century`,
    start: (idx - 1) * 100,
    end: idx * 100 - 1,
  };
}

let _events: WorldEvent[] | null = null;

/** Every event in the corpus, nation-tagged, sorted oldest → newest. Memoised. */
export function allWorldEvents(): WorldEvent[] {
  if (_events) return _events;
  const out: WorldEvent[] = [];

  for (const history of allHistories()) {
    if (history.status !== "published") continue;
    const meta = getCountry(history.code);
    const byId = new Map(history.sources.map((s) => [s.id, s]));

    for (const era of history.eras) {
      for (const ev of era.events) {
        out.push({
          year: ev.year,
          yearLabel: ev.yearLabel ?? formatYear(ev.year),
          title: ev.title,
          summary: ev.summary,
          category: ev.category,
          // Drop ids that don't resolve rather than rendering a dead citation.
          sources: ev.sources.map((id) => byId.get(id)).filter((s): s is Source => !!s),
          code: history.code,
          nation: meta?.name ?? history.name,
          flag: meta?.flag ?? null,
          continent: meta?.continent ?? null,
          eraTitle: era.title,
        });
      }
    }
  }

  out.sort((a, b) => a.year - b.year || a.nation.localeCompare(b.nation));
  _events = out;
  return out;
}

export interface PeriodBucket extends Period {
  events: WorldEvent[];
  nations: number;
}

let _periods: PeriodBucket[] | null = null;

/** Every period that actually contains events, oldest → newest. Memoised. */
export function allPeriods(): PeriodBucket[] {
  if (_periods) return _periods;
  const map = new Map<string, PeriodBucket>();

  for (const ev of allWorldEvents()) {
    const p = periodFor(ev.year);
    let bucket = map.get(p.slug);
    if (!bucket) {
      bucket = { ...p, events: [], nations: 0 };
      map.set(p.slug, bucket);
    }
    bucket.events.push(ev);
  }

  const list = [...map.values()].sort((a, b) => a.start - b.start);
  for (const b of list) b.nations = new Set(b.events.map((e) => e.code)).size;
  _periods = list;
  return list;
}

export function getPeriod(slug: string): PeriodBucket | undefined {
  return allPeriods().find((p) => p.slug === slug);
}

export interface ThemeBucket {
  category: EventCategory;
  slug: string;
  label: string;
  /** Mark colour (bands, dots, rules) — 3:1 on both grounds. */
  tint: string;
  /** The same pigment as small text on limestone — 4.5:1. */
  ink: string;
  /** The same pigment as small text on the deep — 4.5:1. */
  chalk: string;
  events: WorldEvent[];
  nations: number;
}

/** Category slugs are the category keys — already url-safe and stable. */
export function themeSlug(c: EventCategory): string {
  return c;
}

let _themes: ThemeBucket[] | null = null;

/** Every theme that contains events, largest first. Memoised. */
export function allThemes(): ThemeBucket[] {
  if (_themes) return _themes;
  const map = new Map<EventCategory, ThemeBucket>();

  for (const ev of allWorldEvents()) {
    let bucket = map.get(ev.category);
    if (!bucket) {
      const meta = CATEGORY_META[ev.category];
      bucket = {
        category: ev.category,
        slug: themeSlug(ev.category),
        label: meta?.label ?? ev.category,
        tint: meta?.tint ?? "var(--color-copper)",
        ink: meta?.ink ?? "var(--color-copper-deep)",
        chalk: meta?.chalk ?? "var(--color-copper-bright)",
        events: [],
        nations: 0,
      };
      map.set(ev.category, bucket);
    }
    bucket.events.push(ev);
  }

  const list = [...map.values()];
  for (const b of list) b.nations = new Set(b.events.map((e) => e.code)).size;
  list.sort((a, b) => b.events.length - a.events.length);
  _themes = list;
  return list;
}

export function getTheme(slug: string): ThemeBucket | undefined {
  return allThemes().find((t) => t.slug === slug);
}

/**
 * Whether a (theme, period) slice earns a place in the search index. A slice
 * holding one or two events is a fragment, not a document — it stays live and
 * reachable from its theme's index, but is noindexed and kept out of the
 * sitemap. Three events is the floor at which the slice's generated standfirst
 * ("N events across M nations…") describes a shape rather than restating a
 * single record.
 */
export const THEME_SLICE_INDEX_FLOOR = 3;

export function themeSliceIndexable(eventCount: number): boolean {
  return eventCount >= THEME_SLICE_INDEX_FLOOR;
}

/** Corpus-wide totals, for the hub pages' standfirsts. */
export function corpusStats() {
  const events = allWorldEvents();
  const nations = new Set(events.map((e) => e.code)).size;
  const sources = new Set(events.flatMap((e) => e.sources.map((s) => s.url ?? s.label))).size;
  const years = events.map((e) => e.year);
  return {
    events: events.length,
    nations,
    sources,
    earliest: Math.min(...years),
    latest: Math.max(...years),
  };
}

export function formatYear(y: number): string {
  return y < 0 ? `${Math.abs(y)} BCE` : String(y);
}

/**
 * "Meanwhile elsewhere" — what *other* nations were doing while this one lived
 * through the given span.
 *
 * The corpus already holds this: 4,471 events across 184 nations, all with the
 * same schema and the same sources. What it lacked was a way to stumble
 * sideways out of one nation's story into another's, which is the single
 * cheapest way to turn a reference lookup into a browse. A reader arriving for
 * the history of Vietnam should be able to fall into Cambodia's.
 *
 * Selection is deliberately spread rather than "first N": events are grouped by
 * nation and one is taken from each in turn, so a span dominated by a single
 * well-documented country cannot fill the whole strip with itself. Within that,
 * order is by how close the event sits to the middle of the span — the most
 * genuinely contemporaneous, rather than whatever happens to sort first.
 *
 * Build-time only, and memoised through `allWorldEvents()`.
 */
export function meanwhileElsewhere(
  excludeCode: string,
  startYear: number,
  endYear: number,
  limit = 4,
): WorldEvent[] {
  const lo = Math.min(startYear, endYear);
  const hi = Math.max(startYear, endYear);
  const mid = (lo + hi) / 2;

  const byNation = new Map<string, WorldEvent[]>();
  for (const e of allWorldEvents()) {
    if (e.code === excludeCode) continue;
    if (e.year < lo || e.year > hi) continue;
    let list = byNation.get(e.code);
    if (!list) byNation.set(e.code, (list = []));
    list.push(e);
  }
  if (!byNation.size) return [];

  // Closest-to-centre first within each nation, then round-robin across nations.
  const queues = [...byNation.values()].map((list) =>
    list.sort((a, b) => Math.abs(a.year - mid) - Math.abs(b.year - mid)),
  );
  // Nations whose closest event is nearest the centre lead the rotation, so a
  // short strip favours the most contemporaneous nations rather than the
  // alphabetically luckiest.
  queues.sort((a, b) => Math.abs(a[0].year - mid) - Math.abs(b[0].year - mid));

  const out: WorldEvent[] = [];
  for (let round = 0; out.length < limit; round++) {
    let progressed = false;
    for (const q of queues) {
      if (round >= q.length) continue;
      out.push(q[round]);
      progressed = true;
      if (out.length >= limit) break;
    }
    if (!progressed) break;
  }
  return out;
}

/**
 * The category a set of events is mostly made of, and its pigment.
 *
 * The same rule the journey's timeline rail and the chronicle's chapter openers
 * use, lifted here so every surface that shows a *group* of events tints it
 * identically. A reader who learns that madder means rupture on the rail should
 * read the same thing off the chronology's strata without being told twice.
 *
 * Ties resolve to whichever category was seen first, which is stable for a given
 * build because the corpus is traversed in a fixed order.
 */
export function dominantCategory(
  events: { category: EventCategory }[],
): { category: EventCategory; tint: string; ink: string; chalk: string } | null {
  if (!events.length) return null;
  const counts = new Map<EventCategory, number>();
  for (const e of events) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
  let best: EventCategory | null = null;
  let bestN = 0;
  for (const [cat, n] of counts) {
    if (n > bestN) {
      bestN = n;
      best = cat;
    }
  }
  if (!best) return null;
  const m = CATEGORY_META[best];
  return { category: best, tint: m.tint, ink: m.ink, chalk: m.chalk };
}
