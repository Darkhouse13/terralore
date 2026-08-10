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
- `app/atlas/page.tsx` → searchable index of all nations.
- `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx` → the discovery
  surface. All three derive from `lib/seo.ts`.
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
- The landing page's staggered entrance is a **CSS animation** (`.reveal` /
  `.reveal-fade` in `globals.css`, stagger via `--reveal-delay`), not React state.
  It used to be `useState(entered)`, which held every element at `opacity: 0` until
  hydration — and an `opacity: 0` element is not LCP-eligible, so the hero paragraph
  measured a 7.6s LCP on text that was server-rendered all along. Do not reintroduce
  a JS-gated entrance.
- **The globe is GlobeLite — no three.js anywhere on the site.** Three files:
  `components/globe-render.ts` (pure renderer: orthographic projection with
  per-vertex trig precomputed at load, so a frame is multiplications only),
  `components/globe.worker.ts` (an **OffscreenCanvas worker** that owns all
  rasterisation — the main thread never draws a pixel, so TBT is
  architecturally immune to the globe; measured 0 ms over 6 s of spinning at
  retina DPR under 4× CPU throttle), and `components/GlobeLite.tsx` (React:
  pointer→drag/hover/select, the tiny view simulation, tooltip). Same
  behaviours as the old WebGL globe: auto-rotate 1.92°/s, drag-to-spin,
  hover tooltip, click → 900 ms fly-to + brass rings, choropleth fills.
  Falls back to main-thread rendering where OffscreenCanvas is missing.
  `GlobeScene.tsx` (three.js) is retired but kept as the reference — do not
  re-import it into the landing chunk. Wheel zoom stays off: the home scrolls
  past the globe, and a wheel-zooming canvas is a scroll trap; on touch,
  `touch-action: pan-y` keeps vertical swipes scrolling the page.
- `public/globe-still.svg` (generated by `scripts/build-globe-still.mjs`, same
  geojson + palette, framed at the globe's opening view) is the zero-JS first
  paint; it fades once the canvas draws the identical frame. Its geometry
  (`radiusFor`/`centerYFor` in globe-render.ts) must stay in step with the
  still's proportions or the handover jumps.
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
