# The social surface — daily output as a deterministic build artifact

Written 2026-08-11, at the end of the mission that built the social render +
editorial layer. Read alongside `docs/brand-codification.md` (the placement
contract these cards consume), `docs/compare-surface.md` §1 and §4 (the
neutrality and display-language rules the captions inherit) and
`docs/geo-surface.md` (the citation template the caption's citation line
follows). Three commits: the render layer, the editorial engine, the manifest
generator + this document — each gated on `npm run validate` + `tsc` + a
constrained build.

**What this is:** `npm run build-social -- --date YYYY-MM-DD` renders one
day's social assets and a machine-readable manifest into
`social-out/YYYY-MM-DD/`. Nothing posts anything — the deliverable is the
artifact; a downstream publisher consumes the manifest under the contract in
§6. `--range START END` backfills batches (cap 62 days);
`--review-sheet` additionally drops a contact sheet of the day into
`design-review/16-social/week/`.

## 1. Why a build artifact, and why not inside `next build`

The site's own build must not grow a render farm, and the social cadence
(daily) is not the deploy cadence. So the pipeline is a separate script with
a separate, gitignored output directory — but it runs on the repo's own
truth: subjects are assembled from the SAME lib modules the pages render
from (`lib/rankings`, `lib/commodities`, `lib/compare`, `lib/histories`
through the ts-alias loader), so a card can never disagree with the page it
trails. Factual identity by construction, exactly as `lib/geo.ts` achieves
it for the markdown twins.

