# Terralore — art direction

## Why the old look had to go

The site before this pass ran two palettes, and both are on the list of looks that
signal "generated" rather than "designed":

- The globe, dossier and journey were **navy-to-black with a brass/gold accent** —
  the default premium-dark template.
- The chronicle was **warm cream with a high-contrast serif** — the default editorial
  template.

Neither was ugly. Both were anonymous, and they did not belong to each other: the
product read as two sites stapled together at `/chronicle`. Worse, neither said
anything about the subject. A site about *how the earth was divided into nations*
was using the visual language of a fintech landing page and a Medium post.

### Rejected outright

Per the brief, these are defaults rather than choices, and any direction drifting
toward one was revised rather than defended:

| Banned | Why it is a default |
|---|---|
| Navy + gold | The incumbent. Universal "premium dark" shorthand |
| Warm cream + high-contrast serif + terracotta | The incumbent chronicle. Universal "thoughtful longform" shorthand |
| Near-black + one acid-green or vermilion accent | Universal "developer tool" shorthand |
| Broadsheet with hairline rules everywhere | Structure cosplaying as taste; rules substituting for hierarchy |

---

## The three directions considered

Each was grounded in the subject's own materials — cartography, archives, atlases,
statecraft — rather than in a design trend.

### A. STRATUM — the hypsometric atlas ✅ **chosen**

**Grounded in:** bathymetric sea charts, hypsometric tinting, geological section
drawings, sediment cores. The way a physical atlas has always drawn the world: not in
flat fills, but in **discrete bands of depth and elevation**.

**Concept:** depth is the organising idea, and it is already the product's own
structure. Terralore publishes every nation at three depths — glance, journey, read.
An atlas encodes depth as tinted bands. So the information architecture *is* the
palette, and the same device draws the ocean, the timeline and the page furniture.
Time gets the same treatment: eras are strata, laid down in layers, with deep
prehistory literally the deepest band.

**Signature element:** **the stratum rule** — a stack of tinted bands (below).

**Why it wins:** it is the only one of the three where the visual language and the
subject are the same thing. It gives the globe a treatment no other reference site
has — a sea-charted ocean rather than a dark sphere — and it supplies the journey,
the timeline and the chronicle with one shared grammar instead of three.

### B. CHANCERY — treaty paper, wax and silk

**Grounded in:** statecraft. Despatch-box porphyry, treaty vellum, wax seals and
ribbon, the moiré of flag silk, chancery hands, ledger rules.

**Tokens:** `porphyry #2A1216`, `bone #EFE9DC`, `sealwax #8C2B22`, `ribbon #3E6B57`,
`gilt-thread #C9A15C`. Display: a chancery-flavoured serif. Body: a humanist serif.
Utility: a ledger mono.

**Signature element:** the **seal** — a circular impression marking every verified
claim, with ribbon lines connecting a claim to its source.

**Why rejected:** it is the strongest idea for the *chronicle* and the weakest for
the *globe*, which is the hero. Wax seals and ribbon have nowhere to go on a sphere,
so the globe would have kept its old treatment — exactly the two-sites-stapled-together
failure this pass exists to fix. The seal motif also sits one step from kitsch, and
"verified" badges on a corpus where *everything* is verified are noise. Porphyry +
gilt is also uncomfortably close to the banned navy + gold, one hue over.

### C. TRANSIT — observatory optics

**Grounded in:** the transit circle, star charts, brass instruments, reticles,
engraved vernier scales.

**Tokens:** a violet-cool near-black, instrument brass, a cyan reticle line.

**Why rejected:** it is the incumbent wearing a hat. Cool near-black plus a warm
metallic accent is precisely what the site already did, and the reticle is a single
accent line on near-black — the third banned default. Discarded early.

---

## STRATUM — the specification

### Concept in one line

*The world drawn the way an atlas draws it: in bands of depth.*

### Palette

Every pair below is validated arithmetically by `scripts/check-contrast.mjs`, which
declares each foreground/background combination with the role it plays and fails the
build if any falls under its WCAG threshold. **The palette is proven, not eyeballed.**

#### The deep — dark surfaces (globe, journey, dossier)

Six bathymetric steps. Not navy: every step is biased toward teal-cyan, the colour of
water on a chart, never toward indigo-purple.

