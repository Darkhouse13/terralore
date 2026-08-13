/**
 * The wordmark — TERRALORE stamped in the display face (Bricolage 800,
 * caps). The v1 serif "Terralore." with its terminal stop is retired with
 * Literata itself (docs/design/strata-deviations.md, E5): a stamped
 * formation name does not punctuate itself. This component exists for
 * masthead / lockup / signature contexts; navigation keeps plain text and
 * does not use it.
 *
 * `tone` names the ground, as on the mark. Size and tracking come from the
 * caller via `className` — the voice is fixed, the scale is contextual.
 */
export default function Wordmark({
  tone = "auto",
  className,
}: {
  tone?: "light" | "dark" | "auto";
  className?: string;
}) {
  const color =
    tone === "dark"
      ? "var(--color-bone)"
      : tone === "light"
        ? "var(--color-basalt)"
        : undefined;
  return (
    <span
      className={`font-display font-extrabold uppercase ${className ?? ""}`}
      style={color ? { color } : undefined}
    >
      Terralore
    </span>
  );
}
