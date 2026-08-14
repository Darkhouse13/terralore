import type { MetadataRoute } from "next";
import { allCountries } from "@/lib/countries";
import { allHistories, getHistory } from "@/lib/histories";
import { getDossier } from "@/lib/domains";
import { allCommodities, commoditiesUpdated } from "@/lib/commodities";
import { allRankings, rankingsUpdated } from "@/lib/rankings";
import { allComparePages, compareUpdated } from "@/lib/compare";
import { abs, routes, SITE_URL } from "@/lib/seo";
import { allPeriods, allThemes, periodFor } from "@/lib/chronology";
import { currentManifest } from "@/lib/integrity";
import { allEntries, letterSlugs } from "@/lib/ledger";

/**
 * Canonical origin and route shapes both come from `lib/seo.ts`, so the sitemap
 * can never drift from the URLs the JSON-LD and canonical tags advertise.
 */
export const BASE_URL = SITE_URL;

/**
 * Google/Bing cap a single sitemap at 50,000 URLs (and 50 MB uncompressed).
 * We are far below that today, so one sitemap is correct. If the corpus ever
 * crosses the line, split with `generateSitemaps()` (see the Next.js
 * `generate-sitemaps` reference) rather than silently emitting an oversized file.
 */
const MAX_URLS_PER_SITEMAP = 50_000;

/** Build-time stamp, used wherever a resource has no authored `updated` date. */
const BUILT_AT = new Date();

/**
 * The corpus's own latest verification date. The cross-nation pages (timeline,
 * themes, atlas) are derived entirely from the history corpus, so this — not
 * the build timestamp — is when their content last changed. Re-dating a
 * thousand unchanged URLs on every deploy is the pattern that teaches a
 * crawler to ignore lastmod altogether.
 */
const CORPUS_AT =
  allHistories()
    .map((h) => h.updated)
    .filter(Boolean)
    .sort()
    .at(-1) ?? BUILT_AT;

/**
 * Same junk filter the atlas index uses: Natural Earth ships a handful of rows
 * with a missing name or the sentinel "-99".
 */
