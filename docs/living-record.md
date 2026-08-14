# The Living Record — claim identity, the seal, and the recorder

Written 2026-08-14, **before** the implementation it specifies (the D1
precedent: a scheme written after the code is a description of the code;
written first, it is a contract the code must meet). Read alongside
`CLAUDE.md`, `DECISIONS.md` (D14 records why this scheme and not the
alternatives), `docs/geo-surface.md` (the export layer the claims files
join) and `docs/refresh-domains.md` (the runbook the recorder subsumes).

The mission in one line: Terralore has been a photograph — a corpus that is
always current and never remembers. The Living Record makes it a record:
every observation is an addressable claim (Layer 1), every corpus state is
sealed by hashes (Layer 2), and every refresh is diffed and published as a
ledger entry (Layer 3), so the site can say not only "here is the figure"
but "here is what this figure used to be, and when, and why it moved."

---

## 1. Layer 1 — claim identity

### 1.1 The grammar

One colon-separated grammar, deterministic, derived only from committed
content, never from build state:

```
TL:<subject>:<measure>:<vintage>
```

| Claim kind | Form | Example |
|---|---|---|
| Dossier observation | `TL:<A3>:<metricKey>:<observedYear>` | `TL:FRA:gdp:2024` |
| Commodity share | `TL:<A3>:<mineralKey>-share:<year>` | `TL:CHL:prodCopper-share:2025` |
| Commodity world total | `TL:WLD:<mineralKey>-total:<year>` | `TL:WLD:prodCopper-total:2025` |
| Chronicle event | `TL:<A3>:event:<yearToken>:<slug>` | `TL:FRA:event:1789:the-bastille-falls` |

- `TL:` is the namespace — it marks the string as a Terralore claim ID and
  keeps it greppable in any text it lands in.
