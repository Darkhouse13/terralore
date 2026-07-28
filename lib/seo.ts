// ── Site-wide SEO / GEO constants and JSON-LD builders ─────────────────────
// "GEO" = generative-engine optimisation: answer engines quote sources they can
// read and attribute. Terralore's whole corpus is sourced, so the job is to make
// the provenance machine-readable — every chronicle ships its citations as
// schema.org `citation` nodes pointing at the same references a human sees.

import type { CountryHistory, CountryMeta, Source } from "./types";

export const SITE_URL = "https://terralore.co";
export const SITE_NAME = "Terralore";
export const SITE_TAGLINE = "An Atlas of How Nations Came to Be";
export const SITE_DESCRIPTION =
  "An interactive globe and living archive of world history. Explore any nation and trace the long path it took to become a country — every claim sourced.";

/** Absolute URL for a site-relative path. */
export function abs(path: string): string {
  return path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const routes = {
  home: () => "/",
  atlas: () => "/atlas",
  dossier: (code: string) => `/country/${code}`,
  journey: (code: string) => `/country/${code}/history`,
  chronicle: (code: string) => `/country/${code}/chronicle`,
};

// ── JSON-LD ────────────────────────────────────────────────────────────────
// Rendered via <JsonLd/> (components/JsonLd.tsx). Kept as plain objects so the
// same node can be reused across routes and unit-checked without a DOM.

type Json = Record<string, unknown>;

export const publisher: Json = {
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: { "@type": "ImageObject", url: abs("/icon.png") },
  description: SITE_DESCRIPTION,
};

/** The site node — emitted once, on the home page. */
export function websiteLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: `${SITE_NAME} — ${SITE_TAGLINE}`,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    publisher,
    inLanguage: "en",
  };
}

/** The publisher as a standalone, context-bearing node. */
export function organizationLd(): Json {
  return { "@context": "https://schema.org", ...publisher };
}

/** Breadcrumbs give engines the hierarchy and earn rich-result trails. */
export function breadcrumbLd(trail: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: abs(t.path),
    })),
  };
}

/** The nation itself, as a schema.org Country. */
export function countryLd(meta: CountryMeta): Json {
  const node: Json = {
    "@context": "https://schema.org",
    "@type": "Country",
    name: meta.name,
    alternateName: meta.officialName || undefined,
    url: abs(routes.dossier(meta.code)),
    identifier: meta.code,
  };
  if (meta.iso2) node.addressCountry = meta.iso2;
  if (meta.latlng) {
    node.geo = {
      "@type": "GeoCoordinates",
      latitude: meta.latlng[0],
      longitude: meta.latlng[1],
    };
  }
  if (meta.capital?.length) {
    node.containsPlace = { "@type": "City", name: meta.capital[0] };
  }
  if (meta.area) node.area = { "@type": "QuantitativeValue", value: meta.area, unitCode: "KMK" };
  return node;
}

/**
 * A single reference, as a CreativeWork. This is the load-bearing node for
 * being cited: it names the publisher that actually originated the claim, so an
 * answer engine can attribute the chain rather than flattening it to "a website".
 */
export function sourceLd(s: Source): Json {
  const node: Json = { "@type": "CreativeWork", name: s.label };
  if (s.url) node.url = s.url;
  if (s.publisher) node.publisher = { "@type": "Organization", name: s.publisher };
  return node;
}

/**
 * The chronicle as a scholarly Article. `citation` carries every source the
 * piece rests on; `about` links it to the Country node.
 */
export function chronicleLd(history: CountryHistory, meta: CountryMeta): Json {
  const url = abs(routes.chronicle(meta.code));
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: `${meta.name}: ${history.tagline}`,
    name: `The Chronicle of ${meta.name}`,
    description: history.summary,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: "en",
    dateModified: history.updated,
    datePublished: history.updated,
    author: { "@type": "Organization", name: `${SITE_NAME} Editorial` },
    publisher,
    about: countryLd(meta),
    citation: history.sources.map(sourceLd),
    articleSection: history.eras.map((e) => e.title),
    isAccessibleForFree: true,
    license: "https://creativecommons.org/licenses/by/4.0/",
  };
}

/** The dossier's metric tables, as a Dataset — the shape data-seeking engines expect. */
export function dossierLd(
  meta: CountryMeta,
  sources: { publisher?: string; label: string; url?: string }[],
  updated: string | null,
): Json {
  const url = abs(routes.dossier(meta.code));
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${url}#dataset`,
    name: `${meta.name} — national indicators`,
    description: `Sourced economic, social, technological, geographic, resource and military indicators for ${meta.name}, each carrying its publisher and data vintage.`,
    url,
    isAccessibleForFree: true,
    creator: publisher,
    dateModified: updated ?? undefined,
    about: countryLd(meta),
    citation: sources.map((s) => ({
      "@type": "CreativeWork",
      name: s.label,
      url: s.url,
      publisher: s.publisher ? { "@type": "Organization", name: s.publisher } : undefined,
    })),
  };
}
