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
// here is layout, literal colour, and inline SVG. The wordmark renders in the
// default face (loading Literata would put a font fetch or a build-cache
// reach on the card path); the terminal full stop carries the voice.
//
// The routes stay SSG (`generateStaticParams` on the parameterised ones), so
// every card regenerates at `next build` by construction.

import { BRAND, ZENITH_FULL } from "@/components/brand/geometry";
import { strataSequence } from "@/components/brand/StrataPattern";

export const OG_SIZE = { width: 1200, height: 630 };

// The Stratum palette as literals, shared by every card.
export const OG = {
  copper: BRAND.copper,
  copperBright: "#e39a67",
  verdigris: "#7cc4b3",
  verdigrisMid: "#57a695",
  chalkHi: "#f2f6f4",
  chalk: BRAND.chalk,
  chalk2: "#afbfc1",
  chalk3: "#8497a0",
  ground: "radial-gradient(120% 120% at 12% 0%, #0c2e3d 0%, #04161f 48%, #04161f 100%)",
} as const;

/** The ZENITH mark, drawn inline for satori — full cut, chalk, copper dot. */
export function ZenithMark({ size = 46 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96">
      <path d={ZENITH_FULL.path} fill="none" stroke={BRAND.chalk} strokeWidth={ZENITH_FULL.stroke} />
      <circle
        cx={ZENITH_FULL.dot.cx}
        cy={ZENITH_FULL.dot.cy}
        r={ZENITH_FULL.dot.r}
        fill={BRAND.copper}
      />
    </svg>
  );
}

/** The signature — mark + "Terralore." with the copper stop. Lower-right corner. */
export function Signature() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <ZenithMark size={46} />
      <div style={{ display: "flex", fontSize: 30, color: OG.chalk, letterSpacing: -0.5 }}>
        {/* satori lays the two runs out as flex items with a word gap; the
            negative margin closes the seam so the stop sits on the wordmark */}
        Terralore<span style={{ color: OG.copper, marginLeft: -7 }}>.</span>
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
