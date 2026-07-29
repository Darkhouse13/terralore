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
| 4 | South + Southeast Asia | 16 | done |
| 5 | East + Central Asia | 16 | done |
| 6 | Europe | 46 (+ France, authored in TypeScript) | done |
| 7 | Americas | 28 | done |
| 8 | Oceania + Caribbean + territories | 10 | done |

## Nations

| Code | Nation | Formation | Interruptions of sovereignty | Status |
|---|---|---|---|---|
| AFG | Afghanistan | 1747 CE | — | verified-existing |
| AGO | Angola | 1975 CE | — | verified-existing |
| ALB | Albania | 1912 CE | — | verified-existing |
| AND | Andorra | 1278 CE | — | verified-existing |
| ARE | United Arab Emirates | 1971 CE | — | verified-existing |
| ARG | Argentina | 1816 CE | — | verified-existing |
| ARM | Armenia | 331 BCE | 428–885, 1045–1918, 1920–1991 | done |
| AUS | Australia | 1901 CE | — | verified-existing |
| AUT | Austria | 996 CE | 1938–1945 | verified-existing |
| AZE | Azerbaijan | 1918 CE | 1920–1991 | done |
| BDI | Burundi | 1680 CE | 1890–1962 | done |
| BEL | Belgium | 1830 CE | — | verified-existing |
| BEN | Benin | 1600 CE | 1894–1960 | done |
| BFA | Burkina Faso | 1050 CE | 1896–1960 | done |
| BGD | Bangladesh | 1971 CE | — | verified-existing |
| BGR | Bulgaria | 681 CE | 1018–1185, 1396–1908 | verified-existing |
| BHS | The Bahamas | 1973 CE | — | verified-existing |
| BIH | Bosnia and Herzegovina | 1377 CE | 1463–1992 | verified-existing |
| BLR | Belarus | 1991 CE | — | verified-existing |
| BLZ | Belize | 1981 CE | — | verified-existing |
| BOL | Bolivia | 1825 CE | — | verified-existing |
| BRA | Brazil | 1822 CE | — | verified-existing |
| BRN | Brunei | 1368 CE | 1888–1984 | done |
| BTN | Bhutan | 1616 CE | — | done |
| BWA | Botswana | 1966 CE | — | verified-existing |
| CAF | Central African Republic | 1960 CE | — | verified-existing |
| CAN | Canada | 1867 CE | — | verified-existing |
| CHE | Switzerland | 1291 CE | — | verified-existing |
| CHL | Chile | 1818 CE | — | verified-existing |
| CHN | China | 221 BCE | — | verified-existing |
| CIV | Ivory Coast | 1960 CE | — | verified-existing |
| CMR | Cameroon | 1960 CE | — | verified-existing |
| COD | DR Congo | 1960 CE | — | verified-existing |
| COG | Congo | 1960 CE | — | verified-existing |
| COL | Colombia | 1810 CE | — | verified-existing |
| COM | Comoros | 1975 CE | — | verified-existing |
| CPV | Cape Verde | 1975 CE | — | verified-existing |
| CRI | Costa Rica | 1821 CE | — | verified-existing |
| CUB | Cuba | 1902 CE | — | verified-existing |
| CYN | Northern Cyprus | 1983 CE | — | verified-existing |
| CYP | Cyprus | 1960 CE | — | verified-existing |
| CZE | Czechia | 870 CE | 1620–1918 | done |
| DEU | Germany | 1871 CE | — | verified-existing |
| DJI | Djibouti | 1977 CE | — | verified-existing |
| DNK | Denmark | 965 CE | — | verified-existing |
| DOM | Dominican Republic | 1844 CE | 1861–1865 | verified-existing |
| DZA | Algeria | 1516 CE | 1830–1962 | done |
| ECU | Ecuador | 1830 CE | — | verified-existing |
| EGY | Egypt | 3100 BCE | 30 BCE–969, 1517–1805, 1882–1922 | verified-existing |
| ERI | Eritrea | 1993 CE | — | verified-existing |
| ESP | Spain | 1492 CE | — | verified-existing |
| EST | Estonia | 1918 CE | 1940–1991 | verified-existing |
| ETH | Ethiopia | 1 CE | 1936–1941 | verified-existing |
| FIN | Finland | 1917 CE | — | verified-existing |
| FJI | Fiji | 1871 CE | 1874–1970 | done |
| FLK | Falkland Islands | 1833 CE | — | verified-existing |
| FRA | France | 843 CE | — | verified-existing |
| GAB | Gabon | 1960 CE | — | verified-existing |
| GBR | United Kingdom | 927 CE | — | done |
| GEO | Georgia | 1008 CE | 1801–1918, 1921–1991 | done |
| GHA | Ghana | 1957 CE | — | verified-existing |
| GIN | Guinea | 1958 CE | — | verified-existing |
| GMB | Gambia | 1965 CE | — | verified-existing |
| GNB | Guinea-Bissau | 1973 CE | — | verified-existing |
| GNQ | Equatorial Guinea | 1968 CE | — | verified-existing |
| GRC | Greece | 1830 CE | — | verified-existing |
| GRL | Greenland | 2009 CE | — | verified-existing |
| GTM | Guatemala | 1821 CE | — | verified-existing |
| GUY | Guyana | 1966 CE | — | verified-existing |
| HND | Honduras | 1821 CE | — | verified-existing |
| HRV | Croatia | 925 CE | — | verified-existing |
| HTI | Haiti | 1804 CE | — | verified-existing |
| HUN | Hungary | 1000 CE | — | verified-existing |
| IDN | Indonesia | 1945 CE | — | verified-existing |
| IND | India | 320 BCE | 1858–1947 | done |
| IRL | Ireland | 1922 CE | — | verified-existing |
| IRN | Iran | 550 BCE | 330 BCE–-247, 651–934 | verified-existing |
| IRQ | Iraq | 1921 CE | 1921–1932 | done |
| ISL | Iceland | 930 CE | 1262–1918 | done |
| ITA | Italy | 1861 CE | — | verified-existing |
| JAM | Jamaica | 1962 CE | — | verified-existing |
| JOR | Jordan | 1921 CE | 1921–1946 | done |
| JPN | Japan | 660 BCE | — | verified-existing |
| KAZ | Kazakhstan | 1465 CE | 1822–1991 | verified-existing |
| KEN | Kenya | 1963 CE | — | verified-existing |
| KGZ | Kyrgyzstan | 1991 CE | — | verified-existing |
| KHM | Cambodia | 802 CE | 1863–1953 | done |
| KOR | South Korea | 918 CE | 1910–1945 | done |
| KOS | Kosovo | 2008 CE | — | verified-existing |
| KWT | Kuwait | 1752 CE | 1899–1961 | done |
| LAO | Laos | 1353 CE | 1893–1953 | done |
| LBN | Lebanon | 1920 CE | 1920–1943 | done |
| LBR | Liberia | 1847 CE | — | verified-existing |
| LBY | Libya | 1951 CE | — | verified-existing |
| LIE | Liechtenstein | 1719 CE | — | verified-existing |
| LKA | Sri Lanka | 437 BCE | 1815–1948 | done |
| LSO | Lesotho | 1822 CE | 1868–1966 | done |
| LTU | Lithuania | 1253 CE | 1795–1918, 1940–1991 | done |
| LUX | Luxembourg | 963 CE | — | verified-existing |
| LVA | Latvia | 1918 CE | 1940–1991 | verified-existing |
| MAR | Morocco | 788 CE | 1912–1956 | done |
| MCO | Monaco | 1297 CE | 1793–1814 | verified-existing |
| MDA | Moldova | 1991 CE | — | verified-existing |
| MDG | Madagascar | 1540 CE | 1896–1960 | done |
| MEX | Mexico | 1821 CE | — | verified-existing |
| MKD | North Macedonia | 1991 CE | — | verified-existing |
| MLI | Mali | 1235 CE | 1905–1960 | done |
| MLT | Malta | 1964 CE | — | verified-existing |
| MMR | Myanmar (Burma) | 1044 CE | 1886–1948 | done |
| MNE | Montenegro | 1878 CE | 1918–2006 | verified-existing |
| MNG | Mongolia | 1206 CE | 1691–1911 | verified-existing |
| MOZ | Mozambique | 1975 CE | — | verified-existing |
| MRT | Mauritania | 1960 CE | — | verified-existing |
| MUS | Mauritius | 1968 CE | — | verified-existing |
| MWI | Malawi | 1964 CE | — | verified-existing |
| MYS | Malaysia | 1957 CE | — | done |
| NAM | Namibia | 1990 CE | — | verified-existing |
| NCL | New Caledonia | 1998 CE | — | verified-existing |
| NER | Niger | 1960 CE | — | verified-existing |
| NGA | Nigeria | 1960 CE | — | verified-existing |
| NIC | Nicaragua | 1821 CE | — | verified-existing |
| NLD | Netherlands | 1581 CE | — | verified-existing |
| NOR | Norway | 872 CE | 1537–1905 | verified-existing |
| NPL | Nepal | 1768 CE | — | verified-existing |
| NZL | New Zealand | 1840 CE | — | verified-existing |
| OMN | Oman | 1744 CE | — | verified-existing |
| PAK | Pakistan | 1947 CE | — | verified-existing |
| PAN | Panama | 1903 CE | — | verified-existing |
| PER | Peru | 1821 CE | — | done |
| PHL | Philippines | 1898 CE | 1899–1946 | done |
| PNG | Papua New Guinea | 1975 CE | — | verified-existing |
| POL | Poland | 966 CE | 1795–1918 | verified-existing |
| PRI | Puerto Rico | 1952 CE | — | verified-existing |
| PRK | North Korea | 918 CE | 1910–1945 | done |
| PRT | Portugal | 1143 CE | 1580–1640 | verified-existing |
| PRY | Paraguay | 1811 CE | — | verified-existing |
| PSE | Palestine | 1988 CE | — | verified-existing |
| QAT | Qatar | 1868 CE | 1916–1971 | done |
| ROU | Romania | 1859 CE | — | verified-existing |
| RUS | Russia | 882 CE | 1238–1480 | verified-existing |
| RWA | Rwanda | 1650 CE | 1897–1962 | done |
| SAU | Saudi Arabia | 1744 CE | 1818–1824, 1891–1902 | done |
| SDN | Sudan | 1956 CE | — | verified-existing |
| SDS | South Sudan | 2011 CE | — | verified-existing |
| SEN | Senegal | 1960 CE | — | verified-existing |
| SLB | Solomon Islands | 1978 CE | — | verified-existing |
| SLE | Sierra Leone | 1961 CE | — | verified-existing |
| SLV | El Salvador | 1821 CE | — | verified-existing |
| SMR | San Marino | 301 CE | — | verified-existing |
| SOL | Somaliland | 1991 CE | — | verified-existing |
| SOM | Somalia | 1960 CE | — | verified-existing |
| SRB | Serbia | 1166 CE | 1459–1878 | done |
| STP | São Tomé and Príncipe | 1975 CE | — | verified-existing |
| SUR | Suriname | 1975 CE | — | verified-existing |
| SVK | Slovakia | 1993 CE | — | verified-existing |
| SVN | Slovenia | 1991 CE | — | verified-existing |
| SWE | Sweden | 1523 CE | — | verified-existing |
| SWZ | Eswatini | 1750 CE | 1903–1968 | done |
| SYC | Seychelles | 1976 CE | — | verified-existing |
| SYR | Syria | 1920 CE | 1920–1946 | done |
| TCD | Chad | 1960 CE | — | verified-existing |
| TGO | Togo | 1960 CE | — | verified-existing |
| THA | Thailand | 1238 CE | — | done |
| TJK | Tajikistan | 1991 CE | — | verified-existing |
| TKM | Turkmenistan | 1991 CE | — | verified-existing |
| TLS | Timor-Leste | 1975 CE | 1975–2002 | done |
| TTO | Trinidad and Tobago | 1962 CE | — | verified-existing |
| TUN | Tunisia | 1574 CE | 1881–1956 | done |
| TUR | Turkey | 1299 CE | — | done |
| TWN | Taiwan | 1949 CE | — | verified-existing |
| TZA | Tanzania | 1961 CE | — | verified-existing |
| UGA | Uganda | 1962 CE | — | verified-existing |
| UKR | Ukraine | 882 CE | 1238–1649, 1764–1918, 1921–1991 | done |
| URY | Uruguay | 1828 CE | — | verified-existing |
| USA | United States | 1776 CE | — | verified-existing |
| UZB | Uzbekistan | 1501 CE | 1873–1991 | done |
| VAT | Vatican City | 1929 CE | — | verified-existing |
| VEN | Venezuela | 1811 CE | — | verified-existing |
| VNM | Vietnam | 257 BCE | 111 BCE–938, 1887–1945 | done |
| VUT | Vanuatu | 1980 CE | — | verified-existing |
| YEM | Yemen | 1918 CE | — | done |
| ZAF | South Africa | 1910 CE | — | verified-existing |
| ZMB | Zambia | 1964 CE | — | verified-existing |
| ZWE | Zimbabwe | 1980 CE | — | verified-existing |

