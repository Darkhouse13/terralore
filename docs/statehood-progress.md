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
| 2 | Sub-Saharan Africa, west + central | 24 | done |
| 3 | Sub-Saharan Africa, east + south | 24 | done |
| 4 | South + Southeast Asia | | |
| 5 | East + Central Asia | | |
| 6 | Europe | | |
| 7 | Americas | | |
| 8 | Oceania + Caribbean + microstates | | |

## Nations

| Code | Nation | Formation | Interruptions of sovereignty | Status |
|---|---|---|---|---|
| AGO | Angola | 1975 CE | — | verified-existing |
| ARE | United Arab Emirates | 1971 CE | — | verified-existing |
| BDI | Burundi | 1680 CE | 1890–1962 | done |
| BEN | Benin | 1600 CE | 1894–1960 | done |
| BFA | Burkina Faso | 1050 CE | 1896–1960 | done |
| BWA | Botswana | 1966 CE | — | verified-existing |
| CAF | Central African Republic | 1960 CE | — | verified-existing |
| CIV | Ivory Coast | 1960 CE | — | verified-existing |
| CMR | Cameroon | 1960 CE | — | verified-existing |
| COD | DR Congo | 1960 CE | — | verified-existing |
| COG | Congo | 1960 CE | — | verified-existing |
| COM | Comoros | 1975 CE | — | verified-existing |
| CPV | Cape Verde | 1975 CE | — | verified-existing |
| CYN | Northern Cyprus | 1983 CE | — | verified-existing |
| CYP | Cyprus | 1960 CE | — | verified-existing |
| DJI | Djibouti | 1977 CE | — | verified-existing |
| DZA | Algeria | 1516 CE | 1830–1962 | done |
| EGY | Egypt | 3100 BCE | 30 BCE–969, 1517–1805, 1882–1922 | verified-existing |
| ERI | Eritrea | 1993 CE | — | verified-existing |
| ETH | Ethiopia | 1 CE | 1936–1941 | verified-existing |
| GAB | Gabon | 1960 CE | — | verified-existing |
| GHA | Ghana | 1957 CE | — | verified-existing |
| GIN | Guinea | 1958 CE | — | verified-existing |
| GMB | Gambia | 1965 CE | — | verified-existing |
| GNB | Guinea-Bissau | 1973 CE | — | verified-existing |
| GNQ | Equatorial Guinea | 1968 CE | — | verified-existing |
| IRQ | Iraq | 1921 CE | 1921–1932 | done |
| JOR | Jordan | 1921 CE | 1921–1946 | done |
| KEN | Kenya | 1963 CE | — | verified-existing |
| KWT | Kuwait | 1752 CE | 1899–1961 | done |
| LBN | Lebanon | 1920 CE | 1920–1943 | done |
| LBR | Liberia | 1847 CE | — | verified-existing |
| LBY | Libya | 1951 CE | — | verified-existing |
| LSO | Lesotho | 1822 CE | 1868–1966 | done |
| MAR | Morocco | 788 CE | 1912–1956 | done |
| MDG | Madagascar | 1540 CE | 1896–1960 | done |
| MLI | Mali | 1235 CE | 1905–1960 | done |
| MOZ | Mozambique | 1975 CE | — | verified-existing |
| MRT | Mauritania | 1960 CE | — | verified-existing |
| MUS | Mauritius | 1968 CE | — | verified-existing |
| MWI | Malawi | 1964 CE | — | verified-existing |
| NAM | Namibia | 1990 CE | — | verified-existing |
| NER | Niger | 1960 CE | — | verified-existing |
| NGA | Nigeria | 1960 CE | — | verified-existing |
| OMN | Oman | 1744 CE | — | verified-existing |
| PSE | Palestine | 1988 CE | — | verified-existing |
| QAT | Qatar | 1868 CE | 1916–1971 | done |
| RWA | Rwanda | 1650 CE | 1897–1962 | done |
| SAU | Saudi Arabia | 1744 CE | 1818–1824, 1891–1902 | done |
| SEN | Senegal | 1960 CE | — | verified-existing |
| SLE | Sierra Leone | 1961 CE | — | verified-existing |
| SOL | Somaliland | 1991 CE | — | verified-existing |
| SOM | Somalia | 1960 CE | — | verified-existing |
| STP | São Tomé and Príncipe | 1975 CE | — | verified-existing |
| SWZ | Eswatini | 1750 CE | 1903–1968 | done |
| SYC | Seychelles | 1976 CE | — | verified-existing |
| SYR | Syria | 1920 CE | 1920–1946 | done |
| TCD | Chad | 1960 CE | — | verified-existing |
| TGO | Togo | 1960 CE | — | verified-existing |
| TUN | Tunisia | 1574 CE | 1881–1956 | done |
| TUR | Turkey | 1299 CE | — | done |
| TZA | Tanzania | 1961 CE | — | verified-existing |
| UGA | Uganda | 1962 CE | — | verified-existing |
| YEM | Yemen | 1918 CE | — | done |
| ZAF | South Africa | 1910 CE | — | verified-existing |
| ZMB | Zambia | 1964 CE | — | verified-existing |
| ZWE | Zimbabwe | 1980 CE | — | verified-existing |

## SKIPPED

| Code | Nation | Reason |
|---|---|---|
