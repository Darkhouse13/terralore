// ── The /compare surface: two nations, read side by side ───────────────────
//
// Build-time only (SSG). The pair set is committed data (data/compare-pairs.json,
// derived and gated by scripts/build-compare-pairs.mjs, re-asserted by
// scripts/validate-compare.mjs) — this module ASSEMBLES pages for that set, it
// never decides membership. Everything on a compare page already exists
// elsewhere in the atlas with a source attached: the metric rows are the same
// observations as the two dossiers (via lib/domains), the shared chronicle is
// the same sourced event records as the two chronicles (via lib/histories).
// Nothing here is authored for the pair, so nothing here can contradict the
// pages it links to.
//
// Honesty rules, enforced or inherited:
//   · absence is never zero — a row renders when EITHER nation holds a value,
//     and the other side prints "—"; rows where neither holds one are not a
//     comparison and do not render;
//   · alias metric keys (literacy/literacyRate — identical by validator) fold
//     onto the page-owning key, exactly as /rankings folds them: the same
//     figure must not appear on one page twice pretending to be two;
//   · shared events are found, not written: an event qualifies when its own
//     sourced record (title or summary) names the other nation, per the
//     committed name table in data/compare-aliases.json — earlier names of
//     the same state included, successor questions this site will not
//     adjudicate (Yugoslavia, Kievan Rus) deliberately excluded;
//   · zero shared events is a statement about the two archives, and the page
//     says so plainly rather than padding.

import pairsData from "@/data/compare-pairs.json";
import aliasData from "@/data/compare-aliases.json";
import { getCountry } from "./countries";
import { allDomainFiles } from "./domains";
import { getHistory } from "./histories";
import { rankingAliases, rankingSlug } from "./ranking-meta";
import { DOMAIN_META, type DomainKey, type EventCategory, type Source } from "./types";

export interface CompareNation {
  code: string;
  name: string;
  flag: string | null;
  /** The statehood formation anchor (existence-shading data), or founding. */
  formation: { year: number; yearLabel: string; label: string };
  /** The headline "became a country" moment — always present. */
  founding: { year: number; yearLabel: string; label: string };
  historyUpdated: string | null;
  dossierUpdated: string | null;
}

export interface CompareCell {
  value: number | null;
  year: number | null;
}

export interface CompareRow {
  key: string;
  label: string;
  unit: string;
  domain: DomainKey;
  /** /rankings slug — total by construction (validate-rankings). */
  rankingSlug: string;
  a: CompareCell;
  b: CompareCell;
}

export interface CompareDomain {
  domain: DomainKey;
  label: string;
  rows: CompareRow[];
}

export interface SharedEvent {
  /** ADM0_A3 of the chronicle this record comes from. */
  from: string;
  fromName: string;
  year: number;
  yearLabel: string;
  title: string;
  summary: string;
  category: EventCategory;
  eraTitle: string;
  /** Resolved source records — the same ones the chronicle renders. */
  sources: Source[];
}

export interface ComparePage {
  slug: string;
  tier: number;
  reason?: string;
  a: CompareNation;
  b: CompareNation;
  domains: CompareDomain[];
  /** Rows where BOTH nations hold a value — the page's headline count. */
  bothCount: number;
  /** Rows rendered at all (either side holds a value). */
  rowCount: number;
  sharedEvents: SharedEvent[];
  /** max(both dossiers' refresh, both histories' verification) — honest lastmod. */
  updated: string;
}

function fail(msg: string): never {
  throw new Error(`lib/compare: ${msg}`);
}

/* ── the shared-chronicle matcher ─────────────────────────────────────────── */

interface AliasTable {
  aliases: Record<string, string[]>;
  nameOverrides: Record<string, string[]>;
  masks: Record<string, string[]>;
}
const table = aliasData as unknown as AliasTable;

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * A predicate: does this text name nation `code`? Word-bounded match on the
 * nation's atlas names (or their override) plus its committed aliases, after
 * the mask phrases are cut out. Masks are case-insensitive (they are traps,
 * not names); names are case-sensitive (they are proper nouns).
 */
function matcherFor(code: string): (text: string) => boolean {
  const meta = getCountry(code);
  const names =
    table.nameOverrides[code] ??
    [meta?.name, meta?.officialName, ...(table.aliases[code] ?? [])].filter(
      (n): n is string => !!n,
    );
  if (names.length === 0) return () => false;
  const nameRe = new RegExp(`\\b(${names.map(escapeRe).join("|")})\\b`);
  const maskRes = (table.masks[code] ?? []).map((m) => new RegExp(escapeRe(m), "gi"));
  return (text: string) => {
    let t = text;
    for (const re of maskRes) t = t.replace(re, "▮");
    return nameRe.test(t);
  };
}

function formatYear(y: number): string {
  return y < 0 ? `${Math.abs(y).toLocaleString("en")} BCE` : String(y);
}

