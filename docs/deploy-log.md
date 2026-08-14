# Deploy log

Ship records with verification results. Newest first. A deploy is not done
when the push succeeds — it is done when the live origin serves the new
build and the checks below say so.

---

## 2026-08-14 — subscribe-flow repair: outbound 465 is blocked (712cba5)

Live defect: submitting the capture form on `/ledger` froze for ~12s, then
showed an error page — while the subscription committed in listmonk. Reported
as "the POST leg works; the response leg fails," which is exactly right.

**Root cause — the SMTP port, not the route, the URL or the overlay.**
listmonk sends the double-opt-in email *inside* the POST request. At 13:47Z
the Zoho block went live on `smtp.zoho.com:465`, and Hetzner blocks outbound
465. The dial timed out, the handler 500'd, and the subscriber row was already
committed. The trail:

```
POST https://terralore.co/subscription/form
< HTTP/2 500 ; starttransfer=12.299s ; redirects=0

listmonk: subscribers.go:900 error sending opt-in e-mail for subscriber 9
          (59fc8533-…): dial tcp 136.143.182.56:465: i/o timeout
```

Port scan from the box — the evidence that decided the fix:

```
port 25   : BLOCKED/timeout      port 465  : BLOCKED/timeout
port 587  : OPEN                 port 2525 : BLOCKED/timeout
openssl s_client -starttls smtp -connect smtp.zoho.com:587  → cert chain OK
```

All three suspects from the brief were ruled out on evidence, not assumed:
`app.root_url` was already `https://terralore.co`; no redirect was ever
issued, so no route could have been missed; and the 500 body *was* the styled
overlay — listmonk's handler failed inside a page that rendered correctly.

**Fix (config, on the box):** SMTP block 0 → port **587**, `tls_type`
**STARTTLS**, applied as a surgical `jsonb_set` on the listmonk `settings`
row rather than a settings PUT (a partial block crash-loops the app —
newsletter-ops gotcha). Backup: `/root/smtp-settings-backup-2026-08-14.json`.
No repo file was involved in the root cause.

**Fix (repo, 712cba5):** the wait it exposed. The POST is ~2s of SMTP round
trip with an inert-looking form, which is what invites the second click. The
submit now says SENDING… and swallows a second submit — delegated, idempotent,
~300 bytes inline, no hydration, and unchanged with JS off (E16 updated).

**Live proof** (`design-review/22-subscribe-repair/`, fresh disposable
addresses, all deleted after; screenshots 01–08):

| leg | result |
| --- | --- |
| POST → confirmation | **200 in 2.02–2.13s** (0.92s warm; 0.27s through the local sink — the rest is Zoho) |
| double click | **1 POST attempted, not 2**; listmonk also dedupes (two concurrent POSTs → one row) |
| opt-in email | delivered; every URL in it is first-party `https://terralore.co/subscription/…` |
| confirm link | designed page → `list_status = confirmed` |
| leaving | manage form → `unsubscribed`, verified in the DB |
| genuine error | designed Strata page (`ERROR / Invalid UUID(s)`), 0.23s |

**Recorded, not fixed — listmonk's unsubscribe is campaign-scoped.** The plain
Unsubscribe button on `/subscription/<campUUID>/<subUUID>` only updates the
lists that *campaign* targeted. With the zero campaign uuid it renders "You
have unsubscribed successfully" and updates nothing — verified twice, and
verified in reverse: attaching list 3 to a campaign made the same POST commit
immediately. This is not reachable from anything we ship: the opt-in email
links to `?manage=true`, whose preferences form is not campaign-scoped and
does commit, and a sent letter's own unsubscribe link carries its campaign
uuid. **If a bare `UnsubURL` is ever linked outside a campaign, it will lie.**

**Left for the user:** subscriber 5 (the real subscription, 13:48:11Z) is
still `unconfirmed` — its opt-in email was one of the ones that died on port
465. It needs a resend from the admin UI; nothing about it was touched here.
Also worth a look: listmonk authenticates as `hamzabentaieb@terralore.co` but
sends `From: ledger@terralore.co`. Zoho accepted it, but an unverified alias
is a deliverability risk worth confirming before the first real send.

---

## 2026-08-14 — the Ledger Letter (f570a3b + 2 follow-ups)