## SKIPPED

None. The plan allowed up to five nations to be skipped for want of a source
that could be fetched and read; every one of the 184 was sourced.

| Code | Nation | Reason |
|---|---|---|

---

## Done — the statehood pass

`node scripts/audit-statehood.mjs` reports **184/184**, with 68 sourced
interruptions of sovereignty across 56 nations and no SKIPPED rows. The
validator's coverage check is an error rather than a warning, the rail's caption
names all three shading states, and the verification frames are archived under
`design-review/12-statehood/`.

Full suite at close: history validator 0/0, domain validator 0 errors, `tsc`
clean, lint clean, contrast 76 pairs + 3 chroma pairs, page audit 1,054 clean
locally **and against production**, `npm run build` green, IndexNow 1,054 URLs
submitted.

---

# The deepening — hardening the record

`docs/statehood-deepening-plan.md`. The pass above hit its coverage target; its
close-out review found five debts, and they are all about whether the record can
carry the weight the globe now puts on it. Coverage was the easy half.

## Batch 1 — the instruments

Three instruments, built before a single claim was touched, so the debts were
counted before they were paid. Same order of operations as D1: an audit written
after the fix is a description of the fix.

| Instrument | What it measures | First reading |
|---|---|---|
| `scripts/audit-links.mjs` | every unique source URL in the corpus, fetched and classified | **3,674 URLs**: 3,321 ok, 103 redirect, 179 blocked, **43 gone**, 28 error |
| `scripts/audit-precision.mjs` | every statehood claim asserting finer than a year | **153 claims** across 120 blocks — 141 day, 12 month |
| `scripts/validate-histories.mjs` (extended) | the two editorial floors, the label/year agreement, the sovereign allowlist, the restoration cross-check | **147 warnings**, 23 info lines, 0 errors |

