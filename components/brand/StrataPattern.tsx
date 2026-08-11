import { strataSequence } from "./strata";

/**
 * The strata pattern — the brand's pattern device: one row of small pigment
 * blocks, the homepage time rail's grammar promoted to reusable furniture
 * (DESIGN.md, "The strata pattern"). `docs/brand/exploration-svgs/
 * strata-fault-reference.svg` is the proportion reference (block : gap ≈ 10:6,
 * one accent block); this is a pattern, never a logo.
 *
 * The sequence itself — pigments, proportions, the deterministic seeding
 * contract — lives in `./strata` (JSX-free), shared with the OG shell and the
 * social pipeline's node renderer. This file is only the page-component skin.
 *
 * Rendered as inline-styled flex divs with literal hex colours, so the same
 * component composes into satori (`ImageResponse`) as well as into the page.
 */

export { strataSequence, type StrataBlock } from "./strata";

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
