# The GEO export layer — markdown twins, llms.txt, llms-full.txt

Written 2026-08-11, at the end of the mission that built it. Read alongside
`CLAUDE.md`, `docs/rankings-surface.md` and `docs/commodities-surface.md`
(the surfaces being twinned). Three commits: the twins + generator +
validator, the llms indexes + discovery wiring, this document — each gated
on `npm run validate` + `tsc` + a constrained build.

---

## 1. What this is

Every content page has a **markdown twin** at `<canonical-path>.md` — a
plain-text version an LLM crawler or agent fetches for a few KB and can
quote with full provenance. 433 twins: 186 dossiers (`/country/FRA.md`),
184 chronicles (`/country/FRA/chronicle.md`), 53 rankings
(`/rankings/gdp.md`), 10 commodities (`/commodities/copper.md`). Plus two
indexes: `/llms.txt` (the llmstxt.org-shaped map, linking the twins) and
`/llms-full.txt` (the one-fetch corpus). Citation-friendliness is the
product: the twin exists so an answer engine's cheapest path to a figure
runs through a document that names its source.

## 2. The format contract

Every twin, in order:

1. `# <title>` — self-describing ("France — national dossier").
2. The **same one-line description the HTML page's meta carries** (the seo
   helpers are shared, so the two cannot say different things).
3. `Canonical: https://terralore.co<path>` — the page to link.
4. `Updated: <date>` — the honest data vintage (domain refresh, history
   verification date, MCS edition), never a build timestamp.
5. The substance, as markdown tables/lists **holding every invariant**:
   - rankings: definition, unit, the WGI/mixed-vintage/minerals notes, the
     full table with per-row observation years, the named No-data list;
   - commodities: what is measured (the pinned MCS row), world totals,
     producer table with both years and shares, the Rest-of-world row
     ("below the table's rounding" where the residual is sub-precision),
     withheld notes;
   - dossiers: overview, territory/no-data notes, one table per domain
     (value · observed year · source), links onward;
   - chronicles: founding, summary, every era's events with year + source
     keys, figures, and a keyed References list resolving those keys.
6. `## Sources` — the true upstream attributions (label, publisher,
   license, accessed date, URL).
7. A one-line citation template:
   `Citation template: Terralore, "<title>", terralore.co<path>, retrieved <YYYY-MM-DD>.`
   The retrieval date is a **literal placeholder** — baking a build date in
   would assert a retrieval that never happened, and would rot besides.

Absence ≠ zero ("—" cells, named gaps), highest/lowest never best/worst
(validator-enforced on Terralore-authored twins), WGI as absolute scores —
all hold in the twins exactly as in the HTML.

## 3. Architecture — why it cannot drift

- **`lib/geo.ts` is the one composer.** It imports the SAME modules the
  HTML pages render from (`lib/rankings`, `lib/domains`, `lib/histories`
  including `france.ts`, `lib/commodities`, `lib/seo`, `lib/format`), so
  factual identity with the pages is by construction. Proven empirically
  against the built server: `/rankings/gdp.md` 179/179 rows,
  `/commodities/lithium.md` 10/10, `/country/FRA.md` 42/42 metrics
  (raw RSC-payload value → `formatMetric` === twin cell).
- **Twins are committed static files in `public/`.** Public assets win over
  dynamic route segments (verified: `public/country/ZZZ.md` beat the
  `[code]` page on the built server), and Next serves `.md` as
  `text/markdown` from the extension. Zero runtime, zero middleware/proxy,
  and deploys carry the twins regardless of which build command the host
  runs — deliberately NOT hooked into `prebuild`, because the deploy
  container's node version is not ours to assume (see loader note below).
- **`scripts/lib/ts-alias-loader.mjs`** lets node scripts execute the
  repo's TypeScript directly (node ≥ 23-era type-stripping + hooks for the
  `@/` alias, extensionless/directory imports, and attribute-less JSON
  imports). This is what lets the generator and validator use `lib/geo.ts`
  itself instead of re-deriving logic in `.mjs` — the France TypeScript
  history and the ranking tie/alias rules stay single-sourced.
