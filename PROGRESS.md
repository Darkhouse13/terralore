# Progress log

Phase-by-phase record of the Identity / Experience / Discoverability mission.
Each entry states what changed, what it was verified against, and what it left open.

---

## Baseline (before any work)

Measured against a clean production build of `f2b1445`:

| Check | Result |
|---|---|
| `npm run validate` | ✅ 0 errors — 183 history files, 6 domain files |
| `npx tsc --noEmit` | ✅ clean |
| `npm run build` | ✅ 1,054 static routes |
| Corpus | 184 nations, 1,085 eras, 4,471 events, 3,600 references, ~630k words |
| Sitemap | 1,054 URLs |
| CI | ❌ none |
| Page audit | ❌ none existed |

The corpus and the build were already sound. What was missing was any mechanical
guard on them, and any evidence about the *pages* as opposed to the data.

---

## Phase A — Trust & hygiene

### A1. Post-build page audit (`scripts/audit-pages.mjs`)

Written first, deliberately, because every later phase needed something to be
measured against. It crawls every URL in the sitemap on a running production server
and asserts seven things a build cannot catch:

1. 200 OK · 2. exactly one `<h1>` · 3. unique `<title>` · 4. present, unique meta
description · 5. JSON-LD that parses and carries `@type` + `@context` ·
6. self-referential canonical · 7. no orphans (every URL linked from another).

Runs the full 1,054 pages in ~3 seconds at concurrency 12.

**First run found real defects, on a site that built cleanly:**

| Defect | Count |
|---|---|
| Duplicate meta description — `/chronicle` and `/history` both emit `history.summary` verbatim | 184 |
| Meta descriptions far over the ~160-char budget (country pages ran 482–1,731 chars; the whole `summary` was being used as the description) | 184 |
| Theme/period descriptions over budget (176–254 chars) | ~370 |
| `/atlas` emits no JSON-LD at all | 1 |

No non-200s, no orphans, no duplicate titles, and every page had exactly one `<h1>` —
the structural work was already right. The metadata work was not. These are logged
here as the Phase D worklist rather than fixed now, so the fix and its verification
land together.

### A2. CI gate (`.github/workflows/ci.yml`)

`npm ci` → validate → `tsc --noEmit` → lint → build → start server → audit every
sitemap URL → upload the report. Pinned to Node 22 to match `node:22-alpine` in the
Dockerfile, so a build that passes CI cannot fail in the production image.
Citation integrity is now mechanically enforced on every push, not by convention.

### A3. Dead dependencies removed

`three`, `@types/three` and `react-globe.gl` were still installed although the globe
had already been rewritten as GlobeLite (canvas + OffscreenCanvas worker, no WebGL).
`components/GlobeScene.tsx` was the only file importing them, and nothing imported it
— it was being kept as a reference. Deleted; the retired implementation remains in
git history, which is the right place for it.

Runtime dependencies are now exactly four: `next`, `react`, `react-dom`, `motion`.

### A4. Documentation made accurate

- **`README.md`** rewritten. The old one described a "3D antique-atlas globe" built on
  react-globe.gl — an implementation that no longer existed — and quoted a 556-URL
  sitemap against an actual 1,054. Now documents the real GlobeLite architecture, the
  real four-dependency stack, verified corpus figures, and the audit/validate workflow.
- **`PLAN.md`** replaced. Its milestones were all complete; it now holds this mission.
- **`package.json`** renamed `new_project` → `terralore`. Added `refresh-domains`,
  `audit:pages`, `build-og` and a `ci` script that mirrors the pipeline.
- **`docs/refresh-domains.md`** written: the runbook, why builder order matters
  (`build-data` writes the country list every domain builder reconciles against), and
  what to look for in the diff — a metric that went to `null`, a value that swung on a
  rebasing, a changed source label.

### A5. Data vintage made visible

The vintage existed only in a sentence of italic prose at the bottom of the dossier
footer, which is close to not stating it. It is now a monospace stamp in the accent
colour, above the citations it summarises:

> `Data: World Bank WDI · ITU · UNESCO Institute for Statistics · SIPRI — 2026-06 vintage`

