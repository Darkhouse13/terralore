import { CATEGORY_META, type EventCategory } from "@/lib/types";

/**
 * The strata sequence — the brand pattern's data, JSX-free so every renderer
 * can share it: `StrataPattern` (the page component), `lib/og.tsx` (the OG
 * baseline strip), and the social pipeline's node renderer, which imports
 * this module through the ts-alias loader and therefore must find no JSX in
 * it. Proportions and rules are the ones DESIGN.md codifies: blocks draw only
 * from the ten event-category pigments, widths 2.6–4.8× height, colours never
 * repeat adjacently, at most one block takes copper.
 *
 * **Deterministic by contract.** Seeded by the surface it decorates through
 * FNV-1a → mulberry32 — two renders of one surface are pixel-identical, and a
 * rebuild cannot reshuffle a published card. `Math.random` must never enter
 * this file.
 */

const PIGMENTS = (Object.keys(CATEGORY_META) as EventCategory[]).map(
  (k) => CATEGORY_META[k].tint,
);

/** FNV-1a, folded to 32 bits — stable across platforms and builds. */
export function seedFrom(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** The house PRNG — every deterministic brand/editorial sequence draws from it. */
export function mulberry32(a: number): () => number {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface StrataBlock {
  color: string;
  width: number;
}

/**
 * The sequence alone, for callers that draw their own blocks (the card
 * templates size in card pixels). Widths are multiples of `height` in the
 * reference's proportion range; colours never repeat adjacently.
 */
export function strataSequence(seed: string, blocks: number, height: number): StrataBlock[] {
  const rand = mulberry32(seedFrom(seed));
  const seq: StrataBlock[] = [];
  let prev = -1;
  for (let i = 0; i < blocks; i++) {
    let p = Math.floor(rand() * PIGMENTS.length);
    if (p === prev) p = (p + 1) % PIGMENTS.length;
    prev = p;
    // The fault reference draws blocks 2.6–4.8× their height.
    seq.push({ color: PIGMENTS[p], width: Math.round(height * (2.6 + rand() * 2.2)) });
  }
  const accentAt = Math.floor(rand() * blocks);
  // The strip's one accent block is oxide — the Strata accent.
  seq[accentAt] = { ...seq[accentAt], color: "#a64b26" };
  return seq;
}
