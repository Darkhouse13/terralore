@AGENTS.md

# Terralore — architecture notes

Encyclopedia of nations in the **STRATA × SHOW THE WORK** design world
(DESIGN.md v2; binding contracts `docs/design/p3-contract.html` for the phone
and `docs/design/p4-desktop-contract.html` for ≥1024px — the bench build,
deviations E14; the phone rendering is pixel-frozen): the earth in
section — history in beds (depth = time, down is older), data as specimen rows
that proof-flip to their observation label, the section cut as world
navigation. No globe, no canvas, no WebGL anywhere. The north star is "Quartr
for nations" — every domain of a nation (economy, society, …, plus history) in
one beautiful, sourced view. See the `vision-nations-encyclopedia` memory.

## Map of the codebase

- `app/page.tsx` → **the front door** (server, zero client components): five
  beds walking the palette in stratigraphic order; the Overture is pure CSS
  (bed-settle bottom-up, rule-draw, transform-only stamp, oxide dot last,
  ≤1.1s), replayed once per session via an inline parse-time script setting
  `.no-overture` on `<html>`.
- `app/country/[code]/page.tsx` → **dossier route** (SSG). Loads `getDossier(code)`
  + `getCountry` + `getHistory`, renders the `Dossier`. Every valid code renders
  (Overview from `CountryMeta` even with no domain data).
- `app/country/[code]/history/page.tsx` → the cinematic journey — **PARKED**:
  live behind its URL, still in the sitemap, but no surface links to it
  (deviations E8). It keeps the retired deep palette + the `motion` dep
  (route-split, so nothing else pays for it). Revisit as its own mission.
- `app/country/[code]/chronicle/page.tsx` → **the reading depth** (SSG, server-only).
  The same history as one long-form document: every era, event, figure and reference
  in the initial HTML. The journey paints one moment at a time, so it is a good
  experience and a nearly invisible document — before this route, ~6.6% of the
  corpus's ~600k authored words reached the HTML at all. Both routes are two
  presentations of one entity; the JSON-LD `Article` keeps its canonical `@id` on
  the chronicle so engines consolidate onto the readable one.
- `app/timeline/` + `app/themes/` → the corpus read **across** nations: events
  bucketed by period and by category. Derived at build time from the same verified
  history files (`lib/chronology.ts`) — nothing here is authored separately, so a
  chronology entry is always the same record, with the same sources, as the one on
  its nation's chronicle.
- `app/atlas/page.tsx` → **THE SECTION CUT**: continents as beds, nations as
  seams, Antarctica as the absence-hatched bed; client search via
  `AtlasIndex` (the one client component on the navigation path).
- `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx` → the discovery
  surface. All three derive from `lib/seo.ts`.
- `components/strata/` → the shared physics: `ProofFlip.tsx` (client — press
  flips, release returns, keyboard latches) + `ProofBack.tsx` (the standard
  basalt reverse). Faces GRID-STACK in one cell (`.flip-face` in globals.css):
  the row sizes to its taller face — never hardcode a face height; surfaces
  set `min-h-*` for row rhythm only. Server surfaces use the CSS-only variant
  instead (`.flip-press` + `.proof-toggle` checkbox — deviations E9).
- `components/dossier/` → the nation page. `Dossier.tsx` (client) — era beds
  (newest on top), the core-pull (0.5× resistance, 90px commit, 460ms; header
  owns the gesture, arms only at scrollY ≤ 4), specimen rows per domain, the
  URL-hash metric-window contract `#m=<key>&tab=<tab>&c=<codes>&v=rank&map=1`
  that rankings/commodities deep-link against. `MetricDetail` is a
  next/dynamic on-demand chunk (chart + rank + map on an opaque bone sheet).
- `components/journey/` → the parked journey's components (see the route note
  above) — untouched, unlinked, do not grow them.
- `lib/journey.ts` → `buildMoments(history)` flattens eras → navigable moments.
- `lib/chronology.ts` → flattens the whole corpus into nation-tagged `WorldEvent`s,
  bucketed into `Period`s (centuries; millennia before 1000 BCE; one `deep-prehistory`
  bucket below 10,000 BCE, since the corpus reaches the Laetoli footprints at 3.6 Ma
  and per-millennium pages there would hold one event each) and `Theme`s (by
  `EventCategory`). Memoised; build-time only.
