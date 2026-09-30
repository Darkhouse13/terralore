# The growth loop — radar → reel → scorecard

Written 2026-09-30. Read with `docs/reel-cadence.md` (how a reel is made and
queued) and `docs/social-surface.md` §2d (Instagram and Facebook are reels only).

## The goal

The goal is to become **the reference on nations**: history, current stories and data. Instagram and
Facebook are not judged on site traffic, which is Pinterest's job. They are judged on whether a
reel was **watched to the end, sent to a friend or compatriot, saved, and followed**.

The formula (user, 2026-09-30) is a hot topic plus a reel good enough to be watched to the end. Quality is
never traded for heat: every claim stays traceable to the corpus, and disputes stay neutral.

The loop has two instruments, one on each side of production:

```
topic-radar.mjs  →  choose + write + render (the reel skill)  →  publish  →  social-stats-pull.mjs  →  reel-scorecard.mjs
   (what people                                                             (nightly, on the box)     (what worked)
    want now)                                                                                           │
        ▲───────────────────────────────── lessons feed the next choice ◄──────────────────────────────┘
```

## 1. The scorecard (`npm run scorecard`)

- **Raw data:** `scripts/social-stats-pull.mjs` runs on the hetzner **host** at 03:30 UTC from
  root's crontab. It reads the IG and FB Page tokens from the Postiz database and writes
  `/data/terralore-social/status/stats/<date>.json`.
  - The cron line cats the script out of the runner's clone (`/work/repo`) before it runs, so
    the host copy follows git.
  - The log goes to `/data/terralore-social/status/stats-pull.log`.
  - Each reel is joined to its publisher slot (`<date>:<platform>:reel-N`) through
    `posted-keys.json` and `Post.releaseId`.
- **Report:** `node scripts/reel-scorecard.mjs --fetch` rsyncs the snapshots into `social-out/stats/`
  and writes `social-out/scorecard/<date>.md`.
  - Every reel is read **at 48 h old**, from the earliest snapshot taken at least 48 h after it
    was published. When no such snapshot exists, the reading's age is printed next to the reel.
  - The IG reel and its FB twin (same caption) share one row.
- **Signals:**
  - **IG views**
  - **IG hold:** average watch time ÷ length. The length comes from the FB twin, because IG does
    not expose it.
  - **IG skip rate**
  - **IG sends+saves per 1k reached**
  - **FB plays**
  - **FB follows:** `post_video_followers`, the follows attributed to that reel.
  - **Score:** the mean percentile of IG views, IG hold, sends+saves/1k, FB plays and FB follows.
- **First reading (30 Sep):** the skip rate separates winners from losers more sharply than anything
  else.
  - Top reels were skipped by 25–40% of viewers: Cyprus 25%, Chile 34%, Tanzania 37%.
  - The flops were skipped by 50–85%: Haiti 85%, Iceland 80%, Brazil's capital 52%.
  - The winners' first line states a concrete paradox about a place people know, then asks
    "how did that happen?".
  - Hold ran 42–54% on the winners, against 7–17% on the flops.

## 2. The radar (`npm run radar`)

`node scripts/topic-radar.mjs` writes `social-out/radar/<date>.md` (+ `.json`). It has three layers,
cheapest first:

| Layer | Source | Cost | What it says |
| --- | --- | --- | --- |
| Heat | Wikipedia per-article pageviews for all 186 nations (en), last 2 days vs the 28-day median | free | which nation people are suddenly curious about |
| Hooks | Wikipedia top-read lists (en/fr/es/de/pt, last 3 days): EVENT articles naming a nation | free | *why* it is hot: a war, an election, an anniversary |
| Chatter | r/MapPorn, r/geography, r/history, r/europe hot feeds (monid → tikhub) | $0.0015 per sub | the questions the map audience is asking this week |
| Proof | TikTok search + YouTube Shorts search (monid → tikhub) | $0.0015 each | has this topic *already* gone viral in short form? |

- **Fit is a hard gate.** A nation only ranks if it has an authored history in the corpus and was
  not reeled in the trailing 30 days. Last-reel dates come from the latest stats snapshot.
- **The pre-score** is 45% spike + 20% absolute interest + 35% hook volume. Proof then takes 45% of
  the final score for the probed candidates.
- **The radar never writes an angle.** It shows the most-viewed existing shorts on the topic. Learn
  their hooks, never copy them. The angle is editorial and must be sourced (the reel skill).

Flags:

- `--probe "why is chile so long"`: prove a specific angle. Nation-level proof ("Iran history")
  mostly measures the size of a nation's audience, so an angle probe is the sharper test before
  committing a reel.
- `--evergreen`: prove every corpus nation. This builds the **standing demand map**, which ranks
  nations by the short-form audience for their history whatever the news. It costs about $0.55
  and is cached for 14 days.
- `--budget` caps monid spend per run (default $0.05). `--no-paid` runs the free layers only.
- `--top N` proves the top N candidates (default 8).

**Keys and cost:**

- The monid key is the CLI's active key (`~/.config/monid/credentials.yaml`, label `sep30`). A copy
  is in `~/.config/terralore/monid.env` (mode 600).
- The balance was about $2.3 on 2026-09-30. A daily run costs about $0.03.
- Proof results are cached for 14 days in `social-out/radar/cache/`. Empty answers are never cached.

**What the first run showed (30 Sep):**

- "Why Cyprus is divided" had 2.5M views on TikTok and 4.3M on Shorts before our Cyprus reel
  became our best, so short-form proof predicted our winner.
- Many of the top existing shorts are our exact form: "Why did Czechoslovakia split" 2.7M;
  "England, UK & Great Britain explained" 4.6M; "Why does Mozambique have a gun on its flag" 817k.
- The radar's hot list was Iran (the "2026 Iran war" article), the US and UK (elections), and
  Morocco, Czechia and Serbia (Wikipedia pageviews up 1.6–1.7×).

## How to use it when choosing reels

1. Run `npm run scorecard` and read the skip-rate and hold columns. What did the last winners'
   first lines do?
2. Run `npm run radar`. Take one or two **hot** nations and put them through `--probe` with
   concrete angles.
3. Fill the rest of the batch from the **evergreen** table: big proven audience, never reeled.
4. The reel skill takes over from there: the corpus, sources, the map and the voice.
