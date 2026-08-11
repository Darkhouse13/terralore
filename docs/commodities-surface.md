# The commodities surface — what was built and how the shares are computed

Written 2026-08-11, at the end of the mission that built `/commodities`. Read
alongside `CLAUDE.md` (architecture, always current) and
`docs/project-state-2026-08-11.md` §3 (the minerals block this surface grows
out of). Three commits: the computation layer, the routes, the SEO wiring —
each gated on `npm run validate` + `tsc` + a constrained `next build`.

---

## 1. What this is

**`/commodities`** — the resources domain read across nations. The dossier
answers "what does this nation dig?"; these pages answer the inverse: for each
of the ten USGS commodities (copper, iron ore, gold, lithium, cobalt, nickel,
rare earths, bauxite, zinc, phosphate rock), every producer the USGS names,
that nation's share of world mine production for both published years, and the
concentration of the top three. One index (`/commodities`) plus ten pages
(`/commodities/<slug>`), all SSG, server-rendered with every figure in the
initial HTML.

Cross-links both ways: a producer row links into that nation's dossier with
the metric window open (`/country/<CODE>#m=<metricKey>&tab=resources`), and
the dossier links back — USGS production cards and the metric window carry
"Who supplies the world →" into the commodity's page.

## 2. The pieces

- `scripts/lib/mcs.mjs` — **the shared MCS access layer.** ScienceBase item
  id, commodity row pins, unit table, country-name reconciliation, CSV
  reader. Extracted from `build-minerals.mjs` so the dossier builder and the
  commodities builder cannot read different editions. **The annual chore —
  bumping to the next MCS edition — is the one-line `SB_ITEM` edit here.**
- `scripts/build-commodities.mjs` → `data/commodities.json` — world totals
  for both years **with their printed rounding precision**, the published
  "Other countries" aggregate, and the full producer table including
  withheld-figure flags. Chained into `npm run build-domains` right after
  `build-minerals.mjs` so the two files always come from the same fetch
  window.
- `lib/commodities.ts` — the computation module (`allCommodities()`,
  `getCommodity(slug)`), shares computed at build time, throwing on any
  broken invariant (below).
- `lib/commodity-meta.ts` — key/slug/name constants, **client-safe on
  purpose**: `MetricCard` links from it without pulling the data files into
  the client chunk.
- `scripts/validate-commodities.mjs` — offline re-assertion of every
  invariant on the committed files; wired into `npm run validate` and into
  the `build-domains` chain.
- `app/commodities/{page,\[mineral\]/page,\[mineral\]/opengraph-image}.tsx` —
  the routes. Limestone ground, verdigris accent (the measured), bespoke SVG
  bars, no client JS.

## 3. Share-computation methodology (the part that must not regress)

1. **The denominator is the published MCS world total, never the sum of
   listed producers.** The world-total rows live under a "rounded" variant of
   the `Statistics_detail` (`Mine production: rounded`; comma-joined when the
   detail already has a colon, e.g. iron ore's
   `Mine production: Usable ore, rounded`) — `worldTotalRows()` in `mcs.mjs`
   handles both.
