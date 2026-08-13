# Terralore — art direction v2 — STRATA × SHOW THE WORK

*v2, 2026-08-13. This document is the production translation of the binding
design contract `docs/design/p3-contract.html` (the approved P3 prototype).
Where this document and the contract disagree, the contract wins — except
where a contract taboo collides with an editorial invariant
(`docs/project-state-2026-08-11.md` §5), in which case the invariant wins and
the collision is logged in `docs/design/strata-deviations.md`. The v1
direction (STRATUM — the hypsometric atlas) is retired in full; its one
surviving element is the ZENITH mark's geometry, recolored (§7). Extensions —
surfaces the prototype did not cover — are designed inside this language and
logged in the deviations doc.*

---

## 1. The direction in one line

**The earth in section.** Every page is a cut through recorded time: history
lies in beds (depth = time, down is older, always), data is pinned to the
face of the cut as specimen tags, and every observed value turns over —
physically — to show the label on its reverse: the year it was observed and
who observed it. "Show the work" is not a footer disclaimer; it is the
central interaction of the site.

The mood is a geological survey's field sheets: warm mineral paper, massive
type stamped like formation names, monospaced observation labels, 2px ink
rules cut with a straightedge. Nothing floats, nothing glows, nothing fades
behind glass. Mass, not chrome.

## 2. Palette — the seven pigments

Defined once as CSS custom properties in `app/globals.css` `@theme`. No
other color values may enter the system; a surface that seems to need an
eighth color is a design error.