Three details of how the instruments were built are worth keeping:

**The link auditor speaks curl, not `fetch`.** Node's undici negotiates TLS
differently enough from a browser that several publishers' CDNs answer it with a
challenge page. UNESCO's World Heritage Centre — 207 of the corpus's URLs — 403s
every `fetch` and 200s a plain `curl` with a browser user-agent, from the same
machine, in the same second. The first run of the auditor reported all 207 as
`blocked`, which would have been the instrument lying about the corpus.
Britannica refuses curl exactly as it refuses fetch: that is the control that
shows this is a transport fix and not a way past anyone's bot protection.

**Britannica's block turns out to be rate-shaped, not absolute — which changes
nothing about how the corpus treats it.** The audit run, paced at one request
per host per 700 ms, was served 1,330 of the 1,354 Britannica URLs; the same
URLs return the Cloudflare interstitial to a handful of quick requests minutes
later. So the plan's "1,347 unfetchable URLs" is really "1,347 URLs whose
availability depends on how politely and how recently you asked", and a
verification pipeline built on that is a pipeline that fails silently on the
day it matters. The mission's routing-around stands unchanged: **no statehood
claim is anchored on being able to fetch Britannica.** What the run did buy is
19 genuine Britannica 404s — a stable answer, and therefore actionable.

