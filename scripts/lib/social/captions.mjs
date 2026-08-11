// ── Captions: the same records, in each platform's length budget ───────────
// One template per post type. A caption is built as ORDERED BLOCKS, each
// marked authored or corpus, so the rules validator can tell OUR copy (held
// to the neutrality rules: no grading, no contest framing, no CTA furniture)
// from the RECORD'S OWN WORDS (event titles, summaries, taglines, founding
// labels — quoted as the pages quote them; "the Awami League wins the
// election" is a sourced fact, and rewriting it to dodge a word filter would
// be editing the record). The citation line is format-checked and exempt
// from the word scan — pair slugs carry "-vs-" as URL grammar, never as
// language.
//
// Rules the validator enforces on every assembled caption
// (scripts/validate-social.mjs):
//   · length within the platform budget WITH MARGIN — Pinterest 460 of 500,
//     Instagram and TikTok 2000 of 2200;
//   · authored blocks free of grading/contest/CTA language (BANNED below);
//   · every character inside the committed font charset — which also bans
//     emoji from captions, by construction;
//   · hashtags only from data/social-hashtags.json, five at most;
//   · the citation line is the GEO template's shape (lib/geo.ts): the same
//     `Terralore, "<title>", terralore.co<path>.` an answer engine is asked
//     to use. The retrieval-date placeholder belongs to quoting agents and
//     has no meaning in a caption, so the line ends at the path.
//
// Figures always carry their years. Facts, never adjectives: authored copy
// may say "highest" (arithmetic) and never "best" (judgment); disputes are
// never editorialised — the record speaks, with its source.

import { formatMetric } from "@/lib/format";
import pool from "@/data/social-hashtags.json";
import { clamp } from "./ui.mjs";

export const LIMITS = {
  pinterest: { platform: 500, margin: 460 },
  instagram: { platform: 2200, margin: 2000 },
  tiktok: { platform: 2200, margin: 2000 },
};

/** ≤5 tags: the type's own, then core fill — deterministic per type. */
export function hashtagsFor(type) {
  const tags = [...(pool.byType[type] ?? [])];
  for (const t of pool.core) {
    if (tags.length >= 5) break;
    if (!tags.includes(t)) tags.push(t);
  }
  return tags.slice(0, 5);
}

/** The GEO citation shape, ending at the path (see module note). */
export function citationLine(title, path) {
  return `Terralore, "${title}", terralore.co${path}.`;
}

const num = (n) => n.toLocaleString("en");
const a = (text) => ({ kind: "authored", text });
const c = (text) => ({ kind: "corpus", text });

/**
 * Assemble ordered blocks + citation + hashtags under the platform margin.
 * Overflow is absorbed by clamping the LONGEST CORPUS block first (authored
 * copy is written to fit and never truncates mid-claim); templates that can
 * exceed a budget with authored copy alone take the platform and shorten
 * structurally instead.
 */
export function assembleCaption({ blocks, citation, type }, platform) {
  const margin = LIMITS[platform].margin;
  const tags = hashtagsFor(type).join(" ");
  const parts = () => [...blocks.map((b) => b.text), citation, tags].filter((t) => t.length > 0);
  let over = parts().join("\n\n").length - margin;
  while (over > 0) {
    const corpus = blocks.filter((b) => b.kind === "corpus" && b.text.length > 0);
    if (corpus.length === 0) break;
    const longest = corpus.reduce((x, y) => (y.text.length > x.text.length ? y : x));
    const target = Math.max(longest.text.length - over - 1, 0);
    longest.text = target < 24 ? "" : clamp(longest.text, target);
    over = parts().join("\n\n").length - margin;
  }
  return parts().join("\n\n");
}

/* ── per-type templates ───────────────────────────────────────────────────── */

export function onThisDayCaption(subject, platform) {
  const e = subject.event;
  const head =
    subject.kind === "day"
      ? `On this day, ${e.dateText}.`
      : subject.kind === "month"
        ? `This month in history — ${e.dateText}.`
        : `${subject.yearsAgo} years ago, in ${e.yearText}.`;
  const blocks = [
    a(head),
    c(`${e.title}. ${e.summary}`),
    ...(platform === "pinterest"
      ? []
      : [
          a(
            `A sourced record from the chronicle of ${e.nationName}: ` +
              `${num(e.historyEvents)} events across ${e.historyEras} eras, every claim traceable to a named source.`,
          ),
        ]),
    a(`Source: ${e.provenance.join("; ")}.`),
  ];
  return {
    type: "on-this-day",
    blocks,
    // The chronicle's JSON-LD `name` (lib/seo.ts chronicleLd) — canonical and
    // bounded, where the twin's full title carries the tagline and can run
    // hundreds of characters (Guinea-Bissau's tagline alone is ~250).
    citation: citationLine(`The Chronicle of ${e.nationName}`, subject.targetPath),
  };
}

