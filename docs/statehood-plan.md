# The Statehood Plan — filling in the world before independence

**For the executing agent:** this file is your complete instruction set. Read all of
it before writing any code or content. Where this plan and your instinct disagree,
this plan wins; where this plan is genuinely ambiguous, follow `DECISIONS.md`'s
existing editorial rules and record your reasoning in a new entry there.

---

## 1. The problem, precisely

The landing globe travels through time. Its "existence shading" ghosts a nation
until `founding.year` and renders it limestone after. The shading is *faithful to
the data* — and the data has a criterion inconsistency:

- Egypt's `founding.year` is **−3100** (state formation). France's is **843**.
- Morocco's is **1956**, labelled *"Restoration of independence"* — a label that
  itself admits a state existed before the thing being restored.
- **151 of 183** published histories carry `founding.year ≥ 1800`. For **149** of
  them, the nation's own chronicle opens 300+ years earlier.

So the Time Globe currently shows Morocco — a state with twelve centuries of
dynastic continuity — as *not yet existing* through the 19th century, while Egypt
glows limestone from the Bronze Age. Both render the data correctly; the data
answers two different questions. The mission: make the corpus answer **both
questions, for all 183 nations, accurately and sourced**.

**Do not "fix" this by editing `founding.year`.** That field means *"the current
sovereign state dates from"* and is used verbatim by the dossier hero, the atlas
index and the country card. It is not wrong; it is incomplete.

---

## 2. The data model you will add

Extend `CountryHistory` in `lib/types.ts`:

```ts
/** Sourced statehood anchors — what the Time Globe's existence shading reads. */
statehood?: {
  /**
   * The earliest sourced, NAMED polity from which the modern nation draws a
   * broadly accepted line of identity, seated primarily on its modern
   * territory. This is a historiographic anchor, not a nationalist one — see
   * the criteria in §3.
   */
  formation: {
    year: number;          // negative = BCE
    yearLabel: string;     // display form, e.g. "788 CE", "c. 3100 BCE"
    label: string;         // e.g. "Idrisid dynasty unifies northern Morocco"
    detail?: string;       // one sentence of nuance if needed
    sources: string[];     // ids into this file's sources[] — MUST resolve
  };
  /**
   * Formalised losses of external sovereignty between formation and today:
   * colony, protectorate, annexation, incorporation. NOT wartime military
   * occupations (see §3.3). Ordered, non-overlapping.
   */
  interruptions?: {
    start: number;
    end: number;           // the restoration year — usually founding.year
    label: string;         // e.g. "French and Spanish protectorates"
    sources: string[];     // MUST resolve
  }[];
};
```

The block is **optional** in the schema so batches can land incrementally, but the
done-criterion (§8) is that every published history has one.

---

## 3. Editorial criteria — this section is the whole ballgame

"Accurately" means *consistent criteria applied everywhere*, then sourced. Write
these into your head before nation one.

### 3.1 What counts as `formation`

The earliest polity meeting **all four**:

1. **Named and dateable** in mainstream historiography (a dynasty, kingdom,
   confederation, republic — not "peoples were present").
2. **Continuity of identity**: standard reference works describe the modern
   nation as tracing statehood to it. The nation's own chronicle in this corpus
   almost always names the right candidate already — start there.
3. **Seated primarily on the modern territory.** (The Mali Empire anchors Mali,
   not Guinea; Kievan Rus′ is contested between several nations — see §3.4.)
4. **Sourceable** to at least one reference of the kinds this corpus already
   accepts (Britannica, national archives/museums, UNESCO, academic works).

Rules of thumb, matching what the corpus already did well:
- Morocco → Idrisid dynasty, 788. Not the Roman province, not independence.
- Nations that genuinely ARE modern creations keep a modern formation: for many
  post-colonial states with no precursor polity of continuous identity (e.g.
  several Caribbean and Pacific states), `formation.year` may legitimately equal
  `founding.year`. **A modern date is a finding, not a failure** — record it and
  move on. Do not excavate a precursor that historiography does not support.
