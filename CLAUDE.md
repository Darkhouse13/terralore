@AGENTS.md

# Terralore — architecture notes

Interactive 3D-globe encyclopedia of nations. Spin globe → click country →
basic-info card → **dossier** (multi-domain, sourced data) → optional cinematic
history journey. The north star is "Quartr for nations" — every domain of a nation
(economy, society, geography, military, …, plus history) in one beautiful, sourced,
spatial view. See the `vision-nations-encyclopedia` memory.

## Map of the codebase

- `app/page.tsx` → home (server); computes published-history index + economy
  headlines, renders `AtlasHome`.
- `app/country/[code]/page.tsx` → **dossier route** (SSG). Loads `getDossier(code)`
  + `getCountry` + `getHistory`, renders the `Dossier`. Every valid code renders
  (Overview from `CountryMeta` even with no domain data).
- `app/country/[code]/history/page.tsx` → the cinematic history journey (SSG).
  Renders `TimeJourney` if a history exists, else a dark `StubScreen`. Launched from
  the dossier's history hero.
- `app/atlas/page.tsx` → searchable index of all nations.
- `components/GlobeScene.tsx` → client-only globe (react-globe.gl). Antique-atlas look:
  parchment land polygons on a deep-ocean sphere, brass atmosphere. Accessor callbacks
  are typed `(o: object)` and cast to `Feature` (the lib types accessors as `object`).
- `components/CountryCard.tsx`, `AtlasHome.tsx`, `AtlasIndex.tsx`, `Starfield.tsx`.
- `components/dossier/` → the data dossier. `Dossier.tsx` (client) — header, tabbed
  domain panels (Overview + one per available domain), history hero, sources footer.
  `DomainPanel` → grid of `MetricCard`s; `Sparkline` → bespoke SVG (no chart lib).
- `components/journey/` → the country experience. NOT an article — a cinematic,
  navigable time-journey you pilot moment-by-moment:
  - `TimeJourney.tsx` (client) — full-screen dark stage; keyboard (←/→/space), wheel,
    swipe and click-to-jump navigation; intro → per-era (era-intro + events) → outro.
  - `TimelineRail.tsx` — the scrubber: era bands, category-tinted ticks, playhead.
  - `ChapterDrawer.tsx` — a parchment "archive page" that slides in for the full,
    sourced prose on demand (depth without forcing reading).
- `lib/journey.ts` → `buildMoments(history)` flattens eras → navigable moments.
- `lib/types.ts` → `CountryMeta` + `CountryHistory` + `CATEGORY_META` + the dossier
  schema (`Metric`, `DomainSection`, `DataSource`, `CountryDossier`, `DOMAIN_META`).
- `lib/countries.ts` → metadata access (imports `data/countries.json`).
- `lib/domains/index.ts` → dossier access: `getDossier(code)`, `getDomain`, `getMetric`,
  `hasDomainData`. Imports the committed `data/domains/*.json` and registers them in `FILES`.
- `lib/format.ts` → JSON-free formatters (`formatMetric` dispatches by unit), client-safe.
- `lib/histories/` → the registry (`index.ts`) + `france.ts` + `data/*.json`.

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
  domain default; only sources actually referenced are written to the file.
- Code reconciliation lives in `scripts/lib/codes.mjs` (one source of truth, shared with
  `build-data.mjs`). World Bank ISO3 ≈ ADM0_A3; the exceptions are `XKX→KOS`, `SSD→SDS`,
  `ESH→SAH`. **`build-data.mjs` must run before the domain builders** (they read `data/countries.json`).
- Domains live (tab order): economy, society, technology, geography, resources, military.
  Economy/society/geography use World Bank WDI; military is WB series sourced from **SIPRI**
  (attributed via `wb-sipri`); technology attributes each indicator to its real upstream —
  R&D/researchers to **UNESCO UIS** (`wb-unesco`), connectivity to **ITU** (`wb-itu`),
  high-tech exports to WB WDI. Resources is a first cut from WB resource-rents + electricity
  access; USGS physical mineral production/reserves can enrich it later.
- Register a new domain by importing its JSON in `lib/domains/index.ts` and adding it to
  `FILES` (insertion order = dossier tab order).
- **Refresh:** `npm run build-domains` (rebuilds all domain files + validates + rebuilds the
  series index). WB updates ~annually. `npm run validate` runs history + domain validators.
- **Metric window:** a metric card opens the `MetricDetail` modal (`components/dossier/`) with
  the full interactive `MetricChart`. Two lenses: **value** over time, or **world rank** over
  time (`#1` = highest, axis inverted). Readers can overlay other nations or the world average.
  Those series are lazy-fetched client-side from `public/data/series/<metricKey>.json` — one
  small file per metric, built by `scripts/build-series-index.mjs` (chained into
  `build-domains`, or `npm run build-series`), mirroring how the globe fetches `/data/*.json`.
  **Metric `key`s must be globally unique across domains** (the file name + the client's only
  lookup handle) — the builder throws on collision.
- **Spatial map:** the window's `🗺 Map` toggle reveals `MetricMap` — a flat, dependency-free
  SVG world choropleth coloured by the open metric (equirectangular projection of the same
  `public/data/countries.geo.json` the globe uses). The home nation glows brass, compared
  nations are outlined in their chart colours, and **clicking a nation toggles it in the
  comparison** — map, chart and legend move together. The ramp + percentile scale live in
  `lib/choropleth.ts` (pure, no three.js), shared with `GlobeScene` so both views tint identically.
- The modal is rendered **once at the `Dossier` level** (not per card): the Dossier owns the
  open metric + comparison + lens + map state so it can mirror them to the URL hash
  (`#m=<key>&tab=<tab>&c=<codes>&v=rank&map=1`) via `replaceState` — shareable deep links that
  reopen the window in-state on load. `MetricCard` is presentational and just calls `onOpenMetric`.
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
  define pseudo-elements (use a plain class, e.g. `.paper-grain::before`).
- react-globe.gl touches `window`; it's loaded via `next/dynamic` `{ ssr: false }`.
- Turbopack dev does NOT type-check — always run `npx tsc --noEmit` before declaring done.
- A stray `pnpm-lock.yaml` in the home dir confuses Turbopack's root inference; pinned
  via `turbopack.root` in `next.config.ts`.
