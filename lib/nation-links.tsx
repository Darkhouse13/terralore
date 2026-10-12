// ── In-prose nation links ─────────────────────────────────────────────────────
//
// A chronicle's prose names other nations all the time: Montenegro's runs through
// Serbia, Albania, Austria and Türkiye. Before this, those names were plain text
// and every cross-chronicle link sat in the footer. Footer and "related" blocks
// tell a search engine nothing about how two pages relate, while a link inside
// the sentence that names the nation does (docs/seo/STANDARDS.md, rule 4). So the
// FIRST mention of another nation in each era links to that nation's chronicle.
//
// The rule is precision over recall. A missed link costs nothing, but a wrong
// one sends a reader from the Gulf of Guinea to Guinea or from the US state to
// the Caucasus. So a name is skipped whenever its neighbours say it means
// something else:
//
//   * a river, gulf, sea, empire or city ("the Niger", "Gulf of Mexico",
//     "Ghana Empire", "Mexico City");
//   * a qualifier that makes it a different polity ("New Mexico",
//     "Northern Ireland", "Portuguese Guinea", "Republic of China");
//   * a hyphenated compound ("Austria-Hungary", "Iran-Iraq War").
//
// The bare words "Congo" and "Guinea" are never linked: one names two states and
// a river, the other three colonies and a coast. Only the full state names are.
// Palestine is never auto-linked: the
// corpus treats it as a contested name, and a link from historical prose would
// pick a reading the text itself does not make.
import Link from "next/link";
import type { ReactNode } from "react";
import { allCountries, getCountry } from "@/lib/countries";
import { hasHistory } from "@/lib/histories";
import { routes } from "@/lib/seo";

/** Other names the prose uses for a nation, beside its atlas name. */
const ALIASES: Record<string, string[]> = {
  USA: ["United States of America"],
  GBR: ["Great Britain", "Britain"],
  COD: ["Democratic Republic of the Congo", "Congo-Kinshasa"],
  COG: ["Republic of the Congo", "Congo-Brazzaville"],
  GIN: ["Republic of Guinea", "Guinea-Conakry"],
  CIV: ["Côte d'Ivoire", "Côte d’Ivoire"],
  CPV: ["Cabo Verde"],
  CZE: ["Czech Republic"],
  SWZ: ["Swaziland"],
  MMR: ["Burma"],
  TLS: ["East Timor"],
  TUR: ["Turkey"],
  VAT: ["Vatican", "Holy See"],
  FLK: ["Falklands"],
  CHN: ["People's Republic of China", "People’s Republic of China"],
  STP: ["Sao Tome and Principe"],
};

/** Atlas names that are never matched on their own (see the header). */
const BARE_NAME_EXCLUDED = new Set(["COG", "GIN"]);
const NEVER_LINKED = new Set(["PSE"]);

/** Names that mean something else inside one particular chronicle. */
const SKIP_IN: Record<string, Set<string>> = {
  NGA: new Set(["BEN"]), // the Kingdom of Benin lies in Nigeria
  // In the Sahel chronicles "Ghana" is Wagadou, the medieval empire, which lay
  // hundreds of miles from the modern state that took its name.
  MRT: new Set(["GHA"]),
  MLI: new Set(["GHA"]),
  SEN: new Set(["GHA"]),
  GIN: new Set(["GHA"]),
  NER: new Set(["GHA"]),
  GMB: new Set(["GHA"]),
};

/**
 * Georgia the nation is only linked from chronicles of Europe and Asia; from the
 * Americas, Africa or anywhere the Atlantic trade reached, it is the US state.
 */
const CONTINENT_ONLY: Record<string, Set<string>> = {
  GEO: new Set(["Europe", "Asia"]),
};

/** Rivers that share a nation's name and are written "the X". */
const RIVER_NAMES = new Set(["NER", "JOR", "SEN"]);

/** Names an ancient empire shares with a later state ("the Ghana Empire"). */
const EMPIRE_NAMES = new Set(["GHA"]);

