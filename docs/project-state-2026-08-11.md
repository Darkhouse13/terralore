# Terralore — complete project state, 11 August 2026

Handoff snapshot for planning the next phases. Everything below was measured
against the working tree and the live site on this date, not recalled. Read
alongside `CLAUDE.md` (architecture map, always current) and `DECISIONS.md`
(design decisions D1–D13, binding). The previous phase's mission doc was
`docs/content-expansion-plan.md`; it is now fully executed and this document
supersedes it as the statement of where things stand.

---

## 1. What this is

**Terralore** (https://terralore.co) — an interactive 3D-globe encyclopedia of
nations. Spin globe → click country → basic-info card → **dossier** (multi-
domain sourced data) → optional cinematic history journey, plus a long-form
**chronicle** (the readable document) per nation and cross-nation
**timeline/themes** pages. North star: "Quartr for nations" — every domain of
a nation (economy, society, …, history) in one beautiful, sourced, spatial
view.

The site's one promise, enforced by validators: **every claim traceable to a
named source, every gap shown honestly, every dispute presented from both
sides**. That promise is the product; features that would break it (imputed
values, unsourced colour, silently picking a side of a dispute) are out of
bounds regardless of how good they'd look.

- Stack: Next.js 16.2 (App Router, SSG everywhere), React 19, Tailwind v4,
  motion. **No three.js** — the globe is a bespoke OffscreenCanvas renderer
  (GlobeLite). No chart library — bespoke SVG.
- Deploy: `git push origin main` → GitHub webhook → Coolify on a Hetzner box.
  Deploys take ~1–3 min. Everything is static; no runtime data fetching
  server-side (client lazy-fetches `/data/series/*.json` for chart compare).
- 1,054 URLs in the sitemap. All content is baked at build time from
  committed JSON.

## 2. Content system A — the history corpus

Authored, verified, per-nation history files: `lib/histories/data/*.json`
(schema `CountryHistory` in `lib/types.ts`), registered in
`lib/histories/index.ts`, keyed on **Natural Earth ADM0_A3** (never ISO_A3 —
it is `-99` for France/Norway). France itself lives in `lib/histories/france.ts`.

**Current inventory (measured today):**

- 184 registered histories (183 JSON + France) across 186 country codes.
  The only codes without histories: **ATA (Antarctica), ATF (French Southern
  Lands)** — deliberate; no polity, explained by `NO_DATA_NOTES`.
- **4,564 events** (4,545 JSON + 19 France), **~291k words** of era prose,
  3,903 source entries, 1,842 figures.
- **Medians: 25 events / 1,601 words / 20 sources / 9 figures** per nation.
- Every era: `body[]` prose, `events[]` (each with `sources[]` that MUST
  resolve in the file's `sources` list), optional `figures[]`, `pullquote`.
- `statehood` blocks drive the Time Globe's existence shading (see
  `docs/statehood-plan.md`, DECISIONS D12/D13). An allowlist in
  `validate-histories.mjs` controls which codes may carry `sovereign: false`.

**Thinnest nations now** (post-expansion; the next deepening frontier, all at
19 events): SYC 19/1016w, IND 19/1133w (!), SWZ, PHL, PRI, TWN, SUR, PAN,
VUT, then MNG 19/1744w. **India at 19 events / 1,133 words is the most
glaring mismatch between importance and depth in the corpus.** Other
heavyweights below median: PHL, MEX (20/…), BGD (20), NPL (20).

**Validator state:** 0 errors, 17 warnings, 23 info lines. The warnings are
all *accepted and annotated* — statehood formation anchors that rest on
Wikipedia alone or on one publisher for pre-1800 dates, each carrying a
`REMAINS:` note explaining why no better source was found (e.g. Mossi oral
tradition, Burundi's Ntare I). Two warnings note FLK/GRL are allowlisted
non-sovereign but don't set `sovereign: false` — a decision documented in
D13, not an oversight. These are debt only if better sources appear.

## 3. Content system B — the data dossier

Committed JSON per domain in `data/domains/*.json`, shape
`{ domain, updated, sources, data: { CODE: { metrics } } }`. Access layer
`lib/domains/index.ts` (`FILES` insertion order = dossier tab order). Nine
domains as of this week:

| domain | nations | metrics | indicators | true upstream (source ids) | updated |
|---|---|---|---|---|---|
| economy | 179 | 874 | 5 | World Bank WDI + IMF WEO for Taiwan (`wb-wdi`, `imf-weo`) | 2026-07-29 |
| society | 180 | 858 | 5 | WDI + IMF (`wb-wdi`, `imf-weo`) | 2026-07-29 |
| **governance** | 179 | 1,072 | 6 | Worldwide Governance Indicators (`wb-wgi`) | 2026-08-10 |
| **health** | 178 | 827 | 5 | WHO GHO + UN IGME/WHO-UNICEF (`wb-who`, `wb-unicef-who`) | 2026-08-10 |
| **education** | 176 | 829 | 5 | UNESCO UIS (`wb-unesco`) | 2026-08-10 |
| technology | 179 | 802 | 5 | UNESCO UIS, ITU, WDI | 2026-06-15 |
| geography | 178 | 879 | 5 | WDI | 2026-06-14 |
| resources | 179 | **1,018** | **15** | WDI rents + **USGS Mineral Commodity Summaries** (`usgs-mcs`) | 2026-08-10 |
| military | 168 | 488 | 3 | SIPRI (`wb-sipri`) | 2026-06-14 |

7,747 metrics total. 54 metric keys, globally unique (the series-index
builder throws on collision); each key has one file in
`public/data/series/<key>.json` for the compare/rank/map lenses, and a
plain-language definition in `lib/metric-defs.ts`.

**Things a planner must know about this data:**

- The six governance metrics are the WGI's **absolute 0–100 scores** (2025
  methodology: linear map between two hypothetical benchmark performers),
  **not percentile ranks**. Labels/tooltips say "perceived" where perception
  is what was measured. Do not re-describe them as ranks.
- `buildWbDomain` supports per-indicator `source` (true upstream), `wbSource`
  (pins the WB API database — WGI live in database 3), and `floor` (discards
  impossible-magnitude observations; used once, for Somalia's 8×10⁻⁶ % of GDP
  education spend, a denomination error upstream). The bar for a floor is
  impossibility, never extremity.
- Minerals: ten commodities (copper, iron ore, gold, lithium, cobalt, nickel,
  rare earths, bauxite, zinc, phosphate), each pinned to one exact
  `Statistics_detail` row of the MCS CSV; all ten reconcile to the published
  MCS world totals within rounding. Em-dash = nil and "W" = withheld are
  absences, not zeros; a nation that mines none of a commodity has **no
  card**, not a zero. Israel is skipped-and-logged (no ISR entity in this
  atlas; the Natural Earth ISR polygon renders as PSE — see
  `scripts/lib/codes.mjs` REMAP). Headline year is the USGS **estimate**;
  the prior year is the reported figure; both are in the series.
- Taiwan: absent from WB; economy/society filled from IMF WEO by
  `build-nonwb.mjs`. North Korea's economy is deliberately empty (no
  reproducible source exists). Seven codes have no data at all, each with a
  written explanation in `lib/territory-notes.ts` (`NO_DATA_NOTES`).