Determinism is the second contract: same date + same committed ledger state
→ byte-identical output, proven by running the 7-day range twice and
diffing sha256 over every PNG and manifest. No timestamps enter the
manifest; no `Math.random` enters the pipeline (the only randomness is the
house PRNG seeded by the date and by each surface's own identity).

## 2. The render layer (`scripts/lib/social/`)

- **Renderer** — next's own compiled `@vercel/og` (satori + resvg) driven
  from node: the exact pipeline the OG routes run at build, zero new
  rendering dependencies, byte-compatible typesetting with the cards the
  site already ships. `render.mjs` stubs `fetch` TO THROW during a render:
  satori's fallback for a glyph its fonts lack is a Google Fonts fetch, and
  the card path must stay offline — a missing glyph (or an emoji reaching a
  card) fails the run loudly. This is also why **nation flags never appear
  on cards** (they are emoji); nations carry their name, with the ADM0_A3
  code in the mono voice where a mark is needed.
- **Faces** — three committed files, read from disk: Geist Regular (next's
  own file, FIRST in the list so satori's per-glyph fallback stays local),
  `assets/fonts/literata-social-subset.ttf` (display AND reading voice;
  Latin + Latin-Extended instanced at wght 420 / opsz 36 — the wordmark
  subset's instance, one voice) and `assets/fonts/plexmono-social-subset.ttf`
  (IBM Plex Mono Regular — years, codes, eyebrows, source lines).
  Regeneration (same workflow as the wordmark subset,
  `docs/brand-codification.md`): `subset-font` over the Google Fonts
  variable/static TTFs with the charset in the recipe — printable ASCII +
  Latin-1 + Latin Extended-A + `ʿ–—‘’“”…·•°′″‰₂€×−` — instanced at
  `{ wght: 420, opsz: 36 }` for Literata. The charset is deliberately
  broader than the corpus's measured 130 distinct characters, so a new
  diacritic in a history edit does not knock a glyph out of the face.
- **Formats** — PIN 1000×1500 (2:3), VERTICAL 1080×1350 (4:5); carousel
  slides share the vertical frame. All compositions sit on the ZENITH shell
  (`ui.mjs`): deep ground, mono eyebrow, signature corner, strata baseline
  seeded by the surface's own identity — the compare card's strip is seeded
  by the pair slug, the same strip its page and OG card draw. **No CTA
  furniture**: no arrows, no "link in bio", no baked URLs — these are
  editorial artifacts; the caption carries the URL.
- **Card types** (`cards.mjs`) — `on-this-day` (the record's date claim,
  title, summary, category chip in the pigment system, provenance line);
  `ranking` (top-10 verdigris strip that always names how many nations are
  ranked in full, per-row vintages when mixed, the WGI absolute-scores
  caveat when applicable); `commodity` (share-of-world bars that always
  draw the Rest-of-world residual); `compare` (two figures side by side in
  slug order, "Figures compared, never graded" as the stat line). Carousels:
  ranking top-10 as cover + 3 slides; formation stories as cover + one
  slide per key era event (cap 6, chosen per era by category priority
  founding > independence > politics > colonization > war, earliest on
  ties — deterministic, no seed).

## 3. The calendar (`calendar.mjs`)

`planDay(iso, ledger)` is pure: no clock, no writes. The day's shape:

- **The anchor** — "on this day", at the highest precision tier the corpus
  supports for that calendar day. Events carry day precision ONLY in their
  authored `yearLabel` ("24 Dec 1979"); there is no structured day field,
  and the index (`subjects.mjs`) parses full-string forms only — a range or
  a "c." label can never anchor a day claim. Measured: 1,064 day-precision
  events over 333 of 366 calendar days. Tiers, in order: **day** (the
  record's own day+month), **month** ("This month in history — May 1945";
  month-precision records only), **year** (a round 25/50/100-year
  anniversary, claiming only the year — any precision supports that). The
  caption's and the card's claim shrink with the tier; `validate-social`
  asserts a plan's claim never exceeds its record's precision. **A date
  more precise than its record is a fabrication even when it is correct**
  — the same rule the statehood precision ledger enforces.
- **The data card** — ranking → commodity → compare on epoch-day mod 3
  (calendar-stable, no ledger needed for the rotation itself). Within the
  type, a seeded draw skips surfaces used in the trailing 30 days; if the
  skip empties the pool (ten commodities cannot survive a 30-day window at
  a 3-day cadence), it falls back to least-recently-used.
- **The carousel** — on ranking days, the same ranking (one story, three
  formats); otherwise the anchor nation's formation story, skipping
  nations told in the trailing 90 days.

Preference windows (365 days per event, 14 per anchor nation, 30 per data
surface, 90 per formation story) **soften rather than fabricate**: a small
candidate pool may repeat early, but the precision tier never degrades to
manufacture variety.

## 4. The ledger (`data/social-ledger.json`)

Committed data, keyed by date: `{ event, eventNation, surface, carousel }`
per generated day. `build-social` writes it back after each run (sorted
keys, stable diffs). Two invariants make regeneration safe:

- **Idempotent by key** — regenerating a day rewrites the same entry;
- **A day cannot see itself** — recency scans only entries dated strictly
  before the target, so a day's own ledger entry cannot change its own
  plan (asserted by the validator and proven byte-identical in the week
  run).

Commit the ledger after generating days you intend to publish; delete a
day's entry only if it was generated but never published (that returns its
selections to the pool).

## 5. Captions (`captions.mjs`)

Built as ordered blocks marked **authored** or **corpus**, because the
neutrality rules bind OUR copy, not the record's: "the Awami League wins
the election" is a sourced fact, and rewriting it to dodge a word filter
would be editing the record. Enforced (validator + build):

- authored blocks: no grading or contest language (best/worst/winner/
  versus/dominates/…), no CTA furniture;
- platform budgets WITH margin — Pinterest 460 of 500, Instagram and
  TikTok 2000 of 2200; overflow clamps corpus blocks at word boundaries,
  never authored claims (templates shorten structurally per platform —
  the Pinterest ranking caption carries 3 rows, not 10);
- every character inside the committed font charset (bans emoji by
  construction);
- hashtags ONLY from `data/social-hashtags.json`, five at most —
  discovery vocabulary, not trend-bait;
- the citation line is the GEO template's shape: `Terralore, "<title>",
  terralore.co<path>.` — the retrieval-date placeholder belongs to quoting
  agents and has no meaning in a caption. Chronicle citations use the
  JSON-LD `Article` name ("The Chronicle of Germany"), not the twin title,
  whose embedded tagline can alone run 250 characters.

Figures always carry their years; the WGI caveat rides every governance
ranking caption; absence language ("unranked, never zero", "not recorded
as producing none") travels with the surfaces that need it.

## 6. The manifest — the publisher's contract

`social-out/YYYY-MM-DD/manifest.json`, `schemaVersion: 1`:

```jsonc
{
  "schemaVersion": 1,
  "date": "2026-08-13",
  "plan": { "anchor": {…}, "dataCard": "cp-chn-vs-deu", "carousel": "fm-DEU" },
  "posts": [
    {
      "dedupeKey": "2026-08-13:pinterest:anchor",  // idempotency handle
      "platform": "pinterest",                      // pinterest | instagram | tiktok
      "slot": "anchor",                             // anchor | data | carousel
      "type": "on-this-day",                        // …| ranking | commodity | compare | formation
      "format": "pin",                              // pin | vertical | carousel
      "assets": [{ "path": "pin-anchor.png", "width": 1000, "height": 1500, "alt": "…" }],
      "caption": "…",                               // final text, rules-validated
      "targetUrl": "https://terralore.co/…",        // the pin/link destination
      "hashtags": ["#onthisday", "…"]               // already inside caption; listed for APIs with separate fields
    }
  ]
}
```

Rules for the publisher:

- **Idempotency is the dedupe key.** Post each `dedupeKey` at most once,
  ever; keep your own posted-keys store. Keys are `date:platform:slot` —
  stable across regenerations. If a day is regenerated with different
  content before publishing, the key does not change; after publishing,
  editorial policy is that a published day is never regenerated.
- Asset `path`s are relative to the manifest's own directory. Alt text is
  real alt text (accessibility first; it also serves Pinterest description
  search) — carry it to any API that accepts it, per asset for carousels.
- `caption` is final: do not append tags, links or emoji. `targetUrl` is
  the destination for platforms that take one (Pinterest); it is already
  present inside the caption as the citation path for platforms that do
  not.
- Treat an unknown `schemaVersion` as fatal, not as best-effort.
- The five posts per day are independent; partial publishing is fine and
  the dedupe store is what makes retries safe.

**How S3 video will slot in:** a future `format: "video"` post will carry
`assets: [{ "url": "https://…s3…/YYYY-MM-DD/….mp4", "width", "height",
"alt", "durationSeconds" }]` — absolute `url` instead of relative `path`,
because video renders elsewhere and lands in object storage rather than in
`social-out/`. That addition bumps `schemaVersion` to 2; everything else
(dedupe keys, caption rules, ledger semantics) is designed to carry over
unchanged. Publishers must ignore no fields silently: version 2 is a
deliberate migration, not a soft extension.

## 7. Validation

- `scripts/validate-social.mjs` (in `npm run validate`, offline, no
  renders): ledger + pool schema, plan determinism (equal state →
  byte-equal plans), the sparse-day fallback path (probed on a
  corpus-derived day with no day-precision event), precision-tier
  assertions, every caption × platform under the rules, every target URL
  present in the sitemap ∪ GEO twins, the no-repeat window over a
  synthetic sequence.
- `scripts/build-social.mjs` additionally verifies its own output: every
  written asset is a real PNG at its declared size, captions re-pass the
  rules, dedupe keys are unique — the build does not trust itself.

## 8. Verification artefacts

`design-review/16-social/`: one contact sheet per format (pin, vertical,
both carousels; fixed recognisable samples — regenerate with
`scripts/social-samples.mjs`) and `week/2026-08-12 … 2026-08-18.png` — the
7-day proof, generated twice from a reset ledger with sha256 over every
output byte-identical between runs, no repeated event/surface/carousel
across the week, all seven anchors on the day tier, and the full data-card
rotation exercised. The ledger of the proof week is deliberately NOT
committed: the week was a determinism proof, not a published schedule.
