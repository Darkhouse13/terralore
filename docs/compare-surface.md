# The compare surface — nation pairs, and how the pages stay defensible

Written 2026-08-11, at the end of the mission that built `/compare`. Read
alongside `CLAUDE.md`, `docs/project-state-2026-08-11.md` §3 (the domain
inventory), `docs/rankings-surface.md` (the house pattern for cross-nation
data surfaces) and `docs/geo-surface.md` (the twin contract). Four commits:
the pair set + validators, the routes + UI, the discovery wiring (twins,
cards, sitemap, llms), the ship + this document — each gated on
`npm run validate` + `tsc` + a constrained build.

---

## 1. What this is

**`/compare/<a>-vs-<b>`** — 504 curated nation-pair pages, plus the
`/compare` hub. Each page sets two nations' existing sourced records beside
each other: every indicator both publish (side by side, each value with its
own observation year) and — the differentiator — the **entangled histories**
section: every event in either nation's chronicle whose sourced record names
the other nation. **Nothing on a compare page is authored for the pair**;
every fact is the same record, with the same source, as on a dossier or a
chronicle. That is the thin-content defence: the page could only have been
written by this atlas because it is assembled from this atlas's corpus.

The surface has the site's highest neutrality risk (pairs in active dispute
are deliberately included), so the language rules are hard: figures are
**compared, never graded** — no winner, no best/worst, no rivalry framing —
and the validator bans best/worst/winner/loser in every compare twin's
Terralore-authored copy.

## 2. The pair set — data, not a runtime computation

`data/compare-pairs.json`, derived deterministically by
`scripts/build-compare-pairs.mjs`, committed, and re-asserted offline by
`scripts/validate-compare.mjs` (in `npm run validate`). Regenerate with
`npm run build-compare` (chained into `build-domains`, since the gate reads
domain coverage). **Edit the script, never the JSON.**

- **Tier 1 (311): every land-border neighbour pair.** Source: the `borders`
  field of `data/countries.json` (mledoze via `build-data.mjs`), reconciled
  to canonical ADM0_A3: `UNK→KOS`, `SSD→SDS`, `GUF→FRA` (French Guiana is an
  integral department — France's borders with Brazil and Suriname are real),
  `HKG/MAC→CHN` (vanish as self-pairs). Dropped references: `ESH` (Western
  Sahara is presented within Morocco), `ISR` (no ISR entity in this atlas —
  mapping its borders to PSE would assert land borders, e.g.
  Lebanon–Palestine, that do not exist), `GIB` (a British Overseas
  Territory, not part of the UK the way GUF is part of France). Symmetrised
  by union; **ten spot cases are asserted in the builder against the CIA
  World Factbook land-boundary lists** (USA, PRT, GBR, KOR, ESP, CHN, SRB,
  ZAF, EGY, ARM), so a countries.json refresh that breaks adjacency fails
  the build. One source error is excluded and recorded in the JSON:
  mledoze lists an India–Sri Lanka land border; the Palk Strait says
  otherwise (the pair re-enters as Tier 3).
- **Tier 2 (163): all pairs within the G20's nation members** (the EU and
  AU seats are not nations).
- **Tier 3 (30): curated seeds**, each carrying its inclusion reason in the
  JSON — diaspora ties (usa-vs-irl), colonial entanglements (dza-vs-fra),
  similar economies (esp-vs-ita), high-interest comparisons with no land
  border (aus-vs-nzl, chn-vs-twn).

## 3. The thin-content gate — threshold 10, from the data's own shape

A pair publishes only if the two nations share **≥ 10 ranked metrics**
(both sides non-null for the same key, counted across `data/domains/*.json`).
The threshold comes from the measured distribution, which has three regimes
and nothing in between:

| shared metrics | pairs | what it is |
|---|---|---|
| 0 | 3 | one side has no statistical apparatus overlap at all (VAT, CYN) |
| 5 | 2 | Taiwan's IMF-only headline set (gdp, gdpPerCapita, gdpGrowth, inflation, population) |
| 24–54 | 503 | every pair of full-coverage nations (the KOS pairs floor at 24) |

10 sits in the empirical gap: strictly above one domain's headline metrics
(five figures cannot carry a page whose premise is multi-domain
comparison), comfortably below the full-coverage floor of 24 — so pages
appear or disappear only on real coverage-regime changes, never on
single-indicator vintage noise. Four pairs are **dropped and recorded** in
the JSON's `dropped` list with their measured counts: `chn-vs-twn`,
`jpn-vs-twn` (5), `cyn-vs-cyp`, `ita-vs-vat` (0). If Taiwan's coverage ever
crosses the gate (e.g. a future IMF/UIS expansion), those pairs publish on
the next `build-compare` — automatically and consciously, because the
validator forces the rebuild.

## 4. Canonical URL and the redirect choice

One page per pair; the slug orders the two ADM0_A3 codes **alphabetically**,
lowercased: `/compare/deu-vs-fra`. The reversed order (and any mis-cased
form) resolves with a **308** to the canonical, implemented in the route
itself (`permanentRedirect` in `app/compare/[pair]/page.tsx` for any valid
pair under a non-canonical spelling; everything else 404s). Chosen over
`next.config` redirects because ~500 static entries would be unwieldy to
maintain and review, while the route already knows the pair set — the
redirect is three lines beside the code that defines validity. Verified on
the built server and live: `fra-vs-deu` and `FRA-vs-DEU` → 308 →
`deu-vs-fra`; `xxx-vs-yyy` and self-pairs → 404.

