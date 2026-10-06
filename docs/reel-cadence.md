# The reel — cadence, grammar, queue

Written 2026-08-22, when one reel/day became the norm alongside the card
batch. Read with `docs/social-surface.md` (the batch this pairs with) and
`docs/social-publishing.md`.

## One reel, one platform (since 2026-10-05) — read this first

Instagram and Facebook no longer get the same reel. The same video goes viral on one and not the other:
- **Instagram rewards curiosity.** Chile, Ireland, Lesotho and Tanzania's name each did 5–60× better there.
- **Facebook rewards identity.** Cyprus got 28× more (123k plays), and 34% of all page follows are Cypriot, Greek or Turkish.

The evidence is in `social-out/radar/viral-slate-2026-10-05.md`. Each reel is now picked, written and made
for one lead platform, and published only there:

- `scripts/social-queue-reel.sh <date> <reel-N> <mp4> <caption> --platform instagram|facebook`. The flag is
  required, and it writes `platforms` into the drop's `reel-N.json`, which `social-publish.mjs` already honours.
- The shelf names carry the platform: `2-scheduled/<date>_<HHMM>_<slug>_<platform>.mp4`.
- A day is one IG reel plus one FB reel. Use any `reel-N` slot; the time comes from `data/social-publish.json`
  (`instagram:reel-1` 12:30, `facebook:reel-2` 19:40, …).
- Score each reel on its own platform only.

Reels queued before 2026-10-05 still go to both platforms; their drop JSON has no `platforms` field.

## The map reel (since 2026-09-27) — supersedes every section below

**Where reels live (since 2026-09-30):** `social-out/reels/`, one shelf per stage, each video beside its
caption. The stages are `1-ready`, then `2-scheduled` (named `<date>_<HHMM>_<slug>`), then `3-published`. There are
also `4-old-format`, `5-retired` and `6-tests-and-alternates`. `render.sh` writes finals into `1-ready`, and
`social-queue-reel.sh` moves a queued reel to `2-scheduled`. `python3 scripts/reels-index.py` rebuilds the index,
`social-out/reels/README.md`. The daily card batches moved to `social-out/daily/<date>/`, and old work folders to
`social-out/work/`. Older paths in the log below are pre-reorganisation.

Reels 04–31 (evidence collage, live edits, phone grammar) plateaued at ≈1K
views. On 2026-09-27 the user approved a new form without a single note:
**"How Cyprus got sliced in half"** — an animated map explainer where every
sentence is an action on the map, one continuous camera, a conversational
script, and an ElevenLabs narrator ("Chris"). "This is our new direction,
our new narrator, our new tone."

- **Rules of the form:** `.claude/skills/terralore-reels/SKILL.md`.
- **Engine and recipe:** `social-out/reel-lab/map/README.md` (gitignored lab):
  `voice.py` → `music.py` → `geo.mjs` → `sfx.py` → `src/reels/<name>.tsx` →
  `map/render.sh` (preview, then final with loudness QA).
- **Cadence: 2 reels a day** (user directive, 2026-09-28 — the 3–4/week pace was never agreed): `reel-1` at
  12:30 and `reel-2` at 19:30 Casablanca, every day. Production must stay ahead of the drop: build in batches of
  ~8 (four days) and keep at least two days queued. The Tue/Fri carousels were retired on 2026-10-01
  (`docs/social-surface.md` §2d): Instagram and Facebook are reels only.