The owned-audience layer: self-hosted listmonk (Coolify service
`j8lskiymw24…`, v6.2.0 pinned, caps 1.0/512M + 0.5/256M), the list "The
Ledger" (double opt-in), the capture bed (E16) on /ledger + entries + the
front door, /privacy, and issue № 0001 of the digest as committed
artifacts + archive page. Capture is first-party: a priority-1000 proxy
file routes `terralore.co/subscription/*` to the container — no DNS wait.

- **13:03:36Z** pushed `main` (`f570a3b`); **13:06:38Z** the new seal
  (2026-08-14.3) served live; letter page 200 from 13:07:15Z.
- Verification battery: `/ledger/letter/0001` + `.txt`, `/privacy`,
  `/ledger` all 200; live bytes of the letter artifacts and
  `/integrity.json` **hash-identical** to the committed files; sitemap
  carries both new URLs; the entry twin carries the letter line.
- **Live no-JS capture proof (13:11Z)**: `curl -X POST
  https://terralore.co/subscription/form` → 200 designed confirmation page
  ("An e-mail has been sent…" under the TERRALORE stamp) → opt-in email in
  the mailpit sink → subscriber `confirmed` via the opt-in link →
  test subscriber deleted. The identical loop was proven pre-deploy
  end-to-end inside the box.
- **Found & fixed in flight**: `.dockerignore`'s `**/*.png` had been
  eating `app/icon1.png` + `public/icon-192/512.png` since the icon
  rename — the manifest icons and the JSON-LD logo were 404 in
  production. Negation list updated (with the new letter stamp);
  **13:10:48Z** all four PNGs live 200.
- Honesty pass after first deploy: letter/entry/twin copy said "sent" —
  issue № 0001 is issued and archived but not yet sent (send awaits the
  Zoho app password, deliverability doc §2–3). Reworded to "issued /
  the copy subscribers receive", letter rebuilt, resealed 2026-08-14.4.
- Lighthouse mobile (pre-deploy, production build): landing 98/100/100/100,
  ledger 98/100/100/100 — floors hold with the capture bed.
- Not sent, by design: sending is a deliberate act
  (`scripts/send-letter.mjs`, docs/newsletter-ops.md §2) and waits on the
  user's Zoho click-work (docs/newsletter-deliverability.md — DNS A record
  `listmonk`, DMARC, `ledger@terralore.co` + app password).
- IndexNow after the final deploy: `/privacy`, `/ledger/letter/0001`.

---

## 2026-08-14 — the Living Record v1 (b99e05f → e233c03)

Seven commits: the claim-identity scheme (doc before code, D14), Layer 1
(claims), Layer 2 (the seal), Layer 3 (the recorder), the cadence hook,
**Ledger Entry № 0001** riding the first recorded refresh, and the map.

**What shipped.** Every rendered observation is now an addressable claim
(`TL:<subject>:<measure>:<vintage>` — 12,627 unique IDs), resolvable three
ways: engraved on the proof-flip reverse (9px sand mono, selectable),
as a stable fragment on its page, and in committed claims bundles
(`/country/<A3>.claims.json`, `…/chronicle.claims.json`,
`/commodities/<slug>.claims.json`) whose citation strings carry the ID.
Every corpus state is sealed (`/integrity.json`, archived append-only per
version, explained at `/integrity` — tamper-evidence, no theater), and
every refresh is now a published diff: `/ledger`, one page + one committed
JSON per entry, THE RECORD bed on each touched nation (E15).

**Entry № 0001 — the vintage-drift debt paid.** All nine domains + USGS
minerals re-pulled in one act; the recorder read the diff against the
June/August corpus: **1,324 new observations** (1,123 measures advanced
to 2025, 191 to 2024, 2 first-ever), **37 upstream revisions** (mostly
recomputation-scale), **2 withdrawn** (BIH 2024 inflation; JOR trade
openness rolled back to 2007), 0 source changes, 179 nations, 4 domains
moved — governance/health/education/technology/military re-pulled with
zero value changes, which the entry records rather than assumes.
Corpus sealed 2026-08-14 (before) → **2026-08-14.2** (after).

