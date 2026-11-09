# SEO growth loop — state

Goal: more Google/Bing impressions and clicks, Pareto-first. Each iteration
reads this file, does the single highest-leverage next action, logs it here.

## Diagnosis (2026-11-09)

- Cliff on 2026-08-18 = Google's August 2026 spam update (rolled out 08-18 → 08-21),
  which targeted scaled programmatic + AI content (GSQi case studies). Algorithmic,
  not a manual action (manual-actions panel: user to confirm in the GSC UI).
- 180-URL sample (2026-11-05): 1 indexed, 120 "Crawled – currently not indexed",
  58 "URL is unknown to Google". Sitemap last fetched by Google 2026-09-22.
- Google: domain-level quality presumption; remedy is to exclude scaled pages from
  Search; recovery "over a period of months" of a clean site. AI Overviews need the
  page indexed first — AEO comes after indexing.

## Metrics log

| date | GSC 28d clicks | GSC 28d impressions | indexed (180 sample) | sitemap URLs |
|---|---|---|---|---|
| 2026-11-09 | 0 | ~14 | 1 (11-05 check) | 508 → 95 |

## Done

- 2026-11-09 — **Index cut** (`lib/indexing.ts`): noindex + out of sitemap for all
  186 dossiers, 43 ranking leaves, 60 timeline periods, 10 theme pages, and 114
  chronicles outside Europe/North America (+ FRA AUS NZL JPN KOR CYP MNG IRN).
  Kept: core 10, 70 chronicles, 11 commodities, hubs. Empty sitemap families now
  drop out of the sitemap index (validator updated).

## Pending (ranked)

1. Deploy the cut → resubmit sitemap in GSC → IndexNow ping for the 95 URLs.
2. Bing Webmaster Tools: is the site verified? coverage? (Bing feeds ChatGPT search.)
3. Visible editorial signals on the 70 kept chronicles (editor/reviewed line,
   "how this was made") — only claim review that is actually done.
4. Off-site links: drafts for the user (Show HN retry, IG/FB bio link, history
   subreddits/teachers). Never post publicly myself.
5. "Why" pages per reel (docs/seo/keywords.md Pattern 1: weakest SERPs, ~40 reels
   with real demand) — hold until the index starts recovering, so the site
   isn't growing while Google re-evaluates it.
6. GSC URL Inspection of the 70 kept chronicles every ~2 weeks.
