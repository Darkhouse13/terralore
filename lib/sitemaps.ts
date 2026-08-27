import type { MetadataRoute } from "next";
import { allCountries } from "@/lib/countries";
import { allHistories, getHistory } from "@/lib/histories";
import { getDossier } from "@/lib/domains";
import { allCommodities, commoditiesUpdated } from "@/lib/commodities";
import { allRankings, rankingsUpdated } from "@/lib/rankings";
import { allComparePages, compareIndexable, compareUpdated } from "@/lib/compare";
import { abs, routes, SITE_URL } from "@/lib/seo";
import { allPeriods, allThemes, periodFor, themeSliceIndexable } from "@/lib/chronology";
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
    },
    {
      url: abs(routes.atlas()),
      lastModified: CORPUS_AT,
    },
    {
      url: abs(routes.privacy()),
      lastModified: "2026-08-14",
    },
    {
      url: abs(routes.about()),
      lastModified: "2026-08-27",
    },
    {
      url: abs("/integrity"),
      lastModified: currentManifest().sealed.slice(0, 10),
    },
    {
      url: abs(routes.ledger()),
      lastModified: allEntries()[0]?.date ?? currentManifest().sealed.slice(0, 10),
    },
    {
      url: abs(routes.chronicleEventsDataset()),
      lastModified: "2026-08-22",
    },
    ...allEntries().map((entry) => ({
      url: abs(routes.ledgerEntry(entry.slug)),
      lastModified: entry.date,
    })),
    ...letterSlugs().map((slug) => ({
      url: abs(routes.ledgerLetter(slug)),
      lastModified: allEntries().find((entry) => entry.slug === slug)?.date ?? CORPUS_AT,
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
      });
      continue;
    }

    if (!published) continue;
    entries.push({
      url: abs(routes.chronicle(country.code)),
      lastModified: historyUpdated ?? CORPUS_AT,
    });
  }

  return entries;
}

function timelineEntries(): MetadataRoute.Sitemap {
  return [
    {
      url: abs("/timeline"),
      lastModified: CORPUS_AT,
    },
    ...allPeriods().map((period) => ({
      url: abs(`/timeline/${period.slug}`),
      lastModified: CORPUS_AT,
    })),
  ];
}

function themeEntries(): MetadataRoute.Sitemap {
  return [
    {
      url: abs("/themes"),
      lastModified: CORPUS_AT,
    },
    ...allThemes().map((theme) => ({
      url: abs(`/themes/${theme.slug}`),
      lastModified: CORPUS_AT,
    })),
    ...allThemes().flatMap((theme) => {
      // Noindexed slices (below the event floor) are excluded — a sitemap
      // must only carry URLs meant for the index.
      const byPeriod = new Map<string, number>();
      for (const event of theme.events) {
        const slug = periodFor(event.year).slug;
        byPeriod.set(slug, (byPeriod.get(slug) ?? 0) + 1);
      }
      return [...byPeriod.entries()]
        .filter(([, count]) => themeSliceIndexable(count))
        .map(([period]) => ({
          url: abs(`/themes/${theme.slug}/${period}`),
          lastModified: CORPUS_AT,
        }));
    }),
  ];
}

function comparisonEntries(): MetadataRoute.Sitemap {
  return [
    {
      url: abs(routes.compare()),
      lastModified: compareUpdated(),
    },
    // Noindexed pairs (see compareIndexable) are excluded — a sitemap must
    // only carry URLs meant for the index.
    ...allComparePages()
      .filter(compareIndexable)
      .map((page) => ({
        url: abs(routes.comparePair(page.slug)),
        lastModified: page.updated,
      })),
  ];
}

function rankingEntries(): MetadataRoute.Sitemap {
  return [
    {
      url: abs(routes.rankings()),
      lastModified: rankingsUpdated(),
    },
    ...allRankings().map((ranking) => ({
      url: abs(routes.ranking(ranking.slug)),
      lastModified: ranking.updated,
    })),
  ];
}

function commodityEntries(): MetadataRoute.Sitemap {
  return [
    {
      url: abs(routes.commodities()),
      lastModified: commoditiesUpdated(),
    },
    ...allCommodities().map((commodity) => ({
      url: abs(routes.commodity(commodity.slug)),
      lastModified: commoditiesUpdated(),
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