- **Topic choice runs through the growth loop** (`docs/growth-loop.md`): `npm run scorecard`, then `npm run radar`. The paragraph below is the manual version it replaced.
- **Before choosing topics, pull the stats** (Graph v21 with the Postiz integration tokens, from the box) and
  never repeat a published subject (e.g. Panama has had two reels). The names-and-paradoxes reels (Tanzania's
  name 3.2k reach, Siam 2.1k, Saudi Arabia's name 1.9k) beat the anniversary ones.
- **Topics:** "Why is X like that?" about places people already know — not
  anniversaries. Every claim is traceable to a source (and lands in the corpus), and disputes
  are worded neutrally.
- **Length:** about 150 words / 60 s is a good default, not a cap (user, 2026-10-01). When there is
  more story than fits, go over the minute. The queue floor (`scripts/social-queue-reel.sh`) is 50 s;
  the 60 s floor below belonged to the collage form.
- **Research (user, 2026-10-01):** every reel is researched deeply beyond the corpus, and the new sourced facts are added
  to the corpus. See the `terralore-reels` skill.
- **The switch (2026-09-28):** the three old-form reels still waiting in the drop (28 Sep ×2 Canada/Nigeria,
  29 Sep Czechoslovakia) were moved to `/data/terralore-social/status/reels-retired/` on the box (not deleted)
  and the map reels took over: Cyprus 28 Sep, Chile 30 Sep, Lesotho 2 Oct, Greenland 4 Oct, Gibraltar 5 Oct,
  Kaliningrad 7 Oct — all `reel-2` (19:30).
- **Keys:** the fal key lives in `~/.config/terralore/fal.env` (outside the
  repo, mode 600). The pipeline scripts read it from there.

## The contract

**One reel per day, published with that day's card batch.** The reel takes
the same subject as the day's ledger anchor (`data/social-ledger.json` —
`event`/`eventNation`), so the day tells one story across every surface:
the cards trail the chronicle, the reel dramatizes it, the end card sends
viewers to `terralore.co/country/<CODE>/chronicle`. When the engine's
anchor has no reel-shaped story, pick the nearest day-precise event from
the queue below and note the divergence in the log.

Every narrated claim must be traceable to the nation's history file in
`lib/histories/data/` — the reel inherits the corpus's trust rule wholesale.
No claim that is not in the corpus; the corpus's own phrasing is the safe
phrasing ("the power behind the scenes" is citable because the era prose
says it).

## Two reels a day (since 2026-09-22)

**The contract above is superseded for days from 2026-09-22.** The feed is now
five posts a day on Instagram and the Facebook Page, of which **two are reels**
(`reel-1` at 12:30, `reel-2` at 19:30 Casablanca). The other three were stills
(`docs/social-surface.md` §2b). Since 2026-09-27 the stills are gone and only two
carousels a week remain (§2c), so the reels are the whole feed. A reel no longer follows the day's ledger anchor
by default:

- **On a curated anniversary date** (`data/social-anniversaries.json`), one of
  the two reels may tell that anniversary. It is the strongest hook the day has.
  (Until 2026-09-26 the 08:30 still carried the same event. Since §2c there is
  no anniversary still, so the reel is the only feed post the date gets.)
- **Every other reel is a date-free explainer** (the Alaska / Panama / Bolivia
  form). These are evergreen, so they can be cut in batches ahead of time and
  dropped for any day.
- Every reel still clears the one-minute floor and the corpus trust rule.

Production is the constraint now: 14 reels a week at ≥60 s each. Build in
weekly batches (clone the phone-grammar composition, factored into one shared
component first). Queue each finished reel with `scripts/social-queue-reel.sh`.
A day with only one reel dropped still publishes. The missing slot is simply
empty.

## What the day ships around it (since 2026-08-23)

The reel is now the day's lead asset, so the card batch was cut back to what
the reel cannot do (`docs/social-surface.md` §2a): the two Pinterest pins
(anchor + data) always, the ranking carousel on the third of days that has
one, and nothing else. The vertical anchor still and the formation carousel
are retired — both retold, in the same feed on the same day, the exact story
the reel tells better.

## The grammar (the Aktionnaire model)

One sentence per cut. Word-highlight captions (Schibsted 700, 68px,
karaoke fill). One big stamp per beat: **year stamps** (Plex Mono on bone
box) for dates and numbers, **word stamps** (Bricolage 800 on oxide box)
for turns, and — since reel 02 — **name tags** (Bricolage 800, bone box,
scale-pop) when a person first appears. Archive stills with Ken Burns
(1.18× push, four moves), B&W grade for the past, desaturated colour for
the present, grain + vignette. No CTA. End on the turn, then a 3s end
card: wordmark, chronicle URL, sources, image credits. ≥60 s of narration
+ the end card (the one-minute floor, below; the old ~40–50 s target is retired).

Honesty rule for imagery: never put a year stamp over an anachronistic
photo. If no period image exists (Commons had no 1980s Hun Sen), the
Terralore map or a document carries the date and portraits carry the
person. Verify every still actually shows what the beat claims.

## The pipeline

Lives per-reel in `social-out/reel-NN-<nation>/` (gitignored), cloned from
the previous reel: `fetch.py`/`search.py`/`cat.py` (Commons hunt, PD/CC
only, credits.json), `map.py` (locator from `public/data/countries.geo.json`),
`script.txt` (≤100 words, single newlines), `gen-audio.py` (fal.ai:
eleven-v3 "George" → silenceremove + atempo 1.12; whisper word timings;
stable-audio underscore, ducked), `build.py` (beats → ffmpeg clips → ASS
captions/stamps → mix). The fal key is never stored — ask for it each
session. Deliverable: `social-out/reel-NN-<nation>-YYYY-MM-DD.mp4`
(1080×1920, crf 22, ≲16 MB).

