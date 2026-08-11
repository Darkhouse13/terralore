# Brand codification — what was built, and how to use it

*2026-08-11. The design decision predates this pass; this records its
systematization. The normative spec is DESIGN.md, "The brand mark — ZENITH" —
this document is the practitioner's map: where everything lives, what was
decided along the way, and how to put the mark on a surface that does not
exist yet. The social pipeline should treat the placement rules here as its
contract.*

## The pieces

| Piece | Where | What it is |
|---|---|---|
| Geometry (frozen) | `components/brand/geometry.ts` | The two ZENITH cuts as data (path, stroke, dot) + the brand colours as literals. Twin copy in `scripts/build-icon.mjs` (node cannot import TS); if one ever changes — it should not — change both. |
| Source of truth | `docs/brand/exploration-svgs/` | `zenith-primary.svg` (96 grid), `zenith-favicon-32.svg` (32 grid), `strata-fault-reference.svg` (pattern proportions only). Extracted verbatim from the exploration; exploration hexes retained there as the historical record. |
| Mark | `components/brand/Mark.tsx` | `<Mark size cut tone accent />`. No hooks; server-safe. |
| Wordmark | `components/brand/Wordmark.tsx` | "Terralore." in Literata, copper stop in accent contexts. Exists *only* for masthead/lockup/signature contexts — navigation keeps plain text. |
| Pattern | `components/brand/StrataPattern.tsx` | Seeded pigment-block strip + exported `strataSequence()` for callers that draw their own blocks (the OG template does). |
| OG grammar | `lib/og.tsx` | `OgShell` + `Signature` + `Baseline` + `Eyebrow` + `SourcedLine` — the one composition all social cards share. |
| Icon pipeline | `scripts/build-icon.mjs` | Regenerates every icon form; chained into `npm run build-data`. |
| Head/JSON-LD | `app/layout.tsx` (viewport theme-color), `app/manifest.ts`, `lib/seo.ts` (`publisher.logo`) | All agree on depth-6 as the ground and `/icon1.png` as the raster logo. |

## Token mapping (decided, not to be revisited)

The exploration was drawn in its own hexes; production renders in Stratum
tokens. Nearest-token mapping, chosen over introducing new values:

| Exploration | → | Token | Value | Note |
|---|---|---|---|---|
| `#F2EAD9` cream | → | `--color-chalk` | `#E6ECEA` | mark/wordmark on the deep |
| `#C75B28` orange | → | `--color-copper` | `#C87244` | the zenith dot; semantically exact — copper is "the surveyor's hand", and the dot is the identity's you-are-here |
| `#171511` / `#16263D` ink, navy | → | `--color-ink` | `#16201E` | mark/wordmark on limestone |
| `#0F1B2D` / `#16263D` navy grounds | → | `--color-depth-6` | `#04161F` | the ground everywhere: theme-color, manifest, icon plates, OG cards |

One interpretation call, recorded: the mission's one-colour rule said the dot
"drops to ground colour"; the exploration's own one-colour forms draw the dot
in the mark's **drawing colour** (`currentColor`), which is what was codified —
a dot in the literal ground colour would be invisible.

## Judgment calls made in this pass

- **Next conventions over raw `public/` links.** The favicon set lives where
  this codebase already wires the head: `app/favicon.ico`, `app/icon0.svg`,
  `app/icon1.png`, `app/apple-icon.png` (auto-linked by Next), plus
  `public/icon-192/512.png` behind `app/manifest.ts` (served at
  `/manifest.webmanifest`). `.gitignore` negations were extended — the global
  `*.png` ignore has silently dropped icons before.
- **The SVG favicon is theme-adaptive**, ink by default and chalk under
  `prefers-color-scheme: dark`. Rasters cannot media-query, so the ICO and all
  PNG forms carry their own depth-6 ground.
- **No lockup SVG asset was cut yet.** The rule is codified (outlined paths,
  no live text — an exported asset must not depend on a font install), but
  outlining Literata needs a font-to-path step (e.g. opentype.js) this repo
  does not carry. When the social pipeline needs a standalone lockup file,
  add that step; do not export a lockup with a `<text>` element.
- **The OG wordmark renders in real Literata via a committed glyph subset**
  (`assets/fonts/literata-wordmark-subset.ttf`, ~4 KB): exactly the
  "Terralore." glyphs, instanced at wght 420 / opsz 36 with `subset-font`
  (harfbuzz) from the Literata variable TTF (google/fonts, OFL). Regenerate
  only if the wordmark's glyph set ever changes:
  `subsetFont(literataVarTtf, "Terralore.", { targetFormat: "sfnt",
  variationAxes: { wght: 420, opsz: 36 } })`.
  **Gotcha, proven offline:** `ImageResponse`'s `fonts` option *replaces* the
  built-in Geist rather than extending it, and satori then fetches every glyph
  the provided fonts lack from fonts.googleapis.com — a silent network
  dependence on the card path. `ogFonts()` in `lib/og.tsx` therefore ships
  Geist (read from next's own compiled @vercel/og directory) first and the
  Literata subset second; body text keeps the default face, only
  `fontFamily: "Literata"` reaches the subset, and a fetch-stubbed render
  confirms zero network calls.
- **Breadcrumbs keep plain "Terralore"** (no stop): navigation is not a
  signature context, and a stop inside a breadcrumb trail reads as punctuation.

## Placing the mark on a new surface

1. **Ground first.** The mark stands on depth-6 or limestone. Anything else
   needs a plate of one of those two behind it (DESIGN.md misuse list).
2. **Pick the cut by rendered size.** ≥ 28 px → `cut="full"`; 14–28 px →
   `cut="compact"`; below 14 px the mark does not appear. `cut="auto"` does
   this for you from `size`.
3. **Tone names the ground**, not the mark: `tone="dark"` on the deep (chalk
   strokes), `tone="light"` on limestone (ink strokes), `tone="auto"` inherits
   `currentColor`.
4. **Accent:** the copper dot is on by default in the full cut and never
   exists in the compact cut. Turn it off (`accent={false}`) only in genuinely
   one-colour contexts (an engraving, a watermark).
5. **Clearspace** = half the dome height — 16 units in the 96 grid, i.e. ⅙ of
   the mark's rendered height on every side. In a lockup, the gap to the
   wordmark *is* the clearspace, wordmark baseline on the horizon.
6. **The wordmark comes with its stop.** If a surface is a masthead, a lockup
   or a signature, use `Wordmark` (or its OG equivalent) — never a bare styled
   "Terralore" string.
7. **The strata strip is furniture.** Seed it with the surface's own identity
   (slug, code) so renders are reproducible; one row in UI; never inside the
   mark's clearspace; never as a substitute for the mark.

## Building a new social-card surface

Compose `OgShell` from `lib/og.tsx` and give it: `seed` (the route's slug —
this keys the baseline strip), `top` (an `Eyebrow` naming the section),
`middle` (the data-first content), `stat` (a figure the page can stand behind,
plus `SourcedLine`). The signature corner and baseline arrive with the shell.
Keep the route SSG (`generateStaticParams` if parameterised); never load a
remote font or image inside an `ImageResponse` — a satori fetch is a build
that can fail for reasons unrelated to the code.

## Verification artefacts

`design-review/13-brand/`: header at desktop and 360 px, the three OG surfaces
(site, FRA, copper). `design-review/icon-16px-proof.png` (tab legibility),
`design-review/avatar-96px-proof.png` (circular crop). Regenerate icons with
`node scripts/build-icon.mjs`; cards regenerate at every `next build` by
construction.
