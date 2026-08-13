// ── The social-card grammar — one composition for every OG surface ──────────
// v3 of the card template, in the STRATA identity (DESIGN.md v2). Every card
// shares four fixed elements:
//
//   · the ground — bone, the one page ground, solid
//   · a data-first middle: eyebrow, title, support line (the caller's content)
//   · the signature corner — the ZENITH mark (basalt, oxide dot) + the
//     TERRALORE stamp, lower right
//   · the 4px basalt rule + the strata baseline — the brand pattern as a
//     full-bleed bottom strip, seeded by the page it decorates, so every
//     card's strip is its own and every rebuild reproduces it exactly
//
// Constraints: satori renders these, so no CSS custom properties, no remote
// font, no remote image — layout, literal colour, and inline SVG only. The
// faces are the committed subsets in assets/fonts/ (built by
// scripts/build-strata-fonts.mjs) read from disk — zero fetch on the card
// path stays true.
//
// The routes stay SSG (`generateStaticParams` on the parameterised ones), so
// every card regenerates at `next build` by construction.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ZENITH_FULL } from "@/components/brand/geometry";
import { CARD } from "@/components/brand/palette";
import { strataSequence } from "@/components/brand/strata";

export const OG_SIZE = { width: 1200, height: 630 };

// The three faces, from the committed strata subsets. Ordering is
// load-bearing twice over:
//
//   · `ImageResponse` treats a `fonts` option as a REPLACEMENT for its
//     built-in default, and satori resolves un-familied text against the
//     whole list in insertion order, then fetches missing glyphs from Google
//     Fonts. Schibsted (broad Latin) rides FIRST so it is the default body
//     face; Geist rides second as the glyph backstop from the local file
//     next itself ships — every glyph resolves locally, zero fetches. If a
//     next upgrade moves the Geist file, the build fails loudly here —
//     never silently reach for the network instead.
//   · Bricolage answers only to fontFamily "Bricolage" (the stamp voice),
//     Plex Mono to "mono" (the instrument voice).
//
// Cached per worker: satori wants ArrayBuffers, and every card in a build
// shares the one read.
type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700 | 800;
  style: "normal";
};
let fontsPromise: Promise<OgFont[]> | null = null;

const toArrayBuffer = (buf: Buffer): ArrayBuffer =>
  buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;

/** ImageResponse `fonts` for every OG card — pass to the options argument. */
export function ogFonts() {
  fontsPromise ??= Promise.all([
    readFile(join(process.cwd(), "assets/fonts/schibsted-social-400.ttf")),
    readFile(join(process.cwd(), "node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf")),
    readFile(join(process.cwd(), "assets/fonts/schibsted-social-700.ttf")),
    readFile(join(process.cwd(), "assets/fonts/bricolage-social-800.ttf")),
    readFile(join(process.cwd(), "assets/fonts/plexmono-social-400.ttf")),
  ]).then(([schibsted, geist, schibsted700, bricolage, mono]) => [
    {
      name: "Schibsted",
      data: toArrayBuffer(schibsted),
      weight: 400 as const,
      style: "normal" as const,
    },
    { name: "geist", data: toArrayBuffer(geist), weight: 400 as const, style: "normal" as const },
    {
      name: "Schibsted",
      data: toArrayBuffer(schibsted700),
      weight: 700 as const,
      style: "normal" as const,
    },
    {
      name: "Bricolage",
      data: toArrayBuffer(bricolage),
      weight: 800 as const,
      style: "normal" as const,
    },
    { name: "mono", data: toArrayBuffer(mono), weight: 400 as const, style: "normal" as const },
  ]);
  return fontsPromise;
}

// The Strata palette as literals, shared by every card — the definition
// lives in components/brand/palette.ts (JSX-free) so the social pipeline's
// node renderer reads the same values this shell does.
export const OG = CARD;

/** The ZENITH mark, drawn inline for satori — full cut, basalt, oxide dot. */
export function ZenithMark({ size = 46 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96">
      <path d={ZENITH_FULL.path} fill="none" stroke={OG.chalk} strokeWidth={ZENITH_FULL.stroke} />
      <circle
        cx={ZENITH_FULL.dot.cx}
        cy={ZENITH_FULL.dot.cy}
        r={ZENITH_FULL.dot.r}
        fill={OG.copper}
      />
    </svg>
  );
}

/** The signature — mark + the TERRALORE stamp. Lower-right corner. */
export function Signature() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <ZenithMark size={46} />
      <div
        style={{
          display: "flex",
          fontFamily: "Bricolage",
          fontWeight: 800,
          fontSize: 26,
          letterSpacing: -0.5,
          color: OG.chalk,
        }}
      >
        TERRALORE
      </div>
    </div>
  );
}

/**
 * The strata baseline — the brand pattern, full-bleed at the card's bottom
 * edge. Deterministic per `seed` (the route's own slug/code): the strip is
 * part of the page's identity, not decoration that reshuffles per build.
 */
export function Baseline({ seed }: { seed: string }) {
  const blocks = strataSequence(seed, 40, 10);
  return (
    <div style={{ display: "flex", gap: 5, overflow: "hidden", width: "100%" }}>
      {blocks.map((b, i) => (
        <div
          key={i}
          style={{ width: b.width, height: 10, background: b.color, flexShrink: 0 }}
        />
      ))}
    </div>
  );
}

/**
 * The shared shell: ground, padding, the signature corner and the baseline.
 * `top` renders at the head of the card (eyebrow row); `middle` is the
 * data-first content block; `stat` sits lower-left, opposite the signature.
 */
export function OgShell({
  seed,
  top,
  middle,
  stat,
}: {
  seed: string;
  top: React.ReactNode;
  middle: React.ReactNode;
  stat: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: OG.ground,
        color: OG.chalk2,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flexGrow: 1,
          padding: "58px 76px 40px",
        }}
      >
        {top}
        {middle}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          {stat}
          <Signature />
        </div>
      </div>
      <div style={{ display: "flex", width: "100%", height: 4, background: "#221e19" }} />
      <Baseline seed={seed} />
    </div>
  );
}

/** The eyebrow row — section context in the mono-ish tracked voice. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        fontFamily: "mono",
        fontSize: 18,
        letterSpacing: 4,
        textTransform: "uppercase",
        color: OG.chalk3,
      }}
    >
      {children}
    </div>
  );
}

/** The provenance line every card carries beside its stat. */
export function SourcedLine({ children = "Every claim traceable to a source" }: { children?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontFamily: "mono",
        fontSize: 17,
        letterSpacing: 1,
        textTransform: "uppercase",
        color: OG.chalk3,
      }}
    >
      <div style={{ width: 11, height: 11, background: OG.copper }} />
      <span>{children}</span>
    </div>
  );
}
