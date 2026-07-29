# The Statehood Deepening — harden the record, finish the claims, surface them

**For the executing agent:** this file is your complete instruction set. Read all
of it before writing any code or content, along with `docs/statehood-plan.md`
(the mission this one builds on — its §3 editorial criteria remain in force
verbatim and are not restated here), `CLAUDE.md`, `DESIGN.md` and `DECISIONS.md`
(D9–D12 especially). Where this plan and your instinct disagree, this plan wins;
where it is genuinely ambiguous, follow the corpus's standing editorial rules
and record your reasoning in a new `DECISIONS.md` entry.

---

## 1. Where the last mission left the corpus, precisely

The statehood pass (commits `cac3679`…`396958f`) delivered its done-criteria:
**184/184** published histories carry a sourced `statehood` block, 68
interruptions of sovereignty across 56 nations, zero SKIPPED, validator
coverage check at error, caption updated, production verified. The Time Globe
now tells the truth about Morocco in the 12th century and Poland in the 1800s.

The close-out review found five debts. They are this mission's work, and they
are ordered by how much each threatens the corpus's one non-negotiable — that
every claim is traceable to a source that was actually read:

1. **Fabricated precision.** At least two blocks carry a `yearLabel` more
   precise than their cited sources support: Guinea says *"2 October 1958"*
   citing a source that states 1 November 1958 (US recognition); Malta says
   *"21 September 1964"* citing a source that states 18 September. Both dates
   are correct in the world; neither is correct *in the citation*. The pattern
   arose because verification fetches answered "when was X recognised" and the
   block wrote the (true, but unverified-there) declaration date. Until every
   one of the 184 `yearLabel`s has been checked against what its cited sources
   actually say, the corpus does not know how many of these it has.

2. **Source-tier debt.** 83 of the 183 JSON blocks anchor `formation` on
   Wikipedia alone; 146 rest on a single source. Root cause: **1,347 of the
   corpus's 3,658 unique source URLs are Britannica, and Britannica now sits
   behind a Cloudflare challenge that no fetch passes.** The statehood pass
   routed around it; this pass repairs the routing.

3. **Invisibility.** `statehood` is consumed by exactly three files —
   `GlobeLite.tsx`, `AtlasHome.tsx`, `TimeRail.tsx`. A reader who sees Morocco
   dimmed in 1912 and clicks through finds no statehood statement on the
   dossier, the chronicle, the journey, the card, or in the structured data.
   The corpus's richest new claim has one surface, and it is the one surface
   where nothing can be read.

4. **An uneven final sweep.** Named gaps: Vietnam's Ming occupation
   (1407–1427) is a formalised annexation ended by restoration and is missing;
   Morocco's interruption label omits the Spanish protectorate that the same
   file's `founding.detail` establishes (the original plan's §2 example label
   was literally *"French and Spanish protectorates"*); India's Company-rule
   question (1757/1818–1858) was parked without a decision record; the
   validator never cross-checks §3.2's own assertion that an interruption's
   end usually equals `founding.year`.

5. **Territories shaded as sovereigns.** NCL, GRL, FLK and PRI carry blocks
   whose first sentence says "not a sovereign state" — and the globe renders
   them limestone after formation, exactly like France. The shading contradicts
   the block's own prose. The corpus has a fill that *already means* "present
   but not sovereign"; the territories should wear it.

**Do not relitigate what was decided.** D10 (incomplete sovereignty is not
sovereignty lost), D11 (unrecognised annexations judged by whether the state
stopped functioning), and D12 (traditional dates published with their status)
stand. This mission applies them further; it does not reopen them.

---

## 2. The precision rule (new, and the heart of workstream A)

Add this to your head next to the original §3.5, because it is a sharpening of
it:

> **A date more precise than its cited sources support is a fabrication of
> precision, even when the date is correct.** Every `yearLabel` that names a
> day or month must be stated, at that precision, by at least one source the
> claim cites. When no citable source supports the precise form, either add a
> source that does (the file often already carries one — Guinea's own
> `ebsco-independence` covers 2 October) or soften the `yearLabel` to the
> precision the citations support ("1958"). Softening is honourable;
> unsupported precision is not.