**Verified live** (deployment 317, container 113507109112): all new
canonical URLs 200 (/ledger, /ledger/0001{,.json,.md}, /integrity{,.json},
both archived seals, claims bundles, the entry OG card); live bytes of
FRA.claims.json, ledger/0001.json, FRA.md, rankings/gdp.md and
copper.claims.json **hash-equal to the deployed manifest** — the
seal verifies its own deploy; `TL:FRA:gdp:2025` engraved and its fragment
resolving on /country/FRA; RECORD bed live; 19/19 FRA chronicle event
anchors; /integrity shows the deployed root (64ccec05…); llms.txt carries
the claims convention + ledger section; sitemap holds /ledger, entries,
/integrity. Note: during the Coolify rollover (~2 min) responses flapped
between containers — verification only counts after the queue shows
`finished`.

**Gates:** validate 0 errors (incl. the three new validators: claims,
ledger, integrity), tsc clean, constrained build, 0 seam jams,
**12,357/12,357 claim fragments** resolve in prerendered HTML, Lighthouse
mobile on /country/JPN (with the RECORD bed) **96/100/100/100** —
LCP 2.71s, CLS 0.001. GEO factual identity re-verified post-refresh by
construction (validate-geo byte-compares all 938 twins against the
refreshed data) and live (hash-equality above). 1,627 URLs → IndexNow
(HTTP 200). Cadence: Coolify task `monthly-recorder-dryrun`
(gim2nxc7u52f4mgi5r1mbr4l, `0 5 1 * *`, runner service) — detection
only, publishes nothing.

---

## 2026-08-14 — the bench repair (607b578 → bbaa4b1)

One commit (`bbaa4b1`): two shipped bench defects and two logged debts,
one pass. The phone pixel freeze was LIFTED for this mission — the
proof-flip's phone rendering changes deliberately; the captures in
`design-review/20-bench-repair/` are the new reference.

**A — the proof view.** Root cause: `.flip-face` was `position:absolute;
inset:0` inside fixed-height cards (`height={54}` on the dossier,
`h-[62px]`-family on the server surfaces), so a reverse longer than the
card painted past its boundary; in PROOFS mode that rotated-forward
overflow composited over the neighbors' fronts. The faces now
GRID-STACK (`grid-area: 1/1`, `backface-visibility: hidden`, card
`display:grid` + `preserve-3d`) so every row sizes to its taller face;
all four flip surfaces (dossier, wall, duel, producers) moved from
fixed heights to `min-h-*` row rhythm. Zero hydration kept — the
CSS-only `.flip-press`/`.proof-toggle` pattern is untouched in behavior.
Worst-case reverse found programmatically: **education/literacyRate**,
72-char OBSERVED line (`OBSERVED <yr> · WB-UNESCO — UNESCO Institute
for Statistics / World Bank`) + 206-char definition = **278 chars**;
verified on /country/AFG at 390/1024/1440 — 0 face overflows, 0 row
overlaps (was 12 overflows at every width).

**B — the core rail.** Landing: root cause of the −28px miss at 1440
was the `◄ FROM THE CORE` mark — removing it from a bed ABOVE the
target rewrapped that bed's title while `scrollIntoView` was measuring.
The notch state split from the click mark, the scroll now runs
post-commit (rAF), and the bed anchors carry `scroll-mt-0` (the cut
column's sticky stack is zero-height — the rail is sticky in its own
column). Landing = 0px at 1024/1440/1920, keyboard and reduced-motion
(instant) included. Labels: bands now lead with the era's YEARS
(`period · title`), ellipsize (never mid-glyph), and carry full-label
tooltips; **the band floor is 104px** — a plain year range at 9.5px
mono/0.14em (~14 chars) always fits; proportionality expresses above
the floor (PSE, the sparsest corpus rail, shows 143,104×5 at 768px
viewport height with zero rail overflow). Notch: an
IntersectionObserver watches each bed cross a line 6% below the
viewport top and recomputes the active bed from six rects — no rAF, no
scroll listeners; verified tracking mid-bed scroll both directions;
idle stays 0 rAF / 0 running animations.

