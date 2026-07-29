# Refreshing the dossier data

The dossier's 26 indicators are **baked to committed JSON**, never fetched at runtime.
That means refreshing them is a deliberate, reviewable act: you run the builders, read
the diff, and commit it. This document is the runbook.

**Cadence:** World Bank WDI publishes on a roughly annual cycle (with rolling
corrections). Once a year is right; more often is wasted network traffic against a
dataset that has not moved.

**Current vintage:** `2026-06` (economy, society, geography, resources, military:
2026-06-14; technology: 2026-06-15). This is stamped visibly in the footer of every
dossier, so a reader always knows how old the figures are.

---

## The one-liner

```bash
npm run refresh-domains
```

which is exactly:

```bash
npm run build-data      # 1. countries.json + globe geojson + globe-still.svg
npm run build-domains   # 2. all six domains → validate → series index
```

**Order matters.** `build-data.mjs` writes `data/countries.json`, and every domain
builder reads it to reconcile country codes. Running the domain builders first will
silently reconcile against a stale country list.

---

## What each step does

### 1. `npm run build-data`

- `scripts/build-data.mjs` → `data/countries.json` + `public/data/countries.geo.json`
  (emitted at 2-decimal coordinate precision, ~1.1 km — invisible at globe zoom, and
  it takes the geojson from 257 KB to 176 KB. Raise `COORD_DP` if a view ever needs
  true coastline detail.)
- `scripts/build-globe-still.mjs` → `public/globe-still.svg`, the zero-JS first paint.

### 2. `npm run build-domains`

Runs, in order:

| Script | Domain | Upstream |
|---|---|---|
| `build-economy.mjs` | economy | World Bank WDI |
| `build-society.mjs` | society | World Bank WDI |
| `build-technology.mjs` | technology | UNESCO UIS, ITU, World Bank WDI |
| `build-geography.mjs` | geography | World Bank WDI |
| `build-resources.mjs` | resources | World Bank WDI |
| `build-military.mjs` | military | SIPRI (redistributed by World Bank) |
| `validate-domains.mjs` | — | asserts every `sourceId` resolves |
| `build-series-index.mjs` | — | `public/data/series/<metricKey>.json` |

Most builders go through `scripts/lib/domain.mjs` → `buildWbDomain(domain, indicators,
source)`, which pulls each indicator via `scripts/lib/wb.mjs` (the World Bank
Indicators API — free, no key, retry-hardened) and keeps the latest non-null value
plus a trailing series for sparklines.

An indicator may carry its own `source` to override the domain default — that is how
technology attributes R&D to UNESCO UIS and connectivity to ITU rather than crediting
everything to the World Bank, which merely redistributes them. **Only sources actually
referenced end up in the file.**

---

## After the refresh — the checklist

```bash
npm run validate        # must be 0 errors
npx tsc --noEmit
npm run build
```

Then **read the diff before committing**:

```bash
git diff --stat data/domains/
```

Things worth a second look:

- **A metric that went from a value to `null`.** The World Bank does withdraw series.
  This is fine — the dossier renders "—" and says so honestly — but it should be a
  known change, not a surprise.
- **A large swing in a `value`.** Usually a rebasing (e.g. GDP re-based to a new
  constant-dollar year) rather than a real-world event. The `year` field moving
  alongside it is the tell.
- **A change in the `sources` block.** If an upstream provider changed its label or
  URL, the citation text on every dossier changes with it.
- **Country coverage.** Non-UN and contested states (Taiwan, Somaliland, …) are
  partially or wholly absent from World Bank data and degrade gracefully. Taiwan and
  North Korea are populated from named non-WB sources — see
  `scripts/build-nonwb.mjs`, which must run *after* the WB builders so it can fill
  gaps without being overwritten.

---

## Updating the visible vintage

The footer vintage is derived from the `updated` field each builder writes into its
domain file, so it moves on its own. Nothing to edit by hand.

If you need to state it in prose (README, this file), read it from the data rather
than from memory:

```bash
node -e "for (const d of ['economy','society','technology','geography','resources','military']) console.log(d, require('./data/domains/'+d+'.json').updated)"
```

---

## Gotchas

- **Code reconciliation lives in `scripts/lib/codes.mjs`** — one source of truth,
  shared with `build-data.mjs`. World Bank ISO3 ≈ Natural Earth ADM0_A3; the
  exceptions are `XKX→KOS`, `SSD→SDS`, `ESH→SAH`. Add new exceptions there, never
  inline in a builder.
- **Metric `key`s must be globally unique across domains.** The key is both the
  series file name and the client's only lookup handle. `build-series-index.mjs`
  throws on collision rather than silently overwriting.
- **The WB API is rate-limited and occasionally flaky.** `wb.mjs` retries with
  backoff. A full refresh takes a few minutes; that is expected, not a hang.
- **Do not expand the metric set casually.** Every metric is a card on a dossier and
  a file in the series index. Adding one is a design decision, not a data decision.

---

## Future work

USGS physical mineral production and reserves would substantially enrich the
`resources` domain, which is currently a first cut from World Bank resource-rents and
electricity access. That is logged as future work, not part of the current scope.
