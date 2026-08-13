// ── The social-card grammar — one composition for every OG surface ──────────
// v2 of the card template, in the ZENITH identity (DESIGN.md, "The brand
// mark"). Every card shares four fixed elements:
//
//   · the ground — the deep, lit from the upper left
//   · a data-first middle: eyebrow, title, support line (the caller's content)
//   · the signature corner — the ZENITH mark + "Terralore." lockup, lower right
//   · the strata baseline — the brand pattern as a full-bleed bottom strip,
//     seeded by the page it decorates, so every card's strip is its own and
//     every rebuild reproduces it exactly
//
// Constraints inherited from the routes this replaces: satori renders these,
// so no CSS custom properties, no remote font, no remote image — everything
// here is layout, literal colour, and inline SVG. The wordmark renders in
// real Literata via a committed 4 KB glyph subset (assets/fonts/, exactly
// the "Terralore." glyphs, instanced at the header's wght 420) read from
// disk — zero fetch on the card path stays true.
//
// The routes stay SSG (`generateStaticParams` on the parameterised ones), so
// every card regenerates at `next build` by construction.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ZENITH_FULL } from "@/components/brand/geometry";
import { CARD } from "@/components/brand/palette";
import { strataSequence } from "@/components/brand/strata";

export const OG_SIZE = { width: 1200, height: 630 };

// The wordmark's face. Generated once with subset-font (harfbuzz) from the
// Literata variable TTF — glyphs "Terralore." only, instanced at wght 420 /
// opsz 36 — and committed, so the build never fetches it. Regeneration is
// documented in docs/brand-codification.md.
//
// Geist must ride along, and FIRST. `ImageResponse` treats a `fonts` option
// as a REPLACEMENT for its built-in default (`options.fonts || defaultFonts`
// in @vercel/og), and satori resolves un-familied text against the whole
// list in insertion order, then fetches missing glyphs from Google Fonts.
// Proven offline: passing the 8-glyph subset alone sent every other
// character on the card to fonts.googleapis.com — the exact build-time
// network dependence these routes ban. With Geist first, body text keeps the
// default face from the local file next itself ships, the wordmark alone
// matches "Literata", every glyph resolves locally, zero fetches (verified
// with fetch stubbed to throw). If a next upgrade moves the Geist file, the
// build fails loudly here — never silently reach for the network instead.
//
// Declared weight is 400 (satori's Weight union has no 420); the subset file
// is already instanced at wght 420, so the declaration only routes matching.
// Cached per worker: satori wants ArrayBuffers, and every card in a build
// shares the one read.
type OgFont = { name: string; data: ArrayBuffer; weight: 400; style: "normal" };
let fontsPromise: Promise<OgFont[]> | null = null;

const toArrayBuffer = (buf: Buffer): ArrayBuffer =>
  buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;

/** ImageResponse `fonts` for every OG card — pass to the options argument. */
export function ogFonts() {
  fontsPromise ??= Promise.all([
    readFile(join(process.cwd(), "node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf")),
    readFile(join(process.cwd(), "assets/fonts/literata-wordmark-subset.ttf")),
  ]).then(([geist, literata]) => [
    { name: "geist", data: toArrayBuffer(geist), weight: 400 as const, style: "normal" as const },
    {
      name: "Literata",
      data: toArrayBuffer(literata),
      weight: 400 as const,
      style: "normal" as const,
    },
  ]);
  return fontsPromise;
}

// The Stratum palette as literals, shared by every card — the definition
// lives in components/brand/palette.ts (JSX-free) so the social pipeline's
// node renderer reads the same values this shell does.
export const OG = CARD;

/** The ZENITH mark, drawn inline for satori — full cut, chalk, copper dot. */
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

/** The signature — mark + "Terralore." with the copper stop. Lower-right corner. */
export function Signature() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <ZenithMark size={46} />
      <div
        style={{
          display: "flex",
          fontFamily: "Literata",
          fontSize: 30,
          color: OG.chalk,
        }}
      >
        Terralore<span style={{ color: OG.copper }}>.</span>
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
        fontSize: 19,
        letterSpacing: 6,
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
    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 19, color: OG.chalk3 }}>
      <div style={{ width: 11, height: 11, background: OG.copper, transform: "rotate(45deg)" }} />
      <span>{children}</span>
    </div>
  );
}
