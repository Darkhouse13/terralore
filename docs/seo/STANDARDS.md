# SEO standards — read before any SEO change

These are terralore's rules derived from `~/seo/SEO-PLAYBOOK.md`, adopted 2026-10-12. Patterns and
measured demand live in `keywords.md`. Whenever a change is rejected, add the reason to the
rejection log at the bottom so it isn't repeated.

## Agent permissions

| Tier | Actions |
|---|---|
| Do freely | Read GSC, index inspections and monid *free* endpoints. Write `docs/seo/`. Draft titles, briefs, YouTube titles and descriptions. |
| Do, behind the gates | Change title/meta/H1 templates. Add or remove in-body links. Ship a new indexable route. Run `npm run ci` and IndexNow after deploy. |
| Ask first | Any paid monid call (state the cost; the user sets a cap). Any noindex, canonical or robots change: write the reason in this file first. Anything that alters the pixel-frozen phone rendering (it needs a deviations entry). |
| Never | Remove a chronicle (≥ 600 words), whatever its traffic: merge or rewrite instead. Buy links or placements. Run link or ranking swaps. Send email or DMs to third parties. Post under the user's identity. Put terralore.co in IG/FB captions. |

## Every new or changed page

1. **One query, one page.** Before writing, check GSC page×query and `keywords.md`. If a
   URL already serves the query, improve that page instead of adding one.
2. **Title starts with the query as people type it** ("History of Montenegro", not "The
   Chronicle of Montenegro"). One H1 containing it. Meta description sells the click.
3. **One original element the top 10 lacks.** Terralore's are sourced claim IDs, our own
   maps and our own reels. No original element, no page.
4. **At least 5 in-body inbound links** from related pages, inside sentences, with descriptive
   anchors, added in the same deploy. Footer and "related" blocks don't count.
5. **Diff gate:** a rewrite may not drop events, sources, tables, links or claim fragments
   without the loss being reviewed and intended.
6. Structured data matches the visible page. The sitemap is derived (`lib/seo.ts`), but check
   that the URL is present after the build.

## Cadence (content-bomb protection)

- **New indexable URLs: at most 2 a week, never more than 1 a day.** The 1,400-URL launch in
  July and August 2026 is the pattern this rule exists to prevent.
- **60-day wait on SEO edits:** after a title, H1, meta or intro change, don't touch that template or page for 60
  days. Factual corpus additions (new events, sources) are exempt. Error fixes are always allowed.
- Waiting alone is never the plan: every check comes with an action (user rule, 2026-09-22).

## Index decisions (written reasons)

- **2026-10-12 — the 10 `/rankings/<mineral>-production` pages are noindexed and out of
  the sitemap** (`rankingIndexable` in `lib/rankings.ts`). Each page competed with its
  `/commodities/<mineral>` page for "<mineral> production by country". The commodity
  page is the fuller one and the only one that had earned impressions. The rankings
  stay live and linked. The owner approved this on 2026-10-12.

## Shipped 2026-10-12 (the 60-day wait runs to 2026-12-11)

- Titles: chronicles "History of X: a sourced timeline", timeline periods "What happened
  in the 1920s — the world, year by year", commodities "<Mineral> production by country
  (2025): who supplies the world".
- H1 kickers carry the same query (design deviation E19).
- In-prose nation links in chronicles (`lib/nation-links.tsx`): 1,698 links. Median
  inbound per chronicle is 4, and 75 of 184 reach the floor of 5. Small nations stay
  under it because other chronicles rarely name them, and no link is invented to make
  up the count.

## Ruled out (and why)

- `[A] vs [B]` pages as targets: the SERPs are sports fixtures (measured 2026-10-12).
- Paid links, PBNs, link or ranking swaps: link-spam policy, and the site was hit by the
  August 2026 spam update.
- An llms.txt or "AI markup" sprint: Google says AI features need nothing extra. The existing
  `llms.txt` stays as it is.
- Self-ranked "best X" lists: none exist, and none will be created.
- Answer-box queries ("how old is X", "when did X become independent") as page targets:
  an AI Overview answers them in one line.

## Rejection log

- 2026-10-12 (inherited from the blogs): a "related" block is not internal linking. Chronicle prose
  had 1 in-paragraph link per 5,941 words.