/** Events in `ofCode`'s chronicle whose record names `otherCode`. */
function crossedEvents(ofCode: string, otherCode: string): SharedEvent[] {
  const history = getHistory(ofCode);
  if (history?.status !== "published") return [];
  const meta = getCountry(ofCode);
  const names = matcherFor(otherCode);
  const byId = new Map(history.sources.map((s) => [s.id, s]));
  const out: SharedEvent[] = [];
  for (const era of history.eras) {
    for (const ev of era.events) {
      if (!names(`${ev.title} — ${ev.summary}`)) continue;
      out.push({
        from: ofCode,
        fromName: meta?.name ?? history.name,
        year: ev.year,
        yearLabel: ev.yearLabel ?? formatYear(ev.year),
        title: ev.title,
        summary: ev.summary,
        category: ev.category,
        eraTitle: era.title,
        // Same rule as lib/chronology: drop unresolvable ids, never render a
        // dead citation (the validator keeps this set empty anyway).
        sources: ev.sources.map((id) => byId.get(id)).filter((s): s is Source => !!s),
      });
    }
  }
  return out;
}

/* ── assembly ─────────────────────────────────────────────────────────────── */

function nationOf(code: string): CompareNation {
  const meta = getCountry(code);
  if (!meta || !meta.name || meta.name === "-99") fail(`${code} is not a real atlas nation`);
  const history = getHistory(code);
  if (history?.status !== "published") fail(`${code} has no published history — the pair set should not contain it`);
  const founding = {
    year: history.founding.year,
    yearLabel: history.founding.yearLabel,
    label: history.founding.label,
  };
  const f = history.statehood?.formation;
  // Dossier vintage comes from the domain files directly (cheap; getDossier
  // would rebuild section objects per call).
  let dossierUpdated: string | null = null;
  for (const file of allDomainFiles()) {
    if (file.data[code]?.metrics?.length && (!dossierUpdated || file.updated > dossierUpdated)) {
      dossierUpdated = file.updated;
    }
  }
  return {
    code,
    name: meta.name,
    flag: meta.flag,
    formation: f ? { year: f.year, yearLabel: f.yearLabel, label: f.label } : founding,
    founding,
    historyUpdated: history.updated ?? null,
    dossierUpdated,
  };
}

function buildPage(entry: { a: string; b: string; slug: string; tier: number; reason?: string }): ComparePage {
  const a = nationOf(entry.a);
  const b = nationOf(entry.b);

  const domains: CompareDomain[] = [];
  let bothCount = 0;
  let rowCount = 0;
  for (const file of allDomainFiles()) {
    const ea = file.data[entry.a];
    const eb = file.data[entry.b];
    if (!ea && !eb) continue;
    // Metric keys in in-file order, union of both nations' entries.
    const keys: string[] = [];
    for (const m of ea?.metrics ?? []) if (!keys.includes(m.key)) keys.push(m.key);
    for (const m of eb?.metrics ?? []) if (!keys.includes(m.key)) keys.push(m.key);
    const rows: CompareRow[] = [];
    for (const key of keys) {
      if (key in rankingAliases) continue; // folded onto the page-owning key
      const ma = ea?.metrics.find((m) => m.key === key);
      const mb = eb?.metrics.find((m) => m.key === key);
      if (ma?.value == null && mb?.value == null) continue; // nothing to compare
      const slug = rankingSlug(key);
      if (!slug) fail(`metric ${key} has no ranking slug`);
      rows.push({
        key,
        label: ma?.label ?? mb!.label,
        unit: ma?.unit ?? mb!.unit,
        domain: file.domain,
        rankingSlug: slug,
        a: { value: ma?.value ?? null, year: ma?.value != null ? ma.year : null },
        b: { value: mb?.value ?? null, year: mb?.value != null ? mb.year : null },
      });
      rowCount++;
      if (ma?.value != null && mb?.value != null) bothCount++;
    }
    if (rows.length) domains.push({ domain: file.domain, label: DOMAIN_META[file.domain].label, rows });
  }

  const sharedEvents = [...crossedEvents(entry.a, entry.b), ...crossedEvents(entry.b, entry.a)].sort(
    (x, y) => x.year - y.year || x.title.localeCompare(y.title),
  );

  const updated =
    [a.historyUpdated, b.historyUpdated, a.dossierUpdated, b.dossierUpdated]
      .filter((d): d is string => !!d)
      .sort()
      .at(-1) ?? fail(`${entry.slug} has no vintage at all`);

  return {
    slug: entry.slug,
    tier: entry.tier,
    reason: entry.reason,
    a,
    b,
    domains,
    bothCount,
    rowCount,
    sharedEvents,
    updated,
  };
}

let cache: Map<string, ComparePage> | null = null;

/** Every published pair page, in slug order. Memoised; build-time only. */
export function allComparePages(): ComparePage[] {
  if (!cache) {
    cache = new Map(pairsData.pairs.map((p) => [p.slug, buildPage(p)]));
  }
  return [...cache.values()];
}

export function getComparePage(slug: string): ComparePage | undefined {
  allComparePages();
  return cache!.get(slug);
}

/** Display title — the codes' alphabetical order, stable as the slug. */
export function compareTitle(page: ComparePage): string {
  return `${page.a.name} and ${page.b.name} compared`;
}

/**
 * The canonical slug for two codes in either order, when that pair is
 * published — used by the route to 308 the reversed URL onto the canonical.
 */
export function canonicalCompareSlug(x: string, y: string): string | null {
  const [a, b] = [x.toUpperCase(), y.toUpperCase()].sort();
  const slug = `${a.toLowerCase()}-vs-${b.toLowerCase()}`;
  return getComparePage(slug) ? slug : null;
}

/** Latest vintage across every pair — the hub's honest lastmod. */
export function compareUpdated(): string {
  return allComparePages()
    .map((p) => p.updated)
    .sort()
    .at(-1)!;
}
