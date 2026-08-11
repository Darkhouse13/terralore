import { CATEGORY_META, type EventCategory } from "@/lib/types";
import { BRAND } from "./geometry";

/**
 * The strata pattern — the brand's pattern device: one row of small pigment
 * blocks, the homepage time rail's grammar promoted to reusable furniture
 * (DESIGN.md, "The strata pattern"). `docs/brand/exploration-svgs/
 * strata-fault-reference.svg` is the proportion reference (block : gap ≈ 10:6,
 * one accent block); this is a pattern, never a logo.
 *
 * **Deterministic by contract.** The sequence is seeded by the surface it
 * decorates (a page slug, a nation code) through a mulberry32 PRNG — two
 * renders of one page are pixel-identical, and a rebuild cannot reshuffle a
 * published card. `Math.random` must never enter this file.
 *
 * Blocks draw only from the ten event-category pigments; at most one block
 * takes copper. Rendered as inline-styled flex divs with literal hex colours,
 * so the same component composes into satori (`ImageResponse`) for the OG
 * baseline strip as well as into the page.
 */

const PIGMENTS = (Object.keys(CATEGORY_META) as EventCategory[]).map(
  (k) => CATEGORY_META[k].tint,
);

function seedFrom(s: string): number {
  // FNV-1a, folded to 32 bits — stable across platforms and builds.
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function mulberry32(a: number): () => number {
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
 * The sequence alone, for callers that draw their own blocks (the OG template
 * sizes in card pixels). Widths are multiples of `height` in the reference's
 * proportion range; colours never repeat adjacently.
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
  seq[accentAt] = { ...seq[accentAt], color: BRAND.copper };
  return seq;
}

export default function StrataPattern({
  seed,
  blocks = 24,
  height = 6,
  gap = 3,
  opacity = 1,
  className,
  style,
}: {
  /** What this strip decorates — a slug, a code. Same seed, same strip. */
  seed: string;
  blocks?: number;
  height?: number;
  gap?: number;
  opacity?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const seq = strataSequence(seed, blocks, height);
  return (
    <div
      aria-hidden
      className={className}
      style={{ display: "flex", gap, overflow: "hidden", opacity, ...style }}
    >
      {seq.map((b, i) => (
        <div
          key={i}
          style={{
            width: b.width,
            height,
            background: b.color,
            borderRadius: 1,
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}