**Since reel 04 the build moved to the skill's contract** (`.claude/skills/
terralore-reels/`): asset-first sourcing with a licensed `asset-manifest.json`,
per-shot edge-tts (`en-GB-RyanNeural`, +10%, −3Hz) with word boundaries, a
generated `timeline.json` (scene = last word + 0.16s; caption clears 100ms
before the cut), and a custom Remotion composition instead of ASS subtitles.
`validate.py` / the skill's `validate_timeline.py` and `qa_video.py` gate
delivery. Remotion renders at crf 18; one ffmpeg pass at crf 23 + `+faststart`
brings the deliverable under 16 MB without touching the −15 LUFS / −1.2 dBTP
mix. Clone the previous reel's directory — reel 05 is the current reference.

## Queue — day-precise anniversaries in the corpus

| Date | Event | Nation / chronicle |
| --- | --- | --- |
| Sep 8  | First paréage, 1278 · Italy's armistice announced, 1943 · North Macedonia independence referendum, 1991 · Lebanon 1944 | AND, ITA, MKD or LBN |
| Sep 9  | Tajikistan declares independence, 1991 | TJK (ledger anchor) |
| — | Aug 26 – Sep 7 are spent (reels 06–17). Refill from Sep 8 onward. | |

Refill by grepping `yearLabel` for the coming dates (both `"DD Mon"` and
`"DD Month"` formats exist in the corpus).

## The one-minute floor (since 2026-09-21)

**Every reel runs at least 60 s of narration**, plus the 3 s end card on top. User
directive on resuming after the 9 Sep – 21 Sep gap. At the phone grammar's measured
0.34–0.38 s/word that is **175–190 words across ~26–30 one-sentence shots** (the old
≤140-word cap is retired). Length comes from more evidence beats, never from slower
reading or padded holds — a story that cannot fill a minute with exact visuals is the
wrong story. Enforced: the skill's `validate_timeline.py` (`--minimum-voice 60`) and
`qa_video.py` (`--minimum-duration 60`) fail short reels, and `qa.py` runs both.

## The phone grammar (since reel 30, 2026-09-07)

Reels 04–29 plateaued (peak ≈1K views, floor <30). Against the Aktionnaire reference
the difference was density and tempo, not subject: our frames carried 3 photos + 3 tags +
a metric + a pointer + a 20-word caption at 6 s per cut; the reference carries one image,
one 4-word line, a cut every ~2 s, the caption mid-frame. Reel 30 tests the corrective:
**one picture, one sentence, one stamp per cut**; ≤9 words per sentence; the caption card
sits at 61–73 % of frame height (clear of the Reels UI top and bottom bands); documents
are paper cards on paper, photos full-bleed. Voice is delivered as an A/B (Andrew vs
Ryan) so the two suspects can be separated by the numbers.

## Log

| Date | Reel | Anchor match |
| --- | --- | --- |
| 2026-08-21 | reel-01-latvia — "Declared free. Twice." | LVA ✓ |
| 2026-08-22 | reel-02-cambodia — "Three years ago, today." | KHM ✓ |
| 2026-08-23 | reel-03-baltic — "One date." | LTU ✓ (anchor was the 1939 pact; the 1989 Baltic Way is recorded in the EST and LVA files, so the reel reads across all three chronicles and ends on the anchor nation) |
| 2026-08-24 | reel-04-ukraine — the Act, then the referendum | UKR ✓ (queue) |
| 2026-08-25 | reel-05-uruguay — "Gave it away." | URY (queue; the ledger has no Aug 25 anchor yet — Aug 25 offered URY 1825 or BLR 1991, and URY was taken because the three preceding reels were all post-Soviet 1991) |
| 2026-08-26 | reel-06-namibia — "Twenty-four years." | NAM (queue) |
| 2026-08-27 | reel-07-moldova — "Still there." | MDA (queue) |
| 2026-08-28 | reel-08-montenegro — "By half a point." | MNE (queue) |
| 2026-08-29 | reel-09-hungary — "500 years." | HUN (queue; taken over SVK 1944 — Mohács is the 500th anniversary to the day, and the week's only pre-modern story) |
| 2026-08-30 | reel-10-timorleste — "78.5%." | TLS (queue; taken over SWE 1721, which would have doubled Mohács's "an empire ends") |
| 2026-08-31 | reel-11-malaysia — "Merdeka." | MYS (queue; taken over KGZ 1991 — MDA already carries post-Soviet this week) |
| 2026-09-02 | reel-12-vietnam — "Thirty-one years." | VNM ✓ (ledger anchor) |
| 2026-09-03 | reel-13-qatar — "Its own path." | QAT ✓ |
| 2026-09-04 | reel-14-burkinafaso — "Abolished." | BFA ✓ (1932 partition told by two period maps: the 1927 BnF colony map, then the 1936 AOF map without Upper Volta) |
| 2026-09-05 | reel-15-guinea — "The third time." | GIN ✓ (1958 'Non' and 2 Oct 1958 carried by cards — Commons has no de Gaulle-in-Conakry image) |
| 2026-09-06 | reel-16-eswatini — "Five years." | SWZ ✓ (thin Commons coverage: concessions and 1973 on cards; Labotsibeni c.1910 carries the dual monarchy) |
| 2026-09-07 | reel-17-brazil — "One country." | BRA ✓ |
| 2026-09-08 → 09-17 | reels 18–27 (AND, TJK, BLZ, ERI, ETH, CMR, MCO, NIC, MEX, BLR) — batch 3 in `social-out/reel-lab/`, 16 shots / ~1:20–1:35 each; MCO and MEX re-cut as **live edits** (`src/monaco-live.tsx`, `src/mexico-live.tsx`: layered evidence cards, declared pointer targets, focus rings) | queue ✓ |
| 2026-09-20 | reel-28-vatican — "A country inside a city." (`src/vatican-live.tsx`, third live edit; 9 shots, 156 words, 54 s — the 45–60 s form) | VAT (queue: Porta Pia, 20 Sep 1870) |
| 2026-09-06 (evening) | reel-29-bolivia — "A navy without a sea." (`src/bolivia-live.tsx`, fourth live edit; 9 shots, 161 words, 55.8 s voice + 3 s end card) | BOL — date-free explainer chosen over the SWZ anchor (already reel 16); the 2018 ICJ ruling and the 2009 constitution (arts. 243/267/268) were added to `bolivia.json` first so every line stays corpus-traceable |
| 2026-09-07 (evening) | reel-30-alaska — "Seward’s Folly." (`src/alaska.tsx`, the first **phone-grammar** cut: 19 shots / 128 words / 44 s voice + 3 s end card — one full-frame image per cut, one short sentence per cut (~2.3 s), one stamp at most, caption card in the phone's middle band; delivered in two voices, Andrew (`ala`) and Ryan (`alar`), same picture, as an A/B) | USA + RUS — date-free explainer; the 1867 purchase and 1959 statehood were added to `usa.json` / `russia.json` first (State Dept Office of the Historian + NARA) |
| 2026-09-09 | reel-31-panama — "Built it. Gave it away." (`src/panama.tsx`, second phone-grammar cut: 20 shots / 131 words / 49.6 s voice + 3 s end card; Andrew (`pan`) and Ryan (`panr`) again, same picture) | PAN + USA — date-free explainer, the mirror of Alaska (bought a land / built and returned a canal); every line traces to `panama.json` (1880 French attempt, 3 and 18 Nov 1903, 15 Aug 1914, 9 Jan 1964, 7 Sep 1977, 31 Dec 1999). Commons has no French-era excavation photograph and no 31 Dec 1999 image: the FMIB Tabernilla excavator plate and the 14 Dec 1999 Miraflores ceremony carry those beats, labelled with their own dates |
| 2026-09-27 | **map-01-cyprus — "How Cyprus got sliced in half"** (`social-out/cyprus-v2-sliced-in-half.mp4`, 57.5 s, `src/reels/cyprus.tsx`) — the first map reel; approved as the new form | CYP + CYN — date-free explainer; every line traces to `cyprus.json` / `northerncyprus.json` (1571, 1878, 1960, 1963, 1964, 1974 coup and intervention, two-way displacement) |
| 2026-09-27 | **map-02-chile — "Why Chile is shaped like a noodle"** (`social-out/why-chile-is-a-noodle.mp4`, 65.9 s, `src/reels/chile.tsx`) — the first reel built on the engine; true-size Chile laid over Europe (Lisbon → past Moscow, `transplant()` in geo-lib) | CHL + BOL — every line traces to `chile.json` (LOC country study on the shape, added 2026-09-27; 1541; Mapuche frontier; 1818; War of the Pacific; Araucanía; the 23 July 1881 treaty, added from UN RIAA vol. IX) and `bolivia.json` (landlocked; 2018 ICJ) |
| 2026-09-28 | **map-03-lesotho — "A country inside a country"** (`social-out/a-country-inside-a-country.mp4`, 53.5 s, `src/reels/lesotho.tsx`) — queued for 2 Oct | LSO — `lesotho.json` end to end (Thaba Bosiu, lowlands lost, 1868, kept out of the 1910 Union, 1966, water for royalties) |
| 2026-09-28 | **map-04-greenland — "Why does Denmark own Greenland?"** (`social-out/why-denmark-owns-greenland.mp4`, 59.2 s, `src/reels/greenland.tsx`) — true-size Denmark on Greenland; queued for 4 Oct | GRL — `greenland.json` (985, 1261, 1408 Hvalsey, Egede 1721 — Dano-Norwegian, 1933 PCIJ, 1941, Pituffik, 2009, 2025) |
| 2026-09-28 | **map-05-gibraltar — "Why is this rock British?"** (`social-out/why-is-gibraltar-british.mp4`, 58.3 s, `src/reels/gibraltar.tsx`) — vote bars 12,138–44 and 17,900–187; queued for 5 Oct | ESP + GBR — added to `spain.json` (1704, Great Siege 1779–83, 1969–1985 frontier) and `uk.json` (1967, 2002) from the Gibraltar Government booklet, the UN C-24 working paper and Wikipedia |
| 2026-09-28 | **map-06-kaliningrad — "A piece of Russia, cut off"** (`social-out/kaliningrad-cut-off.mp4`, 55.7 s, `src/reels/kaliningrad.tsx`) — queued for 7 Oct | RUS + DEU — added to `germany.json` (1255) and `russia.json` (1945 capture + Potsdam, 1946 rename/expulsion, 1991 exclave, Baltic Fleet) from the Potsdam protocol (Avalon) and Wikipedia |
| 2026-09-28 | **Batch 1 at 2/day** — Andorra "two princes", Bangladesh "one country, two halves", Suriname "traded New York", Czechoslovakia "split without a shot", West Berlin, "two countries called Congo" (`src/reels/{andorra,bangladesh,suriname,czechoslovakia,berlin,congos}.tsx`, 54–61 s each) — queued 1–3 Oct, both slots | Corpus as-is except `germany.json` + the 1948–49 blockade and airlift (US Office of the Historian). A renames reel (`reels/names/`) is scripted but unvoiced: fal locked (TOP_UP) mid-batch; Berlin and Congo reuse the Kaliningrad and Lesotho music beds |
| 2026-10-01 → 10-07 | **Schedule set 2026-09-30** (12:30 / 19:30): 1 Iran-or-Persia (Iran in the news) / Czechoslovakia (Czechia pageviews ×1.6); 2 Andorra / Falklands; 3 Korea (National Foundation Day) / West Berlin (German Unity Day); 4 Mongol Empire / France-borders-Brazil (Brazil's election day); 5 Bir Tawil / Bangladesh; 6 Russia / Suriname; 7 Mongolia / the two Congos. Reels in `social-out/reels/2-scheduled/`. |
| 2026-10-01 | **map reel — "One island, two countries"** (Ireland and Northern Ireland, `src/reels/ireland.tsx`, 103.6 s, the first reel past the minute under the 2026-10-01 rules: deep outside research, a new prop set). **Re-slotted:** 2 Oct is now Falklands 12:30 / Ireland 19:30, and Andorra moves to 8 Oct 12:30. | IRL + GBR: 24 events added to `ireland.json` / `uk.json` (Covenant, 1920 six-county Act, Boundary Commission, Sutton death split, Bloody Sunday/Saville, Bloody Friday, GFA, 2021 census, …) |

Reels 06–11 were built together in `social-out/reel-week/`: **one shared
Remotion project with six compositions**, so the physics (plate, document, map,
photo, Terralore card, caption, headline, end card) live once in
`src/reel.tsx` and each reel is data — `reels/<code>/shots.json` plus its own
`public/img/<code>/`. `build_shots.py` writes the shot maps, `fetch.py` pulls
and licenses every asset from Commons at a fixed pace (Wikimedia rate-limits
downloads hard: honour `Retry-After`), `audio.py` does per-shot TTS and the
timeline, `stills.py` sheets one still per shot for approval, `qa.py` gates
delivery. Clone this directory for a batch; clone `reel-05-uruguay` for a
single reel.

**Reels 12–17 (2–7 Sep) were built in `social-out/reel-week2/`**, cloned from
`reel-week` with three additions worth keeping: `search.py` (Commons hunt →
`reels/<code>/search.json`, merging across passes) + `peek.py` (contact sheet of
candidate thumbnails — Commons now rejects arbitrary thumb widths; 1280px works),
`assets.py` resolving title *substrings* against `search.json` so no Commons title
is ever hand-typed, and `sync_treat.py` (copies treat/headline/label edits from
`shots.json` into `timeline.json` without re-synthesis). edge-tts is not installed
system-wide: run `uv run --with edge-tts python3 audio.py …`. Captions are generated
(`captions.py`) with image credits read from the licensed manifests. Reel length
settled at 52–55 s voice + 3 s end card for 13 shots / ~140 words — trim to ≤140
words before synthesis. Batch build order: `search.py` → `peek.py` → `assets.py` →
`fetch.py` → `maps.py` → `build_shots.py` → `audio.py` → `sync_treat.py` →
`stills.py` → `render.sh` → `qa.py` → `captions.py`.
| 2026-10-05 | **map reel: "Holland or the Netherlands?"** (`src/reels/holland.tsx`, 70.6 s, Instagram only, the first reel on the relief engine: NASA Blue Marble relief, parchment rewind, flag fills, the Copernicus below-sea-level flood layer). Approved by the user ("good content, green lighted"). Queued for **8 Oct reel-2 19:30, `--platform instagram`**. | NLD: 4 events + the 2010 Antilles dissolution added to `netherlands.json` (de Vaan, Blok, government.nl, DutchReview). PBL 26% below NAP. |
| 2026-10-05 | **map reel: "Why is this Greek island 2 km from Turkey?"** (`src/reels/aegean.tsx`, 102.6 s, **Facebook only**, an identity reel: both war names, a two-counter exchange, the Lausanne articles verbatim, Kastellorizo from OSM). Banner/seal/label fixes after the user's review, then approved ("much better now"). Queued for **9 Oct reel-2 19:40, `--platform facebook`**. | GRC/TUR: 9 events added (1912 Ouchy and the Balkan War islands, 1914 decision, 1923 convention + Lausanne Arts 12–16, 1947 Paris, 1995, 1996 Kardak/Imia, 2023 Athens Declaration). |
| 2026-10-05 | **map reels: "Why isn't Portugal part of Spain?"** (IG, 75.8 s) and **"Why do three countries hold Kashmir?"** (FB, 90.6 s; neutral hatches, dashed administered lines, both 1947 framings side by side). Both approved by the user. Queued for **9 Oct reel-1 12:30 `--platform instagram`** and **10 Oct reel-2 19:40 `--platform facebook`**. Engine changes along the way: exact Wikimedia Commons flag SVGs for 34 nations (`public/flags/`, `REAL_FLAGS`), FlagFill centres the emblem, and voice.py refuses multi-word respellings of words (the "Afonso" twice bug). | PRT/KAS corpus additions are still to do (research.md §9 in each). |
| 2026-10-06 | **map reels: "England, Britain, the UK"** (IG, 70.0 s, the "name is a receipt" structure) and **"Why did this country delete its own name?"** (Burkina Faso / Sankara, FB, 82.8 s, a two-column ledger of documented achievements and abuses). Both approved. Queued for **10 Oct reel-1 12:30 `--platform instagram`** and **15 Oct reel-2 19:40 `--platform facebook`** (the anniversary of Sankara's death). | GBR/BFA corpus additions are still to do (research.md §11 / §9). |
| 2026-10-06 | **Batch of four, one platform each:** "Why beef not cow?" (IG, 65 s; the Ivanhoe twist) for **14 Oct reel-2** (Hastings' 960th); "The UAE inside Oman inside the UAE" (IG, 71 s; OSM outlines) for **11 Oct reel-2**; "Why Hormuz moves oil prices" (FB, 85 s; "the Gulf" only, 2026 limited to the Al Jazeera traffic fact) for **11 Oct reel-1**; "The country that doesn't exist" (Transnistria, FB, 77 s; the NE10 disputed strip, dashed) for **12 Oct reel-2**. All approved by the user. The agents built their own geometry and relief (the brief's addendum); 9 more Commons flags were added (44 in all). | Corpus additions from nrm/mdh/trn/hrm are still to do (research.md §9 in each). |