function isRealCountry(name: string | undefined | null): boolean {
  return !!name && name !== "-99";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    {
      url: abs(routes.home()),
      lastModified: BUILT_AT,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: abs(routes.atlas()),
      lastModified: CORPUS_AT,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    // The cross-nation reads. Derived from the same corpus, but they are the
    // only pages that answer "what happened everywhere in X" — which is both
    // the most interesting question here and the one most likely to be asked.
    {
      url: abs("/timeline"),
      lastModified: CORPUS_AT,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: abs("/themes"),
      lastModified: CORPUS_AT,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...allPeriods().map((p) => ({
      url: abs(`/timeline/${p.slug}`),
      lastModified: CORPUS_AT,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...allThemes().map((t) => ({
      url: abs(`/themes/${t.slug}`),
      lastModified: CORPUS_AT,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    // A theme within a period ("Independence in the 1960s") is where the full
    // text of a large theme lives, so these carry the detail — and they are the
    // specific thing a reader searches for. Only pairs that actually hold
    // events are emitted.
    ...allThemes().flatMap((t) => {
      const slugs = new Set(t.events.map((ev) => periodFor(ev.year).slug));
      return [...slugs].map((period) => ({
        url: abs(`/themes/${t.slug}/${period}`),
        lastModified: CORPUS_AT,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));
    }),
    // Privacy: hand-authored; its honest lastmod is its last edit, tracked here.
    {
      url: abs(routes.privacy()),
      lastModified: "2026-08-14",
      changeFrequency: "yearly",
      priority: 0.3,
    },
    // The seal: /integrity changes exactly when the corpus is resealed, so the
    // seal's own date is the honest lastmod.
    {
      url: abs("/integrity"),
      lastModified: currentManifest().sealed.slice(0, 10),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    // The ledger: the hub moves with the latest entry; entries are append-only
    // records that never change after publication — their own date is final.
    {
      url: abs(routes.ledger()),
      lastModified: allEntries()[0]?.date ?? currentManifest().sealed.slice(0, 10),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...allEntries().map((e) => ({
      url: abs(routes.ledgerEntry(e.slug)),
      lastModified: e.date,
      changeFrequency: "never" as const,
      priority: 0.5,
    })),
    // The letter archive: a sent letter is as final as its entry.
    ...letterSlugs().map((slug) => ({
      url: abs(routes.ledgerLetter(slug)),
      lastModified: allEntries().find((e) => e.slug === slug)?.date ?? CORPUS_AT,
      changeFrequency: "never" as const,
      priority: 0.4,
    })),
    // The commodities read: the resources domain across nations. Their content
    // changes only when the USGS MCS table is rebuilt (annually), so the honest
    // lastmod is the commodities file's own build date — not the corpus date
    // and not the deploy timestamp.
    {
      url: abs(routes.commodities()),
      lastModified: commoditiesUpdated(),
      changeFrequency: "yearly",
      priority: 0.8,
    },
    ...allCommodities().map((c) => ({
      url: abs(routes.commodity(c.slug)),
      lastModified: commoditiesUpdated(),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
    // The rankings: every dossier indicator read across nations. Each page's
    // content changes only when its own domain file is rebuilt, so the honest
    // lastmod is that domain's `updated` date — the hub moves with whichever
    // domain moved last.
    {
      url: abs(routes.rankings()),
      lastModified: rankingsUpdated(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...allRankings().map((r) => ({
      url: abs(routes.ranking(r.slug)),
      lastModified: r.updated,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
    // The compare pages: two nations' existing records side by side. A pair's
    // content changes when either nation's dossier refreshes or either
    // chronicle is re-verified, so its honest lastmod is the max of those four
    // dates (computed in lib/compare); the hub moves with the latest pair.
    {
      url: abs(routes.compare()),
      lastModified: compareUpdated(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...allComparePages().map((p) => ({
      url: abs(routes.comparePair(p.slug)),
      lastModified: p.updated,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];

  for (const country of allCountries()) {
    if (!isRealCountry(country.name)) continue;

    const history = getHistory(country.code);
    const published = history?.status === "published";
    const historyUpdated = (published && history.updated) || undefined;
    const dossierUpdated = getDossier(country.code)?.updated || undefined;
    // The dossier page renders BOTH corpora — the authored history hero and
    // the data dossier — so its lastmod is whichever moved later. Using only
    // the history date under-reported every data refresh: when the dossier
    // gained three domains, 170 nations' pages still advertised their old
    // history dates. ISO yyyy-mm-dd strings, so a lexical sort is a date sort.
    const dossierLastMod =
      [historyUpdated, dossierUpdated].filter(Boolean).sort().at(-1) ?? CORPUS_AT;

    entries.push({
      url: abs(routes.dossier(country.code)),
      lastModified: dossierLastMod,
      changeFrequency: "monthly",
      // A nation with a published history is a far richer document than a
      // metadata-only dossier, so it outranks one.
      priority: published ? 0.8 : 0.5,
    });

    if (!published) continue;

    // The chronicle carries the full sourced prose in the initial HTML, so it
    // is the canonical readable document for a nation's history — it outranks
    // the journey, which is the same material as an interactive experience.
    // Both present the history alone, so the history's own date — not the
    // dossier's — is the honest lastmod here.
    entries.push({
      url: abs(routes.chronicle(country.code)),
      lastModified: historyUpdated ?? CORPUS_AT,
      changeFrequency: "yearly",
      priority: 0.8,
    });

    entries.push({
      url: abs(routes.journey(country.code)),
      lastModified: historyUpdated ?? CORPUS_AT,
      changeFrequency: "yearly",
      priority: 0.6,
    });
  }

  if (entries.length > MAX_URLS_PER_SITEMAP) {
    console.warn(
      `[sitemap] ${entries.length} URLs exceeds the ${MAX_URLS_PER_SITEMAP}-URL limit for a single sitemap — split it with generateSitemaps().`,
    );
  }

  return entries;
}