**C — the cascade layer.** Element defaults (`html`, `body`, `a`,
`:focus-visible`, `::selection`, scrollbars) moved into `@layer base`:
unlayered author styles defeat ALL layered styles, so the unlayered
`a { color: oxide }` beat every text-* utility — the active ranking
sibling chip (`text-bone` on basalt) shipped **oxide-on-basalt 2.88:1**;
it now computes bone-on-basalt **13.48:1** (+10.6). Four
`focus:outline-none` utilities (atlas dig, junction tray dig/filter,
metric-window search) were dead under the old cascade and would have
gone LIVE and killed the oxide focus ring — removed. Proof: 23/23
arithmetic pairs (`check-contrast-strata.mjs`) + the new
computed-style sweep (`scripts/contrast-sweep.mjs` — every rendered
text node vs its painted ground, WCAG threshold by rendered size, the
strata label-class at ≥3:1) clean on 14 surfaces × 390/1440, local and
live.

**D — /themes un-orphaned.** BY THEME returns in the front-door dig
cell at desktop (with a READ ACROSS NATIONS lead-in). BY PERIOD stays
phone-only, defended: /timeline already holds two desktop entrances —
the masthead nav's HISTORIES and the Histories bed — a third link to
the same page from the same viewport is noise, while BY THEME was
/themes' ONLY front-door entrance at any width ≥1024.

- **10:29:08Z** pushed `main` (`bbaa4b1`); Coolify webhook fired.
- **10:31:53Z** live front door served the new build (polled at 30 s).
- **10:33–10:37Z** live battery, all green: shots driver (proofs 0/0/0
  overflows at 390/1024/1440; rail landing 0px at 1024/1440/1920) +
  11/11 targeted checks (notch sync both directions, keyboard landing,
  tooltips, PSE floor, chip bone-on-basalt, BY THEME/BY PERIOD, idle
  0/0, reduced-motion instant) + contrast sweep clean on all 14
  surfaces × 2 widths — **both original defect reproductions now pass
  against production**.
- Pre-deploy gates: `npm run validate` 0 errors, `tsc` clean, seams
  0/1628 prerendered pages; Lighthouse **mobile** dossier 96 / ranking
  97 perf (a11y 100 both), **desktop** dossier 98 / ranking 100 perf
  (a11y 100 both) — floor ≥95 holds in both modes.
- No IndexNow: no canonical URL changed.

---

## 2026-08-14 — the bench build (7976100 → 607b578)

One commit: the P4 desktop contract
(`docs/design/p4-desktop-contract.html`, deviations E14) translated into
the six surfaces at ≥1024px — the wide cut face + overture-at-width, the
section cut's rules-as-columns, the nation BENCH (sticky core rail +
specimen bench), the ranking WALL + READOUT LEDGE (inline vanilla
island), the junction tray as the compare index's rail, and the pair
page's DOSSIER DUEL. The phone ships untouched.

- **09:32:05Z** pushed `main` (`607b578`); Coolify webhook fired.
- **~09:34:35Z** deploy landed — live front door first served the new
  masthead ("THE EARTH IN SECTION"), polled every 30 s from push.
- **09:37–09:45Z** verification battery, all green:
  - 16/16 live HTML checks: masthead + COMPARED nav (no junction vocab
    outside the compare surfaces), ledge markup + wall rows with specimen
    data on `/rankings/gdp`, parse-time `.js` class + tray heading on
    `/compare`, duel heading + junction mark on `/compare/deu-vs-fra`,
    core-rail + specimen-bench markup on `/country/FRA` (phone pull hint
    still served), depth scale on `/atlas`
  - live screenshots at **390 / 1024 / 1440 / 1920** (four surfaces,
    `design-review/19-bench/live/`) — zero horizontal overflow at every
    width; the wall runs 3 columns + side ledge at 1440, 2 columns with
    the ledge beneath the header at 1024; the 1920 frame holds 1760px
  - live ledge interaction: pressing rank 04 lands JAPAN on the ledge,
    flipped (`data-flipped=true`) — the island runs in production
