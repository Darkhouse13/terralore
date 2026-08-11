// The /rankings slug layer, client-safe on purpose: the dossier's metric
// window links each metric to its ranking page, and importing lib/rankings.ts
// there would pull every domain file into the client chunk (the same reason
// lib/commodity-meta.ts exists apart from lib/commodities.ts).
//
// The map itself is committed JSON (data/ranking-slugs.json) — an explicit,
// hand-authored decision per metric, never a runtime string transformation.
// scripts/validate-rankings.mjs enforces total coverage of the domain files,
// kebab-case, uniqueness, and the alias identity; lib/rankings.ts re-asserts
// the same invariants at build so a bad map cannot ship.

import map from "@/data/ranking-slugs.json";

const SLUGS = map.slugs as Record<string, string>;
const ALIASES = map.aliases as Record<string, string>;

/** The /rankings URL segment for a dossier metric key. Every metric has one. */
export function rankingSlug(key: string): string | undefined {
  return SLUGS[key];
}

/**
 * slug → the metric key that assembles its page. Alias keys (metrics whose
 * data is identical to another key's, e.g. society's `literacy` beside
 * education's `literacyRate`) collapse onto the key they alias, so a shared
 * slug resolves to exactly one page-owning key.
 */
export const rankingKeyBySlug: Map<string, string> = new Map(
  Object.entries(SLUGS)
    .filter(([key]) => !(key in ALIASES))
    .map(([key, slug]) => [slug, key]),
);

/** Metric keys whose page is owned by another key, and which key that is. */
export const rankingAliases: Record<string, string> = ALIASES;
