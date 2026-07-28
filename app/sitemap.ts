import type { MetadataRoute } from "next";
import { allCountries } from "@/lib/countries";
import { getHistory } from "@/lib/histories";
import { abs, routes, SITE_URL } from "@/lib/seo";

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
      lastModified: BUILT_AT,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  for (const country of allCountries()) {
    if (!isRealCountry(country.name)) continue;

    const history = getHistory(country.code);
    const published = history?.status === "published";
    // Authored histories carry an ISO verification date; bare dossiers don't.
    const lastModified = published && history.updated ? history.updated : BUILT_AT;

    entries.push({
      url: abs(routes.dossier(country.code)),
      lastModified,
      changeFrequency: "monthly",
      // A nation with a published history is a far richer document than a
      // metadata-only dossier, so it outranks one.
      priority: published ? 0.8 : 0.5,
    });

    if (!published) continue;

    // The chronicle carries the full sourced prose in the initial HTML, so it
    // is the canonical readable document for a nation's history — it outranks
    // the journey, which is the same material as an interactive experience.
    entries.push({
      url: abs(routes.chronicle(country.code)),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.8,
    });

    entries.push({
      url: abs(routes.journey(country.code)),
      lastModified,
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
