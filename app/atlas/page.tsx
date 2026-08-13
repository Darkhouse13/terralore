import type { Metadata } from "next";
import AtlasIndex, { type IndexEntry } from "@/components/AtlasIndex";
import JsonLd from "@/components/JsonLd";
import { allCountries } from "@/lib/countries";
import { getHistory, hasHistory } from "@/lib/histories";
import { breadcrumbLd, collectionLd, routes, SITE_NAME, siteOgImages } from "@/lib/seo";

export const metadata: Metadata = {
  title: "The Atlas",
  description:
    "Every nation on the globe, searchable by name, code or region — each opening a sourced dossier and the full chronicle of how it came to be.",
  alternates: { canonical: "/atlas" },
  openGraph: {
    type: "website",
    title: "The Atlas — every nation, searchable",
    description: "Every nation on the globe — searchable by name, code or region.",
    url: "/atlas",
    images: siteOgImages(),
  },
  twitter: {
    card: "summary_large_image",
    title: "The Atlas — every nation, searchable",
    description: "Every nation on the globe — searchable by name, code or region.",
    images: siteOgImages(),
  },
};

export default function AtlasPage() {
  const entries: IndexEntry[] = allCountries()
    .map((c) => {
      const h = hasHistory(c.code) ? getHistory(c.code) : null;
      return {
        code: c.code,
        name: c.name,
        continent: c.continent,
        subregion: c.subregion,
        unMember: c.unMember,
        hasHistory: !!h,
        foundingYear: h?.founding.yearLabel,
      };
    })
    .filter((e) => e.name && e.name !== "-99");

  return (
    <>
      {/* /atlas was the one route in the sitemap emitting no structured data at
          all — the site's index of every nation, invisible to anything looking
          for a collection. */}
      <JsonLd
        data={[
          collectionLd({
            name: "The Atlas — every nation",
            description: metadata.description as string,
            path: routes.atlas(),
            items: entries.map((e) => ({ name: e.name, path: routes.dossier(e.code) })),
          }),
          breadcrumbLd([
            { name: SITE_NAME, path: routes.home() },
            { name: "The Atlas", path: routes.atlas() },
          ]),
        ]}
      />
      <AtlasIndex entries={entries} />
    </>
  );
}