- `lib/seo.ts` → the single definition of the origin, route shapes and JSON-LD
  builders. Anything emitting a URL — canonical tags, sitemap, structured data —
  goes through here so the three cannot drift apart.
- `lib/types.ts` → `CountryMeta` + `CountryHistory` + `CATEGORY_META` + the dossier
  schema (`Metric`, `DomainSection`, `DataSource`, `CountryDossier`, `DOMAIN_META`).
- `lib/countries.ts` → metadata access (imports `data/countries.json`).
- `lib/domains/index.ts` → dossier access: `getDossier(code)`, `getDomain`, `getMetric`,
  `hasDomainData`. Imports the committed `data/domains/*.json` and registers them in `FILES`.
- `lib/format.ts` → JSON-free formatters (`formatMetric` dispatches by unit), client-safe.
- `lib/histories/` → the registry (`index.ts`) + `france.ts` + `data/*.json`.
- **The Living Record** (`docs/living-record.md`, DECISIONS D14) — three layers:
  - **Claims** — every rendered observation is an addressable claim
    (`TL:<subject>:<measure>:<vintage>`; identity excludes the value).
    `lib/claim-id.ts` (pure, client-safe) + `lib/claims.ts` (bundle composer)
    → committed `public/**/*.claims.json`; proof-flip reverses engrave the ID;
    stable fragments per claim. `build-claims`/`validate-claims` (twin
    pattern); `validate-claim-fragments.mjs` asserts every fragment against
    prerendered HTML in `npm run ci`.
  - **The Seal** — `scripts/build-integrity.mjs` hashes the whole corpus
    (sources + claims + twins) into `public/integrity.json`, archived
    append-only at `public/integrity/<version>.json`; `/integrity` explains it
    (tamper-evidence, not tamper-proofing). Cut DELIBERATELY at publish points
    (never chained into build-domains); `validate-integrity.mjs` gates
    `npm run ci`. `lib/seo.ts` stamps `CORPUS_VERSION` into every Dataset node.
  - **The Recorder** — `scripts/record-refresh.mjs` diffs two corpus states
    claim-by-claim (snapshot via `scripts/lib/claims-snapshot.mjs`, works on
    any git ref) into `/ledger` entries (`public/ledger/<NNNN>.json`,
    append-only, fetchable, sealed): NEW / REVISED (upstream vs terralore,
    never conflated) / RETIRED (absence recorded) / SOURCE. `lib/ledger.ts`
    reads them; the nation page's RECORD bed (deviations E15) shows each
    nation's changes with claim links. Language law validator-enforced
    (`validate-ledger.mjs`): publication verbs only, points for bounded
    scales. Refresh runbook: `docs/refresh-domains.md` §Recorded refreshes;
    monthly detection dry-run runs on the social-runner (publishes nothing).
- `scripts/build-social.mjs` + `scripts/lib/social/` → the daily social artifact
  (see `docs/social-surface.md`): renders cards + a per-day manifest into
  gitignored `social-out/`, deterministic per (date, `data/social-ledger.json`).
  Runs OUTSIDE `next build`, via next's own compiled satori/resvg with fetch
  stubbed to throw (committed font subsets in `assets/fonts/`; no emoji — flags
  never reach cards). `scripts/validate-social.mjs` is in `npm run validate`.

## Canonical country code

Everything keys on **Natural Earth `ADM0_A3`** (e.g. FRA, DEU, USA). `ISO_A3` is `-99`
for France/Norway/etc., so we never use it. The globe geojson, `data/countries.json`,
and every history file all use ADM0_A3.

## Adding a nation's history

1. Author `lib/histories/data/<name>.json` matching `CountryHistory` (see `lib/types.ts`).
   - 5–6 eras; each era has `body[]` (reading prose), `events[]`, optional `figures[]`.
   - Events reference sources by id; **every referenced id must exist in `sources[]`**.
   - `year` is numeric (BCE negative); `yearLabel` is the display string.
2. Register it in `lib/histories/index.ts` under its ADM0_A3 code.
3. Run `node scripts/validate-histories.mjs` (must report 0 errors).
4. `npx tsc --noEmit` and `npm run build` to confirm.