| Token | Hex | Role |
|---|---|---|
| `--color-depth-6` | `#04161F` | abyssal — the page ground |
| `--color-depth-5` | `#082230` | the globe's ocean base |
| `--color-depth-4` | `#0C2E3D` | panel ground |
| `--color-depth-3` | `#123B4C` | raised panel, hover |
| `--color-depth-2` | `#1B4E60` | resting borders (decorative) |
| `--color-depth-1` | `#276F80` | shoal — active borders, graticule, coastal halo |

#### The shore — light surfaces (chronicle, atlas, timeline)

**Limestone, not cream.** Cooler and greyer than the parchment it replaces
(`#EBE9E0` vs `#F3ECDD`), so it reads as chart stock and survey stone rather than as
the warm-cream editorial default.

| Token | Hex | Role |
|---|---|---|
| `--color-land-0` | `#EBE9E0` | limestone — the reading ground |
| `--color-land-1` | `#DEDACD` | raised paper, pull-quotes |
| `--color-land-2` | `#C3BEAC` | rules and edges |

#### Ink and chalk

Ink is iron-gall: near-black with a green-grey cast, never pure `#000`.

| Token | Hex | On |
|---|---|---|
| `--color-ink` | `#16201E` | limestone — 13.9:1 |
| `--color-ink-2` | `#454F4C` | limestone — 7.1:1 |
| `--color-ink-3` | `#6C7772` | limestone — 3.9:1, large text only |
| `--color-chalk` | `#E6ECEA` | the deep — 15.4:1 |
| `--color-chalk-2` | `#AFBFC1` | the deep — 9.7:1 |
| `--color-chalk-3` | `#8497A0` | the deep — 6.1:1, micro labels |

#### The ramp — three tints used semantically, not decoratively

The old palette had **one** accent (brass) doing every job, which is why data
visualisation there had no contrast to work with. Stratum has three, and each one
*means* something. This is the rule that keeps the design from becoming decoration:

| Tint | Hex (base / bright / deep) | Means |
|---|---|---|
| **Copper** | `#C87244` / `#E39A67` / `#8A4A28` | *the surveyor's hand* — you are here. Selection, the playhead, the current era, links |
| **Verdigris** | `#57A695` / `#7CC4B3` / `#2F6E62` | *the measured* — metrics, series, ranks, anything sourced from data |
| **Madder** | `#B8453B` / `#D9695E` / `#9B322A` | *rupture only* — war, catastrophe. Never used for emphasis |

If a colour choice cannot be justified by one of those three meanings, it is
decoration and it does not go in.

### Typography

Three families, chosen under a hard performance constraint. The previous system ran
**four families across five files, 230 KB, all preloaded at high priority ahead of
the LCP image** — measurably ~1.15 s of transfer on a 1.6 Mbps link before the
largest element could begin painting. Type here is a performance decision as much as
an aesthetic one.

| Role | Family | Loading |
|---|---|---|
| Display **and** reading | **Literata** | roman preloaded; italic declared separately, **not** preloaded |
| Interface | **IBM Plex Sans** | preloaded |
| Cartographic detail | **IBM Plex Mono** | **not** preloaded |

- **One serif does two jobs.** Literata was designed for long-form screen reading and
  has enough weight and structure to carry display sizes. Using it for both replaces
  Fraunces + Newsreader and removes a whole family from the critical path.
- **Plex Sans and Plex Mono are one superfamily** — shared metrics and a shared
  institutional, surveyed character that suits measured data.
- **Critical path: 2 files, not 5.** Italic and mono are used for taglines and small
  labels; a swap on either is imperceptible and neither is ever the LCP element.

#### Type scale

Fluid, `clamp()`-based, ratio ≈ 1.25 at text sizes and opening up at display.

| Step | Size | Use |
|---|---|---|
| `display-1` | `clamp(2.75rem, 6vw, 5.5rem)` | landing thesis, the journey's year |
| `display-2` | `clamp(2rem, 4.2vw, 3.5rem)` | nation name |
| `title` | `clamp(1.5rem, 2.4vw, 2.125rem)` | era titles |
| `subtitle` | `1.25rem` | event titles |
| `body` | `1rem` / `1.2rem` in prose | interface / reading |
| `small` | `0.875rem` | captions, metric labels |
| `micro` | `0.6875rem`, `0.22em` tracking, mono, uppercase | eyebrows, codes, coordinates |

### Spacing

A single 4 px base. Scale: **4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128**.
Nothing between steps. Section rhythm on reading surfaces is 64 / 96.

### Motion principles