**43 dead URLs, and not one of them supports a statehood claim.** The instrument
was built expecting to find rot under the mission's own feet; it found the rot
somewhere else entirely — UN peacekeeping mission pages, USIP publications, two
UNESCO listings, 19 Britannica biographies. All of it is published in
`docs/link-audit.md` for a future mission, per §5.1's scope line, and none of it
blocks this one.

**Every new floor ships as a warning and flips to an error in the batch that
pays its debt.** A floor that went straight to error would have made the
instrument commit red on arrival, which teaches everyone to run the validator
with their eyes closed. The flip is one named constant per floor in
`scripts/validate-histories.mjs`, and the batch that flips it is written beside
it.

**France is finally validated.** It is the one history authored in TypeScript,
so a `readdir` of `lib/histories/data` has never seen it — meaning the file
every other file is written against is the one file the validator never read.
Its statehood block is now held to the same floors as the other 183, and it
fails two of them on arrival (843 CE anchored on a single Wikipedia article).

## Batch 2 — precision to zero

`node scripts/audit-precision.mjs --pending` prints **zero rows**. Every one of
the 151 claims in `docs/statehood-precision-ledger.md` names the source that was
read and quotes the sentence it was read in.

| | Claims |
|---|---:|
| day precision | 141 |
| month precision | 10 |
| **total** | **151** |
| **verified** | **151** |

