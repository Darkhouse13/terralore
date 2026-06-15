import type { Metadata } from "next";
import AtlasIndex, { type IndexEntry } from "@/components/AtlasIndex";
import { allCountries } from "@/lib/countries";
import { getHistory, hasHistory } from "@/lib/histories";

export const metadata: Metadata = {
  title: "The Index — Terralore",
  description: "Every nation on the globe, with its archive status.",
};

export default function AtlasPage() {
  const entries: IndexEntry[] = allCountries()
    .map((c) => ({
      code: c.code,
      name: c.name,
      flag: c.flag,
      continent: c.continent,
      subregion: c.subregion,
      hasHistory: hasHistory(c.code),
    }))
    .filter((e) => e.name && e.name !== "-99");

  const featured: IndexEntry[] = entries
    .filter((e) => e.hasHistory)
    .map((e) => {
      const h = getHistory(e.code)!;
      return { ...e, tagline: h.tagline, foundingYear: h.founding.yearLabel };
    });

  return (
    <main className="paper-grain min-h-screen bg-parchment">
      <AtlasIndex entries={entries} featured={featured} />
    </main>
  );
}