## 4. What shipped 10–11 August (21 commits, `6e77432..f5546dd`)

The whole of `docs/content-expansion-plan.md`, verified twice over:

1. **Governance / health / education domains** — as above, one commit each.
2. **USGS minerals** into resources (`scripts/build-minerals.mjs`, resolves
   its CSV from ScienceBase item `696a75d5d4be0228872d3bf8`; **bump that id
   annually** when the next MCS edition lands).
3. **Fourteen histories deepened**, one commit per nation, all now meeting
   the bar ≥24 events / ≥1,800 words / ≥16 sources / ≥4 figures:
   MDG, LKA, CRI, HTI, PNG, SLB, BTN (deepened toward median); FLK, CAF, COM
   (had zero era figures); NCL, BLZ, CYN, GNQ (leanest sources). Northern
   Cyprus and the Falklands were expanded under the neutrality rule —
   both sides' own institutions are now cited (Cancillería Argentina +
   GOV.UK; CMP for Cyprus).
4. **Format layer**: units `score`, `per 1,000` (2 dp below 10 — Niger's
   0.04 physicians must not print as 0), `per 1,000 births`, `% gross`
   (enrolment can exceed 100 by definition), `tonnes` (t → kt → Mt, 3 sig
   figs). Bounded-scale metrics report change in **points**, not percent of
   themselves.
5. **SEO fix found in verification**: dossier sitemap lastmod now =
   max(history.updated, dossier.updated); chronicle/journey keep the
   history's own date. Before the fix, 170 dossier pages that had just
   gained three tabs were advertising June dates.
6. All 1,054 URLs submitted to IndexNow (HTTP 200). Google needs no ping —
   sitemap registered in GSC, honest lastmod signals.

New reference material for WB fetching: `scripts/lib/wb.mjs` now retries up
to 10× with 30 s timeouts — the WB API's WAF intermittently 502s and hangs;
this is normal, not breakage.

## 5. Editorial invariants (non-negotiable)

