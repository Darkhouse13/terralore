# Keyword patterns — terralore.co

Pattern research for `~/seo/SEO-PLAYBOOK.md` Part 1, run 2026-10-12. Every volume is a
measured number: DataForSEO Google Ads search volume, **US, English**, monthly average for
Sep 2025 – Aug 2026. Every SERP read is a live Google US desktop top 10. A missing number
is written `n/a` and is never estimated.

- Candidates: free Google Suggest, about 9,400 expansions from 1,057 seeds (`research/suggest-2026-10-12.json`)
- Volumes: 3,236 keywords in 4 calls, plus 75 reel-matched queries (`research/volumes-us-2026-10-12.json`, `research/reel-queries-us-2026-10-12.json`)
- SERPs: 88 of the 95 sampled queries returned results (`research/serps-2026-10-12.json`)
- Spend: $0.75 of the $2.00 cap (`research/monid-spend.log`)

**The constant across every pattern:** there is an AI Overview on 88/88 SERPs. On
"why" and history queries, those overviews cite **YouTube in 17 of 19 and 13 of 18**, more than
Wikipedia. A video pack appears on 11 of 21 "why" SERPs, 9 of 20 history SERPs and 8 of 8 timeline SERPs.

## Verdict per pattern

| Pattern | Sample US volume | Who holds the top 10 | Our asset | Verdict |
|---|---|---|---|---|
| **why is / why does [place] …** | 840 of 919 Suggest queries have volume; 228k/mo total | **Weakest SERPs measured**: 69 of 171 slots are Reddit, Quora, YouTube, FB or IG; 78 are weak domains; 24 are strong | ~40 finished reels on exactly these questions, with sources | **Pattern 1.** Video first (YouTube), then a sourced page per reel |
| **history of [nation]** (smaller and Nordic nations) | Ireland 2,900 · Norway, Netherlands, Switzerland 2,400 · Finland, Denmark 1,300 · Montenegro 590 | Small nations: YouTube, Reddit, travel blogs, countryreports. Big nations: Wikipedia, Britannica | 186 chronicles of 6k words each | **Pattern 2.** Winnable for small nations once indexed; retitle to the query |
| **what happened in the [decade/century]** | 1920s and 1960s 4,400 · 1950s 3,600 · 1930s 2,900 · 1800s 1,600 | Quora, YouTube, fsmitha, pressbooks, newspaper archives; video on 8 of 8 | 61 timeline pages from verified events in many nations | **Pattern 3.** Weak SERPs; retitle the timeline pages |
| **richest / population … in [region]** | Africa 12,100 · Europe population 6,600 · S. America 1,900 · Europe 1,600 · Middle East 1,600 | tradingeconomics, Henley, YouTube, Reddit, Visual Capitalist | Rankings data, no region filter yet | **Pattern 4 (later).** Needs new region-filtered URLs, so it goes behind the cadence cap |
| **[mineral] production / reserves by country** | Small apart from oil and gold. Silver 960 · copper 790 · lithium 660 · aluminum 470 · helium 380 summed; most others under 150 | Wikipedia, USGS, investingnews, Visual Capitalist, World Population Review | 10 USGS commodity pages, our only non-brand impressions near position 8 | **Keep, don't expand yet.** Reserves draw more searches than production; see the note below |
| **when did [X] become independent / who colonized [X] / how old is [X]** | "how old is united states" 74k · Mexico independence 8,100 | Wikipedia and Britannica on top, plus an AI Overview that answers in one line | Chronicles | **Skip as a target.** Zero-click answer queries |
| **[A] vs [B]** | India vs Pakistan 368k, Spain vs Portugal 165k | ESPN, Cricinfo, UEFA, Sofascore | Compare pages (noindexed) | **Dead.** Sports intent. This confirms the 2026-09-22 noindex decision |

Notes:
- "gold reserves by country" (2,400) means central-bank holdings (World Gold Council), and
  "oil reserves" is EIA data. Neither is USGS mine data, so neither is our query.
- **Cannibalisation:** `/commodities/<m>` and `/rankings/<m>-production` are both indexable,
  self-canonical and in the sitemap, and both target "<m> production by country" (10 pairs).
  One of each pair must give way.

## Pattern 1: existing reels mapped to demand (US/mo)

| Reel | Best query (volume) | The "why" phrasing (volume) |
|---|---|---|
| why-denmark-owns-greenland | who owns greenland (33,100) · is greenland part of denmark (14,800) | why does denmark own greenland (1,600) |
| england-britain-or-the-uk | is england a country (33,100) · difference between england britain and uk (5,400) | england vs britain vs uk (3,600) |
| why-dc-is-not-a-state | is washington dc a state (27,100) | why is dc not a state (1,600) |
| holland-or-the-netherlands | holland vs netherlands (9,900) · is holland the same as the netherlands (5,400) | why is netherlands called holland (2,400) |
| bir-tawil-nobody-home | bir tawil (9,900) | n/a |
| iran-or-persia | when did persia become iran (8,100) | iran vs persia (1,600) |
| split-without-a-shot | why did czechoslovakia split (2,400) · velvet divorce (2,400) | — |
| east-of-the-100th-meridian | 100th meridian (2,400) | — |
| why-russia-is-so-big | why is russia so big (2,900) | how did russia get so big (880) |
| why-hormuz-moves-oil-prices | why is the strait of hormuz important (2,900) | — |
| ala (Alaska) | why did russia sell alaska (2,400) | why is alaska part of the us (1,000) |
| falklands-two-names | who owns the falkland islands (2,900) | — |
| cyp2 | is cyprus part of greece (1,900) | why is cyprus divided (320) |
| ireland-one-island-two-countries | why is ireland divided (880) | why is northern ireland part of the uk (720) |
| a-country-inside-a-country | why is lesotho inside south africa (720) | — |
| korea-the-line | why is korea divided (880) | — |
| why-is-gibraltar-british | who owns gibraltar (720) | why does britain own gibraltar (110) |
| why-chile-is-a-noodle | why is chile so long (590) | — |
| why-isnt-portugal-part-of-spain | why is portugal not part of spain (480) | — |
| west-berlin | why was berlin divided (480) | — |

The full table, including reels with n/a or near-zero demand, is in `research/reel-queries-us-2026-10-12.json`.

## Unfilled "why" demand on our audience (no reel yet)

why is greenland called greenland (3,600) · why does brazil speak portuguese (3,600) ·
why does netherlands wear orange (5,400) · why is puerto rico not a state (4,400) ·
why is iceland called iceland (2,400) · why is germany called deutschland (1,600) ·
why is switzerland so expensive (1,900) · why is norway not in the eu (1,000) ·
why is finland the happiest country in the world (1,000) · why is switzerland ch (1,000).
