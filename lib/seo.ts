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

// ── Titles and descriptions, templated per depth ───────────────────────────
// Every nation is published at three depths, and each depth answers a different
// question. Before this, the chronicle and the journey both emitted
// `history.summary` verbatim as their meta description, which made them
// duplicates of each other on 184 pairs of pages — and the summary runs 482 to
// 1,731 characters against a ~160-character budget, so search engines were
// truncating an identical opening on both.
//
// These live here, beside the route shapes, for the same reason the JSON-LD
// builders do: so the three cannot drift apart.

/** Clamp to a word boundary, without leaving a dangling comma or dash. */
export function clampText(s: string, max = 155): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const at = cut.lastIndexOf(" ");
  return `${(at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[\s,;:—-]+$/, "")}…`;
}

/** "600 BCE", "1958" — a bare display year. */
function yearText(y: number): string {
  if (y < -10_000) {
    const ma = Math.abs(y) / 1_000_000;
    return ma >= 1 ? `${ma.toFixed(1)} million years ago` : `${Math.abs(y).toLocaleString("en")} BCE`;
  }
  return y < 0 ? `${Math.abs(y).toLocaleString("en")} BCE` : String(y);
}

function historyShape(history: CountryHistory) {
  const events = history.eras.reduce((n, e) => n + e.events.length, 0);
  const years = history.eras.flatMap((e) => e.events.map((ev) => ev.year));
  return {
    eras: history.eras.length,
    events,
    references: history.sources.length,
    first: years.length ? Math.min(...years) : history.founding.year,
    last: years.length ? Math.max(...years) : history.founding.year,
  };
}

/** The chronicle — the readable record. This is the page we want quoted. */
export function chronicleDescription(meta: CountryMeta, history: CountryHistory): string {
  const s = historyShape(history);
  return clampText(
    `History of ${meta.name}: ${history.tagline}. ${s.eras} eras and ${s.events} sourced events, ` +
      `every claim traceable to a named reference.`,
  );
}

/** The journey — the same material, piloted. Deliberately not the chronicle's line. */
export function journeyDescription(meta: CountryMeta, history: CountryHistory): string {
  const s = historyShape(history);
  return clampText(
    `Travel the history of ${meta.name} one moment at a time — ${s.events} sourced events ` +
      `across ${s.eras} eras, ${yearText(s.first)} to ${yearText(s.last)}.`,
  );
}

/** The dossier — the indicators. */
export function dossierDescription(
  meta: CountryMeta,
  domainLabels: string[],
  metricCount: number,
): string {
  if (!domainLabels.length) {
    return clampText(
      `${meta.name} — country profile: capital, population, area, languages and currency, ` +
        `with an honest account of which statistical series exist and which do not.`,
    );
  }
  const list =
    domainLabels.length > 1
      ? `${domainLabels.slice(0, -1).join(", ")} and ${domainLabels.at(-1)}`
      : domainLabels[0];
  return clampText(
    `${meta.name} — ${list.toLowerCase()} in one sourced dossier: ${metricCount} indicators, ` +
      `each with its publisher and data vintage.`,
  );
}

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

/**
 * A collection page that enumerates its members — used by /atlas, which is the
 * site's index of every nation and was the one route emitting no structured
 * data at all.
 *
 * The `ItemList` is deliberately truncated: an engine wants a representative
 * sample and the shape of the collection, not 184 inlined nodes, and the
 * complete enumeration is already served by the sitemap and /llms.txt.
 */
export function collectionLd(opts: {
  name: string;
  description: string;
  path: string;
  items: { name: string; path: string }[];
  total?: number;
  sample?: number;
}): Json {
  const { name, description, path, items, total, sample = 24 } = opts;
  const url = abs(path);
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    name,
    description,
    url,
    inLanguage: "en",
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    publisher,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: total ?? items.length,
      itemListElement: items.slice(0, sample).map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
        url: abs(it.path),
      })),
    },
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