1. Every claim traceable to a reliable, **fetchable** source. Britannica is
   unfetchable from the dev machine (Cloudflare 403) — 1,347 legacy corpus
   URLs cite it and remain, but **no new claim may rest on it** since it
   cannot be checked. Wikipedia is a lead-finder, not a citation (existing
   wiki citations are legacy debt, tracked by validator warnings).
2. History JSON is edited **textually** (string surgery), never
   JSON.parse→stringify a whole file — the files carry hand-tuned one-line
   formatting for quickFacts/sources/figures.
3. Neutrality: contested territories get competing positions with sources
   (see CYN, FLK, MAR/SAH treatment). "The corpus states the positions and
   adjudicates none" is the house formula.
4. Diacritics follow each file's own established style (e.g. haiti.json is
   deliberately ASCII; centralafricanrepublic.json uses accents).
5. Absence is never zero; gaps render as "—" with an honest note.
6. Metric keys globally unique. ADM0_A3 everywhere.
7. One commit per unit (one domain, one nation) so a bad unit reverts clean.
8. Gate every commit: `npm run validate` (0 errors) + `npx tsc --noEmit` +
   `next build`. Turbopack dev does not type-check; the build is the proof.

## 6. Pipelines and refresh cadence

- `npm run build-data` → countries.json, globe still, icons, time-events
  (must run **before** domain builders).
- `npm run build-domains` → all nine domains in order, then `build-nonwb`
  (IMF/Taiwan), then validation, then series index. Resources runs
  `build-resources` then `build-minerals` (merge, never overwrite).
- `npm run validate` = history + domain validators. `npm run ci` = full gate.
- WB data updates ~annually; MCS annually (bump the ScienceBase id in
  `build-minerals.mjs`); WGI annually (September releases historically).
- `node scripts/indexnow.mjs` after deploys that change many URLs
  (`--urls /a,/b` for a few). Key file: `public/e7c7f68b….txt` (served ✓).

## 7. SEO/GEO state (verified today, all green)

Single source of truth `lib/seo.ts` (origin, route shapes, JSON-LD
builders) — canonical tags, sitemap and structured data cannot drift apart.
Verified surface by surface on the live site: meta descriptions carry real
domain lists + indicator counts; chronicle descriptions carry event counts;
JSON-LD `Dataset` cites every true upstream (incl. USGS on producer
nations), `Article` dateModified matches history dates, chronicle holds the
canonical `@id`; sitemap lastmod is honest for both page types; `/llms.txt`
reports 4,564 events (matches corpus exactly); OG images are build-time SSG
routes (fresh every deploy); timeline/themes pages carry the new events.
GEO: the chronicle route puts the **entire** corpus prose in initial HTML —
that is the surface generative engines read, and it is current.

GSC access recipe: auto-memory `gsc-access` (ADC token +
`x-goog-user-project: unified-gift-486916-u3`, property
`sc-domain:terralore.co`, baseline recorded 2026-08-10).

## 8. Known gaps, debt, papercuts (honest list, roughly by weight)

1. **Corpus depth skew**: India (19 ev/1,133 w) is the worst
   importance-to-depth mismatch; PHL, MEX, BGD, NPL, IDN also below median.
   The deepening bar used this week (≥24/≥1,800/≥16/≥4) is a proven recipe.