The same rule applies inside `detail` prose: a `detail` that asserts a specific
date, quotation or figure must be traceable to a source cited *somewhere in the
same block* (formation or interruption). Corpus-wide prose is out of scope;
statehood blocks are not.

## 3. The two new editorial floors

- **Two-source floor for deep anchors.** Every `formation` with
  `year < 1800` must cite **at least two independent sources** (different
  publishers; two Wikipedia articles do not count as two publishers). Deep
  claims are where a single wrong page does the most damage. Post-1800
  formations may stand on one source *if* it is a gov/encyclopedia/museum/
  academic tier source; a post-1800 formation resting on Wikipedia alone gets a
  second source too.

- **Wikipedia is a valid source, not a sufficient tier.** The goal is not to
  purge Wikipedia — the corpus cites it deliberately and D-series decisions
  accept it. The goal is that **no formation claim rests on Wikipedia alone.**
  Bring each of the 83 down with whichever of these answers a fetch:
  `history.state.gov` (230 country guides, reliable fetch), UNESCO World
  Heritage listings, World History Encyclopedia, EBSCO Research Starters,
  national museums/archives, Library of Congress country studies, academic
  presses. **Do not attempt to defeat Britannica's Cloudflare challenge** — no
  user-agent games beyond a plain browser UA, no scraping services. If a
  Britannica page is the only source on earth for a claim, the claim is not
  well-enough established to shade a globe with; find a different anchor or
  soften the claim.

---

## 4. The data model you will add

One field, deliberately small:

```ts
statehood?: {
  /**
   * Present and `false` only for entities that are not sovereign states —
   * dependencies and autonomous territories whose block records the birth of
   * their own institutions rather than statehood (NCL, GRL, FLK, PRI).
   * Absent (i.e. sovereign) for everything else, INCLUDING de-facto states
   * whose sovereignty is disputed (TWN, KOS, PSE, CYN, SOL): those are
   * functioning states whose recognition is contested, which the corpus
   * already handles in prose, and they keep the standard shading.
   */
  sovereign?: false;
  formation: { … };        // unchanged
  interruptions?: [ … ];   // unchanged
};
```

What it drives: a nation with `sovereign: false` renders **dimmed limestone in
every period from its formation onward** — the fill that means "present but not
sovereign," which is these territories' permanent condition, not a phase. Ghost
before formation as usual. This makes the sphere agree with the blocks' own
first sentences. Record the shading decision and its boundary (why TWN keeps
limestone and GRL does not) as a `DECISIONS.md` entry — the distinction is
*functioning statehood* vs *administered territory*, and it must be written
down where the next agent will find it.

---

## 5. Build order — instruments first, so the debts are counted before they are paid

Do these in order, each with `npx tsc --noEmit && npm run lint && npm run
validate` green before the next.

### 5.1 The link auditor — `scripts/audit-links.mjs`

The corpus holds 3,658 unique source URLs and has never once checked them.
Build the instrument the whole corpus needs, not just this mission:

- Fetch every unique URL (HEAD, falling back to ranged GET; concurrency-capped;
  polite delays per host; a plain browser UA). Classify: `ok` (200), `redirect`
  (report the landing URL — drift is future rot), `blocked` (403/429/challenge
  pages — Britannica lands here; that is a *fact to record*, not a failure to
  fix), `gone` (404/410/DNS), `error`.
- Emit `docs/link-audit.md` (counts by class and by host, plus the full `gone`
  list with every file:source-id that cites each dead URL) and a machine copy
  under the scratchpad for your own batching.
- **Fix only `gone` URLs whose claims the statehood blocks depend on plus any
  `gone` source cited by a `formation`/`interruption`.** Corpus-wide dead-link
  repair beyond that is out of scope — report it, don't chase it. Never delete
  a source; repair the URL (publisher moved the page) or replace the source
  with an equivalent one, re-verifying the claim against the replacement.

### 5.2 The precision auditor — `scripts/audit-precision.mjs`

Static analysis first, fetches second:

- For every statehood block, parse `yearLabel` (and any explicit dates inside
  `detail`) and emit a worklist row per claim: code, claim text, precision
  (year / month / day), cited source ids and URLs. Flag mechanically where
  `yearLabel`'s year disagrees with `year` (should be none — the validator will
  enforce it from 5.3 on).
- The *verification* of each row against its sources is content work
  (workstream A below) — the instrument's job is to make the worklist
  exhaustive and to track it to zero. Give it a `--pending` mode that reads a
  checked-off ledger (`docs/statehood-precision-ledger.md`, one row per claim,
  with the verifying source id and a note) and prints only what remains, so
  progress is visible in every run — the same discipline as
  `audit-statehood.mjs` last mission.

### 5.3 Validator upgrades — `scripts/validate-histories.mjs`

- `yearLabel` must contain the same year as `year` (in BCE forms too:
  "788 CE", "c. 3100 BCE", "660 BCE (traditional)" all parse; a mismatch is an
  error).
- If `sovereign` is present it must be exactly `false`, and the code must be
  one of a declared allowlist in the validator (`NCL`, `GRL`, `FLK`, `PRI`) —
  adding a fifth territory means consciously editing the validator, which is
  the point.
- Cross-check: for every nation whose final interruption `end` differs from
  `founding.year`, emit an **info line** (not a warning) naming both years.
  Most should match (§3.2 of the original plan); the exceptions (Egypt,
  Vietnam, Iran, Armenia, Georgia, the pre-1800 restorations) are legitimate
  and this line simply keeps the divergence visible rather than silent.
- Two-source floor (§3): formation with `year < 1800` and fewer than two
  distinct publishers among its cited sources → **error**. Formation resting on
  Wikipedia-only citations → **warning** during the content batches, flipped to
  **error** at §9 exactly as coverage was last mission.

### 5.4 Builder + shading for `sovereign: false`

- `scripts/build-time-events.mjs`: emit `s: 0` in a territory's compact record.
  France parser untouched (France is sovereign).
- `components/GlobeLite.tsx`: a claim with `s === 0` renders `DIMMED_FILL` for
  every period at-or-after formation (formation-period copper still fires — the
  institutions' birth is still an event). No new colours, so no contrast work.
- `components/TimeRail.tsx` caption: no change needed — "formation, foreign
  rule, restoration" already covers what a reader sees. Do not grow the
  caption; it is at the edge of what a caption can carry.

### 5.5 The sovereignty bar — one component, three surfaces

The STRATUM device this data has been waiting for: a horizontal band from
formation to the present, limestone for sovereign spans, dimmed for
interruptions, a copper tick at each restoration — the existence shading
flattened into a timeline. Build it once (`components/SovereigntyBar.tsx`,
server-renderable, pure SVG like `Sparkline`, no dependencies) and place it:

1. **Chronicle masthead** — under the standfirst, full measure, with the
   formation label and each interruption label as accessible text (the bar is
   `aria-hidden`; the words carry the claim). This is the reading surface, so
   this placement carries source references like everything else there.
2. **Dossier history hero** — compact form beside the founding line, with a
   one-line summary: *"State formed c. 788 · under foreign rule 1912–1956"*.
3. **The journey intro** — smallest form, purely orienting.

Colour discipline: the bar uses the globe's three meanings (limestone /
dimmed / copper) re-expressed with existing tokens that pass contrast on each
ground — run `scripts/check-contrast.mjs` with any new pair *declared* before
any component ships, per D6. On limestone grounds the "dimmed" span will need
an ink-side value; solve it in the check file first, numerically, the way the
category pigments were solved.

### 5.6 Structured data — `lib/seo.ts`

Add `foundingDate` to the Country JSON-LD from `founding.year` (the field's
plain meaning — the current sovereign state) and a `description`-level sentence
derived from `statehood` where present. Everything flows through `lib/seo.ts`
as always; sitemap and canonicals untouched by this except where §5.7 adds a
route.

### 5.7 The statehood hub — `app/statehood/page.tsx`

The corpus-level read, and this mission's hero deliverable. One SSG,
server-only page (like the chronicle: everything in the initial HTML), derived
entirely at build time from the same verified blocks — **nothing on it is
authored separately** (the D7/chronology discipline):