2. **Rest of world = world total − Σ listed producers.** It holds the MCS
   "Other countries" aggregate, withheld figures where the USGS folds them
   into the total, and production this atlas does not file under a separate
   entity (Israel's phosphate — see §4). It is drawn hatched, as its own row.
3. **"Within rounding" is read off the printed precision of the total
   itself**, not a flat percentage. MCS rounds world totals to few
   significant figures (zinc's "13,000" thousand tonnes is a
   nearest-thousand rounding while its parts sum to 12,540), so the builder
   persists half the last printed digit per year as `rounding`, and every
   consumer allows `rounding + 0.5% of world` for the parts' own rounding.
   Cobalt's parts legitimately overshoot its rounded total by 1.48%; a flat
   1% tolerance rejects real data, a flat 2% would hide a real error.
4. **Reconciliation, enforced twice.** The builder checks
   `Σ named (incl. skipped) + "Other countries" = world total` within that
   tolerance for both years, per commodity, while every row is still in hand
   — with any withheld ("W") figure in the column, the sum may only fall
   short, never over. `lib/commodities.ts` and the validator then re-assert
   the residual is not negative beyond rounding on the committed file. A
   breach **throws and fails the build** — a wrong denominator must not ship.
5. **No drift against the dossier.** Every producer-year tonnage in
   `commodities.json` must equal the same nation-year value in
   `resources.json`, checked **in both directions** (a dossier producer
   missing from the commodities table would silently land inside Rest of
   world, which is a wrong claim, not a gap). Checked in `lib/commodities.ts`
   at build and in the validator offline.
6. **Both years, labeled.** The later year is the USGS estimate, the earlier
   the reported figure; the pages, the meta descriptions and the Dataset
   JSON-LD all say which is which. Years are derived per commodity from the
   world-total rows, not hardcoded.

## 4. Editorial invariants, as they landed here

- **Absence ≠ zero.** A withheld year renders `withheld (W)` with a note; a
  producer withheld in both years (US lithium, US bauxite) still gets its
  row, with no bar and no number. A residual smaller than the world total's
  printed rounding renders "below the table's rounding", never `0 t` —
  lithium's reported year is exactly this case, because **the USGS excludes
  the withheld US output from its lithium world total** (which is why the
  withheld note says "where the USGS folds withheld production into its
  world total", conditionally, instead of asserting it always does).
- **No ISR rows, ever.** Israel produces phosphate rock; this atlas has no
  ISR entity (the Natural Earth polygon renders as PSE). Its tonnage stays
  inside the world total and surfaces only inside Rest of world. The
  builder skips it, `lib/commodities.ts` throws if it appears, the validator
  re-asserts.
- **Every figure cites `usgs-mcs`** — one source record, carried in
  `commodities.json` with its accessed date, rendered in each page's source
  footer and the Dataset `citation`.
- **What is measured is stated**: each page names its exact
  `Statistics_detail` row and says mine production is not reserves and not
  refined output. Copper (refinery production) and iron ore (iron content)
  have sibling MCS rows that a loose match would silently add — the pins in
  `mcs.mjs` are load-bearing.

## 5. Design notes

- Limestone ground (a cross-nation reading surface, like `/timeline`), with
  **verdigris** carrying every mark — the palette's "the measured" tint;
  copper stays what it always is, links and selection. Text tints only in
  proven pairs (`verdigris-deep` on limestone clears 4.5:1).
- Bars are **absolute-scale**: the track is 100% of the world total, so a
  quarter-of-the-world bar reads as one and all ten pages are comparable.
  Bars are `aria-hidden` decoration over text that carries the real figures
  (the chronology-hub discipline). The index rows carry a three-step
  concentration bar (top three producers, verdigris steps).
- **JSX gotcha in this Next version, learned the hard way:** the compiler
  sometimes drops the leading space of text following an expression or
  element boundary ("2025world estimate"). The codebase's pervasive explicit
  `{" "}` is not a Prettier tic, it is load-bearing. When prose renders with
  missing spaces, this is why. Satori (OG images) additionally requires any
  multi-child `<div>` to be explicit flex — entities like `&rsquo;` split
  text into multiple children, so OG card copy is written as single string
  expressions.

## 6. What a future phase must know

- **Annual refresh**: bump `SB_ITEM` in `scripts/lib/mcs.mjs` (no longer in
  `build-minerals.mjs`), then `npm run build-domains`. The chain rebuilds
  resources, minerals, commodities, validates all three, and the sitemap
  lastmod follows `data/commodities.json`'s `updated` automatically.
- If the MCS **schema** moves (section names, detail suffixes, new units),
  the builders throw with named errors rather than producing shifted data —
  extend `SCALE` / `NAME_TO_CODE` / `worldTotalRows` as the error indicates.
  A new MCS country name throws (never silently folds into Rest of world).
- Adding an **eleventh commodity** = one row in `COMMODITIES` (`mcs.mjs`,
  with the exact detail pin) + one row in `COMMODITY_META`
  (`lib/commodity-meta.ts`) + a `METRIC_DEFS` entry + rebuild. Routes, OG
  cards, sitemap, llms.txt and both cross-link directions all derive.
- The dossier deep link relies on the Dossier's URL-hash contract
  (`#m=<key>&tab=<tab>`). If that contract changes, the producer-row links
  in `app/commodities/[mineral]/page.tsx` are the offsite consumers to
  update.
- `data/commodities.json` is committed and small (~18 KB). It deliberately
  duplicates producer tonnages already in `resources.json` — the both-ways
  equality check is what makes that duplication safe; do not remove one side
  of it.
- Not done, observed while here: the ten pages could carry a small
  cross-talk block (mining events from the chronicle corpus per producer),
  and reserves / refinery production are separate MCS rows a future surface
  could add **as clearly separate tables** — never merged into these.