const QUALIFIER = new RegExp(
  "(?:\\b(?:New|Northern|Southern|Eastern|Western|Central|North|South|East|West|" +
    "Upper|Lower|Middle|Great|Greater|Gulf of|Bay of|Bight of|Sea of|Lake|Mount|River|" +
    "Republic of|Kingdom of|Portuguese|Spanish|French|German|British|Italian|Dutch|" +
    "Belgian|Austrian|Burgundian|Russian|Soviet|Ottoman|Roman|Danish|Swedish|Japanese|" +
    "American|English|Habsburg|Mughal|Byzantine|Persian|Mandatory|Imperial|Trucial)" +
    "\\s+|[A-Za-z]-)$",
  "i",
);
// "Niger River", "the Chad basin", "the Ghana (Wagadou) Empire", "Mexico City",
// and the paired form "the Senegal and Gambia rivers".
const TRAILER =
  /^(?:-[A-Za-z]|(?:\s+\([^)]{1,30}\))?\s+(?:rivers?|delta|valley|basin|sea|strait|canal|empires?|city|kingdom|company|gulf|ocean|bay|lake|mountains|highlands|plateau|coast)\b|\s+and\s+(?:the\s+)?[A-Z][\w’'-]+\s+rivers\b)/i;

interface Matcher {
  pattern: RegExp;
  codeOf: Map<string, string>;
}

let matcher: Matcher | null = null;

function getMatcher(): Matcher {
  if (matcher) return matcher;
  const codeOf = new Map<string, string>();
  for (const c of allCountries()) {
    if (NEVER_LINKED.has(c.code) || !hasHistory(c.code)) continue;
    if (!BARE_NAME_EXCLUDED.has(c.code)) codeOf.set(c.name, c.code);
    for (const alias of ALIASES[c.code] ?? []) codeOf.set(alias, c.code);
  }
  // Longest first, so "Papua New Guinea" wins over "Guinea" at the same index.
  const names = [...codeOf.keys()].sort((a, b) => b.length - a.length);
  const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  matcher = { pattern: new RegExp(`\\b(?:${escaped.join("|")})\\b`, "g"), codeOf };
  return matcher;
}

/**
 * A linker for one stretch of prose (a chronicle era). It links each nation the
 * first time it appears across every call. Call it in render order, so the
 * link lands on the first mention a reader actually sees.
 */
export function nationLinker(selfCode: string): (text: string) => ReactNode[] {
  const { pattern, codeOf } = getMatcher();
  const seen = new Set<string>([selfCode]);
  const skip = SKIP_IN[selfCode] ?? new Set<string>();
  const selfContinent = getCountry(selfCode)?.continent ?? "";

  return (text: string) => {
    const out: ReactNode[] = [];
    let last = 0;
    pattern.lastIndex = 0;
    for (const m of text.matchAll(pattern)) {
      const name = m[0];
      const code = codeOf.get(name);
      const at = m.index ?? 0;
      if (!code || seen.has(code) || skip.has(code)) continue;
      const before = text.slice(Math.max(0, at - 24), at);
      const after = text.slice(at + name.length, at + name.length + 24);
      if (QUALIFIER.test(before) || TRAILER.test(after)) continue;
      if (RIVER_NAMES.has(code) && /\bthe\s+$/i.test(before)) continue;
      if (CONTINENT_ONLY[code] && !CONTINENT_ONLY[code].has(selfContinent)) continue;
      if (EMPIRE_NAMES.has(code) && /empires?\b/i.test(text.slice(at, at + 60))) continue;

      seen.add(code);
      if (at > last) out.push(text.slice(last, at));
      out.push(
        <Link
          key={`${code}-${at}`}
          href={routes.chronicle(code)}
          prefetch={false}
          className="text-oxide underline underline-offset-2"
        >
          {name}
        </Link>,
      );
      last = at + name.length;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
  };
}
