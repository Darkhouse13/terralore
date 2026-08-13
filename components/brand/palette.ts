/**
 * The card palette — literals for renderers outside the CSS layer (satori
 * has no custom properties). One definition, two consumers: `lib/og.tsx`
 * (the OG routes' shell, which re-exports this as `OG`) and the social
 * pipeline's node renderer (which imports it through the ts-alias loader
 * and therefore needs this file JSX-free).
 *
 * Strata (P3): cards stand on bone like every other surface. The KEY NAMES
 * are historical (they date from the STRATUM deep-ground cards) and are kept
 * so every card route reads the new world without churn — the mapping is:
 * chalkHi/chalk → basalt ink · chalk2 → deep umber (body) · chalk3 → umber
 * (labels) · copper* → oxide (the accent) · verdigris → oxide (stat
 * figures) · verdigrisMid → clay · ground → bone, solid.
 */
export const CARD = {
  copper: "#a64b26",
  copperBright: "#a64b26",
  verdigris: "#a64b26",
  verdigrisMid: "#c88a5c",
  chalkHi: "#221e19",
  chalk: "#221e19",
  chalk2: "#42301f",
  chalk3: "#6e4a32",
  ground: "#efe7d8",
} as const;
