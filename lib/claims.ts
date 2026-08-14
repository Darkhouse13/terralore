// ── The claims layer: every rendered observation as an addressable claim ───
//
// The Living Record's Layer 1 (docs/living-record.md §1, DECISIONS D14).
// This module is the ONE composer of the claims bundles — the JSON files a
// reader or agent fetches to resolve a claim ID to its value, source,
// license, retrieval vintage and citation string. Consumed by:
//   · scripts/build-claims.mjs — writes the bundles into public/ (committed,
//     the markdown-twin pattern);
//   · scripts/validate-claims.mjs — regenerates and byte-compares, asserts
//     corpus-wide ID uniqueness and both-ways coverage.
//
// Bundles import the SAME modules the HTML renders from (lib/domains,
// lib/histories, lib/commodities, lib/seo) — factual identity with the pages
// is by construction, exactly as lib/geo.ts guarantees for the twins.
//
// The invariants hold here as everywhere: a null value is an absence and
// mints NO claim (a gap has no underside and no identity); identity excludes
// the value (a changed value is a revision of the same claim, recorded in
// the ledger); a new observed year is a new claim.

import { allCountries } from "./countries";
import { getDossier } from "./domains";
import { getHistory } from "./histories";
import {
  allCommodities,
  commoditiesSource,
  commoditiesUpdated,
  type Commodity,
} from "./commodities";
import type { CountryHistory, CountryMeta, DataSource, DomainKey } from "./types";
import { SITE_URL, routes } from "./seo";
import { formatMetric, formatTonnes } from "./format";
import {
  assignEventKeys,
  claimFragment,
  claimId,
  eventClaimId,
  producerFragment,
  shareClaimId,
  worldTotalClaimId,
} from "./claim-id";

export interface ClaimBundle {
  /** URL path of the bundle itself, e.g. "/country/FRA.claims.json". */
  path: string;
  /** URL path of the canonical HTML page whose claims it carries. */
  canonicalPath: string;
  kind: "dossier" | "chronicle" | "commodity";
  /** The serialized bundle — what build-claims writes and validators compare. */
  json: string;
  /** Every claim ID in the bundle (for uniqueness + coverage checks). */
  ids: string[];
  /** Every fragment the bundle promises exists on the canonical page. */
  fragments: string[];
}

const CITE_PLACEHOLDER = "<YYYY-MM-DD>";

/** The GEO citation template, extended with the claim ID (living-record §1.3). */
function citation(title: string, canonicalPath: string, fragment: string, id: string): string {
  return (
    `Terralore, "${title}", terralore.co${canonicalPath}#${fragment}, ` +
    `claim ${id}, retrieved ${CITE_PLACEHOLDER}.`
  );
}

function isRealCountry(name: string | undefined | null): boolean {
  return !!name && name !== "-99";
}

/** The source record as a claim carries it: provenance + retrieval vintage. */
function sourceRecord(s: DataSource) {
  return {
    id: s.id,
    label: s.label,
    publisher: s.publisher,
    url: s.url,
    license: s.license,
    accessed: s.accessed,
  };
}

/** Two-space-free, one-space-indented stable JSON — small files, real diffs. */
function serialize(obj: unknown): string {
  return JSON.stringify(obj, null, 1) + "\n";
}

const PREAMBLE =
  "Each claim is one rendered observation on the canonical page. IDs are " +
  "TL:<subject>:<measure>:<vintage> and stable across builds: a changed value under " +
  "the same ID is an upstream revision (recorded in the ledger at /ledger); a new " +
  "observed year is a new claim. A null or absent figure mints no claim — absence " +
  "is never zero. Scheme: https://terralore.co/integrity";

/* ── dossier bundles ──────────────────────────────────────────────────────── */

function dossierBundle(meta: CountryMeta): ClaimBundle | null {
  const dossier = getDossier(meta.code);
  if (!dossier) return null;
  const canonicalPath = routes.dossier(meta.code);
  const title = `${meta.name} — national dossier`;

  const ids: string[] = [];
  const fragments: string[] = [];
  const claims = [];
  for (const [domain, section] of Object.entries(dossier.sections)) {
    if (!section) continue;
    for (const m of section.metrics) {
      if (m.value == null || m.year == null) continue; // absence has no identity
      const id = claimId(meta.code, m.key, m.year);
      const fragment = claimFragment(m.key, m.year);
      ids.push(id);
      fragments.push(fragment);
      claims.push({
        id,
        domain: domain as DomainKey,
        metric: m.key,
        label: m.label,
        value: m.value,
        display: formatMetric(m.value, m.unit),
        unit: m.unit,
        observed: m.year,
        source: sourceRecord(dossier.sources[m.sourceId] ?? {
          id: m.sourceId,
          label: m.sourceId,
          publisher: "",
          url: "",
          license: "",
          accessed: "",
        }),
        url: `${SITE_URL}${canonicalPath}#${fragment}`,
        citation: citation(title, canonicalPath, fragment, id),
      });
    }
  }
  if (claims.length === 0) return null;

  const json = serialize({
    subject: meta.code,
    name: meta.name,
    kind: "dossier-observations",
    canonical: `${SITE_URL}${canonicalPath}`,
    updated: dossier.updated,
    note: PREAMBLE,
    claims,
  });
  return { path: `${canonicalPath}.claims.json`, canonicalPath, kind: "dossier", json, ids, fragments };
}

/* ── chronicle bundles ────────────────────────────────────────────────────── */

