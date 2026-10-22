#!/usr/bin/env bash
# ── Queue a finished map ALBUM (3-10 JPEG slides) for the daily publisher ───
# Usage:
#
#   scripts/social-queue-album.sh <YYYY-MM-DD> <album-N> <caption.txt> <slide-1.jpg> <slide-2.jpg> ... \
#       [--platform <instagram,facebook>] [--alt "<slide-1 alt>" --alt "<slide-2 alt>" ...] [--now] [--check]
#
# The photo half of the 2026-10-22 cadence (one reel + one map album a day, docs/reel-cadence.md; research in
# social-out/work/fb-photo-research/). One album = ONE post per platform carrying every slide: Postiz turns the
# multi-image `image` array into an Instagram carousel and a Facebook multi-photo post.
#
# Copies the slides and a drop file into the album drop on the box
# (/data/terralore-social/status/albums/<date>/, which the runner sees as /status/albums), exactly like
# social-queue-reel.sh does for reels:
#     album-N.json      { "caption": "...", "platforms": ["instagram","facebook"], "slides": ["album-N-1.jpg", ...], "alts": [...] }
#     album-N-1.jpg ... the slides, in swipe order
# The 04:00 UTC run schedules every album dropped for its day (slot instagram:album-N / facebook:album-N in
# data/social-publish.json, 17:30 / 17:40 Casablanca for album-1); --now also runs the publisher for that date
# immediately (idempotent: already-scheduled posts are skipped by key). --check runs the gates and writes NOTHING.
#
# Gates, before anything leaves the laptop: 3-10 slides (Instagram carousel max is 10), every slide a JPEG of
# exactly 1080x1350 (4:5 — Instagram wants one shared ratio across a carousel), a non-empty caption of at most
# 2,000 characters (Instagram rejects over 2,200 at publish time), no terralore.co link (Meta demotes
# off-platform links, since 2026-10-03), no emoji anywhere, and none of the engagement-bait phrasings Meta
# demotes ("comment 1", "share if", "tag a friend", "like if", "type yes" ...). The caption file is the post
# text exactly as it should appear.
set -euo pipefail

if [ $# -lt 5 ]; then
  sed -n 3,6p "$0"
  exit 2
fi
DATE=$1 SLOT=$2 CAPTION=$3
shift 3
SLIDES=() ALTS=()
NOW= CHECK= PLATFORM=instagram,facebook
while [ $# -gt 0 ]; do
  case $1 in
    --now) NOW=--now ;;
    --check) CHECK=1 ;;
    --platform) PLATFORM=${2:-}; shift ;;
    --alt) ALTS+=("${2:-}"); shift ;;
    --*) echo "unknown option: $1" >&2; exit 2 ;;
    *) SLIDES+=("$1") ;;
  esac
  shift
done
HOST=${SOCIAL_HOST:-hetzner}
RUNNER=runner-v113yzpn4rzcv32nqam70td2
DROP=/data/terralore-social/status/albums/$DATE

[[ $DATE =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || { echo "date must be YYYY-MM-DD" >&2; exit 2; }
[[ $SLOT =~ ^album-[0-9]+$ ]] || { echo "slot must be album-N" >&2; exit 2; }
[[ $PLATFORM =~ ^(instagram|facebook)(,(instagram|facebook))*$ ]] || { echo "--platform must be instagram, facebook or both" >&2; exit 2; }
[ -s "$CAPTION" ] || { echo "caption file missing or empty: $CAPTION" >&2; exit 2; }
N=${#SLIDES[@]}
[ "$N" -ge 3 ] && [ "$N" -le 10 ] || { echo "an album needs 3-10 slides (got $N)" >&2; exit 1; }
if [ "${#ALTS[@]}" -gt 0 ] && [ "${#ALTS[@]}" -ne "$N" ]; then echo "--alt must be given once per slide ($N), got ${#ALTS[@]}" >&2; exit 2; fi

for f in "${SLIDES[@]}"; do
  [ -f "$f" ] || { echo "no such slide: $f" >&2; exit 2; }
  IFS=, read -r CODEC W H < <(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height -of csv=p=0 "$f")
  { [ "$CODEC" = mjpeg ] && [ "$W" = 1080 ] && [ "$H" = 1350 ]; } || {
    echo "$f: expected a 1080x1350 JPEG (4:5), got ${W}x${H} $CODEC" >&2; exit 1; }
done

# Caption gates (length, link, emoji, engagement bait) in one place.
node -e '
const fs = require("fs");
const cap = fs.readFileSync(process.argv[1], "utf8").trim();
const fail = (m) => { console.error("caption: " + m); process.exit(1); };
if (!cap) fail("empty");
if (cap.length > 2000) fail(`${cap.length} chars; the margin is 2000 (Instagram limit 2200)`);
if (/terralore\.co/i.test(cap)) fail("links to terralore.co; Meta captions carry no website link");
if (/\p{Extended_Pictographic}|\p{Regional_Indicator}|‍|️/u.test(cap)) fail("contains an emoji; there is none anywhere in Terralore output");
const bait = /(comment\s+(yes|no|1|2|"|\x27)|share (this )?if|tag (a|your|someone)|like (this )?if|type (yes|1|amen)|follow (us )?for more|link in bio)/i.exec(cap);
if (bait) fail(`engagement bait: "${bait[0]}"`);
const tags = (cap.match(/#[\p{L}\p{N}_]+/gu) || []).length;
if (tags < 3 || tags > 10) fail(`${tags} hashtags; keep 5-8`);
' "$CAPTION"

echo "gates ok: $DATE $SLOT, $N slides (1080x1350 JPEG), caption $(node -e 'process.stdout.write(String(require("fs").readFileSync(process.argv[1],"utf8").trim().length))' "$CAPTION") chars, platforms $PLATFORM"
[ -z "$CHECK" ] || { echo "--check: nothing written"; exit 0; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
NAMES=()
for i in "${!SLIDES[@]}"; do NAMES+=("$SLOT-$((i + 1)).jpg"); done
ALTJSON=$(printf '%s\n' "${ALTS[@]+"${ALTS[@]}"}" | node -e 'const l=require("fs").readFileSync(0,"utf8").split("\n").filter(Boolean);process.stdout.write(JSON.stringify(l))')
node -e '
const fs = require("fs");
const [captionPath, outPath, platforms, names, alts] = process.argv.slice(1);
const out = { caption: fs.readFileSync(captionPath, "utf8").trim(), platforms: platforms.split(","), slides: names.split(",") };
const a = JSON.parse(alts); if (a.length) out.alts = a;
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
' "$CAPTION" "$TMP/$SLOT.json" "$PLATFORM" "$(IFS=,; echo "${NAMES[*]}")" "$ALTJSON"

ssh "$HOST" "mkdir -p '$DROP'"
for i in "${!SLIDES[@]}"; do scp -q "${SLIDES[$i]}" "$HOST:$DROP/${NAMES[$i]}"; done
scp -q "$TMP/$SLOT.json" "$HOST:$DROP/$SLOT.json"
echo "queued $DATE $SLOT ($N slides) for $PLATFORM → $HOST:$DROP"

if [ "$NOW" = "--now" ]; then
  ssh "$HOST" "docker exec $RUNNER sh -c 'cd /work/repo && node scripts/social-publish.mjs --date $DATE'"
fi
