# The rankings surface — what was built and how the tables stay honest

Written 2026-08-11, at the end of the mission that built `/rankings`. Read
alongside `CLAUDE.md` (architecture, always current),
`docs/project-state-2026-08-11.md` §3 (the domain inventory these pages read),
and `docs/commodities-surface.md` (the house pattern this surface follows).
Four commits: the slug layer + assembly + validator, the routes, the SEO
wiring, this document — each gated on `npm run validate` + `tsc` + a
constrained `next build`.

---

## 1. What this is

**`/rankings`** — every dossier indicator read across nations. The dossier
answers "what is true of this nation?"; these pages answer the inverse: for
one indicator, every nation with a published figure, ordered highest to
lowest. One index (`/rankings`, grouped by domain in dossier tab order) plus
**53 pages** (`/rankings/<slug>`) covering all **54 metric keys** (one page is
shared — see §3). All SSG, server-rendered, no client JS: the whole table,
every vintage and every gap, is in the initial HTML — the chronicle
discipline applied to data.

Cross-links both ways: every table row deep-links into that nation's dossier
with the metric window open (`/country/<CODE>#m=<key>&tab=<domain>`), and the
dossier's metric window links back ("World ranking · <label> →" in
`MetricDetail`, beside the commodity link where one exists).

## 2. The pieces

- `data/ranking-slugs.json` — **the slug map.** Hand-authored,
  committed, never derived at runtime: a metric's URL is an editorial
  decision with a permanence obligation, not a string transformation.
  Carries `slugs` (key → slug, all 54) and `aliases` (§3).
- `lib/ranking-meta.ts` — the client-safe slug lookup (`rankingSlug(key)`),
  kept apart from the data exactly as `lib/commodity-meta.ts` is: the metric
  window imports it without pulling nine domain files into the client chunk.
- `lib/rankings.ts` — the assembly (`allRankings()`, `getRanking(slug)`),
  computed at build from **the domain files via `lib/domains`
  (`allDomainFiles()`), not from the series index** — see §4. Throws on any
  broken invariant, so a bad state fails the build rather than publishing a
  wrong table.
- `scripts/validate-rankings.mjs` — offline re-assertion of every slug-layer
  invariant (§5); wired into `npm run validate` and the `build-domains` chain.
- `app/rankings/{page,[slug]/page,[slug]/opengraph-image}.tsx` — the routes.
  Limestone ground, verdigris accent (the measured), bespoke SVG bars, no
  client JS.
- `lib/seo.ts` — `routes.rankings`/`routes.ranking`, `rankingsDescription`,
  `rankingDescription`, `rankingLd` (Dataset). Sitemap and llms.txt read from
  the same assembly.

## 3. Slug policy

- **Explicit, total, unique.** Every metric key has exactly one hand-chosen
  slug; the validator fails the build on a missing key, a dead slug, a
  non-kebab-case slug, or an undeclared collision.
- **The bare noun, never "-rate".** `literacy`, `fertility`, `inflation` —
  the validator bans the `-rate` suffix outright, because one stray
  `literacy-rate` beside `fertility` is exactly the inconsistency a
  hand-authored map exists to prevent. Established public names are kept
  whole (`voice-and-accountability`, `rule-of-law`); SIPRI's own term is used
  for the %-of-GDP series (`military-burden`, distinct from
  `military-spending` in dollars); minerals take `<commodity>-production`.
  Clean URLs, not keyword-stuffed ones.
- **The alias pair.** Society's `literacy` and education's `literacyRate`
  are the same UIS indicator reaching the atlas through two pipelines, and
  they are **byte-identical across all 141 nations** (checked value-and-year,
  every run, by both the validator and `lib/rankings.ts`). Publishing two
  ranking pages of identical figures would be duplicate content pretending
  to be two datasets, so `aliases: { "literacy": "literacyRate" }` folds
  them onto one page at `/rankings/literacy`, assembled from the education
  key; both dossier metric windows link to it, and the page's footer names
  both tabs. **The identity check has teeth:** the moment a refresh makes
  the two diverge (WDI and UIS update on different cadences), the build
  fails and forces a conscious decision — split the pages or fix the data —
  instead of a silent drift.

## 4. Assembly methodology (the part that must not regress)

1. **Source of truth is `data/domains/*.json`, not
   `public/data/series/`.** The series index drops any nation whose trailing
   series is shorter than two points — 19 nations hold a real literacy figure
   with no chartable series, 11 for R&D spending, 3 for high-tech exports. A
   ranking assembled from the series files would silently unrank them, which
   is a wrong claim, not a gap. The domain files are the series files' own
   source, so nothing can drift between the two surfaces.
2. **Absence is never zero.** Only nations with a published value are
   ranked. Every other atlas nation is listed under "No data" by name, with
   the `NO_DATA_NOTES` explanation where one exists (Antarctica, Taiwan,
   Somaliland…). Exception in form, not substance: **USGS mineral metrics**
   list producers only — the MCS names producers, so a nation absent from it
   is *not recorded as producing none*. Those pages carry a note saying
   exactly that and defer the remainder to the commodity page's
   "Rest of world" instead of listing ~170 nations as if they were data gaps.
