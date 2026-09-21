# The daily reel — cadence, grammar, queue

Written 2026-08-22, when one reel/day became the norm alongside the card
batch. Read with `docs/social-surface.md` (the batch this pairs with) and
`docs/social-publishing.md`.

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
(`reel-1` at 12:30, `reel-2` at 19:30 Casablanca). The other three are stills
(`docs/social-surface.md` §2b). A reel no longer follows the day's ledger anchor
by default:

- **On a curated anniversary date** (`data/social-anniversaries.json`), one of
  the two reels may tell that anniversary. It is the strongest hook the day has.
  The still in the 08:30 slot carries the same event, which is fine: a card and
  a film are different formats.
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