**What the sweep actually found was a pattern, not two bugs.** The plan named
Guinea and Malta. The shape underneath them turned out to sit under **23**
blocks: `history.state.gov`'s country guides are a guide to *US recognition*,
and for most of the 1960 African independences recognition fell on independence
day — so "the United States recognized X on <date>" reads as support for the
independence date until the one time it does not. Guinea is that time
(recognition 1 November, declaration 2 October). Malta is another (the September
21 on its page is the opening of the US embassy in Valletta; recognition was
September 18). Every one of the 23 now cites a source that says what the
**polity** did, with the diplomatic note kept alongside rather than doing the
work alone.

| Fix | Blocks |
|---|---|
| confirmed against a source already cited | 112 |
| a source the file already carried, added to the claim | 17 — BHS CMR DJI GAB GMB GHA CIV MRT NER SYC SDN TGO UGA GIN LBR SOM NAM |
| a new source fetched and added | 8 — CAF TCD CYP MLT NGA PAK GUY MAR |
| **softened** | **4** — CRI, SLV, HND (provincial acceptance months no source states), MAR (2 March 1956) |

Two blocks changed beyond their citations:

- **MAR** — the interruption label is now *"French and Spanish protectorates"*,
  which is what the plan's own §2 example said and what the file's
  `founding.detail` already established. Its new `detail` carries the Spanish
  zone's retrocession on 7 April 1956, sourced. The French zone's 2 March 1956
  is **not** in the block: no source in the file states it, and an unsourced
  date is exactly what this batch exists to remove.
- **SWZ** — `yearLabel` was *"mid-18th century"*, which names no year at all and
  so could not agree with `year: 1750`, and 1750 was not in any cited source
  either. Both are now 1745, the start of Ngwane III's reign as `wiki-ngwane-iii`
  states it, with the State Department's *"settled in northern Zululand in about
  1750"* alongside. This also lifts Eswatini over the two-publisher floor. It
  moves no pixel: 1745 and 1750 fall in the same rail period.