3. **Vintages are per-row.** These publishers carry each nation's latest
   available year, so one table can mix 2011 and 2024 observations. Every
   row prints its own year; when `min !== max` a note above the table says
   so plainly, with the spread. The header stat says "Observed 2011–2024",
   never a single year it cannot claim.
4. **Ties share a rank** (competition ranking, computed on raw values).
   Display rounding is display: two nations can print the same 1-dp score
   with different ranks because the underlying estimates differ — the
   ranking never invents an order beyond the data, and never flattens one
   the data contains.
5. **WGI metrics are described as what they are**: absolute 0–100 scores
   anchored to two hypothetical benchmark performers — not percentile
   ranks — aggregating perception surveys and expert assessments. Each
   governance page carries that note verbatim and adds that the ranking
   *order* is computed by this atlas from those scores.
6. **All formatting through `lib/format.ts`** (`formatMetric`), so Niger's
   0.04 physicians per 1,000 prints as 0.04, never 0. No change/trend
   figures are shown at all: per-nation baselines differ (mixed vintages),
   so a Δ column would compare unlike periods — the dossier's metric window,
   which owns a single nation's series, is where change lives (in points for
   bounded scales, per the house rule).
7. **Language is highest/lowest, never best/worst** — a high military burden
   or a low tax share is not a virtue or a vice on this site. This extends
   to the top-10 strip's caption ("Highest, not best: this page orders
   figures, it does not grade nations") and to negative values: a bar for a
   GDP contraction is not drawn at all, because a clamped sliver would read
   as a small positive number.

## 5. What the validator asserts (offline, every `npm run validate`)

Total coverage in both directions (every domain-file key has a slug, every
slug names a live key); kebab-case; the `-rate` ban; uniqueness modulo
declared aliases; alias source/target share their slug, no alias chains;
**alias identity per nation, value and year**; and a definition in
`lib/metric-defs.ts` for every page-owning key (checked textually — node
cannot import the TS module). `lib/rankings.ts` re-asserts the load-bearing
subset at build time and additionally fails on an unknown country code or a
missing source id.

## 6. SEO / GEO wiring

- Meta descriptions carry real figures: the leader, its value and year, and
  the ranked count (`rankingDescription`). The hub carries totals
  (`rankingsDescription`). Both live in `lib/seo.ts`, the only place URLs
  and descriptions are made.
- Each page emits a schema.org **Dataset** (`rankingLd`) whose `citation`
  names the true upstream — SIPRI, UNESCO UIS, ITU, WHO/UN IGME, the WGI
  project, USGS MCS, World Bank WDI (and the IMF WEO beside it where Taiwan
  is filled) — with `variableMeasured`, `temporalCoverage` from the actual
  vintage spread, and `dateModified` = the domain file's `updated`.
- Sitemap lastmod: per page, the metric's own domain `updated`; the hub,
  `rankingsUpdated()` (latest across domains). Honest dates, not deploy
  timestamps.
- One OG card per ranking (`opengraph-image.tsx`, ZENITH grammar, verdigris
  stat, baseline seeded by the slug), generated at build.
- `/llms.txt` gains a "By ranking" section — 53 lines with leader figures —
  under the same honesty preamble (mixed vintages, absence ≠ zero).

## 7. How a future 55th metric gets a page

1. Add the indicator to its domain builder (`scripts/build-<domain>.mjs`)
   and rebuild (`npm run build-domains`). The series-index builder will
   enforce global key uniqueness as always.
2. Add one line to `data/ranking-slugs.json` — the slug is an editorial
   choice; follow §3 (bare noun, no `-rate`, keep established public names).
3. Add its plain-language definition to `lib/metric-defs.ts` (the validator
   makes this non-optional).
4. `npm run validate` + build. Everything else derives: the page, the index
   row, the OG card, the sitemap entry, the llms.txt line, the dossier
   backlink, the Dataset JSON-LD.

If the new key duplicates an existing indicator through a second pipeline,
declare it in `aliases` instead of giving it its own page — and let the
identity check decide whether that claim survives refreshes. If a new unit
appears, `formatMetric` (lib/format.ts) and the page's `UNIT_PHRASE` map are
the two places to teach it.

## 8. Verification artefacts

`design-review/14-rankings/`: index, gdp (dense), lithium-production
(sparse minerals), rule-of-law (WGI) at desktop and 360 px (no horizontal
overflow, asserted programmatically at capture); the mixed-vintage note, the
WGI note, the minerals note and a No-data section as focused captures;
`dossier-backlink.png` (the metric window's "World ranking →" link);
`og-life-expectancy.png` (the card). Pages regenerate at every `next build`
by construction.

Known seam, accepted: two nations can display equal rounded values with
distinct ranks (§4.4). The alternative — ranking on rounded values — would
manufacture ties the estimates do not contain.