export function rankingCaption(subject, platform) {
  const rows = platform === "pinterest" ? 3 : 10;
  const shown = subject.rows.slice(0, rows);
  const lines = shown.map(
    (r) => `${r.rank}. ${r.name} — ${formatMetric(r.value, subject.unit)}${r.year != null ? ` (${r.year})` : ""}`,
  );
  const blocks = [
    a(`${subject.label}: the ${rows === 3 ? "three" : "ten"} highest published figures.`),
    a(lines.join("\n")),
    a(
      // The vintage explainer is structural-shortened away on Pinterest: the
      // years already ride every row inline ("(2023)"), so the sentence is
      // explanatory rather than load-bearing there, and its 63 characters are
      // what pushed long-labelled mixed-vintage rankings past the 460 margin.
      `Of ${num(subject.totalRanked)} ${subject.isMineral ? "producers listed" : "nations ranked"} in full` +
        `${subject.mixedYears && platform !== "pinterest" ? "; each figure is its nation's latest observation year" : ""}. ` +
        (subject.isMineral
          ? "A nation absent from the USGS list is not recorded as producing none."
          : "Nations without published data are unranked, never zero."),
    ),
  ];
  if (subject.isWgi && platform !== "pinterest") {
    blocks.push(
      a(
        "These are the Worldwide Governance Indicators' absolute 0–100 scores — model estimates " +
          "from perception surveys, not percentile ranks.",
      ),
    );
  }
  blocks.push(a(`Source: ${subject.provenance.join("; ")}.`));
  return {
    type: "ranking",
    blocks,
    citation: citationLine(`${subject.label} by nation — world ranking`, subject.targetPath),
  };
}

export function commodityCaption(subject, platform) {
  const top = subject.producers.slice(0, 3);
  const lines = top.map((p) => `${p.name} — ${p.shareText}${p.valueText ? ` (${p.valueText})` : ""}`);
  const blocks = [
    a(`Who supplies the world: ${subject.name.toLowerCase()}.`),
    a(
      `World mine production ${subject.worldText}. The three largest producers hold ${subject.topThreeText} ` +
        `of the published world total:`,
    ),
    a(lines.join("\n")),
    ...(platform === "pinterest"
      ? [a(`Rest of world: ${subject.restShareText}.`)]
      : [
          a(
            `Rest of world: ${subject.restShareText}. Shares are computed against the published world ` +
              `total, and a nation absent from the USGS list is not recorded as producing none.`,
          ),
        ]),
    a(`Source: ${subject.sourceLabel}.`),
  ];
  return {
    type: "commodity",
    blocks,
    citation: citationLine(`${subject.name} — who supplies the world`, subject.targetPath),
  };
}

export function compareCaption(subject) {
  const blocks = [
    a(`${subject.aName} and ${subject.bName}, side by side.`),
    a(
      `${subject.metricLabel}: ${subject.aValueText}${subject.aYear != null ? ` (${subject.aYear})` : ""} and ` +
        `${subject.bValueText}${subject.bYear != null ? ` (${subject.bYear})` : ""}. ` +
        `${subject.bothCount} shared sourced indicators; ${subject.crossedCount} ` +
        `${subject.crossedCount === 1 ? "event" : "events"} their chronicles record of each other. ` +
        `Figures compared, never graded.`,
    ),
    a("Every figure carries its publisher and observation year."),
  ];
  return {
    type: "compare",
    blocks,
    citation: citationLine(`${subject.aName} and ${subject.bName} compared`, subject.targetPath),
  };
}

export function formationCaption(subject) {
  const blocks = [
    a(`${subject.nationName}: how a nation came to be, in its chronicle's own sourced records.`),
    c(`Founding: ${subject.foundingText} — ${subject.foundingLabel}.`),
    c(subject.events.map((e) => `${e.yearText} — ${e.title}`).join("\n")),
    a("Every claim traceable to a named source."),
  ];
  return {
    type: "formation",
    blocks,
    citation: citationLine(`The Chronicle of ${subject.nationName}`, subject.targetPath),
  };
}

/** The caption spec for any subject+platform, by type. */
export function captionFor(subject, platform) {
  switch (subject.type) {
    case "on-this-day":
      return onThisDayCaption(subject, platform);
    case "ranking":
      return rankingCaption(subject, platform);
    case "commodity":
      return commodityCaption(subject, platform);
    case "compare":
      return compareCaption(subject);
    case "formation":
      return formationCaption(subject);
    default:
      throw new Error(`captionFor: unknown subject type ${subject.type}`);
  }
}

/* ── the rules, as checkable predicates (used by validate-social) ─────────── */

// Grading and contest language, banned from authored blocks. Word-bounded.
export const BANNED =
  /\b(best|worst|winner|winners|loser|losers|beats?|wins?|won|dominates?|dominant|crushe?s?|versus|vs)\b|link in bio/i;

// The committed font charset (see the subset recipe in docs/social-surface.md):
// printable ASCII, Latin-1 supplement, Latin Extended-A, the typographic set —
// plus newline. Anything else (emoji included) fails the caption.
export const CHARSET =
  /^[\x20-\x7e\u00a0-\u00ff\u0100-\u017f\u02bf\u2013\u2014\u2018\u2019\u201c\u201d\u2026\u00b7\u2022\u00b0\u2032\u2033\u2030\u2082\u20ac\u00d7\u2212\n]*$/;

export const CITATION_RE = /^Terralore, "[^"]+", terralore\.co\/[^\s]+\.$/;

export function allPoolTags() {
  return new Set([...Object.values(pool.byType).flat(), ...pool.core]);
}