- **Regeneration**: `npm run build-geo`, chained into `npm run
  build-domains` (data refresh ⇒ twin refresh). History edits require a
  manual `build-geo` — the validator makes forgetting impossible:
- **`scripts/validate-geo.mjs`** (in `npm run validate`) regenerates every
  twin and **byte-compares** it against the committed file — freshness and
  factual identity are the same check. Also: per-surface coverage counts
  (exactly one twin per canonical page), orphan-ghost scan of the managed
  directories, the llms-full size cap, and the best/worst language rule —
  which caught its own first draft's disclaimer ("highest, not best")
  using the banned word.

## 4. The indexes

- **`/llms.txt`** (route, SSG): llmstxt.org shape — H1, blockquote, the
  reading contract ("fetch the .md twin"), citation guidance, then
  `## Rankings / Commodities / Chronicles / Dossiers` sections whose links
  point at the twins, and `## Optional` for the human HTML surfaces
  (hubs, periods, themes). Links derive from the same `allTwins()` set the
  validator checks, so a listed URL cannot fail to resolve without
  `npm run validate` failing first.
- **`/llms-full.txt`** (route, SSG): all 53 ranking tables + all 10
  commodity tables + one summary block per nation — ~527 KB. **Cap:
  1 MiB** (`LLMS_FULL_CAP` in `lib/geo.ts`), validator-enforced.
  Rationale: one fetch that fits whole in an agent's context beats a
  complete dump that doesn't; the growth budget to the cap is roughly
  double today's corpus. What it omits it states in its own header: the
  ~291k-word chronicle corpus, which lives one fetch away per nation at
  the chronicle twins, all indexed in llms.txt.

## 5. Discovery

- Every content HTML page carries
  `<link rel="alternate" type="text/markdown" href="…/<path>.md">` via
  `mdTwinTypes()` in `lib/seo.ts` (`Metadata.alternates.types`).
- `robots.ts` already named every answer-engine crawler explicitly
  (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-User,
  Claude-SearchBot, PerplexityBot, Perplexity-User, Google-Extended,
  CCBot, Applebot-Extended, Bingbot, Amazonbot, meta-externalagent) —
  nothing to change; the human-crawler policy is untouched.
- The `.md` files are deliberately **not** in the sitemap: they are
  alternates of canonical pages, not canonical pages. Engines find them
  via the alternate links and llms.txt.

## 6. How a new surface type registers its twin

1. Write a `<surface>Twin(...)` composer in `lib/geo.ts` following the §2
   contract (title, description from the same seo helper the HTML uses,
   canonical, honest vintage, substance, Sources, citation line) and add
   its kind to the `Twin["kind"]` union.
2. Emit it from `allTwins()`; add the expected count to the `want` table in
   `scripts/validate-geo.mjs` and, if its files live in a new directory,
   a `pruneDir`/`scan` entry in generator and validator.
3. Add `types: mdTwinTypes(path)` to the HTML page's `alternates`.
4. Give it a section (or line) in `app/llms.txt/route.ts`; include it in
   `llmsFullText()` only if it fits the cap's budget.
5. `npm run build-geo` && `npm run validate` — coverage, freshness,
   orphans and the language rule are asserted from then on.

## 7. Judgment calls, recorded

- **Chronicle twins carry the event record, not the era prose.** The
  contract asked for "the events"; the ~291k words of narrative stay on
  the canonical pages (and the twin says so). Every event's summary,
  year and source keys are present — the citable skeleton.
- **Retrieval date as placeholder** (`<YYYY-MM-DD>`), per §2.
- **`prebuild` not used** — a deploy-container node older than the
  loader's needs would turn every deploy red. Committed twins + validator
  freshness deliver the same guarantee without the risk.
- **Journey pages are not twinned**: the journey and the chronicle are two
  presentations of one entity (the JSON-LD already consolidates them onto
  the chronicle); a journey twin would be a duplicate of the chronicle
  twin under a second URL.
