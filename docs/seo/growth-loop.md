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

- 2026-11-09 — Deployed; GSC sitemap resubmitted (204); IndexNow 95 URLs (200).
- 2026-11-09 — **Bing API wired** (key in `~/.config/terralore/bing.env`, never commit).
  Sitemap submitted to Bing (was missing). Bing 6-month: 3 clicks / 206 impressions,
  rising — and its impressions come from rankings, timeline periods and non-target
  chronicles at positions 4–7. So the cut is now **Google-only**: `NOINDEX` emits
  `robots: index,follow` + `googlebot: noindex,follow`. Bing keeps everything.

- 2026-11-09 — **"How this chronicle was made"** line on every chronicle footer
  (user-approved wording: AI-assisted draft, edited by Hamza Bentaieb, sources enforced
  by the build, corrections to ledger@terralore.co).

## Pending (ranked)

1. Each iteration: Bing query/page stats (GetQueryStats/GetPageStats) + GSC 28d — Bing is
   the live channel. (Google-only noindex live 2026-11-09; 423 URLs re-pinged via IndexNow.)
4. Off-site links: user chose ONLY the IG/FB bio link (2026-11-09) — drafted, user posts.
   Show HN / subreddits / teachers declined for now; don't re-propose before ~2026-12.
5. "Why" pages per reel (docs/seo/keywords.md Pattern 1: weakest SERPs, ~40 reels
   with real demand) — hold until the index starts recovering, so the site
   isn't growing while Google re-evaluates it.
6. GSC URL Inspection of the 70 kept chronicles every ~2 weeks.
