// ── Who supplies the world: share-of-production per commodity ──────────────
//
// Build-time only (SSG). Reads data/commodities.json (world totals + producer
// table, scripts/build-commodities.mjs) and computes each producer's share of
// world production for both published years — the reported year and the USGS
// estimate.
//
// Two rules are enforced here, at compute time, so a bad file fails the build
// rather than publishing a wrong share:
//
//   * **The denominator is the published MCS world total**, never the sum of
//     listed producers. What the sum does not cover — the MCS "Other
//     countries" aggregate, withheld ("W") figures, and any producer this
//     atlas deliberately skips — is rendered as one honest "Rest of world"
//     residual. If the listed producers exceed the published total beyond its
//     printed rounding, the identity is broken and we throw.
//   * **No drift against the dossier.** The same tonnage appears on a nation's
//     resources tab (data/domains/resources.json, merged by
//     scripts/build-minerals.mjs). Both files come from the same MCS edition;
//     every producer-year value is asserted equal across the two, in both
//     directions, so the commodity page and the dossier can never disagree.

import type { DataSource } from "./types";
import raw from "@/data/commodities.json";
import resources from "@/data/domains/resources.json";
import { getCountry } from "./countries";
import { COMMODITY_META, commodityBySlug, type CommodityMeta } from "./commodity-meta";

// Each MCS figure is independently rounded, so the listed producers may
// overshoot the published world total by up to their accumulated rounding —
// this share of the total, on top of the total's own printed precision (which
// the builder persists per year as `rounding`).
const PARTS_ROUNDING = 0.005;

interface RawProducer {
  code: string;
  reported?: number;
  estimate?: number;
  reportedWithheld?: boolean;
  estimateWithheld?: boolean;
}

interface RawCommodity {
  key: string;
  commodity: string;
  detail: string;
  years: { reported: number; estimate: number };
  world: { reported: number; estimate: number };
  /** Half the last printed digit of each world total — its rounding precision. */
  rounding: { reported: number; estimate: number };
  otherCountries?: { reported?: number; estimate?: number };
  producers: RawProducer[];
}

interface RawFile {
  updated: string;
  source: DataSource;
  commodities: RawCommodity[];
}

export interface ProducerShare {
  code: string;
  name: string;
  flag: string | null;
  /** Tonnes in the reported year; null = nil or withheld (see the flag). */
  reported: number | null;
  /** Tonnes in the estimate year; null = nil or withheld (see the flag). */
  estimate: number | null;
  /** True when USGS withholds the year's figure to protect company data. */
  reportedWithheld: boolean;
  estimateWithheld: boolean;
  /** Share of the published world total, 0–1, per year. */
  shareReported: number | null;
  shareEstimate: number | null;
}

export interface Commodity extends CommodityMeta {
  /** The exact MCS `Statistics_detail` row this measures, e.g. "Mine production: Usable ore". */
  detail: string;
  years: { reported: number; estimate: number };
  /** Published MCS world totals, tonnes. */
  world: { reported: number; estimate: number };
  /** Listed producers, largest estimate first. */
  producers: ProducerShare[];
  /** world − Σ listed producers: the MCS "Other countries" aggregate plus withheld and skipped figures. */
  restOfWorld: {
    reported: number;
    estimate: number;
    shareReported: number;
    shareEstimate: number;
  };
  /** Combined estimate-year share of the three largest producers, 0–1. */
  topThreeShare: number;
}

function fail(msg: string): never {
  throw new Error(`lib/commodities: ${msg}`);
}

/** The resources-domain series for one nation+metric, as year → value. */
function dossierSeries(code: string, key: string): Map<number, number> {
  const metrics = (resources as { data: Record<string, { metrics: { key: string; series?: { year: number; value: number }[] }[] }> })
    .data[code]?.metrics;
  const m = metrics?.find((x) => x.key === key);
  return new Map((m?.series ?? []).map((p) => [p.year, p.value]));
}

