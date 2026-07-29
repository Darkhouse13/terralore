# Final report — Identity, Experience, Discoverability

Terralore was already a substantively complete product: 184 sourced national
histories, a three-depth architecture, 1,054 static pages, validators enforcing
citation integrity. The mission was to make the world find it and be astonished by
it. This is what changed, what is verified, and what is not.

---

## The design rationale, in three sentences

The site ran two palettes — navy-and-gold on the globe and warm-cream-and-serif on
the chronicle — and both are named defaults, so the product read as two anonymous
sites stapled together at `/chronicle`, neither of them saying anything about the
subject. **STRATUM** replaces them with the way an atlas has always drawn the world:
in discrete bands of depth, which is also the product's own structure, since
Terralore already publishes every nation at three depths. The result is one grammar
everywhere — a bathymetric globe with a continental-shelf halo, a timeline rail that
reads as a core sample of a nation's history, and a chronicle whose chapter openers
are tinted by what each era was mostly made of.

---

## Before and after

Screenshots are archived in `design-review/` — `00-before/` against `06-final/`, plus
`03-crosstalk/` and `05-taiwan/` for the features that did not exist before.

| Surface | Before | After |
|---|---|---|
| Landing | `00-before/landing-desktop.png` | `06-final/landing-desktop.png` |
| Dossier | `00-before/dossier-desktop.png` | `06-final/dossier-desktop.png` |
| Chronicle | `00-before/chronicle-desktop.png` | `06-final/chronicle-desktop.png` |
| Journey | `00-before/journey-event-desktop.png` | `06-final/journey-event-desktop.png` |
| Empty state | `00-before/dossier-empty-desktop.png` | `04-phaseC/dossier-empty-desktop.png` |
| 404 | *(Next default, unstyled)* | `06-final/notfound-desktop.png` |
| Cross-talk | *(did not exist)* | `03-crosstalk/metric-annotated.png`, `meanwhile.png` |
| Taiwan | *(seven empty tabs)* | `05-taiwan/taiwan-dossier.png` |

Full-page captures run to ~19 MB each and are gitignored; regenerate with
`node scripts/review-shots.mjs --label <name>`.

---

## What changed

### Trust
- **CI** (`.github/workflows/ci.yml`): validate → typecheck → lint → build → serve →
  audit every sitemap URL, on every push, pinned to Node 22 to match the Dockerfile.
- **`scripts/audit-pages.mjs`**, written *first*: crawls all 1,054 pages and asserts
  200, one `<h1>`, unique title, unique description, parseable JSON-LD, a
  self-referential canonical, and no orphans. It found 184 duplicate descriptions and
  ~550 over-length ones on a site that built cleanly with zero validator errors.
- **`scripts/check-contrast.mjs`**: 52 declared colour pairs, each with the role it
  plays, proven against WCAG thresholds.
- **Dead deps gone** — `three`, `@types/three`, `react-globe.gl` outlived the WebGL
  globe by a full rewrite. Runtime dependencies are now `next`, `react`, `react-dom`,
  `motion` — and `motion` no longer loads on the landing page at all.

### Identity
- STRATUM applied to every route, the globe included. `DESIGN.md` carries the tokens,
  the type scale, the motion principles, the signature element, and the two rejected
  directions with the reasoning.
- **Zero navy/gold remnants**: 802 token and hex replacements across 27 files, the
  choropleth ramp re-derived from a single source, the event-category palette recast
  as ten mineral pigments, and the favicon — the last remnant, and the only one
  visible in a browser tab — regenerated as a sphere cut in section.
- **The globe**: bathymetric ocean, a three-band continental-shelf halo on every
  coast, and the graticule now drawn *over* the land rather than under it, because an
  atlas rules its grid across the whole sheet. The GlobeLite architecture (pure
  renderer + OffscreenCanvas worker) is untouched, and the still is **35.9 KB
  gzipped — smaller than before**.

### Experience
- **Dossier ↔ chronicle cross-talk**, modelled as one table rather than curated pairs:
  **4,374 (metric, event) annotations across 152 of 183 nations**, scoped to each
  metric's own series span. South Sudan's life expectancy collapsing 58 → 35 years now
  sits beside "2018 — An estimated 383,000 dead", one click from the sourced account.
  The return leg deep-links chronicle events into the exact metric window.
- **"Meanwhile elsewhere"** on every chronicle era — during France's Gaul & Rome era it
  surfaces the Three Kingdoms in Korea, Caesar in the Low Countries, Rome annexing
  Cyprus. 184 chronicles that were previously connected only through the hub pages.
- **Era-jump** (`[` / `]`, PageUp/PageDown, Home/End) and a reduced-motion mode that
  actually applies to the journey's JS-driven transition, which CSS could not reach.
- **Designed empty states** for the six remaining Overview-only codes, each naming its
  own reason — a continent under the Antarctic Treaty is not the same case as a state
  recognised by one UN member.

### Discoverability
- Per-depth titles and descriptions; **1,054 pages clean** on the audit.
- Per-nation OG cards, generated at build time, inherited by all three depths.
- `CollectionPage` + `ItemList` on `/atlas`, previously the one route with no
  structured data at all.
- IndexNow key and submission script; `robots.txt` already named the answer-engine
  crawlers explicitly, and `/llms.txt` already pointed every nation at its chronicle.

### Data
- **Taiwan** populated from the IMF World Economic Outlook — 5 metrics across economy
  and society, capped at 2024 so projections are never published as fact.
- **North Korea** already carried 15 metrics across five domains; its economy domain
  stays empty because the DPRK publishes no national accounts and no institution
  estimates them in a form that can be rebuilt reproducibly.

