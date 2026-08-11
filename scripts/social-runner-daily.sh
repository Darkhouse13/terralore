#!/usr/bin/env bash
# ── The daily runner entry: pull latest main, deps if changed, publish ──────
# Executed inside the terralore-social-runner container by a Coolify
# scheduled task (docs/social-publishing.md §5). The task's command pulls
# before invoking this script, so even THIS file is current when it runs.
#
# Env (set on the runner service): POSTIZ_API_URL, POSTIZ_API_KEY,
# POSTIZ_PINTEREST_BOARD (once Pinterest is connected), SOCIAL_STATUS_DIR.
set -euo pipefail

cd /work/repo

# Discard an UNCOMMITTED ledger change first: it means a previous run
# generated a day but scheduled nothing (no platforms connected), and the
# ledger policy for a generated-but-never-published day is to return its
# selections to the pool. A published day's entry is committed by the
# publisher and is not touched by this. Then pull: --rebase keeps an
# unpushed ledger commit from a partially-failed run (scheduled fine, push
# failed) on top of remote main.
git checkout -- data/social-ledger.json 2>/dev/null || true
git pull --rebase origin main

# npm ci only when the lockfile actually changed — the full install is
# minutes; the daily no-op case is a hash compare.
LOCK_HASH=$(sha256sum package-lock.json | cut -d" " -f1)
STAMP=/work/.npm-ci-stamp
if [ ! -d node_modules ] || [ "$(cat "$STAMP" 2>/dev/null)" != "$LOCK_HASH" ]; then
  npm ci --no-audit --no-fund
  echo "$LOCK_HASH" > "$STAMP"
fi

# Publish today (the script derives today in the configured timezone,
# generates the day's manifest if absent, schedules whatever platforms are
# connected, commits + pushes the ledger). Non-zero exit propagates to the
# scheduled task so Coolify surfaces the failure.
node scripts/social-publish.mjs
