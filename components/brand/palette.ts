/**
 * The card palette — literals for renderers outside the CSS layer (satori
 * has no custom properties). One definition, two consumers: `lib/og.tsx`
 * (the OG routes' shell, which re-exports this as `OG`) and the social
 * pipeline's node renderer (which imports it through the ts-alias loader
 * and therefore needs this file JSX-free).
 *
 * TRANSITIONAL: these are still the retired STRATUM values, deliberately
 * decoupled from the recolored BRAND literals so the committed OG/social
 * output stays byte-stable until the Phase-4 re-skin replaces this palette
 * wholesale with the Strata pigments.
 */
export const CARD = {
  copper: "#c87244",
  copperBright: "#e39a67",
  verdigris: "#7cc4b3",
  verdigrisMid: "#57a695",
  chalkHi: "#f2f6f4",
  chalk: "#e6ecea",
  chalk2: "#afbfc1",
  chalk3: "#8497a0",
  ground: "radial-gradient(120% 120% at 12% 0%, #0c2e3d 0%, #04161f 48%, #04161f 100%)",
} as const;
