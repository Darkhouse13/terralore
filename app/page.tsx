import AtlasHome from "@/components/AtlasHome";
import { allHistories, publishedCodes } from "@/lib/histories";
import { allCodes } from "@/lib/countries";
import { getMetric } from "@/lib/domains";
import { formatUSD } from "@/lib/format";

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

  return (
    <AtlasHome
      historyCodes={codes}
      foundingNotes={foundingNotes}
      headlines={headlines}
      publishedCount={codes.length}
    />
  );
}