function buildCommodity(rc: RawCommodity, meta: CommodityMeta): Commodity {
  const { reported: yr, estimate: ye } = rc.years;
  if (rc.world.reported == null || rc.world.estimate == null) {
    fail(`${rc.key}: missing a world total`);
  }

  let sumReported = 0;
  let sumEstimate = 0;
  const producers: ProducerShare[] = rc.producers.map((p) => {
    if (p.code === "ISR") fail(`${rc.key}: ISR must never appear (the atlas has no Israel entity)`);
    const country = getCountry(p.code);
    if (!country) fail(`${rc.key}: producer code ${p.code} is not in the atlas`);

    // Anti-drift: this exact tonnage is what the nation's dossier shows.
    const dossier = dossierSeries(p.code, rc.key);
    for (const [year, value] of [[yr, p.reported], [ye, p.estimate]] as const) {
      if (value != null && dossier.get(year) !== value) {
        fail(
          `${rc.key}/${p.code} ${year}: commodities file says ${value} but the resources domain ` +
            `says ${dossier.get(year) ?? "nothing"} — rebuild both (npm run build-domains)`,
        );
      }
    }

    sumReported += p.reported ?? 0;
    sumEstimate += p.estimate ?? 0;
    return {
      code: p.code,
      name: country.name,
      flag: country.flag,
      reported: p.reported ?? null,
      estimate: p.estimate ?? null,
      reportedWithheld: p.reportedWithheld ?? false,
      estimateWithheld: p.estimateWithheld ?? false,
      shareReported: p.reported != null ? p.reported / rc.world.reported : null,
      shareEstimate: p.estimate != null ? p.estimate / rc.world.estimate : null,
    };
  });

  // The other direction of the drift check: a nation the dossier lists as a
  // producer of this commodity must be in the commodities table too.
  const listed = new Set(producers.map((p) => p.code));
  for (const [code, entry] of Object.entries((resources as { data: Record<string, { metrics: { key: string }[] }> }).data)) {
    if (entry.metrics.some((m) => m.key === rc.key) && !listed.has(code)) {
      fail(`${rc.key}: ${code} has this metric in the resources domain but is missing from the commodities table`);
    }
  }

  // Reconciliation: listed + residual = world total, by construction — so the
  // check with teeth is that the residual is not negative beyond rounding.
  const slack = (y: "reported" | "estimate") => rc.rounding[y] + PARTS_ROUNDING * rc.world[y];
  const residual = (sum: number, y: "reported" | "estimate", year: number) => {
    if (rc.world[y] - sum < -slack(y)) {
      fail(
        `${rc.key} ${year}: listed producers sum to ${sum}, beyond the published world total ` +
          `${rc.world[y]} even after rounding — the shares would be wrong`,
      );
    }
    return Math.max(0, rc.world[y] - sum);
  };
  const restReported = residual(sumReported, "reported", yr);
  const restEstimate = residual(sumEstimate, "estimate", ye);

  // The published "Other countries" aggregate must fit inside what we render
  // as "Rest of world" — if it does not, the residual is misattributed.
  for (const [oc, rest, y, year] of [
    [rc.otherCountries?.reported, restReported, "reported", yr],
    [rc.otherCountries?.estimate, restEstimate, "estimate", ye],
  ] as const) {
    if (oc != null && oc > rest + slack(y)) {
      fail(`${rc.key} ${year}: "Other countries" (${oc}) exceeds the rest-of-world residual (${rest})`);
    }
  }

  producers.sort((a, b) => (b.estimate ?? b.reported ?? -1) - (a.estimate ?? a.reported ?? -1));
  const topThreeShare = producers
    .slice(0, 3)
    .reduce((s, p) => s + (p.shareEstimate ?? 0), 0);

  return {
    ...meta,
    detail: rc.detail,
    years: rc.years,
    world: rc.world,
    producers,
    restOfWorld: {
      reported: restReported,
      estimate: restEstimate,
      shareReported: restReported / rc.world.reported,
      shareEstimate: restEstimate / rc.world.estimate,
    },
    topThreeShare,
  };
}

let cache: Commodity[] | null = null;

/** All ten commodities, in COMMODITY_META order, shares computed and checked. */
export function allCommodities(): Commodity[] {
  if (cache) return cache;
  const file = raw as unknown as RawFile;
  const byKey = new Map(file.commodities.map((c) => [c.key, c]));
  cache = COMMODITY_META.map((meta) => {
    const rc = byKey.get(meta.key);
    if (!rc) fail(`${meta.key}: missing from data/commodities.json`);
    return buildCommodity(rc, meta);
  });
  return cache;
}

export function getCommodity(slug: string): Commodity | undefined {
  const meta = commodityBySlug.get(slug);
  if (!meta) return undefined;
  return allCommodities().find((c) => c.key === meta.key);
}

/** The date the commodities table was last rebuilt (honest sitemap lastmod). */
export function commoditiesUpdated(): string {
  return (raw as unknown as RawFile).updated;
}

/** The USGS MCS source record, for citations. */
export function commoditiesSource(): DataSource {
  return (raw as unknown as RawFile).source;
}
