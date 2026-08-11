import { ZENITH_COMPACT, ZENITH_FULL } from "./geometry";

/**
 * The Terralore mark — ZENITH. Horizon, dome, meridians, and the copper point
 * at the zenith. Spec: DESIGN.md, "The brand mark — ZENITH".
 *
 * - `cut`: `"full"` (96 grid) for ≥ 28 px, `"compact"` (32 grid, its own
 *   heavier drawing) below; `"auto"` picks by `size`.
 * - `tone` names the ground the mark sits on: `"dark"` → chalk strokes,
 *   `"light"` → ink strokes, `"auto"` → `currentColor` (inherit).
 * - `accent`: the dot in copper. Only the full cut ever two-colours — the
 *   compact cut is one-colour by construction (a 2-unit dot cannot carry a
 *   second colour at tab size), so `accent` is ignored there.
 *
 * No hooks — safe in server components and anywhere an inline SVG renders.
 */
export default function Mark({
  size = 32,
  cut = "auto",
  tone = "auto",
  accent = true,
  className,
}: {
  size?: number;
  cut?: "full" | "compact" | "auto";
  tone?: "light" | "dark" | "auto";
  accent?: boolean;
  className?: string;
}) {
  const g = cut === "full" || (cut === "auto" && size >= 28) ? ZENITH_FULL : ZENITH_COMPACT;
  const stroke =
    tone === "dark"
      ? "var(--color-chalk)"
      : tone === "light"
        ? "var(--color-ink)"
        : "currentColor";
  const dot = accent && g === ZENITH_FULL ? "var(--color-copper)" : stroke;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${g.viewBox} ${g.viewBox}`}
      aria-hidden
      className={className}
    >
      <path d={g.path} fill="none" stroke={stroke} strokeWidth={g.stroke} />
      <circle cx={g.dot.cx} cy={g.dot.cy} r={g.dot.r} fill={dot} />
    </svg>
  );
}
