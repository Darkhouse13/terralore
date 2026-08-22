# Terralore Chronicle Events 1.0.0

Creator and publisher: Terralore. Released 2026-08-22.

This package contains 4,564 curated historical events from 184 published country chronicles, linked to 3,922 country-scoped source records.

## Suggested citation

Terralore (2026). *Terralore Chronicle Events* (Version 1.0.0) [Data set]. https://terralore.co/datasets/chronicle-events

## Files

- `events.csv` — one row per stable Terralore event claim.
- `event-sources.csv` — the many-to-many event/source relation.
- `sources.csv` — source metadata; `source_key` is `<ADM0_A3>:<source_id>`. Empty `license` or `accessed` cells mean that metadata was not recorded; they do not imply permission, public-domain status, or that a URL was unreachable.
- `events.ndjson` — the event rows with their source keys embedded.
- `datapackage.json` — machine-readable package metadata and resource hashes.
- `LICENSE.md` — scope of Terralore's CC BY 4.0 declaration.
- `SHA256SUMS` — checksums for every other file.

## Method limits

This is a curated reference corpus, not an exhaustive event census. Event counts must not be interpreted as historical activity, severity, or importance. Dates can be approximate; BCE years are negative integers; categories are editorial; and country codes follow Natural Earth ADM0_A3, which is not always ISO alpha-3.

History content is updated through 2026-08-22. Stable `claim_id` values resolve to the canonical Terralore page and fragment in `canonical_url`.
