# Deploy log

Ship records with verification results. Newest first. A deploy is not done
when the push succeeds — it is done when the live origin serves the new
build and the checks below say so.

---

## 2026-08-14 — STRATA × SHOW THE WORK: the whole visual world replaced

The cutover of the strata-rebuild branch (10 commits + merge `fca7a25`):
every pixel and interaction on the site replaced to the P3 design
contract (`docs/design/p3-contract.html`, translated in DESIGN.md v2,
extensions logged in `docs/design/strata-deviations.md`). Content, data,
URLs, invariants and the SEO/GEO plumbing untouched by design.

What shipped: the Overture front door (pure CSS, once per session,
≤1.1s then stillness; zero client components on the landing route); the
globe deleted end to end (renderer + worker + still + builder, ~1,900
lines and the worker chunk) and replaced by THE SECTION CUT at /atlas;
the nation page as era beds + the core-pull + specimen dossier; the
proof-flip on every observed value on every surface (client component
on the dossier, CSS-only :active + checkbox on the server-rendered
rankings/compares/commodities); absence as the hatched NOT OBSERVED
mark everywhere; the chronicle, timeline, themes, 404 and all hubs in
the reading grammar; ZENITH recolored basalt-on-bone with the oxide
dot across favicon/manifest/theme-color/JSON-LD logo; OG cards + the
social pipeline re-skinned to the same world (byte-identical
determinism re-proven, ledger untouched); three self-hosted faces —
runtime Google Fonts gone entirely.

Verification, all on the production build then re-checked live:

- `npm run validate` 0 errors (histories, domains, commodities,
  rankings, compare, geo, social); `tsc` clean; the new seam scan
  (`scripts/validate-seams.mjs`, in `npm run ci`) 0 word-jams across
  1,628 prerendered pages.
- Contrast proven arithmetically: 23/23 strata pairs clear their
  thresholds (`scripts/check-contrast-strata.mjs`).
- Lighthouse mobile (medians): front door 98/95, nation 99/96, ranking
  97/96, compare 96/96, chronicle 96/96 (perf/a11y; BP+SEO 100 across).
  The lever: analytics now load on first interaction or a 7s idle
  timer — gtag's ~200ms evaluation was the whole blocking-time story;
  the accepted trade is that sub-7s zero-interaction bounces go
  unrecorded.
- Idle profile: 0 rAF callbacks, 0 running animations over 10 idle
  seconds on all five surface classes.
- Bundle: home 201.3 → 188.2 KB gz (and the worker chunk gone);
  /country/FRA 248.7 → 207.7 KB gz (motion left the dossier; the
  metric window is now an on-demand chunk). No three.js existed to
  remove — the audit confirms none returned.
- Live matrix (desktop + 390px, overflow asserted zero at capture):
  front door, section cut, JPN + FRA nations, gdp ranking, deu-vs-fra,
  copper, the 1800s period page — `design-review/17-strata/live-*`.
  OG cards ×3, icon0.svg, manifest (bone), FRA.md twin all 200 with
  correct types.
- GEO factual identity: 3 live twins byte-identical to the committed
  files; `validate-geo` regenerates all 937 and byte-compares — 0
  errors. Design touched no facts.
- No IndexNow: no URL changed. The journey routes stay live but
  unlinked (deviations E8).

---

## 2026-08-11 — social publishing infrastructure (Postiz + publisher + daily runner)

Not a site deploy — an infrastructure deploy beside it (no site route
changed; the repo gains the publisher, its config, and two docs). Full
architecture: `docs/social-publishing.md`; remaining click-work:
`docs/social-apps-setup.md`.

- **Postiz self-hosted** on the Coolify box: service `postiz`
  (`aaga0pmd4y7elompbck0aafl`, project TERRA), template pin `v2.10.1`,
  app+postgres+redis with persistent volumes, resource-capped
  (1536M/2cpu + 512M/1cpu + 256M/0.5cpu — a spike hits its cgroup, not
  the site builds). Domain `postiz.terralore.co` configured; **TLS
  pending the one DNS A record** (Namecheap click-work, setup doc §0 —
  ACME here is HTTP-01, it cannot precede DNS). Verified: app healthy;
  Traefik routes the hostname (via forced resolve); admin login 200 over
  the API; registration provably disabled (`Registration is disabled` on
  a valid probe); org API key extracted to `/root/.postiz-admin` and the
  runner env — never the repo.
- **Crash-loop found and fixed while proving it**: once the stack joined
  the shared `coolify` docker network (for the runner), the bare
  `postgres`/`redis` hostnames became ambiguous — another stack answers
  `postgres` there, and the app crash-looped on P1000 against a foreign
  database (plus a Coolify quirk: `SERVICE_PASSWORD_POSTGRESQL`
  regenerated on compose re-save while the volume kept the initdb-time
  password; realigned with `ALTER USER`). Compose now pins the unique
  container-scoped hostnames; the reasoning is committed as a comment in
  `docs/social-publishing.md` §1 territory and the compose itself.
- **Publisher** `scripts/social-publish.mjs` + committed slot config
  `data/social-publish.json` (07:30/07:45/12:00/19:00/19:30
  Africa/Casablanca — documented first guesses). Idempotency: local
  posted-keys store → Postiz day-window query → deterministic UUIDv5
  post ids that Postiz upserts on (tags investigated and rejected: the
  public API cannot create them). Ledger: commit+push with rebase retry;
  unresolvable push = loud failure, never un-scheduling.
