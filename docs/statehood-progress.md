# Statehood coverage

The tracking table for `docs/statehood-plan.md`. One row per published history:
the formation year chosen, how many sourced interruptions of sovereignty it
carries, whether any source had to be added, and the status.

`node scripts/audit-statehood.mjs` is the ground truth this table must agree
with. **SKIPPED is honourable; silent omission is not** — a nation whose claim
could not be verified against a fetched source belongs in the SKIPPED table with
a reason, never in the data on memory.

Status values:

- `done` — a `statehood` block authored and sourced this pass.
- `verified-existing` — the nation's `founding.year` was already the correct
  formation anchor; the block records it explicitly and cites the source.
- `SKIPPED: <reason>` — no claim written. Must stay under five rows.

---

## Corpus size

The plan counts 183 published histories. The audit finds **184**: the 183 JSON
files under `lib/histories/data/` plus France, which is authored in TypeScript
(`lib/histories/france.ts`) and so is invisible to a `readdir` of that
directory. Both the audit script and the time-events builder parse it
structurally, so the target is 184/184.

---

## Progress

| Batch | Region | Nations | Status |
|---|---|---|---|
| — | code, validator, builder, shading | — | done |
| 1 | North Africa + Middle East | | |
| 2 | Sub-Saharan Africa, west | | |
| 3 | Sub-Saharan Africa, east + south | | |
| 4 | South + Southeast Asia | | |
| 5 | East + Central Asia | | |
| 6 | Europe | | |
| 7 | Americas | | |
| 8 | Oceania + Caribbean + microstates | | |

## Nations

| Code | Nation | Formation | Interruptions | Sources added | Status |
|---|---|---|---|---|---|

## SKIPPED

| Code | Nation | Reason |
|---|---|---|
