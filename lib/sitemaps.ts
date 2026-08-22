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

export const BASE_URL = SITE_URL;

export const SITEMAP_GROUP_IDS = [
  "core",
  "country-dossiers",
  "country-chronicles",
  "timelines",
  "themes",
  "comparisons",
  "rankings",
  "commodities",
] as const;

export type SitemapGroupId = (typeof SITEMAP_GROUP_IDS)[number];

const MAX_URLS_PER_SITEMAP = 50_000;
const SITE_SHELL_AT = "2026-08-14";

const CORPUS_AT =
  allHistories()
    .map((history) => history.updated)
    .filter(Boolean)
    .sort()
    .at(-1) ?? SITE_SHELL_AT;

// The home page is a view over these corpora plus the authored site shell.
// A deploy alone does not change it, so never re-date it with the build clock.
const HOME_AT = [
  SITE_SHELL_AT,
  CORPUS_AT,
  commoditiesUpdated(),
  rankingsUpdated(),
  compareUpdated(),
  allEntries()[0]?.date,
]
  .filter((value): value is string => !!value)
  .sort()
  .at(-1);

function isRealCountry(name: string | undefined | null): boolean {
  return !!name && name !== "-99";
}

function coreEntries(): MetadataRoute.Sitemap {
  return [
    {
      url: abs(routes.home()),
      lastModified: HOME_AT,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: abs(routes.atlas()),
      lastModified: CORPUS_AT,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: abs(routes.privacy()),
      lastModified: "2026-08-14",
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: abs("/integrity"),
      lastModified: currentManifest().sealed.slice(0, 10),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: abs(routes.ledger()),
      lastModified: allEntries()[0]?.date ?? currentManifest().sealed.slice(0, 10),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: abs(routes.chronicleEventsDataset()),
      lastModified: "2026-08-22",
      changeFrequency: "yearly",
      priority: 0.8,
    },
    ...allEntries().map((entry) => ({
      url: abs(routes.ledgerEntry(entry.slug)),
      lastModified: entry.date,
      changeFrequency: "never" as const,
      priority: 0.5,
    })),
    ...letterSlugs().map((slug) => ({
      url: abs(routes.ledgerLetter(slug)),
      lastModified: allEntries().find((entry) => entry.slug === slug)?.date ?? CORPUS_AT,
      changeFrequency: "never" as const,
      priority: 0.4,
    })),
  ];
}

function countryEntries(kind: "dossier" | "chronicle"): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const country of allCountries()) {
    if (!isRealCountry(country.name)) continue;

    const history = getHistory(country.code);
    const published = history?.status === "published";
    const historyUpdated = (published && history.updated) || undefined;

    if (kind === "dossier") {
      const dossierUpdated = getDossier(country.code)?.updated || undefined;
      const dossierLastMod =
        [historyUpdated, dossierUpdated].filter(Boolean).sort().at(-1) ?? CORPUS_AT;

      entries.push({
        url: abs(routes.dossier(country.code)),
        lastModified: dossierLastMod,
        changeFrequency: "monthly",
        priority: published ? 0.8 : 0.5,
      });
      continue;
    }

    if (!published) continue;
    entries.push({
      url: abs(routes.chronicle(country.code)),
      lastModified: historyUpdated ?? CORPUS_AT,
      changeFrequency: "yearly",
      priority: 0.8,
    });
  }

  return entries;
}

function timelineEntries(): MetadataRoute.Sitemap {
  return [
    {
      url: abs("/timeline"),
      lastModified: CORPUS_AT,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...allPeriods().map((period) => ({
      url: abs(`/timeline/${period.slug}`),
      lastModified: CORPUS_AT,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}

function themeEntries(): MetadataRoute.Sitemap {
  return [
    {
      url: abs("/themes"),
      lastModified: CORPUS_AT,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...allThemes().map((theme) => ({
      url: abs(`/themes/${theme.slug}`),
      lastModified: CORPUS_AT,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...allThemes().flatMap((theme) => {
      const periods = new Set(theme.events.map((event) => periodFor(event.year).slug));
      return [...periods].map((period) => ({
        url: abs(`/themes/${theme.slug}/${period}`),
        lastModified: CORPUS_AT,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));
    }),
  ];
}

function comparisonEntries(): MetadataRoute.Sitemap {
  return [
    {
      url: abs(routes.compare()),
      lastModified: compareUpdated(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...allComparePages().map((page) => ({
      url: abs(routes.comparePair(page.slug)),
      lastModified: page.updated,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}

function rankingEntries(): MetadataRoute.Sitemap {
  return [
    {
      url: abs(routes.rankings()),
      lastModified: rankingsUpdated(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...allRankings().map((ranking) => ({
      url: abs(routes.ranking(ranking.slug)),
      lastModified: ranking.updated,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
}

function commodityEntries(): MetadataRoute.Sitemap {
  return [
    {
      url: abs(routes.commodities()),
      lastModified: commoditiesUpdated(),
      changeFrequency: "yearly",
      priority: 0.8,
    },
    ...allCommodities().map((commodity) => ({
      url: abs(routes.commodity(commodity.slug)),
      lastModified: commoditiesUpdated(),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
}

const BUILDERS: Record<SitemapGroupId, () => MetadataRoute.Sitemap> = {
  core: coreEntries,
  "country-dossiers": () => countryEntries("dossier"),
  "country-chronicles": () => countryEntries("chronicle"),
  timelines: timelineEntries,
  themes: themeEntries,
  comparisons: comparisonEntries,
  rankings: rankingEntries,
  commodities: commodityEntries,
};

export function isSitemapGroupId(value: string): value is SitemapGroupId {
  return (SITEMAP_GROUP_IDS as readonly string[]).includes(value);
}

export function sitemapGroupPath(group: SitemapGroupId): string {
  return `/sitemaps/${group}.xml`;
}

export function buildSitemapGroup(group: SitemapGroupId): MetadataRoute.Sitemap {
  const entries = BUILDERS[group]();
  if (entries.length > MAX_URLS_PER_SITEMAP) {
    throw new Error(
      `[sitemap:${group}] ${entries.length} URLs exceeds the ${MAX_URLS_PER_SITEMAP}-URL limit`,
    );
  }
  return entries;
}

export function allSitemapEntries(): MetadataRoute.Sitemap {
  return SITEMAP_GROUP_IDS.flatMap((group) => buildSitemapGroup(group));
}
