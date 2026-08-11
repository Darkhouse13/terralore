// ── The editorial calendar: what runs on a given date, decided by rule ─────
// Deterministic by contract: (date, ledger-state-before-that-date) → plan.
// The seed is the date itself through the house PRNG (FNV-1a → mulberry32,
// components/brand/strata.ts); the ledger is committed data
// (data/social-ledger.json), so a re-run of an already-generated day sees the
// same prior state and reproduces the same plan byte for byte. Recency reads
// ONLY entries dated strictly before the target day — a day's own ledger
// entry must not change its own plan on regeneration.
//
// The day's shape:
//   · the ANCHOR — "on this day", selected from the date index at the highest
//     precision tier the corpus supports for that calendar day:
//       day   — events whose own yearLabel carries this day+month;
//       month — events whose yearLabel carries this month (no day claim);
//       year  — a round-anniversary event (25/50/100… years before the date's
//               year). The caption's claim shrinks with the tier; a card
//               never states more than the record does.
//     Preference order inside a tier: unused in the trailing 365 days, then
//     nations not anchored in the trailing 14 days, then the seeded draw.
//     Preferences soften, never fabricate: a small candidate pool may repeat
//     an event before the year is out, but the tier — the truth of the date
//     claim — never degrades to accommodate variety.
//   · the DATA CARD — ranking → commodity → compare, rotating by day number
//     (epoch days mod 3, so the rotation is calendar-stable and needs no
//     ledger). Within the type, the seeded draw skips surfaces used in the
//     trailing 30 days; if the skip empties the pool (ten commodities cannot
//     survive a 30-day exclusion at a 3-day cadence), it falls back to
//     least-recently-used — the deterministic honest compromise.
//   · the CAROUSEL — on ranking days, the same ranking as the carousel
//     (one story, three formats); otherwise the anchor nation's formation
//     story, skipping nations told in the trailing 90 days, LRU fallback.

import { allRankings } from "@/lib/rankings";
import { allCommodities, commoditiesSource, commoditiesUpdated } from "@/lib/commodities";
import { allComparePages } from "@/lib/compare";
import { mulberry32, seedFrom } from "@/components/brand/strata";
import {
  dateIndex,
  eventKey,
  onThisDaySubject,
  rankingSubject,
  commoditySubject,
  compareSubject,
  formationSubject,
} from "./subjects.mjs";

/* ── dates ────────────────────────────────────────────────────────────────── */

export function parseDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`not a YYYY-MM-DD date: ${iso}`);
  const date = { iso, year: +m[1], month: +m[2], day: +m[3] };
  const ms = Date.UTC(date.year, date.month - 1, date.day);
  if (new Date(ms).getUTCDate() !== date.day) throw new Error(`not a real calendar date: ${iso}`);
  date.epochDay = Math.floor(ms / 86_400_000);
  return date;
}

