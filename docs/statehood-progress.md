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
| 1 | North Africa + Middle East | 19 | done |
| 2 | Sub-Saharan Africa, west | | |
| 3 | Sub-Saharan Africa, east + south | | |
| 4 | South + Southeast Asia | | |
| 5 | East + Central Asia | | |
| 6 | Europe | | |
| 7 | Americas | | |
| 8 | Oceania + Caribbean + microstates | | |

## Nations

| Code | Nation | Formation | Interruptions of sovereignty | Status |
|---|---|---|---|---|
| ARE | United Arab Emirates | 1971 CE | — | verified-existing |
| CYN | Northern Cyprus | 1983 CE | — | verified-existing |
| CYP | Cyprus | 1960 CE | — | verified-existing |
| DZA | Algeria | 1516 CE | 1830–1962 | done |
| EGY | Egypt | 3100 BCE | 30 BCE–969, 1517–1805, 1882–1922 | verified-existing |
| IRQ | Iraq | 1921 CE | 1921–1932 | done |
| JOR | Jordan | 1921 CE | 1921–1946 | done |
| KWT | Kuwait | 1752 CE | 1899–1961 | done |
| LBN | Lebanon | 1920 CE | 1920–1943 | done |
| LBY | Libya | 1951 CE | — | verified-existing |
| MAR | Morocco | 788 CE | 1912–1956 | done |
| OMN | Oman | 1744 CE | — | verified-existing |
| PSE | Palestine | 1988 CE | — | verified-existing |
| QAT | Qatar | 1868 CE | 1916–1971 | done |
| SAU | Saudi Arabia | 1744 CE | 1818–1824, 1891–1902 | done |
| SYR | Syria | 1920 CE | 1920–1946 | done |
| TUN | Tunisia | 1574 CE | 1881–1956 | done |
| TUR | Turkey | 1299 CE | — | done |
| YEM | Yemen | 1918 CE | — | done |

## SKIPPED

| Code | Nation | Reason |
|---|---|---|
