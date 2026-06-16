import AtlasHome from "@/components/AtlasHome";
import { allHistories, publishedCodes } from "@/lib/histories";
import { allCodes, allCountries } from "@/lib/countries";
import { getMetric } from "@/lib/domains";
import { formatUSD } from "@/lib/format";
import type { DomainKey } from "@/lib/types";

// Indicators selectable as a globe colour layer (one per domain group).
const LAYERS: { key: string; domain: DomainKey; label: string }[] = [
  { key: "gdpPerCapita", domain: "economy", label: "Income per person" },
  { key: "lifeExpectancy", domain: "society", label: "Life expectancy" },
  { key: "internetUsers", domain: "technology", label: "Internet access" },
  { key: "co2PerCapita", domain: "geography", label: "CO₂ per person" },
  { key: "milExpPctGdp", domain: "military", label: "Military burden" },
];

export default function Home() {
  const codes = publishedCodes();
  const foundingNotes: Record<string, string> = {};
  for (const h of allHistories()) {
    foundingNotes[h.code] = `${h.founding.label} · ${h.founding.yearLabel}`;
  }

  // Headline economy figures for the selection card (whatever the data covers).
  const headlines: Record<string, { gdp: string; gdpPerCapita: string }> = {};
  for (const code of allCodes()) {
    const gdp = getMetric(code, "economy", "gdp");
    const pc = getMetric(code, "economy", "gdpPerCapita");
    if (gdp?.value == null && pc?.value == null) continue;
    headlines[code] = {
      gdp: formatUSD(gdp?.value ?? null),
      gdpPerCapita: formatUSD(pc?.value ?? null),
    };
  }

  // Choropleth layers: code → value maps the globe can colour by.
  const layers = LAYERS.map((l) => {
    const values: Record<string, number> = {};
    let unit = "";
    for (const code of allCodes()) {
      const m = getMetric(code, l.domain, l.key);
      if (m?.value != null) {
        values[code] = m.value;
        unit = m.unit;
      }
    }
    return { key: l.key, label: l.label, unit, values };
  });

  // Lightweight name/flag index so the legend can name the extreme + hovered nations.
  const metaIndex: Record<string, { name: string; flag: string | null }> = {};
  for (const c of allCountries()) metaIndex[c.code] = { name: c.name, flag: c.flag };

  return (
    <AtlasHome
      historyCodes={codes}
      foundingNotes={foundingNotes}
      headlines={headlines}
      layers={layers}
      metaIndex={metaIndex}
      publishedCount={codes.length}
    />
  );
}