Publishers are de-duplicated across the "X / World Bank" redistribution pairs, so the
line names who *originated* the data rather than repeating the redistributor four
times. Derived from the `updated` field each builder writes, so it moves on its own.

**Verified:** `tsc --noEmit` clean · `npm run lint` clean · validators 0 errors.

---

## Phase B — Identity: STRATUM

Three art directions were developed against the subject's own materials, two
rejected, and the reasoning is in `DESIGN.md`. The short version: the old site ran
**two** palettes and both are named defaults — navy+gold on the globe/dossier/journey,
warm-cream + high-contrast serif on the chronicle. It read as two sites stapled
together at `/chronicle`, and neither half said anything about the subject.

**STRATUM** — *the world drawn the way an atlas draws it: in bands of depth.* Depth is
already the product's own structure (glance → journey → read), and an atlas encodes
depth as tinted bands, so the information architecture and the palette became the same
thing. Rejected: CHANCERY (treaty paper and wax — strongest for the chronicle, weakest
for the globe, which is the hero) and TRANSIT (observatory optics — the incumbent
wearing a hat).

### B1. The palette is proven, not eyeballed

`scripts/check-contrast.mjs` declares every foreground/background pair the system uses
**with the role it plays**, and fails if any falls under its WCAG threshold. It found
three real problems at design time — a rupture red at 4.43:1 against limestone, a
panel border at 2.02:1, an over-pale rule — before a single component was touched.

It also solved a constraint that would have been very hard by eye: the ten
event-category pigments appear on **both** grounds (journey/rail on the deep,
chronicle/themes on limestone), so each must clear 3:1 against `#04161F` *and*
`#EBE9E0`. That confines them to a narrow mid-dark luminance window. Four were solved
numerically rather than guessed. **52 pairs, all passing.**

### B2. One accent became three that mean something

The old palette had a single brass accent doing every job, which is why its data
visualisation had no contrast to work with. Stratum has **copper** (the surveyor's
hand — you are here), **verdigris** (the measured), **madder** (rupture only). The
rule is enforceable: a colour that cannot be justified by one of those three meanings
is decoration and does not go in.

That immediately caught a real error — the dossier's rank bars were copper, i.e. every
bar was wearing the selection colour. They are measured data, so they are verdigris.

### B3. Type: a performance decision as much as an aesthetic one

The old system ran **four families across five files, 230 KB, all preloaded at high
priority** — ahead of the LCP image in the queue. Stratum runs **Literata** (display
*and* reading — one family replacing Fraunces + Newsreader) and **IBM Plex
Sans/Mono** (one superfamily). Italic and mono are declared as separate instances with
`preload: false`, since neither is ever above the fold or the LCP element.

**Critical path: 5 files/230 KB → 2 files/79 KB.** Landing LCP 4.83s → 3.60s.

Real italics needed one CSS rule: `next/font` mints a distinct family per instance, and
a family with no italic face does not fall through — the browser synthesises a slanted
roman, which looks wrong on a serif.

### B4. The globe — the deepest pass

- The ocean is a bathymetric ramp, and every landmass carries a **three-band
  continental-shelf halo** — the stratum rule wrapped onto a sphere, and the detail
  that makes it read as a sea chart rather than a dark ball. All visible landmasses are
  merged into one `Path2D` first, so each band is a single wide stroke instead of ~90.
- **The graticule now draws over the land, not under it.** An atlas rules its grid
  across the whole sheet; drawing it underneath turned every landmass into an opaque
  sticker sitting on the map rather than part of it. The equator and prime meridian are
  drawn a step heavier, as every printed atlas does.
- The fake-3D emboss underlay is **gone** — skeuomorphic depth on a chart that now
  expresses depth for real, costing the same per-frame work the halo spends on meaning.
- `globe-still.svg` regenerated from the same palette. The halo initially tripled it
  (96 KB → 362 KB) by repeating the 90 KB land path four times; `<use>` keeps exactly
  one copy of the geometry. Net: 100 KB raw, **35.9 KB gzipped — smaller than before**.
