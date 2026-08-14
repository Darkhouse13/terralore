#!/usr/bin/env bash
# ── The monthly DETECTION dry-run (living-record §3.3) ──────────────────────
# Executed inside the terralore-social-runner container by a Coolify
# scheduled task (the social runner's pattern: repo clone at /work/repo,
# status under the mounted /status). Detection ONLY: it pulls fresh data
# over the clone, diffs it against committed main claim-by-claim, writes the
# would-be ledger entry to the Marsad status path — and then discards every
# byte it changed. Publishing a recorded refresh stays a deliberate act:
# an operator reads the dry-run, then runs the runbook in
# docs/refresh-domains.md ("Recorded refreshes").
#
# Status (host: /data/terralore-social/status/recorder/):
#   dryrun.jsonl      — one line per run: date, counts, ok
#   would-be-entry.json — the full would-be entry from the latest run
set -euo pipefail

cd /work/repo
STATUS_DIR="${RECORDER_STATUS_DIR:-/status/recorder}"
mkdir -p "$STATUS_DIR"

# A clean, current clone: discard any leftover state, then pull.
git checkout -- .
git pull --rebase origin main

# npm ci only when the lockfile changed (the social runner's stamp pattern,
# its own stamp file so the two tasks never race each other's node_modules).
LOCK_HASH=$(sha256sum package-lock.json | cut -d" " -f1)
STAMP=/work/.npm-ci-stamp
if [ ! -d node_modules ] || [ "$(cat "$STAMP" 2>/dev/null)" != "$LOCK_HASH" ]; then
  npm ci --no-audit --no-fund
  echo "$LOCK_HASH" > "$STAMP"
fi

RUN_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
OK=true
COUNTS=null

# Pull fresh data over the working tree (WB API — minutes, retry-hardened),
# then diff against HEAD. Any failure is recorded, not swallowed.
if npm run build-data && npm run build-domains; then
  node scripts/record-refresh.mjs --dry-run --out "$STATUS_DIR/would-be-entry.json" --before HEAD \
    || OK=false
  if [ -f "$STATUS_DIR/would-be-entry.json" ]; then
    COUNTS=$(node -e '
      const e = require(process.argv[1]);
      console.log(JSON.stringify({ ...e.counts, domains: e.domains }));
    ' "$STATUS_DIR/would-be-entry.json")
  fi
else
  OK=false
fi

# DETECTION ONLY — return the clone to committed state, always.
git checkout -- .
git clean -fd public/ data/ >/dev/null 2>&1 || true

printf '{"runAt":"%s","ok":%s,"counts":%s}\n' "$RUN_AT" "$OK" "${COUNTS:-null}" \
  >> "$STATUS_DIR/dryrun.jsonl"

$OK