Content rule: **only verified claims, each traceable to a reliable source** (Britannica,
UNESCO, national archives/museums, academic refs). Prefer stable top-level URLs over
deep paths that rot.

## The data dossier (multi-domain)

Per-nation data is **baked to committed JSON at build time** (never fetched at runtime),
mirroring the history pipeline. One file per domain under `data/domains/<domain>.json`,
keyed on canonical ADM0_A3, shaped `{ domain, updated, sources, data: { CODE: { metrics } } }`.

- Builders: `scripts/build-<domain>.mjs`. Most use `scripts/lib/domain.mjs` →
  `buildWbDomain(domain, indicators, source)`, which pulls each indicator via
  `scripts/lib/wb.mjs` (World Bank Indicators API — free, no key, retry-hardened) and
  keeps the latest non-null value + a trailing series for sparklines. An indicator may
  carry its own `source` (the true upstream provider WB redistributes) to override the
  domain default; only sources actually referenced are written to the file. It may also
  carry `wbSource` (pins the API database id — the WGI series live in database 3, not the
  default WDI one) and `floor` (discards observations of impossible magnitude; see the
  Somalia case in `build-education.mjs` — the bar is impossibility, never extremity).
- Code reconciliation lives in `scripts/lib/codes.mjs` (one source of truth, shared with
  `build-data.mjs`). World Bank ISO3 ≈ ADM0_A3; the exceptions are `XKX→KOS`, `SSD→SDS`,
  `ESH→SAH`. **`build-data.mjs` must run before the domain builders** (they read `data/countries.json`).
- Domains live (tab order): economy, society, governance, health, education, technology,
  geography, resources, military. Economy/society/geography use World Bank WDI; military is
  WB series sourced from **SIPRI** (attributed via `wb-sipri`); technology attributes each
  indicator to its real upstream — R&D/researchers to **UNESCO UIS** (`wb-unesco`),
  connectivity to **ITU** (`wb-itu`), high-tech exports to WB WDI. Governance is the six
  **Worldwide Governance Indicators** (`wb-wgi`) — 0–100 *absolute* scores anchored to two
  hypothetical benchmark performers, **not percentile ranks**, and model estimates from
  perception surveys rather than measurements; label them accordingly. Health splits between
  **WHO GHO** (`wb-who`) and the **UN IGME / WHO-UNICEF** estimates (`wb-unicef-who`);
  education is **UNESCO UIS** throughout. Resources is WB resource-rents + electricity access
  **plus** physical mineral production for ten commodities from the **USGS Mineral Commodity
  Summaries** (`usgs-mcs`), merged in afterwards by `scripts/build-minerals.mjs` — which
  resolves its CSV from the ScienceBase item id at the top of the file. Bump that id once a
  year when the next MCS edition lands.
- Register a new domain by importing its JSON in `lib/domains/index.ts` and adding it to
  `FILES` (insertion order = dossier tab order).
- **Refresh:** `npm run build-domains` (rebuilds all domain files + validates + rebuilds the
  series index). WB updates ~annually. `npm run validate` runs history + domain validators.
- **Metric window:** a specimen row's `→` button opens `MetricDetail`
  (`components/dossier/`, a next/dynamic on-demand chunk) with the full
  interactive `MetricChart`. Two lenses: **value** over time, or **world rank**
  over time (`#1` = highest, axis inverted); plus the `MetricMap` flat SVG
  choropleth (ramp = the bed walk, sand → clay → umber, in `lib/choropleth.ts`).
  Series lazy-fetch from `public/data/series/<metricKey>.json`, built by
  `scripts/build-series-index.mjs`. **Metric `key`s must be globally unique
  across domains** — the builder throws on collision.
- The window is rendered **once at the `Dossier` level**: the Dossier owns the
  open metric + comparison + lens + map state so it can mirror them to the URL
  hash (`#m=<key>&tab=<tab>&c=<codes>&v=rank&map=1`) via `replaceState` —
  shareable deep links that reopen the window in-state on load. Rankings and
  commodity pages deep-link against this contract.
- Every `Metric` carries `value`, `year` (vintage), `unit`, and a `sourceId` that **must
  resolve** in the file's `sources` — `scripts/validate-domains.mjs` enforces this, the
  same trust rule as histories. Missing data is `null` → renders "—"; non-UN/contested
  states (Taiwan, Somaliland, …) are partially/wholly absent from WB and degrade gracefully.

