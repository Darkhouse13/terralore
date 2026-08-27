import localFont from "next/font/local";

/* ── The three faces — self-hosted subsets, no runtime Google Fonts ─────────
   Committed files in assets/fonts/, built by scripts/build-strata-fonts.mjs
   from the OFL sources (regeneration recipe in that script's header). The
   satori/OG pipeline has its own static TTF instances of the same faces —
   a display-face change here must be mirrored there (Phase-4 wiring in
   lib/og.tsx and scripts/lib/social/fonts.mjs).

   Loading strategy, measured not preferred:

     Bricolage Grotesque  display. ONE file, wght pinned to the contract's
                          only display weight (800); the opsz axis is kept
                          variable so browsers apply optical sizing from
                          17px bed headers to the 96px stamp. Preloaded —
                          the stamp is above the fold on every surface.

     Schibsted Grotesk    body, variable wght 400–700. Preloaded: prose and
                          row text swap late otherwise, and on dense tables
                          the late swap measured CLS 0.089 — worse than the
                          ~250ms of LCP the preload costs.

     IBM Plex Mono        data: values, years, codes, eyebrows. Preloaded
                          since 2026-08-27: "small labels, imperceptible
                          swap" was measured false — the chronicle masthead
                          concentrates enough mono text (eyebrows, quick
                          facts, the verification line) that the swap
                          reflowed the header at CLS 0.309 on mobile,
                          single-handedly dragging the route to Lighthouse
                          81 against the ≥95 floor.

   `display: "swap"` throughout — text is readable immediately in the
   fallback, never blocked on a webfont. */

export const bricolage = localFont({
  src: "../assets/fonts/bricolage-display.woff2",
  variable: "--ff-display",
  display: "swap",
  weight: "800",
});

export const schibsted = localFont({
  src: "../assets/fonts/schibsted-body.woff2",
  variable: "--ff-sans",
  display: "swap",
  weight: "400 700",
});

export const plexMono = localFont({
  src: [
    { path: "../assets/fonts/plexmono-400.woff2", weight: "400" },
    { path: "../assets/fonts/plexmono-500.woff2", weight: "500" },
  ],
  variable: "--ff-mono",
  display: "swap",
});
