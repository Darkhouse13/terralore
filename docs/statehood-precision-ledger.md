# The statehood precision ledger

Every statehood claim that asserts a precision finer than a year — a day, a
month, or a direct quotation — with the source that was read to confirm it.

The rule this ledger exists to enforce (`docs/statehood-deepening-plan.md` §2):

> **A date more precise than its cited sources support is a fabrication of
> precision, even when the date is correct.**

Guinea is the case that produced it. The block said *"2 October 1958"* and
cited a source that states 1 November 1958 — the date the United States
recognised the republic. The label was true about the world and false about the
citation, and the corpus's entire claim on a reader's trust is that those two
are the same thing. Three ways to close a row, in order of preference:

1. **Confirm** — a source the claim already cites states the date at that
   precision. Record which one.
2. **Add** — the file carries another source that does (Guinea's own
   `ebsco-independence` covers 2 October), or one is added and read.
3. **Soften** — no citable source supports the precise form, so the label drops
   to the precision the citations do support. Softening is honourable;
   unsupported precision is not.

`node scripts/audit-precision.mjs --pending` prints what remains. A row records
the claim text it verified, so editing a claim reopens its row automatically —
the ledger cannot drift out of agreement with the corpus.

**Verified by** names the source id inside that nation's own `sources[]`.

---