export function isoAddDays(iso, n) {
  const d = parseDate(iso);
  const ms = Date.UTC(d.year, d.month - 1, d.day) + n * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

/* ── the ledger view ──────────────────────────────────────────────────────── */

/**
 * Recency maps from the committed ledger, scanning only days STRICTLY BEFORE
 * the target — see the module note. Returns last-used epoch day per key.
 */
function recency(ledger, before) {
  const lastEvent = new Map();
  const lastNation = new Map();
  const lastSurface = new Map();
  const lastFormation = new Map();
  for (const [iso, entry] of Object.entries(ledger.days ?? {})) {
    const d = parseDate(iso);
    if (d.epochDay >= before.epochDay) continue;
    const touch = (map, key) => {
      if (key && (!map.has(key) || map.get(key) < d.epochDay)) map.set(key, d.epochDay);
    };
    touch(lastEvent, entry.event);
    touch(lastNation, entry.eventNation);
    touch(lastSurface, entry.surface);
    if (entry.carousel?.startsWith("fm-")) touch(lastFormation, entry.carousel.slice(3));
  }
  return { lastEvent, lastNation, lastSurface, lastFormation };
}

/** Seeded draw from a list — deterministic for (seed, list order). */
function draw(list, seed) {
  if (list.length === 0) return null;
  const rand = mulberry32(seedFrom(seed));
  return list[Math.floor(rand() * list.length)];
}

/**
 * Draw under softening preferences: each predicate filters the pool only if
 * survivors remain. Order = strongest preference first.
 */
function drawPreferring(list, seed, ...prefs) {
  let pool = list;
  for (const pred of prefs) {
    const kept = pool.filter(pred);
    if (kept.length > 0) pool = kept;
  }
  return draw(pool, seed);
}

/* ── the anchor ───────────────────────────────────────────────────────────── */

const YEAR_DAYS = 365;
const NATION_DAYS = 14;

function pickAnchor(date, rec) {
  const idx = dateIndex();
  const seed = `otd-${date.iso}`;
  const unused = (e) => {
    const at = rec.lastEvent.get(eventKey(e));
    return at == null || date.epochDay - at > YEAR_DAYS;
  };
  const freshNation = (e) => {
    const at = rec.lastNation.get(e.code);
    return at == null || date.epochDay - at > NATION_DAYS;
  };

  // Tier: the record's own day.
  const dayPool = (idx.byDay.get(`${date.month}-${date.day}`) ?? []).filter((e) => e.year < date.year);
  if (dayPool.length > 0) {
    return onThisDaySubject(drawPreferring(dayPool, seed, unused, freshNation), "day", date);
  }

  // Tier: the record's own month, no day claim.
  const monthPool = (idx.byMonth.get(date.month) ?? []).filter((e) => e.year < date.year);
  if (monthPool.length > 0) {
    return onThisDaySubject(drawPreferring(monthPool, seed, unused, freshNation), "month", date);
  }

  // Tier: a round anniversary (multiples of 25; prefer the rounder). Only the
  // year is claimed, which every precision level supports.
  for (const step of [100, 50, 25]) {
    const pool = idx.all.filter((e) => {
      const gap = date.year - e.year;
      return gap > 0 && gap % step === 0 && (step === 25 ? gap % 50 !== 0 : step === 50 ? gap % 100 !== 0 : true);
    });
    if (pool.length > 0) {
      return onThisDaySubject(drawPreferring(pool, seed, unused, freshNation), "year", date);
    }
  }
  throw new Error(`no anchor candidate exists for ${date.iso} — the corpus cannot be this empty`);
}

/* ── the data card ────────────────────────────────────────────────────────── */

const SURFACE_DAYS = 30;
const ROTATION = ["ranking", "commodity", "compare"];

function pickSurface(list, keyOf, date, rec, seed) {
  const fresh = list.filter((s) => {
    const at = rec.lastSurface.get(keyOf(s));
    return at == null || date.epochDay - at > SURFACE_DAYS;
  });
  if (fresh.length > 0) return draw(fresh, seed);
  // LRU fallback: the pool is smaller than the window — take the stalest.
  return [...list].sort(
    (a, b) => (rec.lastSurface.get(keyOf(a)) ?? -1) - (rec.lastSurface.get(keyOf(b)) ?? -1),
  )[0];
}

function pickDataCard(date, rec) {
  const type = ROTATION[((date.epochDay % 3) + 3) % 3];
  const seed = `data-${date.iso}`;
  if (type === "ranking") {
    return rankingSubject(pickSurface(allRankings(), (r) => `rk-${r.slug}`, date, rec, seed));
  }
  if (type === "commodity") {
    const c = pickSurface(allCommodities(), (x) => `cm-${x.slug}`, date, rec, seed);
    return commoditySubject(c, commoditiesSource(), commoditiesUpdated());
  }
  // compare: only pairs with a computable headline row qualify.
  const pages = allComparePages()
    .map((p) => compareSubject(p))
    .filter(Boolean);
  return pickSurface(pages, (s) => `cp-${s.slug}`, date, rec, seed);
}

/* ── the carousel ─────────────────────────────────────────────────────────── */

const FORMATION_DAYS = 90;

function pickCarousel(date, rec, anchor, dataCard) {
  if (dataCard.type === "ranking") {
    return { kind: "ranking", subject: dataCard };
  }
  // The anchor nation's formation story ties the day together — unless that
  // story ran recently, in which case any nation not told lately qualifies.
  const anchorCode = anchor.event.code;
  const anchorAt = rec.lastFormation.get(anchorCode);
  let code = anchorCode;
  if (anchorAt != null && date.epochDay - anchorAt <= FORMATION_DAYS) {
    const idx = dateIndex();
    const nations = [...new Set(idx.all.map((e) => e.code))].sort();
    const fresh = nations.filter((c) => {
      const at = rec.lastFormation.get(c);
      return at == null || date.epochDay - at > FORMATION_DAYS;
    });
    code = draw(fresh.length ? fresh : nations, `fm-${date.iso}`) ?? anchorCode;
  }
  const subject = formationSubject(code);
  if (!subject) throw new Error(`formation carousel: ${code} has no published history`);
  return { kind: "formation", subject };
}

/* ── the plan ─────────────────────────────────────────────────────────────── */

/**
 * One day's editorial plan, from the committed ledger state. Pure: no clock,
 * no randomness beyond the date-seeded PRNG, no writes.
 */
export function planDay(iso, ledger) {
  const date = parseDate(iso);
  const rec = recency(ledger, date);
  const anchor = pickAnchor(date, rec);
  const dataCard = pickDataCard(date, rec);
  const carousel = pickCarousel(date, rec, anchor, dataCard);
  return { date, anchor, dataCard, carousel };
}

/** The ledger entry a plan writes for its day — keyed by date, idempotent. */
export function ledgerEntry(plan) {
  return {
    event: eventKey(plan.anchor.event),
    eventNation: plan.anchor.event.code,
    surface: plan.dataCard.surfaceKey,
    // Formation seeds are "fm-<code>", ranking seeds "rk-<slug>" — the seed
    // is already the namespaced identity.
    carousel: plan.carousel.subject.seed,
  };
}