**The display/slug language split, recorded:** the hyphenated `-vs-` exists
only in the URL, as search grammar (that is the phrasing people type).
Display copy — titles, H1s, breadcrumbs, twins — always says
"Germany and France compared". A "vs" never appears in rendered language,
because "versus" frames a contest and this surface grades nothing.

## 5. The entangled-histories matcher

An event qualifies when its own sourced record (title or summary) contains,
word-bounded, the other nation's name — per `data/compare-aliases.json`, the
committed name table. The section's honesty rests on three decisions:

- **Aliases are names the nation's own chronicle would accept**: current
  atlas names, official names, corpus-used former names of the same state
  (Burma, Ceylon, Siam, Zaire, East Pakistan, Prussia), and the adjective
  where the nation acts in other nations' histories (British, French,
  Ottoman-era Turkish…). Empirically necessary: with bare modern names,
  Germany–France finds zero shared events — the corpus writes
  "Franco-Prussian War" and "Napoleon", not "France".
- **Successor-state calls are recorded in the table itself**: Soviet→RUS
  (recognised continuator), Ottoman→TUR (assumed the empire's debt and
  treaties), Czechoslovakia→both CZE and SVK, Austria-Hungary→both AUT and
  HUN. And deliberately assigned to **nobody**: Yugoslavia (the Badinter
  Commission found dissolution with no continuator) and Kievan Rus (claimed
  by RUS, UKR and BLR at once) — assigning either would adjudicate a
  dispute this site describes and does not resolve.
- **Masks kill the traps found empirically**: "Spanish flu" is not Spain,
  the "East India Company" is not India, the "Niger Delta" is not Niger,
  "Belgian Congo" is COD not COG (COG's atlas name being literally "Congo"
  forced a full name override). Matching runs only within published pairs,
  which bounds the blast radius of any future trap to the pair it sits in.

The matcher is deliberately conservative — it undercounts (272 of the
original candidate pairs find zero events on bare names; aliases recover
the entanglement that is really there). **Zero shared events renders as a
plain statement** ("Neither nation's sourced chronicle names the other…"),
because the absence is a fact about the two archives, not a gap to pad.
Duplicated moments are a feature, not a bug: the Korean War armistice
appears twice on kor-vs-prk — once as each archive records it.

## 6. Page anatomy (all assembled, nothing authored)

Formation line per nation from `statehood.formation` (the existence-shading
anchor), falling back to `founding`. Side-by-side tables per domain via
`lib/compare.ts` (from the same domain files as the dossiers; alias metric
keys fold as `/rankings` folds them; a row renders when either side holds a
value, and the other side prints "—"). Metric labels deep-link to
`/rankings/<slug>`; each value deep-links into its dossier's metric window
(`/country/<CODE>#m=<key>&tab=<domain>`). The one bespoke visual is the
paired bar SVG — two weights of verdigris (the measured, per D5), decor
over text that carries the real figures, no bar for non-positive values.
The strata pattern is seeded by the pair slug (reproducible, per the brand
codification). Vintage = max of the two dossiers' refreshes and the two
chronicles' verification dates — the sitemap lastmod, the twin's Updated
line and the page footer all read it from `lib/compare.ts`.

## 7. Discovery wiring

`lib/seo.ts`: `routes.compare/comparePair`, `compareDescription` (real
figures: shared-indicator and crossed-event counts), `compareLd` (Dataset
about two Country nodes, citing the two dossier Datasets). Sitemap: hub +
504 pairs with honest lastmod. Markdown twins per pair (`docs/geo-surface.md`
§6 followed to the letter; validator counts, prunes, byte-compares, and
language-checks them). llms.txt: a Comparisons section. llms-full.txt names
the comparisons among its deliberate omissions. One OG card per pair (ZENITH
grammar: both formation years + one shared-metric contrast, side by side,
unranked).

## 8. How to add a Tier-3 pair

1. Add `["AAA", "BBB", "the stateable reason"]` to `TIER3` in
   `scripts/build-compare-pairs.mjs`. No reason, no pair.
2. `npm run build-compare` — derives, gates (a below-gate pair lands in
   `dropped`, recorded), validates.
3. `npm run build-geo` — the twin, the llms.txt line.
4. `npm run validate` + `tsc` + build. The page, card, sitemap entry and
   redirect all derive.

If the pair's chronicles cross under names the matcher misses, extend
`data/compare-aliases.json` under §5's rules (alias = a name the nation's
own chronicle would accept; record successor-state reasoning in the file;
mask new traps). `validate-compare` checks the table's codes and collisions.

## 9. Verification artefacts

`design-review/15-compare/`: hub, deu-vs-fra (dense, 42 indicators),
alb-vs-kos (sparse, 24), bfa-vs-gha (zero shared events — the plain
statement), ind-vs-pak and kos-vs-srb (disputed pairs — the neutrality
check: both formation lines from each nation's own sourced record, 18
crossed events on kos-vs-srb from both archives, no winner language), each
at desktop and 360 px with horizontal overflow asserted zero at capture;
`og-deu-vs-fra.png` (the card). Live verification and the IndexNow
submission are recorded in `docs/deploy-log.md`.

Known seams, accepted:

- The hub's per-pair "shared indicators" figure and the JSON's
  `sharedMetrics` can differ by one where both nations carry the
  literacy/literacyRate alias pair — the gate counts raw keys, the page
  counts folded rows. Both are true statements about different questions.
- mledoze adjacency omits some territory-mediated borders (e.g.
  Saint-Martin's French–Dutch line); the spot-checked ten prove the shape,
  not completeness. A missing neighbour pair is addable as Tier 3 in one
  line.
