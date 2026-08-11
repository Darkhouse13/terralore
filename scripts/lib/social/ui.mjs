// ── The ZENITH card grammar as satori element trees, JSX-free ──────────────
// The node-side twin of lib/og.tsx's shell: same four fixed elements — the
// deep ground lit from the upper left, a data-first middle, the signature
// corner, the strata baseline seeded by the surface's own identity. Geometry,
// palette and the strata sequence are IMPORTED from the same pure modules the
// OG shell reads (components/brand/{geometry,palette,strata}.ts, via the
// ts-alias loader), so this file holds layout only — no twin copies of brand
// data. Every script using this must run under:
//
//   node --import ./scripts/lib/ts-alias-loader.mjs <script>
//
// Type hierarchy (docs/brand-codification.md placement contract, applied):
// Literata for display and reading, IBM Plex Mono for cartographic detail
// (eyebrows, years, codes, source lines). Nation flags are emoji and emoji
// require a network fetch, so flags never appear on cards — nations carry
// their name, with the ADM0_A3 code in the mono voice where a mark is needed.

import { BRAND, ZENITH_FULL } from "@/components/brand/geometry";
import { CARD } from "@/components/brand/palette";
import { strataSequence } from "@/components/brand/strata";

export { BRAND, CARD };

/** createElement for satori — no JSX in scripts, trees are plain objects. */
export function h(type, props = {}, ...children) {
  const kids = children.flat().filter((c) => c != null && c !== false);
  return {
    type,
    key: null,
    props: { ...props, children: kids.length === 0 ? undefined : kids.length === 1 ? kids[0] : kids },
  };
}

/** The ZENITH mark — full cut, chalk strokes, copper dot (lib/og.tsx twin). */
export function zenithMark(size = 46) {
  return h(
    "svg",
    { width: size, height: size, viewBox: "0 0 96 96" },
    h("path", { d: ZENITH_FULL.path, fill: "none", stroke: BRAND.chalk, strokeWidth: ZENITH_FULL.stroke }),
    h("circle", { cx: ZENITH_FULL.dot.cx, cy: ZENITH_FULL.dot.cy, r: ZENITH_FULL.dot.r, fill: BRAND.copper }),
  );
}

/** The signature — mark + "Terralore." with the copper stop, lower right. */
export function signature(scale = 1) {
  return h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: 16 * scale } },
    zenithMark(46 * scale),
    h(
      "div",
      { style: { display: "flex", fontFamily: "Literata", fontSize: 30 * scale, color: CARD.chalk } },
      "Terralore",
      h("span", { style: { color: CARD.copper } }, "."),
    ),
  );
}

/** The strata baseline — full-bleed bottom strip, deterministic per seed. */
export function baseline(seed, { blocks = 40, height = 12 } = {}) {
  const seq = strataSequence(seed, blocks, height);
  return h(
    "div",
    { style: { display: "flex", gap: Math.round(height / 2), overflow: "hidden", width: "100%" } },
    seq.map((b) => h("div", { style: { width: b.width, height, background: b.color, flexShrink: 0 } })),
  );
}

/** The eyebrow — section context in the mono tracked voice. */
export function eyebrow(text, { size = 24, color = CARD.chalk3 } = {}) {
  return h(
    "div",
    {
      style: {
        display: "flex",
        fontFamily: "mono",
        fontSize: size,
        letterSpacing: Math.round(size / 4),
        textTransform: "uppercase",
        color,
      },
    },
    text,
  );
}

/** The provenance line every card carries — copper lozenge + mono text. */
export function sourcedLine(text = "Every claim traceable to a source", { size = 22 } = {}) {
  return h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: 12, fontSize: size, fontFamily: "mono", color: CARD.chalk3 } },
    h("div", {
      style: {
        width: Math.round(size / 2),
        height: Math.round(size / 2),
        background: CARD.copper,
        transform: "rotate(45deg)",
        flexShrink: 0,
      },
    }),
    h("span", {}, text),
  );
}

/**
 * The shared shell. `format` = { width, height, pad } — the composition's
 * pixel frame. `top` at the head, `middle` grows, `stat` sits lower-left
 * opposite the signature; the baseline is full-bleed at the bottom edge.
 */
export function shell({ seed, top, middle, stat, format, signatureScale = 1.25 }) {
  const { pad } = format;
  return h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: CARD.ground,
        color: CARD.chalk2,
      },
    },
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flexGrow: 1,
          padding: `${pad.top}px ${pad.x}px ${pad.bottom}px`,
        },
      },
      top,
      middle,
      h(
        "div",
        { style: { display: "flex", alignItems: "flex-end", justifyContent: "space-between" } },
        // The stat may never crowd the signature's clearspace — cap its share
        // of the row (compositions also clamp their source lines to length).
        h("div", { style: { display: "flex", maxWidth: "62%" } }, stat),
        signature(signatureScale),
      ),
    ),
    baseline(seed),
  );
}

/** Clamp text to a word boundary — same shape as lib/seo.ts clampText. */
export function clamp(s, max) {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const at = cut.lastIndexOf(" ");
  return `${(at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[\s,;:—-]+$/, "")}…`;
}

/** The two static formats. Carousel slides share VERTICAL's frame. */
export const FORMATS = {
  pin: { key: "pin", width: 1000, height: 1500, pad: { top: 72, x: 76, bottom: 48 } },
  vertical: { key: "vertical", width: 1080, height: 1350, pad: { top: 64, x: 80, bottom: 46 } },
};