2. **~1,347 Britannica + many Wikipedia citations** in legacy corpus files —
   unverifiable from this machine / lead-finder-grade respectively.
   Replacing them nation-by-nation with fetchable institutional sources is
   slow, proven work (this week's 14 nations show the method).
3. **Military domain thinnest**: 168 nations × 3 indicators. SIPRI publishes
   much more (arms transfers, per-capita, share of govt spending).
4. **No France JSON**: france.ts predates the JSON pipeline; fine, but any
   corpus-wide tooling must remember the one TypeScript history.
5. **Dead npm script**: `"build-og"` references `scripts/build-og-images.mjs`
   which does not exist (no git history). Harmless — OG images come from the
   App Router route — delete the line when next touching package.json.
6. **Stale doc-comment**: `lib/chronology.ts` docstring says "4,471 events";
   corpus is 4,564. Cosmetic.
7. **17 validator warnings** (statehood anchors on thin sources) — each
   annotated with why it remains; revisit only if better sources surface.
8. **Domain vintage drift**: economy/society/tech/geo/military last pulled
   June–July; the five new/refreshed domains are August. A full
   `npm run refresh-domains` would even them up (WB API is slow/flaky;
   expect retries).
9. Metric window compare palette supports 4 overlay nations; map toggle is
   equirectangular SVG — fine, but no zoom. Known, accepted.

## 9. In-flight work — DO NOT CLOBBER

Two files are modified but uncommitted in the working tree, from a
**SovereigntyBar** effort that predates this week's work and belongs to
another line of development:

- `scripts/build-time-events.mjs` (+7): emits `s: 0` flag for D13
  non-sovereign entities in the time-events payload.
- `scripts/check-contrast.mjs` (+45): contrast assertions for a
  `components/SovereigntyBar.tsx` that **does not exist yet** — a planned
  one-axis flattening of the globe's existence shading for chronicle
  (limestone ground) and dossier/journey (the deep ground).

Treat these as the seed of a future phase (the design intent is written in
the diffs themselves); either finish that component or consciously revert.

## 10. Environment and operations

- Dev machine: 15 GB RAM laptop. **Always build constrained**:
  `taskset -c 0,1 env NODE_OPTIONS=--max-old-space-size=1536 npx next build`
  (~25 s; the unconstrained parallel build has frozen the machine). Kill
  stray `next start` / Playwright Chrome before long runs. Auto-memory:
  `build-memory-limits`.
- Britannica unfetchable (Cloudflare); LOC country-studies 403; some UN
  press pages JS-walled. Working alternatives verified this week: BBC
  country profiles, history.state.gov, UNESCO WHC, UNSCR archive
  (unscr.com), Hansard (api.parliament.uk), national statistical institutes,
  RNZ Pacific, EITI, HRW, WFP/UN News.
- WB API: intermittent WAF 502s + hung sockets; the client retries 10× with
  timeouts. Full domain rebuild takes many minutes.
- Playwright Chrome: `find ~/.cache/ms-playwright -name chrome -path "*chrome-linux*"`,
  pass as `CHROME_PATH`. Scripts importing playwright must run from repo
  root (node_modules resolution).
- Coolify/Traefik gotchas (HTTP/3 must stay off; webhook path) are in
  CLAUDE.md's Gotchas section. `ssh hetzner` has root; cross-deploy proxy
  rules in `/data/coolify/proxy/dynamic/` (auto-memory `www-subdomain-broken`).

## 11. Opportunities observed while working (input, not decisions)

- **Deepen the heavyweight thin nations** (IND first) with the proven bar.
- **Chronicle ↔ data cross-talk** exists (`lib/annotations.ts`) but only 6
  category→metric links; the three new domains could carry more (e.g.
  politics events → wgiRuleOfLaw, disaster → underFiveMortality).
- **Governance sparklines tell 16-year stories** (every WGI metric has a
  full series) — a "governance trajectory" surface (risers/fallers) would be
  cheap and unique.
- **Minerals invite a "who supplies the world" view**: the data now supports
  share-of-world-production per commodity at build time.
- **Overview tab curation**: nine domains make the dossier long; the
  Overview highlights strip may deserve a rethink (currently first-metric
  driven).
- **SIPRI direct** (arms transfers) and **UNHCR refugees** are natural next
  domains; both publish machine-readable data with clean licensing.
- The **journey/chronicle corpus is now ~291k words** — an llms-full.txt or
  per-nation markdown export for GEO would be nearly free (all data is
  build-time).

## 12. File map (quick reference)

- `CLAUDE.md` — architecture map (current). `DECISIONS.md` — D1–D13.
  `DESIGN.md` — pigment/colour system. `docs/statehood-*.md` — statehood
  editorial criteria and ledger.
- Histories: `lib/histories/{index.ts,france.ts,data/*.json}`; validator
  `scripts/validate-histories.mjs`.
- Domains: `scripts/build-<domain>.mjs`, shared `scripts/lib/{domain,wb,codes}.mjs`,
  access `lib/domains/index.ts`, schema+meta `lib/types.ts`, defs
  `lib/metric-defs.ts`, formats `lib/format.ts`, validator
  `scripts/validate-domains.mjs`, series `scripts/build-series-index.mjs`.
- Dossier UI: `components/dossier/` (Dossier owns modal state + URL hash;
  MetricDetail/MetricChart/MetricMap; choropleth ramp in `lib/choropleth.ts`).
- Journey/chronicle: `components/journey/`, `app/country/[code]/{page,history,chronicle}`.
- Cross-nation: `lib/chronology.ts` → `app/timeline`, `app/themes`.
- SEO: `lib/seo.ts`, `app/{sitemap,robots}.ts`, `scripts/indexnow.mjs`.
- Globe: `components/{GlobeLite.tsx,globe-render.ts,globe.worker.ts}`
  (GlobeScene.tsx is the retired three.js reference — never re-import).

---

*Compiled 2026-08-11 after full execution and independent re-verification of
`docs/content-expansion-plan.md`. Repo state at commit `f5546dd`; working
tree clean except the two SovereigntyBar files (§9).*
