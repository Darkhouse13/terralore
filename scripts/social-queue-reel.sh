#!/usr/bin/env bash
# ── Queue a finished reel for the daily publisher ──────────────────────────
# Usage:
#
#   scripts/social-queue-reel.sh <YYYY-MM-DD> <reel-1|reel-2> <video.mp4> <caption.txt> --platform <instagram|facebook> [--youtube <sheet.txt>] [--now]
#
# --platform is required: since 2026-10-05 each reel is made for ONE platform and
# published only there (Instagram rewards curiosity, Facebook identity —
# .claude/skills/terralore-reels/SKILL.md). It lands in the drop's reel-N.json as
# "platforms", which social-publish.mjs honours. A comma list is accepted for the
# rare deliberate exception.
#
# --youtube <sheet.txt> also publishes the reel as a YouTube Short, from the same
# upload sheet used for hand uploads (TITLE / DESCRIPTION / TAGS sections, as in
# social-out/reels/*-youtube.txt). A Short is found by search, so the sheet's
# title is the query ("Why Does Denmark Own Greenland?") and its description
# answers first and links the page (docs/seo/keywords.md). Unlike the Meta
# caption, the description MUST carry a terralore.co link. "youtube" is added to
# the platforms; --platform youtube alone (with --youtube) queues a Short only,
# for reels already published on Meta.
#
# Copies the reel and its caption into the reel drop on the box
# (/data/terralore-social/status/reels/<date>/, which the runner sees as
# /status/reels — docs/social-publishing.md §2a). The 04:00 UTC run schedules
# every reel dropped for its day; --now also runs the publisher for that date
# immediately (idempotent — already-scheduled posts are skipped by key), for a
# reel dropped after that day's run.
#
# Gates, before anything leaves the laptop: 1080×1920 H.264, at least 50 s
# (the map-reel floor, docs/reel-cadence.md — the approved Cyprus cut runs
# 57.5 s), a non-empty caption of at most 2,000 characters (Instagram rejects
# over 2,200 — at publish time, hours after queueing; 2,000 is the margin the
# still captions keep, scripts/lib/social/captions.mjs). The caption file is
# the post text exactly as it should appear — and it carries no terralore.co
# link (Meta demotes posts that send people off-platform; since 2026-10-03).
set -euo pipefail

if [ $# -lt 4 ]; then
  sed -n 3,6p "$0"
  exit 2
fi
DATE=$1 SLOT=$2 VIDEO=$3 CAPTION=$4
shift 4
NOW= PLATFORM= SHEET=
while [ $# -gt 0 ]; do
  case $1 in
    --now) NOW=--now ;;
    --platform) PLATFORM=${2:-}; shift ;;
    --youtube) SHEET=${2:-}; shift ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done
[[ $PLATFORM =~ ^(instagram|facebook|youtube)(,(instagram|facebook|youtube))*$ ]] || {
  echo "--platform instagram|facebook is required (one reel, one platform — since 2026-10-05)" >&2; exit 2; }
if [ -n "$SHEET" ]; then
  [ -s "$SHEET" ] || { echo "youtube sheet missing or empty: $SHEET" >&2; exit 2; }
  [[ ,$PLATFORM, == *,youtube,* ]] || PLATFORM=$PLATFORM,youtube
elif [[ ,$PLATFORM, == *,youtube,* ]]; then
  echo "--platform youtube needs --youtube <sheet.txt>: no Short goes out without a search title" >&2; exit 2
fi
HOST=${SOCIAL_HOST:-hetzner}
RUNNER=runner-v113yzpn4rzcv32nqam70td2
DROP=/data/terralore-social/status/reels/$DATE

