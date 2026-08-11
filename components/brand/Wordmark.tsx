/**
 * The wordmark — "Terralore." in the display serif, and the terminal full stop
 * is not optional: this component exists for masthead / lockup / signature
 * contexts, where the stop is the brand's voice (DESIGN.md, "The wordmark").
 * Navigation (breadcrumbs, link text) is not such a context and keeps plain
 * text — it does not use this component.
 *
 * `tone` names the ground, as on the mark. The stop takes copper in accent
 * contexts and the text colour otherwise. Size and tracking come from the
 * caller via `className` — the voice is fixed, the scale is contextual.
 */
export default function Wordmark({
  tone = "auto",
  accent = true,
  className,
}: {
  tone?: "light" | "dark" | "auto";
  accent?: boolean;
  className?: string;
}) {
  const color =
    tone === "dark"
      ? "var(--color-chalk)"
      : tone === "light"
        ? "var(--color-ink)"
        : undefined;
  return (
    <span className={`font-display ${className ?? ""}`} style={color ? { color } : undefined}>
      Terralore
      <span style={accent ? { color: "var(--color-copper)" } : undefined}>.</span>
    </span>
  );
}