- Architecture untouched: pure renderer + OffscreenCanvas worker, no main-thread raster.

### B5. The signature element, applied

The **stratum rule** — stacked tinted bands — now carries across surfaces: the globe's
shelf halo, the dossier's active tab, the chronicle's chapter openers (tinted by the
era's dominant category), and the journey's timeline rail, where each era is a band in
its own pigment. The rail now reads as a *core sample*: you can see that one era was
mostly war and the next mostly formation before reading a word.

### B6. The Chanel cut: the starfield

Removed `components/Starfield.tsx` (152 lines, animated client component) and its two
keyframe blocks. A starfield belonged to the old "cosmic void" concept; in Stratum the
dark ground is **water**, and stars actively contradicted the single idea the design
rests on. Replaced by **isobaths** — faint concentric depth contours in one CSS
gradient, which say the same thing the globe says.

### Two experiments run and rejected (measurements, not opinions)

- **Fonts off the critical path** (`preload: false` on all four): landing barely moved
  (3.60 → 3.48s) and CLS regressed badly — dossier **0.007 → 0.210** — as late swaps
  reflowed the layout. Preloading is correct.
- **Inlining the still into the HTML** to remove a request: worse. The RSC payload
  duplicates server-rendered markup, so a 90 KB SVG landed in the document twice —
  doc 34 KB → **104 KB** gzipped, TBT 80 → 153 ms — and LCP did not move.

### Measurement caveat

The build machine is shared and its ambient load average sits around 14 on 12 cores.
TBT is the metric most sensitive to CPU contention and swung 80 → 211 → 1141 ms across
runs of *identical* code, so absolute Lighthouse scores taken here are depressed and
single runs are not trustworthy. LCP, which Lantern simulates over the dependency
graph, stayed stable across every run and is the number relied on above.

**Verified:** validators 0 errors · `tsc --noEmit` clean · lint clean · contrast 52/52 ·
page audit shows no new structural defects (the 184 duplicate meta descriptions are the
pre-existing Phase D worklist).

---

## Phase D — Discoverable

### D1. Titles and descriptions, templated per depth

The audit's largest finding, fixed. The chronicle and the journey both emitted
`history.summary` verbatim, making **184 pairs of pages duplicates of each other**;
the summary also runs 482–1,731 characters against a ~160-character budget, so
engines were truncating an identical opening on both. ~370 theme and timeline pages
ran 176–254 characters for the same reason.

Descriptions now live in `lib/seo.ts` beside the route shapes — the same reason the
JSON-LD builders do, so the three cannot drift. The dossier line is built from what
the nation actually *has*: the eight Overview-only codes should not advertise six
domains they do not carry.

`clampText()` cuts at a word boundary and strips a dangling comma or dash, so no
template can silently exceed the budget as the corpus grows.

### D2. `/atlas` structured data

The site's index of every nation was the one route in the sitemap emitting no JSON-LD
at all. Now `CollectionPage` + `ItemList` (sampled, not 184 inlined nodes — the full
enumeration is the sitemap's and `/llms.txt`'s job) plus `BreadcrumbList`.

### D3. Per-nation OG cards

`app/country/[code]/opengraph-image.tsx`, in the Stratum identity, inherited by all
three depths. **Build-time, never per request** — `generateStaticParams` is what makes
that true; without it Next puts an image pipeline on the hot path of every crawler
visit. 184 cards cost a few seconds of build.

The signature stat is chosen by what the nation has, and the order is a statement: a
sourced history outranks a borrowed indicator. France reads "19 sourced events across
5 eras"; Taiwan falls through to GDP; Antarctica to a country profile.

This also fixed a **real build error that had been firing on every build**: the root
card rendered a `◆` glyph, which satori has no font for — it attempted a network font
fetch at build time and failed (`Failed to download dynamic font. Status: 400`).
Replaced with a rotated div.

### D4. The mark

`app/icon.png` was a gold compass rose on black — the clearest surviving remnant of
the old identity, and the only one visible in a browser tab. Now the Stratum
signature: a sphere cut in section showing its bands. Generated by
`scripts/build-icon.mjs`, chained into `build-data`, kept as a committed PNG so the
`/icon.png` URL referenced by the Organization JSON-LD keeps resolving.

### D5. IndexNow

Key file committed under `public/`, plus `scripts/indexnow.mjs`. Reads the key from
whichever `<hex>.txt` is in `public/` and refuses to run if the file does not contain
its own name — the one way to be silently rejected. Deliberately **not** wired into
`npm run build`: a build is not a publish, and pinging engines about URLs that are not
live is how a site teaches them to distrust its pings.

### D6. 404

Next's default is unstyled black-on-white. Now in the interface's voice, with four
real routes out, the corpus's actual size, and `noindex` to cover the soft-404 case.

**Audit: 1,054 pages clean** — 200, exactly one `<h1>`, unique title and description,
JSON-LD that parses with `@type` and `@context`, self-referential canonical, no
orphans.

---

## Phase E — Data gaps

**Taiwan.** Absent from the World Bank's country list for political rather than
statistical reasons, which left a nation with an $800bn economy showing seven empty
tabs. `scripts/build-nonwb.mjs` fills it from the IMF World Economic Outlook: GDP, GDP
per capita, GDP growth, inflation and population, each with 16 years of series and
each attributed to the IMF. It runs after the WB builders and merges without
overwriting, so if the WB ever starts reporting Taiwan its series wins.

Two honesty constraints in the builder: WEO carries actuals, estimates and projections
in one continuous series with no flag distinguishing them, so it is **capped at 2024**
— without the cap it would have published 2031 projections as fact. And trade
openness, life expectancy, urbanisation, fertility and literacy are not in WEO, so
they stay empty rather than being sourced from somewhere weaker.

**North Korea** turned out to be already populated across five of six domains — the
World Bank does carry its demographic and land series. What it lacks is economy,
because the DPRK does not publish national accounts and neither the WB nor the IMF
estimates them (PRK is absent from WEO entirely). The standard reference is the Bank
of Korea's annual estimate, published as a press release rather than a queryable
dataset, so it cannot be built reproducibly. Documented as a gap rather than filled
with a number nobody stands behind.

---

## Cross-cutting: performance

Two deterministic wins, both verified by inspecting the built output rather than by
score:

| Change | Effect |
|---|---|
| Type system: 4 families / 5 files / 230 KB preloaded → 2 files / 79 KB | Landing LCP **4.83s → 3.44s** |
| framer-motion removed from the landing page entirely | Landing JS −40 KB transfer; TBT 116ms → 79ms |

The landing page was shipping a 121 KB motion library, a quarter of it unused, to
animate the one card that appears *after* a click. All three usages were
opacity/translate transitions CSS does natively, and the CSS version also collapses
under `prefers-reduced-motion`, which the JS version did not.

### The measurement environment, stated plainly

The floor of ≥95 ×4 is **not verified on this machine**, and the reason is
environmental rather than a code claim I am hedging:

| Surface | Perf | A11y | Best practices | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| Landing | 91 | 100 | 100 | 100 | 3.44s | 0 |
| Dossier | 82 | 100 | 100 | 100 | 2.86s | 0 |
| Chronicle | 89 | 98 | 100 | 100 | 2.86s | 0 |

Accessibility, best-practices and SEO clear the floor. Performance does not, and the
deficit is entirely TBT. The build box is shared and carries a persistent ~67%-CPU
tenant plus other agents; ambient load average ran between 2 and 23 during this work.
The evidence that this is contention and not a regression:

- **`bootup-time` measured 0.4s and 1.3s for byte-identical JavaScript** across two
  runs — a 3× swing in script execution for code that did not change.
- **TBT swung 36 → 62 → 299 → 609 ms on the same commit.**
- **LCP and CLS did not move at all** between those runs (dossier LCP 2.86s in both),
  because Lantern simulates them over the dependency graph rather than measuring wall
  clock — they are the numbers to trust here.

A quiet run measured dossier 94 / chronicle 95 mid-way through Phase B, before any
change that could plausibly have slowed them. Re-measurement on an idle machine is
the first item in `FINAL_REPORT.md`.
