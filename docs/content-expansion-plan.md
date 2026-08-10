# Content expansion — four workstreams

Mission for a fresh session. Everything here was scoped and fact-checked on
2026-08-10 against the live corpus and the data APIs named below; re-verify
anything that smells stale before building on it. CLAUDE.md / AGENTS.md load
automatically — the architecture map, the canonical-code rule (ADM0_A3), and
the "read `node_modules/next/dist/docs` first" rule all apply. The deploy path
is `git push origin main` → GitHub webhook → Coolify.

**Baseline (2026-08-10):** 184/186 nations have histories; corpus median is
25 events / ~1,570 words of era prose / ~20 sources per nation. Dossiers have
six domains; a fully-covered nation carries ~27 indicators.

## Ground rules (all workstreams)

1. **Every claim traceable to a reliable source.** Britannica is
   **unfetchable** from this machine (Cloudflare 403 — do not circumvent).
   Verified-workable alternatives: `history.state.gov/countries/<slug>`,
   UNESCO WHC, World History Encyclopedia, EBSCO Research Starters, LOC
   country studies, national archives/museums. Wikipedia is a lead-finder,
   not a citation. Prefer stable top-level URLs over deep paths that rot.
2. **History JSON is edited textually** — the files use hand-tuned one-line
   formatting for quickFacts/sources/figures; never JSON.parse → stringify a
   whole file. Collect all edits, verify, write once.
3. **Neutrality**: contested territories (Northern Cyprus, Somaliland, …) get
   the competing positions with sources, never a silently picked side.
4. **Gate every commit** on: `npm run validate` (history + domain validators,
   0 errors), `npx tsc --noEmit`, `npm run build`. Turbopack dev does not
   type-check; the build is the proof.
5. **Commit discipline**: one commit per unit (one domain, one nation), so a
   bad unit reverts cleanly.

## Workstream 1 — Governance domain (start here; smallest, proves the pipeline)

Worldwide Governance Indicators via the World Bank API. **Verified
2026-08-10**: the WGI series live under **`source=3`** with renamed ids —
`GOV_WGI_VA.SC`, `GOV_WGI_PV.SC`, `GOV_WGI_GE.SC`, `GOV_WGI_RQ.SC`,
`GOV_WGI_RL.SC`, `GOV_WGI_CC.SC` (0–100 percentile-style scores, 2024
vintage). The plain ids (`GE.EST`) return "Invalid value" — don't use them.

- `scripts/lib/wb.mjs` → `fetchIndicator` builds its URL without a `source`
  param; add an option (e.g. `{ wbSource: 3 }`) threaded from the indicator
  spec in `buildWbDomain`.
- New `scripts/build-governance.mjs` (mirror `build-military.mjs`): six
  metrics, keys like `wgiVoice`, `wgiStability`, `wgiEffectiveness`,
  `wgiRegQuality`, `wgiRuleOfLaw`, `wgiCorruption` — **metric keys must be
  globally unique across all domains**; the series-index builder throws on
  collision.
- Attribution follows the `wb-sipri` pattern (see `build-military.mjs`):
  source id `wb-wgi`, publisher the Worldwide Governance Indicators project /
  World Bank, URL `https://www.worldbank.org/en/publication/worldwide-governance-indicators`.
- Register: `DomainKey` + `DOMAIN_META` in `lib/types.ts`, import + `FILES`
  entry in `lib/domains/index.ts` (insertion order = dossier tab order —
  governance reads naturally after society). `lib/format.ts` dispatches by
  unit; add a unit case if "score" doesn't render well.
- Describe the metrics honestly: WGI are model estimates with confidence
  intervals, not measurements — say "percentile score" in labels/tooltips.
- `npm run build-data && npm run build-domains` (build-data first — domain
  builders read `data/countries.json`), then validate/build/commit.

## Workstream 2 — Health and education domains

Same pipeline, default WB source. Ids verified to exist (fetch with
`mrnev=1`; the existing pipeline already keeps latest-non-null):

- **Health** (`build-health.mjs`): `SH.XPD.CHEX.GD.ZS` health spend % GDP,
  `SH.MED.PHYS.ZS` physicians per 1,000, `SH.DYN.MORT` under-5 mortality,
  `SH.IMM.MEAS` measles immunisation %, `SH.H2O.SMDW.ZS` safe drinking
  water %. Attribute the SH.* series to their true upstream, WHO Global
  Health Observatory (`wb-who`), mirroring how technology attributes UNESCO.
  **Life expectancy already lives in society — do not duplicate it** (key
  collision + duplicate content).