1. **Content never fades in from `opacity: 0`.** This is a hard rule, not a
   preference — it is encoded from a measured regression. An element at `opacity: 0`
   is not LCP-eligible, which once cost the hero paragraph a 7.6 s LCP and the globe
   still a 4.8 s one. Decorative layers may fade; anything that carries meaning
   arrives at full opacity and moves instead.
2. **Movement is vertical, and it is depth.** Things rise from below — surfacing from
   a deeper stratum. Nothing slides sideways; sideways is navigation, and this product
   is about descent.
3. **Three durations.** `160 ms` state · `320 ms` panel · `900 ms` descent. No others.
4. **One easing for entrances:** `cubic-bezier(0.16, 1, 0.3, 1)`.
5. **Reduced motion removes duration, never state.** With `prefers-reduced-motion`,
   every transition collapses to ~0 but every state change still happens and every
   control still works — the journey in particular must be fully usable.

### The signature element: the stratum rule

A stack of tinted bands — a bathymetric legend, a sediment core seen in section. It
is the one device that appears on every surface, which is what makes the product feel
like one thing:

- **On the globe** — the ocean is banded, not flat: a depth ramp from the shoal at
  the coastlines out to the abyssal, with a shelf halo tracing every landmass.
- **On the timeline rail** — each era is a band, its thickness proportional to its
  span, tinted by its dominant category.
- **In the chronicle** — section dividers are a short stratum rule tinted by the era's
  category, replacing the anonymous hairline.
- **On the dossier** — the active tab sits on a stratum rule rather than a plain
  underline.
- **In the favicon and OG images** — the mark is a sphere cut in section, showing its
  bands: limestone at the surface, then copper, verdigris, shoal, and the abyssal
  below (`scripts/build-icon.mjs`).

### The globe

The globe is the hero and states the thesis in the first second: *this is an atlas.*

- **Ocean:** a bathymetric ramp — `--depth-1` at the coasts falling to `--depth-6`,
  plus a **shelf halo** offset outward from every landmass. This single detail is what
  makes it read as a sea chart rather than a dark ball.
- **Land:** limestone fill with a fine iron-gall coastline.
- **Graticule:** `--depth-2` hairlines, with the equator and prime meridian a step
  stronger — a real chart convention, and it orients the eye.
- **Limb:** a cool `--depth-1` glow. No brass halo.
- **Selection:** copper — the surveyor's hand.

Constraints preserved: the GlobeLite architecture is untouched (pure renderer +
OffscreenCanvas worker + React shell), rasterisation stays off the main thread, and
the landing chunk budget does not grow. The still (`globe-still.svg`) is regenerated
from the same palette so the handover stays invisible.

### The event-category pigments

Ten categories, drawn from the mineral and earth pigments an atlas or an illuminated
manuscript would actually have had. A different axis from the three-tint semantic
ramp — except war, which stays in the madder family because rupture is what madder
means.

| Category | Pigment | | Category | Pigment |
|---|---|---|---|---|
| Formation | `#8E6E2E` yellow ochre | | Economy & Trade | `#566F3C` terre verte |
| Independence | `#A85B2E` burnt orange | | Colonisation | `#96583B` sienna |
| War & Rupture | `#B0463C` madder | | Peoples & Migration | `#2C6C84` cerulean |
| Politics & Power | `#5464A1` indigo | | Catastrophe | `#5F6D6C` graphite |
| Religion | `#85578A` tyrian | | Culture & Ideas | `#2C7566` verdigris |

The narrow mid-dark range is a constraint, not a mannerism: a category mark appears
on **both** grounds — the journey and timeline rail on the deep, the chronicle and
theme pages on limestone — so a single value must clear 3:1 against `#04161F` *and*
`#EBE9E0`. That confines every pigment to roughly `0.116 ≤ L ≤ 0.24`. Four were
solved numerically rather than guessed.

### Quality floor (unannounced, non-negotiable)

- Responsive to **360 px** with no horizontal scroll.
- **Visible keyboard focus** on every interactive element — copper ring, 3:1 minimum.
- **`prefers-reduced-motion` respected everywhere**, with the journey fully usable.
- Touch targets **≥ 24 × 24 px** with adequate spacing.
- Contrast proven by `scripts/check-contrast.mjs`, not by eye.

### The Chanel rule

Every review pass removes one element that does not serve the direction. Removals are
logged in `PROGRESS.md` so the subtractions are as visible as the additions.