| Token | Hex | Name | Role |
|---|---|---|---|
| `--color-bone` | `#EFE7D8` | Bone | the page ground — the only page ground |
| `--color-sand` | `#E2D3B8` | Sand | first bed, raised panels, specimen-tag pills |
| `--color-clay` | `#C88A5C` | Clay | second bed, warm mid-ground |
| `--color-oxide` | `#A64B26` | Oxide | the accent: links, live labels, the zenith dot, third bed |
| `--color-umber` | `#6E4A32` | Umber | secondary text on bone/sand; fourth bed |
| `--color-umber-deep` | `#42301F` | Deep umber | secondary text on clay (the contract's own text-on-clay value); fifth bed |
| `--color-basalt` | `#221E19` | Basalt | ink: primary text, every rule, flip reverses, the core sample |
| `--color-absent` | `#B8AC97` | Absent | one job only: the hatch stroke of the not-observed mark |

Text-on-bed pairs (all clear WCAG AA at their sizes, proven by
`scripts/check-contrast-strata.mjs`):

- on **bone / sand**: basalt primary, umber secondary, oxide accent
- on **clay**: basalt primary, deep-umber secondary
- on **oxide / umber / basalt**: bone primary, sand secondary, clay for the
  "method:" voice on basalt reverses

**Dark surfaces are geology, not UI.** Basalt appears as the reverse of a
flipped specimen, as the extracted core sample, and as bed five of a deep
stack — always as *material*, entered and left by a physical gesture, never
as a page theme. There is no dark mode.

## 3. Type — the three faces

Self-hosted subsets only (committed in `assets/fonts/`, built by
`scripts/build-strata-fonts.mjs`; loaded via `next/font/local` in
`app/fonts.ts`). **No runtime Google Fonts anywhere — house rule.** The
satori/OG twins of the faces are static TTF instances from the same script.

| Face | File(s) | Voice | Rules |
|---|---|---|---|
| **Bricolage Grotesque 800** | `bricolage-display.woff2` (opsz variable, wght pinned 800) | display — formation names | ALL CAPS for stamps and bed titles; line-height 0.95–1.0; never below 16px; never for running prose |
| **Schibsted Grotesk 400/500/700** | `schibsted-body.woff2` (variable) | body — the reader's voice | sentence case; 1.5–1.6 line-height in prose; 500 for emphasis rows |
| **IBM Plex Mono 400/500** | `plexmono-400/500.woff2` | data — the instrument's voice | every number, code, year, coordinate, eyebrow and observation label; letter-spacing 0.08–0.16em on eyebrows |

The rule of voices: **if a human wrote it, Schibsted; if the archive named
it, Bricolage; if an instrument measured it, Plex Mono.** A number set in
the body face is a defect.

### Type scale (from the contract, extended to desktop)

| Step | px (mobile / desktop) | Face | Use |
|---|---|---|---|
| stamp | 56 / 96 | Bricolage 800 | TERRA/LORE, nation names on their own page |
| title | 42–52 / 64–72 | Bricolage 800 | page titles (ranking, commodity, compare) |
| bed | 25 / 28 | Bricolage 800 | home beds, section titles |
| seam | 17 / 19 | Bricolage 800 | era-bed headers, card titles |
| body | 15 / 16 | Schibsted 400 | prose |
| row | 14.5 / 15 | Schibsted 400/500 | list and table rows |
| data | 12.5–13 / 13–14 | Plex Mono 400 | values in rows |
| label | 10–11 / 10–11 | Plex Mono 400/500 | eyebrows, observation lines, counts |
| fine | 9–9.5 / 9–10 | Plex Mono 400 | REFS marks, core legend |

## 4. Motion — the physics table

One curve for everything: **the mass curve `cubic-bezier(.32,.72,0,1)`** —
things move like stone coming to rest, fast out of the hand and dead-stopped.
No bounce, no overshoot, no ease-in-out.

| Gesture | Spec |
|---|---|
| **bed-settle** | entrance: `translateY(24px)→0` + fade, 380ms mass curve, staggered **bottom-up, oldest first**, ~80ms apart |
| **overture** | the front door's once-per-session opening: beds settle staggered, 2px basalt rules draw in 240ms as beds lock, TERRA/LORE stamps in, the oxide zenith dot arrives last; **≤1.1s total, then total stillness**. `sessionStorage` skips replay; `prefers-reduced-motion` gets the settled state instantly |
| **proof-flip** | 320ms mass curve, `rotateX(180deg)` — a specimen turned over on a table, not a page turned in a book. Fires on press, returns on release. Reverse is basalt with the observation label engraved: `OBSERVED <year> · <src> — <org>` + `method:` line. An explicit "PROOF VIEW ⟲" control flips a whole surface at once |
| **core-pull** | pull down on a nation header: 0.5× resistance, commit at 90px, 460ms extraction/return on the mass curve. The header owns the gesture (pointer capture, `touch-action:none` on the header only) so it never fights scroll or pull-to-refresh; it arms only at `scrollY ≤ 4` |
| **press** | every pressable surface depresses 2px in 90ms; release restores. This is the only hover/press feedback — no color washes, no shadows |
| **parallax** | ±6px maximum, CSS-only (no scroll listeners); decorative layers only |

**Zero continuous animation at idle.** Nothing loops, nothing pulses,
nothing auto-plays. After the overture the page is still until touched.
`prefers-reduced-motion`: every entry in this table collapses to its settled
end state; the proof-flip swaps faces without rotating.

## 5. The absence mark

Missing data is a first-class typographic object, never an empty cell:

- the hatch: `repeating-linear-gradient(45deg, var(--color-absent) 0 3px, var(--color-bone) 3px 7px)`,
  carrying the mono label `NOT OBSERVED`
- **a gap has no underside** — the mark does not flip; there is nothing to
  turn over, and the surface says so in plain language where gaps cluster
- absence is stated, never zeroed; unranked nations are named, not dropped
  (invariant §5.5 — the contract and the invariants agree here)

## 6. Taboos (refusals, not preferences)

1. **No dark UI.** Basalt is material (§2), never a page theme.
2. **No hairlines.** A rule is **2px basalt** or it is absent. No 1px
   borders, no 50%-opacity dividers.
3. **No transparency, no blur.** Every surface is opaque pigment. No
   glassmorphism, no `backdrop-filter`, no rgba washes.
4. **No rounded-app corners.** Blocks are cut square. The one sanctioned
   radius is the **specimen pill** (the small year+source tag, radius 9px) —
   it reads as a tag riveted to the face, per the prototype itself.
5. **No chart without its source.** Any drawn quantity carries its
   observation year and source id within the same component, or it is not
   drawn.
6. **No shadows, no gradients** except the absence hatch (a pattern, not a
   gradient wash).
7. **No emoji in any rendered artifact** (cards ban them by font
   construction; UI copy bans them by rule).

## 7. The ZENITH mark, recolored

Geometry is **frozen** exactly as codified in v1
(`components/brand/geometry.ts`, `docs/brand/exploration-svgs/`): horizon
overshooting the dome, meridians to the crown, the zenith dot. The 96-grid
primary and 32-grid compact cuts, minimum sizes, clearspace (= dome height /
2) and misuse rules all carry over unchanged.

Only the colors move to the new world:

| Context | Strokes | Dot |
|---|---|---|
| on bone / sand (the normal case) | basalt | **oxide** |
| on basalt / oxide / umber (dark material) | bone | oxide on umber/basalt; bone on oxide (the dot must not vanish into its own ground) |
| one-colour contexts | drawing color | drawing color (never omitted) |

Favicons, manifest, `theme-color`, and the JSON-LD logo all follow: the
raster plates are **basalt on bone** with the oxide dot; `theme-color` is
bone `#EFE7D8`; the adaptive SVG favicon draws basalt by default, bone under
`prefers-color-scheme: dark`.

**The wordmark** moves to the display face: `TERRALORE` set in Bricolage 800
(caps, tight), stamped, with no terminal stop — the stop belonged to the
serif voice, and a stamp does not punctuate itself. Signature contexts pair
the stamp with the mark; navigation keeps plain text. (Deviation from v1
logged.)

## 8. Structural grammar

- **Beds**: full-bleed horizontal bands separated by 2px basalt rules; bed
  order encodes age (down = older) wherever content is temporal. Bed
  backgrounds walk the palette in stratigraphic order:
  bone → sand → clay → oxide → umber → basalt.
- **The section cut**: world navigation. Continents are beds, nations are
  seams within a bed. SSG/SVG/CSS only — no canvas, no WebGL, no runtime
  globe.
- **The specimen tag**: a value + its pill (`'24 S-01`) in a row; press to
  flip. Universal across dossier, rankings, compares, commodities.
- **The core sample**: a nation's whole history compressed to one column of
  bands, thickness ∝ recorded events; extracted by the core-pull; tap a band
  to land in its era. Legend: `BAND THICKNESS ∝ RECORDED EVENTS · DEPTH = TIME`.
- **Section rhythm**: content sits in 20px side gutters on mobile; desktop
  centers a measured column (~720px reading, up to 1120px for tables) with
  the beds themselves always full-bleed.
- **Category pigments**: the ten event-category pigments of v1 are retained
  unchanged as *data encoding* (they are mineral pigments already, and they
  clear contrast on bone) — logged as a fusion decision in the deviations
  doc.

## 9. Quality floor (unannounced, non-negotiable)

- Responsive to **360px** with no horizontal scroll.
- Visible keyboard focus on every interactive element — **2px oxide ring**
  (offset 2px; the focus ring is exempt from the hairline taboo's "or
  absent" only in the sense that it must exist).
- `prefers-reduced-motion` respected everywhere (§4).
- Touch targets ≥ 24×24px; press-holds suppress text selection and context
  menu; `touch-action` is surgical, never global.
- Contrast proven arithmetically by `scripts/check-contrast-strata.mjs`,
  never by eye.
- Lighthouse mobile ≥ 95 performance and ≥ 95 accessibility on every
  surface class.
- Zero continuous rAF/animation loops at idle.

## 10. The Chanel rule (carried over)

Every review pass removes one element that does not serve the direction.
Removals are logged in `docs/design/strata-deviations.md` alongside the
extensions, so the subtractions stay as visible as the additions.