- **Daily runner**: service `terralore-social-runner`
  (`v113yzpn4rzcv32nqam70td2`, node:22, 2048M/2cpu), repo clone over a
  write deploy key (GitHub key 159960312), Coolify scheduled task
  `daily-social-publish` at `0 4 * * *` UTC (≈05:00 Casablanca), 1800 s
  timeout. Status lines for Marsad:
  `/data/terralore-social/status/publish-status.jsonl` on the box.
- **Proofs**: offline dry-run prints the 5-post staggered schedule;
  second dry-run byte-identical in 19 ms (no regeneration); online
  dry-run reports true per-platform state (all `platform not connected`,
  exit 0 — the skip path is the live path until OAuth lands); upload
  endpoint exercised with a real card PNG (201); runner→Postiz over the
  shared network verified from inside the runner.
- **Editorial fix en route**: today's plan surfaced a Pinterest caption
  at 484/460 (`rk-tertiary-enrolment`, mixed vintages — a surface no
  validator probe day had planned). The ranking template now drops the
  vintage-explainer on Pinterest (rows carry years inline), and
  `validate-social` gained an exhaustive sweep: every selectable surface
  × platform (5,315 × 3), so caption-budget bugs are now structurally
  unreachable, not probabilistically missed.

---

## 2026-08-11 — the compare surface (16d5695 → fbcd3d8)

Five commits (incl. the GEO ship record): the /compare pair set (504
pages: 311 land-border, 163 G20, 30 curated; 4 gate-dropped and
recorded), the routes + hub, the discovery wiring (504 markdown twins,
OG cards, sitemap, llms.txt Comparisons section), and
`docs/compare-surface.md`.

- **17:13:03Z** pushed `main` (`fbcd3d8`); Coolify webhook fired.
- **17:15:50Z** deploy landed — live `/compare/deu-vs-fra` first served
  200 (polled every 15 s from push; the 2,391-page build).
- **17:16:20Z** verification battery, all green:
  - five sample pairs (deu-vs-fra dense, alb-vs-kos sparse, bfa-vs-gha
    zero-events, ind-vs-pak and kos-vs-srb disputed): HTML 200, twin 200
    `text/markdown`, OG card 200 `image/png` — all fifteen URLs
  - `/compare` hub 200; `/compare/fra-vs-deu` → **308** →
    `/compare/deu-vs-fra`; `/compare/xxx-vs-yyy` → 404
  - live sitemap carries exactly **505** `/compare…` URLs; live
    `/llms.txt` lists **504** compare twins
  - kos-vs-srb serves its "Entangled histories" (18 events, both
    archives); bfa-vs-gha serves the plain zero-events statement
- **17:16:35Z** IndexNow: 505 URLs (hub + 504 pairs) in one batch →
  **HTTP 200**. (Google needs no ping — sitemap registered in GSC,
  lastmod honest: per pair, max of the two dossiers' refreshes and two
  chronicles' verification dates.)

---

## 2026-08-11 — GEO export layer (a65ddaf → 16d5695)

Four commits: 433 markdown twins (dossiers, chronicles, rankings,
commodities) + generator + byte-compare validator, `/llms.txt` +
`/llms-full.txt` indexes, `rel="alternate"` discovery wiring, and
`docs/geo-surface.md`.

- **16:16:45Z** pushed `main` (`16d5695`) to origin; Coolify webhook fired.
- **16:20:31Z** deploy landed — live `/country/FRA.md` first served 200
  (polled every 15 s from push).
- **16:21:30Z** verification battery, all green:
  - `/country/FRA.md` 200, `text/markdown; charset=UTF-8`, 6,182 bytes —
    **42 metric rows** across the nine domain tables (matches the dossier)
  - `/llms.txt` 200 — 509 distinct terralore.co URLs; **10 sampled links
    all 200** (dossier twins, chronicle twins, incl. SOL and TLS)
  - `/llms-full.txt` 200 — **526,775 bytes (~527 KB)**, header states its
    contents (53 rankings, 10 commodities, 186 nation summaries) and what
    it deliberately omits (the ~291k-word chronicle corpus, one fetch away
    at the chronicle twins)
  - `/rankings/gdp` HTML carries
    `<link rel="alternate" type="text/markdown" href="…/rankings/gdp.md"/>`
- No IndexNow ping for this deploy: the `.md` twins are alternates of
  canonical pages, not canonical pages (deliberately absent from the
  sitemap — see docs/geo-surface.md §5); no canonical URL changed.

---

## 2026-08-11 — brand codification + rankings surface (f328c3f → a65ddaf)

Twelve commits: the ZENITH brand codification (components, favicon set,
manifest, OG grammar v2, Literata wordmark subset) and the /rankings surface
(slug layer, 53 pages, SEO/OG/llms wiring, docs).

- **15:40:00Z** pushed `main` (`a65ddaf`) to origin; Coolify webhook fired.
- **15:42:06Z** deploy landed — live `/rankings` first served 200 (polled
  every 15 s from push).
- **15:42:55Z** verification battery, all green:
  - `/rankings` 200, carries "53" (rankings count)
  - `/rankings/rule-of-law` 200, carries the WGI "absolute 0–100 scores" note
  - `/rankings/gdp` 200, carries the "mixes vintages" note
  - `/commodities/copper` 200, carries "Rest of world"
  - `/rankings/life-expectancy/opengraph-image` 200, `image/png`, 70,731 bytes
  - `/manifest.webmanifest` 200, `application/manifest+json`
  - `/icon0.svg` 200, `image/svg+xml`, 428 bytes — the ZENITH compact cut
  - live `sitemap.xml` contains exactly **54** `/rankings…` URLs
- **15:43Z** IndexNow: 54 URLs (53 `/rankings/<slug>` + `/rankings`)
  submitted in one batch → **HTTP 200**. (Google needs no ping — the sitemap
  is registered in GSC and lastmod is honest.)