The `yearLabel`-names-its-own-`year` check is an **error** from this batch on.

## Batch 3 — source-tier uplift

| | Before | After |
|---|---:|---:|
| formations resting on Wikipedia alone | **84** | **6** |
| formations dated before 1800 with fewer than two publishers | **58** | **6** |
| formations below at least one floor | **85** | **7** |

(84 rather than the plan's 83: France is the 84th, and it was invisible to the
count that produced that figure for the same reason it was invisible to the
validator.)

**Half the debt was already paid for, in the files themselves.** The statehood
pass cited whatever source was nearest to hand when it wrote each block, and
the files turned out to be far better stocked than their formation claims were:
**34** of the 85 were closed by pointing the claim at a source the nation
already carried. Those are not filler. The Bulgarian foreign ministry on 681,
the National Museum of Denmark on Harald's stone at Jelling, the Swiss federal
government on the Rütli oath, the Amiri Diwan on the 1868 Anglo-Qatari
agreement, the Princely House of Liechtenstein on 1719, Store norske leksikon
on Hafrsfjord, the US National Archives on the engrossed Declaration, the Holy
See's mission to the UN on the Lateran Treaty, Þingvellir National Park on the
first Alþingi. The corpus had them and its own headline claims were not using
them.

**44 more were closed by fetching a second publisher** — chiefly New World
Encyclopedia and World History Encyclopedia, both of which answer a paced fetch
where Britannica, the Library of Congress, BlackPast and the Met do not.

Two facts about the floors, learned by running into them:

- **The two-source floor is about the claim, not the year.** The first sweep
  demanded that both publishers state the same year and stalled on 13 nations.
  That is the precision ledger's job, and it is already done; the floor exists
  so a deep anchor does not rest on one page. Re-run on the polity instead of
  the date, it closed six more.
- **Two articles from the same publisher are one publisher.** Turkey briefly
  cited two World History Encyclopedia pages and still failed, correctly.

### REMAINS

Seven formations, out of 85 that started below a floor. Each row is in
`scripts/validate-histories.mjs` beside the check it exempts, so the exception
cannot drift away from the rule; a row leaves the moment anyone finds a second
publisher.

| Code | Anchor | Why it could not be raised |
|---|---|---|
| BFA | 1050, Oubri's Ouagadougou dynasty | oral tradition dates it anywhere from the 11th to the 15th century (D12); NWE's *Mossi* and *Burkina Faso* and WHE's *Mossi Kingdoms* describe the kingdoms without naming Oubri or a date |
| BDI | 1680, Ntare I | NWE's *Burundi* and the LOC Country Study cover the monarchy without the founding date; the searchable alternatives are Wikipedia mirrors |
| GRL | 2009, the Self-Government Act | a Danish statute; NWE's *Greenland* stops at Home Rule in 1979, and the Naalakkersuisut and Statsministeriet pages did not answer a fetch |
| MDG | 1540, Andriamanelo | NWE's *Madagascar* begins the Merina ascendancy in the 1790s — it corroborates the polity but not the anchor |
| RWA | 1650, the Nyiginya | neither NWE's *Rwanda* nor the LOC Country Study names the dynasty |
| UZB | 1501, the Khanate of Bukhara | NWE's *Uzbekistan* and *Bukhara* and WHE's *Bukhara* cover the city, not the Shaybanid khanate |
| VNM | 257 BCE, Âu Lạc | absent under that name from NWE's *Vietnam*, WHE's *Ancient Vietnam* and the LOC Country Study |

The shape they share is worth naming: a precursor polity that mainstream
reference works discuss without dating it the way this corpus does. In every
one of the seven a second publisher could have been *added* — and would have
corroborated the polity while saying nothing about the anchor. That is worse
than an honest gap, because it looks like corroboration.

Both floors are **errors** from this batch on, with REMAINS as the only
exemption.