---

## Indexing status

| Item | State |
|---|---|
| Sitemap | 1,054 URLs, all 200, all linked, no orphans |
| Titles / descriptions | Unique on every page, within budget |
| JSON-LD | `Article` + citations, `Dataset`, `Country`, `CollectionPage`, `BreadcrumbList` — parses on every page with `@type` and `@context` |
| Canonicals | Self-referential on every page |
| `robots.txt` | GPTBot, ClaudeBot, PerplexityBot, Google-Extended and 11 others named as explicit opt-in |
| `/llms.txt` | Live, pointing every nation at its canonical chronicle |
| IndexNow | Key file committed, `npm run indexnow` ready to run on deploy |
| OG images | Per nation, build-time |
| Rich Results | **Not validated against Google's live tool** — see below |

---

## What is not verified

Stated plainly, because a report that quietly omits these is worth less than one that
names them.

**1. Lighthouse ≥95 ×4 is not met on this machine.**

| Surface | Perf | A11y | Best practices | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| Landing | 91 | 100 | 100 | 100 | 3.44s | 0 |
| Dossier | 82 | 100 | 100 | 100 | 2.86s | 0 |
| Chronicle | 89 | 98 | 100 | 100 | 2.86s | 0 |

Accessibility, best-practices and SEO clear the floor everywhere. Performance does
not, and the entire deficit is TBT. The build box is shared, carrying a persistent
~67%-CPU tenant and several other agents; ambient load ran between 2 and 23 during
this work. The evidence that this is contention rather than a code regression:
`bootup-time` measured **0.4s and 1.3s for byte-identical JavaScript**; TBT swung
**36 → 62 → 299 → 609 ms on the same commit**; and LCP and CLS did not move at all
across those runs, because Lantern simulates them over the dependency graph. A quiet
run mid-way through Phase B measured dossier 94 and chronicle 95, before any change
that could plausibly have slowed them.

The two performance changes that *are* deterministic, verified by inspecting the built
output: the critical-path font payload went from **5 files / 230 KB to 2 files / 79 KB**
(landing LCP 4.83s → 3.44s), and framer-motion is now **absent from every landing
chunk**.

**2. Rich Results validation** was not run — it needs Google's hosted tool against a
public URL. The JSON-LD is asserted to parse and carry `@type`/`@context` on all 1,054
pages by the audit, which is the mechanical half.

**3. CI has never executed.** The workflow is committed but no push has triggered it.
Every step in it has been run locally and passes.

---

## Operator-side — needs your authenticated session

1. **Google Search Console** — verify the property and submit `sitemap.xml`.
2. **Bing Webmaster Tools** — same, and it also activates IndexNow for the host.
3. **Run `npm run indexnow` after the first deploy** carrying these changes.
4. **Validate a chronicle, a dossier and `/atlas`** against Google's Rich Results
   Test once live.
5. **Re-run `node scripts/lighthouse.mjs --label clean --runs 3` on an idle machine**
   to settle the performance question one way or the other.

---

## The ten next actions, ranked

1. **Re-measure Lighthouse on an idle box.** Everything below is guesswork until the
   performance picture is real rather than contended.
2. **Cut the remaining landing JS.** ~199 KB transfer across 10 chunks, with ~74 KB
   reported unused. The globe worker and geojson fetch are the honest cost; the rest
   is worth a bundle-analyzer pass.
3. **Submit to Search Console and Bing**, then watch coverage for a fortnight — 1,054
   URLs appearing (or not) is the only real test of this work.
4. **USGS mineral production and reserves** for the `resources` domain, which is
   currently a thin first cut from World Bank resource-rents and electricity access.
   Explicitly out of scope for this mission; logged here as intended.
5. **North Korea's economy from the Bank of Korea**, if a machine-readable release
   ever exists — or as a hand-entered series *clearly marked as such*, which needs a
   schema change to distinguish "built" from "transcribed" provenance.
6. **Widen cross-talk coverage.** 31 of 183 nations have no annotated metric, almost
   always because their history is dense before 1960 and World Bank series start in
   2009. Longer series (Maddison, IMF historical) would close most of that gap.
7. **The journey's entry as descent.** Selecting a nation on the globe still navigates
   rather than descends; one orchestrated transition from globe to journey is the
   biggest remaining piece of the "unforgettable" objective.
8. **Per-era OG images for chronicles**, so a shared link to a specific chapter shows
   that chapter.
9. **A visual-regression gate.** `review-shots.mjs` produces the images; nothing
   compares them between runs, so a layout regression is only caught by eye.
10. **Prune the 8 Overview-only tabs on empty dossiers.** The designed empty state
    explains the absence well, but six dimmed tabs above it still promise data that
    will never arrive.

---

## Verification at time of writing

```
npm run validate      ✅ 0 errors — 183 history files, 6 domain files
npx tsc --noEmit      ✅ clean
npm run lint          ✅ clean
npm run build         ✅ 1,054 static routes
node scripts/check-contrast.mjs   ✅ 52/52 pairs
npm run audit:pages   ✅ 1,054 pages clean
```

Responsive floor checked at **360px and 390px** across landing, chronicle, dossier
and timeline: `scrollWidth === innerWidth` on all eight, i.e. no horizontal scroll
anywhere. Two real bugs were found and fixed by that check rather than by eye — the
landing hero overflowed the right edge (a `max-w-[430px]` inside a `left-6`-only
absolute container), and at 360px its paragraph then overlapped the globe and made
both unreadable. The globe now seats lower on narrow viewports, with the SVG still's
offset moved in step so the still→canvas handover stays pixel-stable.