- **Education** (`build-education.mjs`): `SE.ADT.LITR.ZS` adult literacy,
  `SE.XPD.TOTL.GD.ZS` education spend % GDP, `SE.PRM.ENRR` / `SE.SEC.ENRR` /
  `SE.TER.ENRR` gross enrolment. Upstream is UNESCO UIS — reuse the existing
  `wb-unesco` source shape from `build-technology.mjs`.
- Literacy is sparse for rich countries (they stopped surveying); that is a
  real gap, render "—" per the neutrality rule, don't impute.
- Register both domains as in workstream 1. Tab order suggestion:
  … society, governance, health, education, technology …

## Workstream 3 — USGS minerals (resources enrichment)

`data/domains/resources.json` is a self-declared first cut (resource rents +
electricity). Enrich with physical production, sourced to the USGS **Mineral
Commodity Summaries** (annual, public domain, `usgs.gov/centers/national-minerals-information-center`).

- MCS data releases ship machine-readable per-commodity world-production
  tables (ScienceBase); explore before building. If extraction is unreliable,
  **scope down honestly**: ~10 strategic commodities (copper, iron ore, gold,
  lithium, cobalt, nickel, rare earths, bauxite, zinc, phosphate) × top
  producers, hand-verified against the published summaries.
- New builder (`build-resources.mjs` extension or a merge step): per-country
  metrics like `prodCopper` with honest units (tonnes; add a unit case to
  `lib/format.ts` for large-tonnage display). Source id `usgs-mcs`.
- Most nations produce none of a given commodity — only emit metrics where
  production exists; absence is not zero.

## Workstream 4 — Deepen the thinnest histories (largest; one nation per commit)

Follow `## Adding a nation's history` in CLAUDE.md for schema and validation.
Targets, from the 2026-08-10 inventory (events / era-prose words):

- **Deepen toward the median** — Madagascar MDG 16/995, Sri Lanka LKA
  16/1252, Costa Rica CRI 16/1566, Haiti HTI 17/1468, Papua New Guinea PNG
  18/1744, Solomon Is. SLB 18/1379, Bhutan BTN 18/1417.
- **Zero figures** (add ≥4 sourced figures each): FLK, CAF, COM.
- **Leanest sources** (broaden to ≥16): NCL 10, BLZ 11, FLK 11, CYN 13,
  GNQ 13. CYN is Northern Cyprus — the neutrality rule applies to every
  sentence.

Per-nation bar: **≥24 events, ≥1,800 words of era prose, ≥16 sources, ≥4
figures**, every new claim verified against a fetchable source from the
ground-rules list, and the file's `updated` bumped to the verification date
(that date drives sitemap lastmod and the Article JSON-LD). Deepen where the
record is rich (LKA's 2,500 years, MDG's Merina kingdom, HTI's revolution),
don't pad. Re-run the inventory after each nation:
events = sum of `eras[].events`, words = `eras[].body` joined.

## SEO/GEO integration (mostly automatic — verify, don't rebuild)

Derived surfaces that update themselves once data/corpus change: dossier meta
descriptions (domain list + metric count), chronicle descriptions (event
counts), JSON-LD `Dataset` citations, sitemap lastmod (history `updated` /
domain `updated`), `/llms.txt` (a route), social cards (event counts),
timeline/themes pages (rebuilt from the corpus). Verify a sample in the built
HTML rather than re-implementing anything.

Manual checks per workstream: metric-key uniqueness (builder throws), new
tabs render with sources footer, `MetricDetail` value/rank lenses work for a
new metric, `public/data/series/<key>.json` files exist (`build-series-index`
chains into `build-domains`).

Post-deploy, each batch: spot-check live HTML; submit changed URLs to
IndexNow (key file `public/f3cd899db6301c1908d52b29c3ae5f08.txt`, POST
`https://api.indexnow.org/indexnow` with host/key/keyLocation/urlList).
Google needs no ping — the sitemap is registered in Search Console and honest
lastmod does the signalling. GSC API access recipe: auto-memory `gsc-access`
(ADC token + `x-goog-user-project: unified-gift-486916-u3`).

## Order and definition of done

Order: 1 → 2 → 3 → 4. The domain work is fast and compounds (every dossier
page gets richer, which is also what the thin-history nations need while
their prose is being written); histories are the long tail.

Done when: three new domains + enriched resources live with 0 validator
errors; every listed nation meets the per-nation bar; `npm run validate`,
`npx tsc --noEmit`, `npm run build` all green; live spot-checks pass; changed
URLs submitted to IndexNow.