function chronicleBundle(meta: CountryMeta, history: CountryHistory): ClaimBundle {
  const canonicalPath = routes.chronicle(meta.code);
  const title = `The Chronicle of ${meta.name}: ${history.tagline}`;
  const srcById = new Map(history.sources.map((s) => [s.id, s]));
  const keys = assignEventKeys(history.eras);

  const ids: string[] = [];
  const fragments: string[] = [];
  const claims = [];
  for (let e = 0; e < history.eras.length; e++) {
    const era = history.eras[e];
    for (let i = 0; i < era.events.length; i++) {
      const ev = era.events[i];
      const key = keys[e][i];
      const id = eventClaimId(meta.code, key);
      ids.push(id);
      fragments.push(key.fragment);
      claims.push({
        id,
        year: ev.year,
        yearLabel: ev.yearLabel ?? String(ev.year),
        title: ev.title,
        summary: ev.summary,
        category: ev.category,
        era: era.id,
        sources: ev.sources
          .map((sid) => srcById.get(sid))
          .filter((s): s is NonNullable<typeof s> => !!s)
          .map((s) => ({ id: s.id, label: s.label, publisher: s.publisher ?? null, url: s.url ?? null })),
        url: `${SITE_URL}${canonicalPath}#${key.fragment}`,
        citation: citation(title, canonicalPath, key.fragment, id),
      });
    }
  }

  const json = serialize({
    subject: meta.code,
    name: meta.name,
    kind: "chronicle-events",
    canonical: `${SITE_URL}${canonicalPath}`,
    updated: history.updated,
    note: PREAMBLE,
    claims,
  });
  return { path: `${canonicalPath}.claims.json`, canonicalPath, kind: "chronicle", json, ids, fragments };
}

/* ── commodity bundles ────────────────────────────────────────────────────── */

/** "23.9%" — the commodity surface's own share precision, mirrored. */
function pct(share: number): string {
  const p = share * 100;
  return `${p.toFixed(p >= 10 ? 0 : p >= 1 ? 1 : 2)}%`;
}

function commodityBundle(c: Commodity): ClaimBundle {
  const canonicalPath = routes.commodity(c.slug);
  const title = `${c.name} — who supplies the world`;
  const source = sourceRecord(commoditiesSource());
  const { reported: yr, estimate: ye } = c.years;

  const ids: string[] = [];
  const fragments: string[] = [];

  // The published world totals — the denominators every share derives from.
  const worldTotals = ([
    { year: yr, value: c.world.reported, estimate: false },
    { year: ye, value: c.world.estimate, estimate: true },
  ] as const).map((w) => {
    const id = worldTotalClaimId(c.key, w.year);
    ids.push(id);
    return {
      id,
      value: w.value,
      display: formatTonnes(w.value),
      unit: "tonnes",
      observed: w.year,
      usgsEstimate: w.estimate,
      source,
      url: `${SITE_URL}${canonicalPath}#claim-world`,
      citation: citation(title, canonicalPath, "claim-world", id),
    };
  });
  fragments.push("claim-world");

  const claims = [];
  for (const p of c.producers) {
    const fragment = producerFragment(p.code);
    fragments.push(fragment);
    for (const side of [
      { year: yr, tonnes: p.reported, share: p.shareReported, withheld: p.reportedWithheld, estimate: false },
      { year: ye, tonnes: p.estimate, share: p.shareEstimate, withheld: p.estimateWithheld, estimate: true },
    ]) {
      if (side.withheld || side.tonnes == null || side.share == null) continue; // withheld = absence
      const tonnageId = claimId(p.code, c.key, side.year);
      const id = shareClaimId(p.code, c.key, side.year);
      ids.push(tonnageId, id);
      claims.push({
        id,
        nation: p.code,
        name: p.name,
        value: side.share,
        display: pct(side.share),
        unit: "share of the published world total",
        observed: side.year,
        usgsEstimate: side.estimate,
        derivedFrom: { tonnage: tonnageId, worldTotal: worldTotalClaimId(c.key, side.year) },
        tonnage: {
          id: tonnageId,
          value: side.tonnes,
          display: formatTonnes(side.tonnes),
          unit: "tonnes",
          observed: side.year,
          citation: citation(title, canonicalPath, fragment, tonnageId),
        },
        source,
        url: `${SITE_URL}${canonicalPath}#${fragment}`,
        citation: citation(title, canonicalPath, fragment, id),
      });
    }
  }

  const json = serialize({
    subject: c.slug,
    name: c.name,
    kind: "commodity-shares",
    canonical: `${SITE_URL}${canonicalPath}`,
    updated: commoditiesUpdated(),
    detail: c.detail,
    note:
      PREAMBLE +
      " Shares are Terralore computations: tonnage over the published MCS world total " +
      "(derivedFrom names both input claims). Tonnage claims are the same claims, with " +
      "the same IDs, as on each nation's dossier where the year matches.",
    worldTotals,
    claims,
  });
  return { path: `${canonicalPath}.claims.json`, canonicalPath, kind: "commodity", json, ids, fragments };
}

/* ── the full set ─────────────────────────────────────────────────────────── */

let bundlesCache: ClaimBundle[] | null = null;

/** Every claims bundle, memoised: dossiers, chronicles, commodities. */
export function allClaimBundles(): ClaimBundle[] {
  if (bundlesCache) return bundlesCache;
  const out: ClaimBundle[] = [];
  for (const meta of allCountries()) {
    if (!isRealCountry(meta.name)) continue;
    const d = dossierBundle(meta);
    if (d) out.push(d);
    const history = getHistory(meta.code);
    if (history?.status === "published") out.push(chronicleBundle(meta, history));
  }
  for (const c of allCommodities()) out.push(commodityBundle(c));
  bundlesCache = out;
  return out;
}