- **The count of states through time.** For each of the 60 periods the rail
  already uses: how many of the corpus's nations existed as sovereign states,
  how many stood under foreign rule, how many were not yet formed. Render as a
  stacked band chart in the three existence fills — a core sample of
  sovereignty itself. Pure SVG, no chart library, `MetricChart`-adjacent but
  simpler.
- **The ledger.** Formations and restorations bucketed by period, each entry
  linking to its nation's chronicle; interruption starts likewise ("taken:
  …"). Every entry is a statehood claim the corpus already carries, with its
  sources resolvable one click away.
- **The honesty block.** A short prose section stating exactly what this page
  is: the corpus's own sourced claims, counted — modern borders, 184 nations,
  criteria linked (this file and the original plan are not published; restate
  the criteria in two sentences of page prose).
- Register in `lib/seo.ts` (route shape, canonical, JSON-LD Dataset or
  CollectionPage), `app/sitemap.ts` follows automatically, link it from the
  timeline hub and the atlas footer with `prefetch={false}` (link-dense pages
  rule). The page audit's clean count will grow from 1,054 — update the
  expected count wherever it is asserted.

### 5.8 Screenshots — `design-review/13-deepening/`

Extend `scripts/statehood-shots.mjs` or add a sibling for page shots:
the four territories dimmed on the globe (one frame, Pacific/Atlantic as
needed), the sovereignty bar on Morocco's chronicle and dossier, and the
`/statehood` page at desktop and 360px. Remember the two traps the last
mission's script learned the hard way: park the pointer off-sphere (hover tint
lies) and reload per shot (auto-rotation drifts). Environment: Playwright has
no browser for this distro — launch with
`CHROME_PATH=~/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome`.

---

## 6. Content batches

Six batches, one commit each, `npm run validate` at 0 errors before every
commit, tracking table updated per batch. Where a batch's work changes a claim,
the claim is re-verified against a fetched source — the original §3.5 rule has
not softened.

1. **Instruments** — 5.1, 5.2, 5.3 built and their reports committed. The
   link-audit and precision worklists are this mission's map, exactly as
   `audit-statehood.mjs` was last mission's. No content changes yet.
2. **Precision to zero** — work the 5.2 ledger through all 184 blocks. For
   each day/month-precision claim: confirm a cited source states it, or add
   one that does (prefer sources the file already carries — Guinea's
   `ebsco-independence` is the model), or soften the label. Fix the two known
   cases first (GIN, MLT), then sweep. Also fix the Morocco label ("French and
   Spanish protectorates") and re-verify its Spanish end (April 1956) against
   a fetched source while there.
3. **Source-tier uplift** — the 83 Wikipedia-only formations and the
   two-source floor for every pre-1800 formation. This is the heaviest fetch
   batch; the 230 `history.state.gov` guides, UNESCO, WHE, EBSCO and LOC
   country studies will carry most of it. Any block that cannot reach its
   floor goes into a REMAINS table in the tracking doc with the reason and
   what was tried — the SKIPPED discipline, applied to sourcing.
4. **The adjudications** — the named list, each closed with either a sourced
   change or a `DECISIONS.md`-grade note in the tracking doc:
   - **VNM**: the Ming occupation, 1407–1427 (annexation as Jiaozhi province;
     restoration under Lê Lợi). Expected outcome: add it.
   - **IND**: Company rule before 1858. Adjudicate against §3.2/§3.3 — the
     Mughal emperor's nominal sovereignty until 1858 is the crux. Whatever the
     outcome, write the decision down; last mission parked it silently.
   - **KOR/PRK**: the 1905 protectorate vs the 1910 annexation as the
     interruption's start. Adjudicate and record.
   - **IRN**: the Mongol conquest/Ilkhanate (1258–, ruled *from within* Iran
     after 1256 — likely no change, but the reasoning belongs in the record).
   - **EGY**: confirm the 969 Fatimid boundary and the Mamluk non-interruption
     survive a second look, with one added source if either needs it.
   - Sweep the remaining 56 interruption carriers once against their own
     chronicles for any interruption the prose asserts and the block lacks —
     the chronicle is the hint-list, exactly as it was for formations.
5. **Territories + surfaces** — `sovereign: false` on the four territories
   (5.3, 5.4), the sovereignty bar on its three surfaces (5.5), dossier line,
   JSON-LD (5.6). Screenshots.
6. **The hub** — `/statehood` (5.7), SEO wiring, page-audit count updated,
   validator's Wikipedia-only warning flipped to error, screenshots, PROGRESS
   and DECISIONS entries, deploy, production page audit, production
   screenshots, IndexNow.

---

## 7. Tracking

Extend `docs/statehood-progress.md` with this mission's sections rather than
creating a second file — one document holds the statehood record:

- a **precision ledger** section (or link to `docs/statehood-precision-ledger.md`
  if it is large): every day/month claim, its verifying source, checked off;
- a **source-tier table**: per nation, formation source count and tiers, before
  → after;
- an **adjudications table**: the §6.4 list, each row `changed` /
  `no-change: <reasoning>` with sources;
- a **REMAINS table** for floors that could not be met, with reasons — under
  ten rows or the floors were set wrong; talk to the operator via the tracking
  doc rather than quietly lowering them.

The instruments are the ground truth the tables must agree with, as before.

---

## 8. What you must NOT do

- Never edit `founding` (any field), era prose, events, figures, quickFacts, or
  any existing source's meaning. Statehood blocks and their sources are this
  mission's write surface; the two documented label fixes (MAR) and any
  adjudicated interruption changes are within it.
- Never write or keep a claim you did not verify against a fetched source. A
  claim that was *right* last mission but unverifiable this mission gets its
  citation fixed, not its fact removed — softening precision is the tool.
- No attempts to circumvent Britannica's (or anyone's) bot protection.
- No new dependencies. The chart, the bar and the hub are hand-rolled SVG and
  server components like everything else here.
