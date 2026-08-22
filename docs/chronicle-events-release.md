# Chronicle Events release plan

The first citable Terralore dataset will be the Chronicle Events corpus. It is
already the site's most distinctive, defensible asset: stable claim IDs,
canonical fragments, authored summaries, explicit source links, deterministic
generation, and corpus integrity machinery all exist today.

## Draft package

Build an unpublished package with:

```bash
npm run build-chronicle-release -- --out=release-drafts/chronicle-events/1.0.0
```

The package contains `events.csv`, `event-sources.csv`, `sources.csv`,
`events.ndjson`, `datapackage.json`, `LICENSE.md`, `README.md`, and
`SHA256SUMS`. The builder refuses to put a draft version inside `public/`.
`npm run validate` regenerates the package in memory, checks referential
integrity, and verifies deterministic bytes and checksums.

## Publication gates

Release 1.0.0 was prepared on 2026-08-22. Its publication gates are:

1. **Complete (2026-08-22):** the fresh full audit found two additional hard
   failures after the previous 43 were replaced; both are repaired. The current
   3,759-URL report contains zero URLs classified `gone`.
2. **Complete (2026-08-22):** licence scope approved. Terralore-authored
   summaries and compilation structure are CC BY 4.0; third-party source
   records are citations and do not relicense the underlying works.
3. **Complete (2026-08-22):** creator and publisher are Terralore, with the
   suggested citation embedded in the package and landing page.
4. **Complete (2026-08-22):** the final package is version 1.0.0 and the
   validator byte-compares every committed file against a deterministic rebuild.
5. **Complete (2026-08-22):** release files are part of seal `2026-08-22`; the
   server-rendered `/datasets/chronicle-events` page exposes `Dataset` and
   `DataDownload` structured data.
6. **Partly complete (2026-08-22):** the exact bytes, Data Package metadata,
   package checksums, and a deterministic archive are published in GitHub
   Release `chronicle-events-v1.0.0`. A persistent DOI remains pending because
   no Zenodo credential or confirmed GitHub–Zenodo integration is available.

## Method statement

The release is a curated reference corpus, not an exhaustive census of world
events. Counts do not measure historical activity, severity, or importance.
Dates may be approximate, BCE years use negative integers, categories are
editorial, and country codes follow Natural Earth ADM0_A3 rather than always
matching ISO 3166-1 alpha-3.