- First-era `startYear` in the chronicle is a *hint*, never the answer: eras often
  open with prehistory or geography, which fails criterion 1.

### 3.2 What counts as an `interruption`

A **formalised, internationally recognised loss of external sovereignty** lasting
from a dateable start to a dateable restoration: colonisation, protectorate,
annexation, full incorporation into another state, partition out of existence
(Poland 1795–1918). The end year is the restoration — for most, exactly the
existing `founding.year`, which is why that field stays untouched.

### 3.3 What does NOT count

- **Wartime military occupation** with sovereignty restored at war's end
  (Belgium 1914–18, Norway 1940–45): no interruption. The corpus's chronicles
  cover these; the shading claim stays minimal and defensible.
- **Vassalage, tribute, suzerainty** with retained internal statehood (Ottoman
  vassals, tributaries of China): no interruption unless historiography treats
  sovereignty as extinguished.
- **Personal unions and federations entered by consent** (Poland–Lithuania,
  the UK's formation): handle in `formation`/`detail`, not as interruptions.

### 3.4 Contested and shared anchors — the neutrality rule

Follow the corpus's standing rule: **describe, never adjudicate.**

- **Shared precursors** (Kievan Rus′ → RUS/UKR/BLR; ancient Macedon vs MKD):
  a precursor may anchor more than one nation *if* mainstream references support
  each claim; say so in `detail`. If references materially dispute a claim,
  prefer the *less contested, later* anchor and note the earlier tradition in
  `detail`.
- **TWN, PRK, KOR, ISR, PSE, KOS, and similar**: use de-facto dates for shading;
  carry the dispute in `detail` and the chronicle. Never let a shading choice
  make a sovereignty argument the prose does not make.
- **Unrecognised states with histories in this corpus** (CYN, SOL): author the
  block by the same criteria; they are currently skipped by the globe for
  lacking centroids, not for lacking history.

### 3.5 The source-verification rule (non-negotiable)

Every `formation` and every `interruption` cites at least one source id that
resolves in that file's `sources[]`. Reuse existing sources where they already
support the claim (they often do — the chronicle prose discusses these events).
If you add a source, it follows the house rules: named publisher, stable
top-level URL, of the kinds listed in §3.1.4. **You must verify each claim
against the source's actual content (fetch it) before writing it. A claim you
"know" but did not verify does not go in.** If a source will not resolve or will
not support the claim, the nation goes to the SKIPPED table (§6) with a reason —
never into the data on memory alone.

---

## 4. Build order — code first, so every batch is visible immediately

Do these in order, each with `npx tsc --noEmit && npm run lint && npm run
validate` green before the next:

1. **Schema**: add `statehood` to `CountryHistory` (§2).
2. **Validator** (`scripts/validate-histories.mjs`): when `statehood` is present —
   `formation.year` is a number; `yearLabel`/`label` non-empty; every source id
   resolves; interruptions ordered, non-overlapping, `start < end`,
   `formation.year ≤ first start`; `end ≤ 2026`. Emit a **warning** (not error)
   for any published history still missing `statehood`, so coverage is visible in
   every validator run. Flip to error only at §8.
3. **Builder** (`scripts/build-time-events.mjs`): emit per nation
   `statehood: { f: year, i: [[start,end],...] }` when present, falling back to
   `founding.year` as today. Parse `france.ts` structurally with loud assertions,
   as the file already does for events.
4. **Shading** (`components/GlobeLite.tsx` + `components/AtlasHome.tsx`): four
   states —
   - period entirely before formation → ghost (current treatment);
   - formation falls inside the period → copper (born — current treatment);
   - period inside an interruption → **dimmed limestone**
     `rgba(235, 233, 224, 0.42)` — present but not sovereign;
   - an interruption's `end` falls inside the period → copper again
     (sovereignty restored — this is what re-ignites Africa in the 1960s and
     Poland in 1918).
   Validate the two new fill colours in `scripts/check-contrast.mjs` (`decor`
   role) before shipping them.
5. **Caption** (`components/TimeRail.tsx`): the honesty line becomes
   *"today's borders · shaded by sourced statehood — formation, foreign rule,
   restoration"* once ≥ half the corpus carries the block; leave as-is until
   then (do not caption data that is not yet there).
6. **Audit script**: write `scripts/audit-statehood.mjs` printing the worklist
   table — code, `founding.year`, first-era year, has-statehood — sorted by the
   gap. This is your progress instrument; run it at every batch boundary.

## 5. Content batches

Work in **eight regional batches**, each one commit, in this order (worst
distortions and densest interruption history first):

1. North Africa + Middle East (MAR, DZA, TUN, LBY, EGY†, IRQ, SYR, LBN, JOR, …)
2. Sub-Saharan Africa, west (the 1960s wave — mostly modern formations plus
   Mali/Ghana/Benin-style named precursors to assess per §3.1)
3. Sub-Saharan Africa, east + south (ETH†, ERI, TZA, ZWE — Great Zimbabwe, …)
4. South + Southeast Asia (IND, PAK, LKA, MMR, KHM, VNM, IDN, THA†, …)
5. East + Central Asia (CHN†, JPN†, KOR, MNG, the five Stans, IRN, AFG)
6. Europe (mostly formed-early: fill interruptions — Baltics, Poland, Balkans)
7. Americas (mostly clean colonial→independence: formation often = founding;
   pre-colonial polities per §3.1 where historiography supports identity
   continuity — e.g. the shading must not imply the Aztec state *is* Mexico
   unless references say Mexico traces statehood so; usually it belongs in
   `detail`, not `formation`)
8. Oceania + Caribbean + microstates (†already-deep nations: verify, add
   interruptions if any, move on)

† = nations whose `founding` is already deep; they need verification and
possibly interruptions, not re-anchoring.

Per batch: author → `npm run validate` (0 errors) → `node
scripts/build-time-events.mjs` → screenshot the globe at the batch's pivotal
periods (the region's colonisation century and its independence decade) via
`scripts/review-shots.mjs`-style driving → eyeball that the shading now tells the
region's true story → update the tracking table (§6) → commit with a message
naming the batch and any SKIPPED entries.

## 6. Tracking

Maintain `docs/statehood-progress.md`: one row per nation — code, formation year
chosen, #interruptions, sources added, status (`done` / `verified-existing` /
`SKIPPED: <reason>`). SKIPPED is honourable; silent omission is not. The audit
script (§4.6) is the ground truth the table must agree with.

## 7. What you must NOT do

- Never edit `founding` (any field), era prose, events, or existing sources'
  meanings. This mission **adds** one block per file.
- Never write a claim you did not verify against a fetched source (§3.5).
- No new dependencies; no renderer-architecture changes beyond §4.4's fills.
- No design changes beyond §4.4/§4.5. STRATUM rules stand (`DESIGN.md`).
- Do not touch `data/domains/*` or anything in the dossier pipeline.
- Commit per batch; never one mega-commit. CI must be green on every push.

## 8. Done-criteria

1. `node scripts/audit-statehood.mjs` reports **183/183** published histories
   carrying `statehood` (or SKIPPED-with-reason rows in the tracking table,
   which must be < 5).
2. Validator warning (§4.2) flipped to **error**, and green.
3. Full suite green: validators, `tsc`, lint, contrast, page audit (1,054
   clean), `npm run build`.
4. Globe verification screenshots archived under `design-review/12-statehood/`:
   Morocco limestone in the 12th century; Poland dimmed 1795–1918 and copper in
   the 1910s; India dimmed in the 1880s; the 1960s still ablaze.
5. `PROGRESS.md` entry + any `DECISIONS.md` entries for contested calls.
6. Deployed, production page-audit clean, IndexNow pinged.

---

*Written 2026-07-29. The Time Globe this plan feeds shipped in commits `d7838c2`
(pulses) and `6262879` (existence shading); the criterion inconsistency it fixes
is quantified in §1 from the corpus itself.*