**Neutrality:** the dossier reports sourced figures with their provenance and shows gaps
honestly rather than imputing. Disputed/contested territories are surfaced with the data
that exists (and its caveats), never by silently picking a side — consistent with the
history corpus's neutral, primary-sourced treatment of disputes.

## Gotchas

- Tailwind v4: theme tokens live in `@theme` in `app/globals.css`; `@utility` cannot
  define pseudo-elements (use a plain class).
- Turbopack dev does NOT type-check — always run `npx tsc --noEmit` before declaring done.
- **The design system is STRATA** (DESIGN.md v2, contract in `docs/design/`):
  seven pigments, three self-hosted faces (`app/fonts.ts` ← `assets/fonts/*.woff2`,
  regenerated by `scripts/build-strata-fonts.mjs` — **no runtime Google Fonts**),
  one mass curve. Rules are 2px basalt or absent; no transparency/blur/shadows;
  the only radius is the `.pill`. Contrast is proven twice: the palette by
  `scripts/check-contrast-strata.mjs` (arithmetic, 23 pairs) and the USAGE by
  `scripts/contrast-sweep.mjs` (computed styles over every shipped surface —
  needs `CHROME_PATH` + the site served on :3311). The old
  `check-contrast.mjs` is frozen with an in-flight SovereigntyBar diff — do
  not touch it. Element defaults in `globals.css` live in `@layer base` so
  text utilities outrank them — never add an unlayered element rule (the
  unlayered `a { color }` once beat `.text-bone` and shipped a 2.9:1 chip).
- **Entrances are two grades and the difference is load-bearing**: `.settle`
  is TRANSFORM-ONLY (LCP-safe — use for content); `.settle-fade` adds opacity
  and exists only for the front door's overture beds, which are never the LCP.
  An `opacity: 0` element is not LCP-eligible — the 7.6s-LCP lesson survives
  every redesign. Do not reintroduce a JS-gated or opacity-gated entrance on
  content.
- **The proof-flip has two implementations, one physics**: client
  `ProofFlip` (dossier — needs the chart button + proof-view state) and the
  CSS-only `.flip-press`/`.proof-toggle` pattern on server surfaces
  (rankings/compares/commodities — zero hydration). Both are 320ms rotateX on
  the mass curve with a basalt reverse. Keep them in step.
- **No emoji anywhere in rendered output** (flags included) — the committed
  font subsets carry none, and satori would try to fetch them (the card path
  has fetch fused shut). Codes are the mark.
- **Analytics load `lazyOnload`** (after TTI) — the tag's ~250ms of throttled
  main-thread work must not count against the pages it measures. Lighthouse
  floor: ≥95 performance + accessibility, mobile, on every surface class
  (`scripts/lighthouse.mjs`).
- **JSX seam check**: this compiler drops the leading space of text after an
  expression boundary; explicit `{" "}` is load-bearing.
  `scripts/validate-seams.mjs` scans every prerendered page post-build (in
  `npm run ci`) and fails on word-jams.
- **Prefetch discipline:** link-dense pages (atlas grid, timeline hub, theme
  indexes, chronicle footer) set `prefetch={false}` — App Router's default
  prefetch downloads the full payload per static link, which on a 60-link hub
  page means tens of MB of background traffic for nothing.
- **Deploy path:** Coolify on the same Hetzner box; GitHub webhook goes through
  `https://coolify.qalame.xyz/...` (443 via Traefik) because inbound :8000 and
  UDP:443 are blocked upstream of the VM. Traefik's HTTP/3 advertisement was
  removed for that reason — re-enabling `--entrypoints.https.http3` without
  opening UDP 443 at the cloud level will silently stall every Chrome visitor
  on blackholed QUIC (30-day alt-svc memory) for every app on the box.
- `public/data/countries.geo.json` is emitted at 2-decimal coordinate precision
  (~1.1 km, invisible at globe zoom) — 257 KB → 176 KB. Raise `COORD_DP` in
  `scripts/build-data.mjs` if a view ever needs true coastline detail.
- A stray `pnpm-lock.yaml` in the home dir confuses Turbopack's root inference; pinned
  via `turbopack.root` in `next.config.ts`.