[[ $DATE =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || { echo "date must be YYYY-MM-DD" >&2; exit 2; }
[[ $SLOT =~ ^reel-[0-9]+$ ]] || { echo "slot must be reel-N" >&2; exit 2; }
[ -f "$VIDEO" ] || { echo "no such video: $VIDEO" >&2; exit 2; }
[ -s "$CAPTION" ] || { echo "caption file missing or empty: $CAPTION" >&2; exit 2; }
CAPLEN=$(node -e 'process.stdout.write(String(require("fs").readFileSync(process.argv[1],"utf8").trim().length))' "$CAPTION")
# The caption gates are Meta's: a YouTube-only queue posts the sheet, not the caption.
if [[ ,$PLATFORM, =~ ,(instagram|facebook), ]]; then
  [ "$CAPLEN" -le 2000 ] || { echo "caption is $CAPLEN chars; the margin is 2000 (Instagram's limit 2200)" >&2; exit 1; }
  ! grep -qi 'terralore\.co' "$CAPTION" || { echo "caption links to terralore.co; reel captions carry no website link" >&2; exit 1; }
fi

IFS=, read -r CODEC W H < <(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height \
  -of csv=p=0 "$VIDEO")
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VIDEO")
[ "$CODEC" = h264 ] && [ "$W" = 1080 ] && [ "$H" = 1920 ] || {
  echo "expected 1080x1920 h264, got ${W}x${H} $CODEC" >&2; exit 1; }
awk -v d="$DUR" 'BEGIN { exit !(d >= 50) }' || { echo "reel runs ${DUR}s; the floor is 50s" >&2; exit 1; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
# The YouTube sheet, parsed and gated: title ≤ 100 chars, description ≤ 5,000
# with a terralore.co link, tags ≤ 500 chars in all (YouTube's own limits).
node -e '
const fs = require("fs");
const [captionPath, outPath, platforms, sheetPath] = process.argv.slice(1);
const out = { caption: fs.readFileSync(captionPath, "utf8").trim(), platforms: platforms.split(",") };
if (sheetPath) {
  const sections = {};
  let key = null;
  for (const line of fs.readFileSync(sheetPath, "utf8").split("\n")) {
    const head = line.match(/^(TITLE|DESCRIPTION|TAGS|SETTINGS)\b/);
    if (head) { key = head[1]; sections[key] = []; continue; }
    if (key) sections[key].push(line);
  }
  const text = (k) => (sections[k] || []).join("\n").trim();
  const title = text("TITLE").split("\n")[0].trim();
  const description = text("DESCRIPTION");
  const tags = text("TAGS").split(",").map((t) => t.trim()).filter(Boolean);
  const fail = (m) => { console.error("youtube sheet: " + m); process.exit(1); };
  if (!title || title.length > 100) fail(`title must be 1-100 chars (got ${title.length})`);
  if (!description || description.length > 5000) fail(`description must be 1-5000 chars (got ${description.length})`);
  if (!/terralore\.co/i.test(description)) fail("description must link terralore.co: the Short exists to send searchers to the page");
  if (tags.join(",").length > 500) fail("tags exceed 500 chars");
  out.youtube = { title, description, tags };
}
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
' "$CAPTION" "$TMP/$SLOT.json" "$PLATFORM" "$SHEET"

ssh "$HOST" "mkdir -p '$DROP'"
scp -q "$VIDEO" "$HOST:$DROP/$SLOT.mp4"
scp -q "$TMP/$SLOT.json" "$HOST:$DROP/$SLOT.json"
echo "queued $DATE $SLOT for $PLATFORM ($(printf '%.1f' "$DUR")s, $(du -h "$VIDEO" | cut -f1)) → $HOST:$DROP"

# Shelf bookkeeping (social-out/reels/README.md): a reel queued from the ready shelf moves, with its
# caption, to the scheduled shelf, named <date>_<HHMM>_<slug> so the shelf sorts in publishing order.
case "$(realpath "$VIDEO")" in
  */social-out/reels/1-ready/*)
    HHMM=$(node -e 'const c=require(process.argv[2]);process.stdout.write((c.slots[process.argv[3].split(",")[0]+":"+process.argv[1]]||"0000").replace(":",""))' "$SLOT" "$(cd "$(dirname "$0")/.." && pwd)/data/social-publish.json" "$PLATFORM")
    SHELF=$(dirname "$(realpath "$VIDEO")")/../2-scheduled
    SLUG=$(basename "$VIDEO" .mp4)
    SLUG="${SLUG}_${PLATFORM//,/+}"
    mv "$VIDEO" "$SHELF/${DATE}_${HHMM}_${SLUG}.mp4"
    case "$(realpath "$CAPTION")" in */social-out/reels/1-ready/*) mv "$CAPTION" "$SHELF/${DATE}_${HHMM}_${SLUG}-caption.txt";; esac
    echo "shelved → social-out/reels/2-scheduled/${DATE}_${HHMM}_${SLUG}.mp4";;
esac

if [ "$NOW" = "--now" ]; then
  ssh "$HOST" "docker exec $RUNNER sh -c 'cd /work/repo && node scripts/social-publish.mjs --date $DATE'"
fi