- `<A3>` is the canonical ADM0_A3 code, as everywhere. `WLD` is reserved
  for world aggregates (it is no nation's ADM0_A3).
- `<metricKey>` is the domain files' metric key, which is already globally
  unique across domains (the series-index builder throws on collision) —
  so the domain never appears in the ID and a metric moving between
  domains would not change its claims' identity.
- `<observedYear>` is the year the value refers to (the `year` field),
  never the retrieval or build year.
- `<yearToken>` is the event's numeric `year` — `1789`, or `52bce` for
  −52 (the authored `yearLabel` is display precision, not identity).
- `<slug>` is the event title, kebab-cased: lowercase, diacritics folded
  to ASCII, non-alphanumerics collapsed to single hyphens, truncated at a
  word boundary to ≤48 chars. If two events in one nation share year and
  slug, the later one (in era order, then event order — the corpus's own
  order) takes `-2`, `-3`, … . Deterministic; no hashes, no randomness.

### 1.2 What makes two claims the same claim

**Identity is the subject, the measure, and the vintage — never the
value.** Attributes (value, unit, source, series, summary text) belong to
the claim; they do not name it.

- **A revision** is the same identity with a changed attribute: the World
  Bank restates France's 2023 GDP, the USGS corrects a tonnage, an author
  tightens an event summary. Same claim ID, new content — and the change
  is **recorded in the ledger as a REVISION**, labelled by origin:
  `upstream` (the publisher moved) or `terralore` (we corrected our own
  record). The two must never be conflated — one is the world's
  statistical apparatus at work, the other is our erratum.
- **A new vintage** is a new claim: when the latest GDP observation moves
  from 2024 to 2025, `TL:FRA:gdp:2025` is born and `TL:FRA:gdp:2024`
  stops being the published specimen. The ledger records the new claim as
  a NEW OBSERVATION superseding the old one; the old claim was never
  wrong and is not "revised" — it was true of its own year.
- **A retirement** is an identity that leaves the published corpus with
  no successor: a value going to `null`, a metric or producer dropped, a
  series withdrawn. Absence appearing is a recorded fact (invariant §5.5
  extended in time), so retirements are ledger entries, never silent.

Scope note: a claim is a **rendered observation** — the specimen a reader
can flip. The trailing series points behind a sparkline are the source's
history of the same measure, reachable through the claim's series file;
they do not get separate IDs (an ID per series point would mint ~90k
identities nobody can cite a surface for).

Ranking rows and compare rows mint **no identity of their own**: a rank is
Terralore arithmetic over dossier claims, so a ranking row resolves to —
and displays — the underlying dossier claim ID. Commodity **shares** do
get their own IDs because a share is a published Terralore computation
(tonnage over the printed MCS world total, per
`docs/commodities-surface.md` §3) whose value exists on no upstream page;
its claims file records the derivation: numerator claim + world-total
claim.

### 1.3 Resolution — three ways, all SSG

1. **HTML.** Every proof-flip reverse face carries its claim ID (small,
   mono, selectable). Every claim has a stable fragment on its canonical
   page:
   - dossier: `/country/FRA#claim-gdp-2024` (the specimen row's `id`)
   - chronicle: `/country/FRA/chronicle#ev-1789-the-bastille-falls`
     (`ev-<yearToken>-<slug>`)
   - commodity: `/commodities/copper#claim-chl` (the producer row; both
     year-shares and the row's tonnages resolve to it)
   Fragment ids use hyphens, not colons — HTML allows colons in ids but
   CSS selectors and hand-typed URLs do not enjoy them.
   A fragment names the *current* claim; when a vintage supersedes it the
   old fragment leaves the page and the claims file + ledger remain the
   durable record. That is honest: the page shows what is published, the
   record shows what was.
2. **JSON.** Bundled per surface, never one file per claim:
   - `/country/<A3>.claims.json` — every dossier observation
   - `/country/<A3>/chronicle.claims.json` — every event claim
   - `/commodities/<slug>.claims.json` — shares, world totals, and the
     producer tonnages as references to their dossier claims
   Each claim carries: value, unit, observed year, source id + upstream
   publisher + URL, license, retrieval vintage (the source's `accessed`
   date), the fragment URL, and a ready citation string per the GEO
   template. Files are committed in `public/` exactly as the markdown
   twins are, generated by the same composer pattern (`lib/claims.ts`,
   `scripts/build-claims.mjs`), validated by regenerate-and-byte-compare.
3. **The citation string** includes the claim ID, so a quotation carries
   its own resolver:
   `Terralore, "France — national dossier", terralore.co/country/FRA#claim-gdp-2024, claim TL:FRA:gdp:2024, retrieved <YYYY-MM-DD>.`

Discovery: every markdown twin links its claims file; `/llms.txt` states
the claims convention in its preamble.

### 1.4 The validator

`scripts/validate-claims.mjs` (in `npm run validate`): regenerates every
bundle and byte-compares against `public/` (freshness = identity, the
geo-layer precedent); asserts corpus-wide ID uniqueness; asserts coverage
both ways (every non-null rendered observation has exactly one claim, no
claim without a live observation). Fragment resolution is asserted
post-build by `scripts/validate-claim-fragments.mjs` (in `npm run ci`,
beside the seam validator): the prerendered HTML of every dossier,
chronicle and commodity page must contain every fragment id its claims
file promises.

## 2. Layer 2 — the seal

### 2.1 What is sealed

`public/integrity.json` — the corpus manifest: one SHA-256 per corpus
file, a corpus root hash, the seal timestamp, and the data vintages. The
hashed set is (a) the source corpus — `lib/histories/data/*.json`,
`lib/histories/france.ts`, `data/countries.json`, `data/domains/*.json`,
`data/commodities.json`, `data/compare-pairs.json`,
`data/ranking-slugs.json`, `data/ledger/*.json` — and (b) the published
derivations a reader actually fetches: the claims files and the markdown
twins. (b) is derivable from (a), and the validators already prove that;
sealing both means a reader can verify the exact bytes they fetched
without re-deriving anything.

The **root hash** is the SHA-256 of the manifest's own file list in
canonical form (`<sha256>  <path>` lines, sorted by path, one trailing
newline) — the standard checksums-file construction, verifiable with
`sha256sum` and nothing else. The **corpus version** is the seal date
(`2026-08-14`; a second seal on one day takes `.2`).

### 2.2 The archive

Every seal is copied to `public/integrity/<version>.json` — an
**append-only** directory, committed. History is the point: the honest
claim is tamper-*evidence*, not tamper-*proofing* — we cannot silently
rewrite history because every past manifest is in the public git history
and on the live site, and a rewritten corpus would hash differently than
the manifest everyone already fetched. No blockchain, no external
timestamping service, no theater; the git history and the readers' own
copies are the witnesses.

### 2.3 When the seal moves

The seal is cut by `scripts/build-integrity.mjs`, chained at the end of
`npm run build-domains` and runnable alone. `npm run ci` fails if the
committed manifest does not match the committed corpus — so any state
that ships is sealed, while intermediate commits inside a mission need
not each cut a version. One version per deployed corpus state, not per
keystroke. The `/integrity` page (modest, in the design language)
explains the scheme to a skeptical reader and shows the current root.

## 3. Layer 3 — the recorder

### 3.1 The diff engine

`scripts/lib/claims-snapshot.mjs` extracts the claim set from any corpus
state — the working tree, or any git ref via `git show` — and
`scripts/record-refresh.mjs` diffs two states into a structured change
record: per nation, per domain — NEW (new vintage or newly published
measure), REVISED (same claim, changed value — labelled upstream unless
we changed it), RETIRED (observation absent where one stood; absence
appearing is recorded as a fact), SOURCE (a source's label, URL, license
or accessed date moved — methodology changes ride this lane). v1 scope
is the data corpus (domains + commodities); history-file changes are
sealed by Layer 2 and diffable by the same machinery later — the event
claims exist from day one, the event differ is future work, stated.

Language is validator-enforced neutral: no improved/worsened/better/
worse/best/worst anywhere in ledger prose or rendering; bounded scales
(%, 0–100 scores) report change in **points**, per the house rule.

### 3.2 The surfaces

- `/ledger` — the world-level record: one entry per recorded refresh
  (date, domains touched, counts, notable structural changes), each entry
  at `/ledger/<slug>` with its own page and OG card. Entries live in
  `data/ledger/*.json` (append-only, like the seals), read by
  `lib/ledger.ts`.
- The per-nation **RECORD** bed on the dossier — that nation's recent
  changes, each row linking its claim fragment and its ledger entry.
  Designed in the strata language; logged as deviation E15.
- GEO: ledger twins + llms.txt lines, per `docs/geo-surface.md` §6.

### 3.3 Recorded refreshes are deliberate acts

One command: `npm run record-refresh` — snapshot HEAD, run
`refresh-domains`, snapshot the tree, write the entry, rebuild claims +
twins, cut the seal, print the summary for the operator to read before
committing. The monthly Coolify task is **detection only**: a dry-run in
a throwaway clone (pull → diff → would-be entry to the Marsad status
path), publishing nothing. The machinery makes a recorded refresh cheap;
it does not make it automatic.