- No design outside STRATUM: existing tokens, existing type scale, contrast
  declared in `check-contrast.mjs` before any new pair ships, `.stratum-top`
  and the three-tint semantics as documented. The sovereignty bar is a stratum
  rule wearing the existence fills — if it starts needing new colours, it is
  wrong.
- Do not touch `data/domains/*` or the dossier data pipeline (adding a
  *component* to the dossier page is in scope; its data plumbing is not).
- `/statehood` derives; it never authors. If a fact is not in a history file,
  it is not on that page.
- Commit per batch; CI green on every push; never one mega-commit.

## 9. Done-criteria

1. `scripts/audit-precision.mjs --pending` prints **zero** rows; the ledger
   covers every day/month-precision claim in all 184 blocks.
2. Zero formations resting on Wikipedia alone (validator at **error**), and
   every pre-1800 formation cites ≥2 publishers — or a REMAINS row explains
   why, and REMAINS has fewer than ten rows.
3. `scripts/audit-links.mjs` report committed; zero `gone` URLs cited by any
   statehood claim; corpus-wide `gone` list published in `docs/link-audit.md`
   for a future mission.
4. The §6.4 adjudications all closed in the tracking table; any block changes
   sourced and validated.
5. Four territories carry `sovereign: false`, render dimmed after formation,
   and the validator allowlists exactly those four.
6. Sovereignty bar live on chronicle, dossier and journey; `/statehood` live,
   derived, and in the sitemap; JSON-LD `foundingDate` present; page audit
   clean at its new count, locally **and against production**.
7. Full suite green: validators (0/0), `tsc`, lint, contrast (every new pair
   declared), build. Screenshots archived under `design-review/13-deepening/`
   including production frames.
8. `PROGRESS.md` entry; `DECISIONS.md` entries for the territory-shading
   boundary and every §6.4 adjudication that sets precedent.
9. Deployed, production page-audit clean, IndexNow pinged.

---

*Written 2026-07-29, the day the statehood pass closed at 184/184 (commits
`cac3679`…`396958f`). The precision and tier debts it repairs are quantified in
§1 from the corpus itself: 2 confirmed precision gaps (GIN, MLT), 83
Wikipedia-only formations, 146 single-source formations, 1,347 unfetchable
Britannica URLs of 3,658 total.*