| Claim | Kind | Text | Verified by | Note |
|---|---|---|---|---|
| `ALB:formation.yearLabel` | day | 28 November 1912 | — |  |
| `AGO:formation.yearLabel` | day | 11 November 1975 | — |  |
| `ARG:formation.yearLabel` | day | 9 July 1816 | — |  |
| `AUS:formation.yearLabel` | day | 1 January 1901 | — |  |
| `AUS:formation.detail` | day | 9 October 1942 | — |  |
| `AUT:formation.detail` | day | 12 March 1938 | — |  |
| `AUT:formation.detail#2` | day | 27 April 1945 | — |  |
| `AUT:formation.detail#3` | day | 27 July 1955 | — |  |
| `AZE:formation.yearLabel` | day | 28 May 1918 | — |  |
| `BHS:formation.yearLabel` | day | 10 July 1973 | — |  |
| `BGD:formation.yearLabel` | day | 26 March 1971 | — |  |
| `BGD:formation.detail` | day | 16 December 1971 | — |  |
| `BLR:formation.yearLabel` | day | 25 August 1991 | — |  |
| `BEL:formation.yearLabel` | day | 4 October 1830 | — |  |
| `BEL:formation.detail` | day | 20 December 1830 | — |  |
| `BLZ:formation.yearLabel` | day | 21 September 1981 | — |  |
| `BOL:formation.yearLabel` | day | 6 August 1825 | — |  |
| `BWA:formation.yearLabel` | day | 30 September 1966 | — |  |
| `BRA:formation.yearLabel` | day | 7 September 1822 | — |  |
| `BRA:formation.detail` | day | 29 August 1825 | — |  |
| `BGR:formation.detail` | day | 5 October 1908 | — |  |
| `CMR:formation.yearLabel` | day | 1 January 1960 | — |  |
| `CMR:formation.detail` | day | 11 February 1961 | — |  |
| `CMR:formation.detail#2` | day | 1 October 1961 | — |  |
| `CPV:formation.yearLabel` | day | 5 July 1975 | — |  |
| `CAF:formation.yearLabel` | day | 13 August 1960 | — |  |
| `TCD:formation.yearLabel` | day | 11 August 1960 | — |  |
| `CHL:formation.yearLabel` | day | 12 February 1818 | — |  |
| `CHL:formation.detail` | day | 1 January 1818 | — |  |
| `COL:formation.yearLabel` | day | 20 July 1810 | — |  |
| `COL:formation.detail` | day | 7 August 1819 | — |  |
| `COM:formation.yearLabel` | day | 6 July 1975 | — |  |
| `COG:formation.yearLabel` | day | 15 August 1960 | — |  |
| `CRI:formation.detail` | day | 30 August 1848 | — |  |
| `CRI:formation.detail#2` | month | October 1821 | — |  |
| `CUB:formation.yearLabel` | day | 20 May 1902 | — |  |
| `CYP:formation.yearLabel` | day | 16 August 1960 | — |  |
| `CZE:formation.detail` | day | 1 January 1993 | — |  |
| `DJI:formation.yearLabel` | day | 27 June 1977 | — |  |
| `COD:formation.yearLabel` | day | 30 June 1960 | — |  |
| `SLV:formation.detail` | day | 21 September 1821 | — |  |
| `GNQ:formation.yearLabel` | day | 12 October 1968 | — |  |
| `ERI:formation.yearLabel` | day | 27 April 1993 | — |  |
| `EST:formation.yearLabel` | day | 24 February 1918 | — |  |
| `FLK:formation.yearLabel` | day | 3 January 1833 | — |  |
| `FJI:formation.yearLabel` | day | 5 June 1871 | — |  |
| `FJI:formation.detail` | day | 10 October 1874 | — |  |
| `FJI:formation.detail#2` | month | November 1871 | — |  |
| `FIN:formation.yearLabel` | day | 6 December 1917 | — |  |
| `GAB:formation.yearLabel` | day | 17 August 1960 | — |  |
| `GMB:formation.yearLabel` | day | 18 February 1965 | — |  |
| `DEU:formation.yearLabel` | day | 18 January 1871 | — |  |
| `GHA:formation.yearLabel` | day | 6 March 1957 | — |  |
| `GRC:formation.yearLabel` | month | February 1830 | — |  |
| `GRL:formation.yearLabel` | day | 21 June 2009 | — |  |
| `GRL:formation.detail` | day | 1 May 1979 | — |  |
| `GTM:formation.yearLabel` | day | 15 September 1821 | — |  |
| `GTM:formation.detail` | month | January 1822 | — |  |
| `GIN:formation.yearLabel` | day | 2 October 1958 | — |  |
| `GNB:formation.yearLabel` | month | September 1973 | — |  |
| `GNB:formation.detail` | month | September 1974 | — |  |
| `GUY:formation.yearLabel` | day | 26 May 1966 | — |  |
| `HND:formation.detail` | month | September 1821 | — |  |
| `ISL:formation.detail` | day | 1 December 1918 | — |  |
| `ISL:formation.detail#2` | day | 17 June 1944 | — |  |
| `IND:formation.detail` | month | July 1947 | — |  |
| `IDN:formation.yearLabel` | day | 17 August 1945 | — |  |
| `IRQ:formation.yearLabel` | day | 23 August 1921 | — |  |
| `IRL:formation.yearLabel` | day | 6 December 1922 | — |  |
| `IRL:formation.detail` | day | 6 December 1921 | — |  |
| `ITA:formation.yearLabel` | day | 17 March 1861 | — |  |
| `CIV:formation.yearLabel` | day | 7 August 1960 | — |  |
| `JAM:formation.yearLabel` | day | 6 August 1962 | — |  |
| `JOR:formation.yearLabel` | day | 11 April 1921 | — |  |
| `KEN:formation.yearLabel` | day | 12 December 1963 | — |  |
| `KOS:formation.yearLabel` | day | 17 February 2008 | — |  |
| `LVA:formation.yearLabel` | day | 18 November 1918 | — |  |
| `LVA:formation.detail` | day | 4 May 1990 | — |  |
| `LBN:formation.yearLabel` | day | 1 September 1920 | — |  |
| `LBR:formation.yearLabel` | day | 26 July 1847 | — |  |
| `LBY:formation.yearLabel` | day | 24 December 1951 | — |  |
| `LIE:formation.yearLabel` | day | 23 January 1719 | — |  |
| `LTU:formation.yearLabel` | day | 6 July 1253 | — |  |
| `MWI:formation.yearLabel` | day | 6 July 1964 | — |  |
| `MYS:formation.yearLabel` | day | 31 August 1957 | — |  |
| `MYS:formation.detail` | day | 16 September 1963 | — |  |
| `MLT:formation.yearLabel` | day | 21 September 1964 | — |  |
| `MRT:formation.yearLabel` | day | 28 November 1960 | — |  |
| `MUS:formation.yearLabel` | day | 12 March 1968 | — |  |
| `MEX:formation.yearLabel` | day | 27 September 1821 | — |  |
| `MNG:formation.detail` | day | 29 December 1911 | — |  |
| `MNG:formation.detail#2` | month | October 1945 | — |  |
| `MNE:formation.detail` | day | 3 June 2006 | — |  |
| `MOZ:formation.detail` | day | 25 June 1975 | — |  |
| `NAM:formation.yearLabel` | day | 21 March 1990 | — |  |
| `NPL:formation.yearLabel` | day | 25 September 1768 | — |  |
| `NLD:formation.detail` | day | 12 April 1588 | — |  |
| `NCL:formation.yearLabel` | day | 5 May 1998 | — |  |
| `NCL:formation.detail` | day | 24 September 1853 | — |  |
| `NZL:formation.detail` | day | 26 September 1907 | — |  |
| `NZL:formation.detail#2` | day | 25 November 1947 | — |  |
| `NIC:formation.detail` | day | 5 November 1838 | — |  |
| `NER:formation.yearLabel` | day | 3 August 1960 | — |  |
| `NGA:formation.yearLabel` | day | 1 October 1960 | — |  |
| `CYN:formation.yearLabel` | day | 15 November 1983 | — |  |
| `OMN:formation.yearLabel` | day | 20 November 1744 | — |  |
| `PAK:formation.yearLabel` | day | 14 August 1947 | — |  |
| `PSE:formation.yearLabel` | day | 15 November 1988 | — |  |
| `PSE:formation.detail` | month | December 1988 | — |  |
| `PSE:formation.detail#2` | month | February 1989 | — |  |
| `PAN:formation.yearLabel` | day | 3 November 1903 | — |  |
| `PNG:formation.yearLabel` | day | 16 September 1975 | — |  |
| `PRY:formation.yearLabel` | day | 15 May 1811 | — |  |
| `PER:formation.yearLabel` | day | 28 July 1821 | — |  |
| `PHL:formation.yearLabel` | day | 12 June 1898 | — |  |
| `PHL:formation.detail` | day | 23 January 1899 | — |  |
| `PRT:formation.yearLabel` | day | 5 October 1143 | — |  |
| `PRI:formation.yearLabel` | day | 25 July 1952 | — |  |
| `STP:formation.yearLabel` | day | 12 July 1975 | — |  |
| `STP:formation.detail` | day | 21 December 1470 | — |  |
| `SEN:formation.yearLabel` | day | 20 August 1960 | — |  |
| `SYC:formation.yearLabel` | day | 29 June 1976 | — |  |
| `SLE:formation.yearLabel` | day | 27 April 1961 | — |  |
| `SVK:formation.yearLabel` | day | 1 January 1993 | — |  |
| `SLB:formation.yearLabel` | day | 7 July 1978 | — |  |
| `SOM:formation.yearLabel` | day | 1 July 1960 | — |  |
| `SOM:formation.detail` | day | 26 June 1960 | — |  |
| `SOL:formation.detail` | day | 26 June 1960 | — |  |
| `ZAF:formation.yearLabel` | day | 31 May 1910 | — |  |
| `SDS:formation.yearLabel` | day | 9 July 2011 | — |  |
| `SDN:formation.yearLabel` | day | 1 January 1956 | — |  |
| `SUR:formation.yearLabel` | day | 25 November 1975 | — |  |
| `SWE:formation.yearLabel` | day | 6 June 1523 | — |  |
| `SYR:formation.yearLabel` | day | 8 March 1920 | — |  |
| `SYR:formation.detail` | day | 25 July 1920 | — |  |
| `TWN:formation.yearLabel` | month | December 1949 | — |  |
| `TWN:formation.detail` | day | 7 December 1949 | — |  |
| `TZA:formation.yearLabel` | day | 9 December 1961 | — |  |
| `TZA:formation.detail` | day | 26 April 1964 | — |  |
| `TLS:formation.yearLabel` | day | 28 November 1975 | — |  |
| `TLS:formation.detail` | day | 20 May 2002 | — |  |
| `TGO:formation.yearLabel` | day | 27 April 1960 | — |  |
| `TTO:formation.yearLabel` | day | 31 August 1962 | — |  |
| `ARE:formation.yearLabel` | day | 2 December 1971 | — |  |
| `ARE:formation.detail` | day | 10 February 1972 | — |  |
| `UGA:formation.yearLabel` | day | 9 October 1962 | — |  |
| `GBR:formation.yearLabel` | day | 12 July 927 | — |  |
| `USA:formation.yearLabel` | day | 4 July 1776 | — |  |
| `VUT:formation.yearLabel` | day | 30 July 1980 | — |  |
| `VAT:formation.yearLabel` | day | 11 February 1929 | — |  |
| `ZMB:formation.yearLabel` | day | 24 October 1964 | — |  |
| `ZWE:formation.yearLabel` | day | 18 April 1980 | — |  |
| `FRA:formation.yearLabel` | day | 10 August 843 | — |  |
