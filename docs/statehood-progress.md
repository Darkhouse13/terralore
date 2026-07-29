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
| 8 | Oceania + Caribbean + microstates | | |

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
| NER | Niger | 1960 CE | — | verified-existing |
| NGA | Nigeria | 1960 CE | — | verified-existing |
| NIC | Nicaragua | 1821 CE | — | verified-existing |
| NLD | Netherlands | 1581 CE | — | verified-existing |
| NOR | Norway | 872 CE | 1537–1905 | verified-existing |
| NPL | Nepal | 1768 CE | — | verified-existing |
| OMN | Oman | 1744 CE | — | verified-existing |
| PAK | Pakistan | 1947 CE | — | verified-existing |
| PAN | Panama | 1903 CE | — | verified-existing |
| PER | Peru | 1821 CE | — | done |
| PHL | Philippines | 1898 CE | 1899–1946 | done |
| POL | Poland | 966 CE | 1795–1918 | verified-existing |
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
| YEM | Yemen | 1918 CE | — | done |
| ZAF | South Africa | 1910 CE | — | verified-existing |
| ZMB | Zambia | 1964 CE | — | verified-existing |
| ZWE | Zimbabwe | 1980 CE | — | verified-existing |

## SKIPPED

| Code | Nation | Reason |
|---|---|---|