- Pre-deploy gates (recorded in the commit): 390px **pixel-identity
  proof** on all six surfaces (`design-review/19-bench/390-diff-proof.txt`
  — zero differing pixels, content-visibility forced so placeholder
  estimates cannot fake a pass); Lighthouse **mobile** landing 98 /
  dossier 96 / ranking 97 / compare-hub 95 perf with a11y 96–100, and
  **desktop** 100 / 98 / 100 / 100 perf with a11y 96–100 (floor ≥95 both
  modes); idle 0 rAF and 0 running animations at 1024 and 1440;
  reduced-motion collapses the ledge flip; keyboard drives the ledge
  (row focus + Enter, aria-live announced) and the tray (dig,
  ArrowDown, Enter).
- No IndexNow: no canonical URL changed — same pages, recomposed at
  width.

---

## 2026-08-14 — The mounted core + the junction finder

Three commits (`9f38674`, `8611cc9`, `b603346`): the desktop adaptation
the P3 contract never specified, designed inside the language rather
than adapted (deviations E12), and the compare index rebuilt as
wayfinding (E13). No URL changed; no IndexNow.

**The mounted core (E12), every surface ≥1024px.** A core sample is a
narrow vertical thing — the wide screen now MOUNTS it instead of
stretching it: content locks to a bounded column (46rem reading
measure; data tables fill to ~52rem) set left-of-center, and the freed
left margin carries the apparatus: a 2px depth rail with mono ticks —
era years riding the rail on the nation cut and chronicle (pure
`position: sticky`, zero scroll JS), rank decades printed at every
tenth ranking row, section names on the front door, calendar years on
chronology period pages. Labels that stacked under titles on the phone
(bed sublines, era periods, bed eyebrows) moved to marginalia with
`sr-only` in-flow twins, so the reading order is unchanged for screen
readers. The section cut alone uses width honestly: 4 seam columns
≥1280px, row height untouched. Overture choreography identical.

**The junction finder (E13).** 504 alphabetical compare rows became:
THE TRAY (two specimen slots — dig, slot, CUT THE JUNCTION; a published
pair navigates, a miss reports "no junction cut" and lists the cuts the
set holds through nation A) + three browse views on native radios (BY
NEIGHBOURHOOD under continent bed-headers walking the cut's palette,
default; MOST ENTANGLED — 265 pairs with crossed events, count
descending, the 239 without stated as a count; THE G20 — all 171
member pairs by membership, not tier) + a dig-to-filter field. The
tray and filter are one inline vanilla-JS island on this page only,
hidden until it runs — without JavaScript the page is still the whole
index. Row anatomy unchanged.

**Index audit (the >60-undifferentiated-rows sweep):** ranking pages
(~180 rows) were the other true case — fixed by the decade depth marks;
rankings index (66 rows) was already domain-sectioned — gained domain
jump links + margin ticks; atlas is the section cut, timeline hub is
2 sections of density bands, theme/period pages already carry chapter
jump navs, commodities is 10 rows — none needed structural surgery.

**A gate found a real defect:** the strata contrast script's ≥3:1
"label class" had sanctioned sand-on-oxide (3.90:1) at 10–11px, which
fails AA — E11 extended: micro mono labels on oxide grounds are now
bone (4.68:1) on the front door, dossier era beds, atlas and compare
hub. Jump links got real touch targets.

Verification, production build then re-checked live:

- Trio per commit: `npm run validate` 0 errors, `tsc` clean, build
  green, seam scan 0 word-jams across 1,628 prerendered pages.
- Lighthouse mobile (median of 3): front door 98/100, nation (JPN)
  97/100, compare index 95/100 (perf/a11y; BP+SEO 100 across) — the
  island costs nothing (TBT 78ms) and accessibility hit 100 on all
  three gated surfaces for the first time (the oxide fix cleared
  latent flags on landing and dossier too).
- Reduced-motion: 0 running animations, content visible, on front
  door, nation, compare index, ranking, chronicle.
- Touch: tray tap-select and tab switching at 390px, proof-flip press,
  core-pull commit — all pass.
- Screenshot matrix: 13 surfaces × 390/1280/1440/1920, horizontal
  overflow asserted zero at every capture —
  `design-review/18-mounted-core/`; live re-capture of 6 surfaces × 4
  widths (again zero overflow) in `…/live/`.
- Live behavior: tray dig→slot→CUT navigates to /compare/deu-vs-fra;
  MOST ENTANGLED shows 265 rows; chronicle era ticks are sticky in
  production. `fuser`-killed the local server after.

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
