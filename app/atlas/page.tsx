import type { Metadata } from "next";
import AtlasIndex, { type IndexEntry } from "@/components/AtlasIndex";
import { allCountries } from "@/lib/countries";
import { getHistory, hasHistory } from "@/lib/histories";

export const metadata: Metadata = {
  title: "The Atlas",
  description:
    "Every nation on the globe — searchable by name, code or region. Each entry opens a sourced dossier and, where the archive is published, the full chronicle of how that nation came to be.",
  alternates: { canonical: "/atlas" },
  openGraph: {
    type: "website",
    title: "The Atlas — every nation, searchable",
    description: "Every nation on the globe — searchable by name, code or region.",
    url: "/atlas",
  },
};

export default function AtlasPage() {
  const entries: IndexEntry[] = allCountries()
    .map((c) => {
      const h = hasHistory(c.code) ? getHistory(c.code) : null;
      return {
        code: c.code,
        name: c.name,
        flag: c.flag,
        continent: c.continent,
        subregion: c.subregion,
        population: c.population,
        unMember: c.unMember,
        hasHistory: !!h,
        foundingYear: h?.founding.yearLabel,
      };
    })
    .filter((e) => e.name && e.name !== "-99");

  return <AtlasIndex entries={entries} />;
}
