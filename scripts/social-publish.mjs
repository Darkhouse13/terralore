#!/usr/bin/env node
// ── The daily publisher: manifest → Postiz schedule ────────────────────────
// Usage:
//
//   node scripts/social-publish.mjs                       # today (Africa/Casablanca)
//   node scripts/social-publish.mjs --date 2026-08-12
//   … either may add --dry-run     (full pipeline, zero Postiz writes,
//                                   zero git writes — prints the schedule)
//
// Consumes social-out/<date>/manifest.json under the contract in
// docs/social-surface.md §6 (schemaVersion 1 only — anything else is fatal),
// generating it first via build-social if absent. Slot times come from
// data/social-publish.json (first-guess defaults, one place to revise).
//
// Idempotency, three layers (docs/social-publishing.md §3):
//   1. a local posted-keys store (SOCIAL_STATUS_DIR/posted-keys.json) — the
//      "keep your own posted-keys store" the manifest contract mandates;
//   2. a Postiz day-window query (GET /public/v1/posts) — a post whose id
//      matches the dedupe key's deterministic UUID is already scheduled;
//   3. the deterministic post id itself: Postiz upserts on the client-supplied
//      value[0].id, so even a raced duplicate create updates in place rather
//      than double-posting. (Postiz tags were rejected as the dedupe vehicle:
//      the public API only ATTACHES tags that already exist in the org —
//      it cannot create them, so a fresh key's tag would silently drop.)
//
// Platforms not connected in Postiz are skipped with a logged reason — the
// day still publishes on whatever is connected. After ≥1 successful schedule
// the day's ledger entry is committed and pushed (the determinism contract
// requires the published ledger in history); an unresolvable push fails the
// run loudly, but never unschedules what Postiz already accepted.
//
// Env: POSTIZ_API_KEY (required unless --dry-run), POSTIZ_API_URL
// (default https://postiz.terralore.co/api), POSTIZ_PINTEREST_BOARD
// (overrides platformSettings.pinterest.board), SOCIAL_STATUS_DIR
// (default social-out/.status — gitignored with the rest of social-out).
//
// Exit: 0 = every post scheduled or deliberately skipped; 1 = any post
// failed, the ledger push failed, or the pipeline itself broke. A per-run
// JSON status line is appended to SOCIAL_STATUS_DIR/publish-status.jsonl
// and mirrored to SOCIAL_STATUS_DIR/last-run.json (the Marsad surface —
// docs/social-publishing.md §6).

import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_ROOT = join(ROOT, "social-out");
const LEDGER_PATH = join(ROOT, "data/social-ledger.json");
const CONFIG_PATH = join(ROOT, "data/social-publish.json");
const MANIFEST_SCHEMA_VERSION = 1;

// Which Postiz provider identifiers satisfy each manifest platform. The
// instagram provider comes in two flavours (Facebook-linked and standalone);
// either carries the post.
const PROVIDERS = {
  pinterest: ["pinterest"],
  instagram: ["instagram", "instagram-standalone"],
  tiktok: ["tiktok"],
};

/* ── arguments ────────────────────────────────────────────────────────────── */

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const dateArg = argv.includes("--date") ? argv[argv.indexOf("--date") + 1] : null;
if (dateArg && !/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
  throw new Error(`--date must be YYYY-MM-DD, got ${dateArg}`);
}

const config = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
if (config.version !== 1) throw new Error(`unknown config version ${config.version}`);
const TZ = config.timezone;

const STATUS_DIR = process.env.SOCIAL_STATUS_DIR || join(OUT_ROOT, ".status");
const API_URL = (process.env.POSTIZ_API_URL || "https://postiz.terralore.co/api").replace(/\/$/, "");
const API_KEY = process.env.POSTIZ_API_KEY || "";

/* ── time: wall-clock in the configured zone → UTC instant ────────────────── */

function tzOffsetMs(instantMs, tz) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(new Date(instantMs)).map((p) => [p.type, p.value])
  );
  const wall = Date.UTC(
    +parts.year, +parts.month - 1, +parts.day,
    parts.hour === "24" ? 0 : +parts.hour, +parts.minute, +parts.second
  );
  return wall - instantMs;
}

// Two passes so a slot near a DST transition resolves against the offset
// actually in force at the resulting instant, not at midnight UTC.
function zonedToUtc(dateIso, hhmm, tz) {
  const wallUtc = Date.parse(`${dateIso}T${hhmm}:00Z`);
  let instant = wallUtc - tzOffsetMs(wallUtc, tz);
  instant = wallUtc - tzOffsetMs(instant, tz);
  return new Date(instant);
}

function todayIn(tz) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

/* ── deterministic post ids (UUIDv5 over the dedupe key) ──────────────────── */

const UUID_NS = Buffer.from("6f9c2e1a8b4d4f3a9e2b1c7d5a3f8e40", "hex");

function uuidv5(name) {
  const h = createHash("sha1").update(Buffer.concat([UUID_NS, Buffer.from(name)])).digest();
  const b = Buffer.from(h.subarray(0, 16));
  b[6] = (b[6] & 0x0f) | 0x50;
  b[8] = (b[8] & 0x3f) | 0x80;
  const x = b.toString("hex");
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}

/* ── the Postiz public API ────────────────────────────────────────────────── */

async function api(path, init = {}) {
  const res = await fetch(`${API_URL}/public/v1${path}`, {
    ...init,
    headers: { Authorization: API_KEY, ...(init.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Postiz ${init.method || "GET"} ${path} → ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

async function uploadAsset(absPath, filename) {
  const form = new FormData();
  form.append("file", new Blob([readFileSync(absPath)], { type: "image/png" }), filename);
  return api("/upload", { method: "POST", body: form });
}

/* ── the run ──────────────────────────────────────────────────────────────── */

const startedAt = Date.now();
const date = dateArg || todayIn(TZ);
const dir = join(OUT_ROOT, date);
const manifestPath = join(dir, "manifest.json");

// Ensure the day exists: manifest on disk AND its entry in the ledger (a
// manifest without a ledger entry means it was generated elsewhere — rebuild
// from the committed ledger so plan and entry agree).
const ledgerHas = (iso) =>
  Boolean(JSON.parse(readFileSync(LEDGER_PATH, "utf8")).days?.[iso]);
if (!existsSync(manifestPath) || !ledgerHas(date)) {
  console.log(`[social-publish] generating ${date} (build-social)…`);
  const r = spawnSync(
    process.execPath,
    ["--import", "./scripts/lib/ts-alias-loader.mjs", "scripts/build-social.mjs", "--date", date],
    { cwd: ROOT, stdio: "inherit" }
  );
  if (r.status !== 0) throw new Error(`build-social failed for ${date} (exit ${r.status})`);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
if (manifest.schemaVersion !== MANIFEST_SCHEMA_VERSION) {
  throw new Error(
    `manifest ${date} has schemaVersion ${manifest.schemaVersion}; this publisher speaks version ${MANIFEST_SCHEMA_VERSION} only (unknown versions are fatal, per the contract)`
  );
}

// The would-be schedule: every manifest post gets its configured slot.
const schedule = manifest.posts.map((post) => {
  const slotKey = `${post.platform}:${post.slot}`;
  const hhmm = config.slots[slotKey];
  if (!hhmm) throw new Error(`no slot time configured for ${slotKey} in data/social-publish.json`);
  return { post, slotKey, hhmm, at: zonedToUtc(date, hhmm, TZ), postId: uuidv5(post.dedupeKey) };
});
schedule.sort((a, b) => a.at - b.at);

mkdirSync(STATUS_DIR, { recursive: true });
const postedStorePath = join(STATUS_DIR, "posted-keys.json");
const postedStore = existsSync(postedStorePath)
  ? JSON.parse(readFileSync(postedStorePath, "utf8"))
  : {};

// Reads are allowed in dry-run when a key is present — the dry run then
// reports real connection state; without a key it still prints the schedule.
let integrations = null;
let existingIds = new Set();
let apiState = "offline (no POSTIZ_API_KEY)";
if (API_KEY) {
  integrations = await api("/integrations");
  const windowStart = `${date}T00:00:00.000Z`;
  const windowEnd = new Date(Date.parse(`${date}T00:00:00Z`) + 2 * 86400_000).toISOString();
  const { posts: existing } = await api(
    `/posts?startDate=${encodeURIComponent(windowStart)}&endDate=${encodeURIComponent(windowEnd)}`
  );
  existingIds = new Set((existing || []).map((p) => p.id));
  apiState = "connected";
} else if (!dryRun) {
  throw new Error("POSTIZ_API_KEY is required for a live run (dry-run works without it)");
}

const integrationFor = (platform) => {
  if (!integrations) return null;
  const wanted = PROVIDERS[platform] || [platform];
  const live = integrations.filter((i) => !i.disabled);
  for (const id of wanted) {
    const hit = live.find((i) => i.identifier === id);
    if (hit) return hit;
  }
  return null;
};

const pinterestBoard =
  process.env.POSTIZ_PINTEREST_BOARD || config.platformSettings?.pinterest?.board || null;

function settingsFor(post) {
  if (post.platform === "pinterest") {
    return {
      title: post.caption.split("\n")[0].slice(0, 100),
      link: post.targetUrl,
      board: pinterestBoard,
    };
  }
  if (post.platform === "instagram") {
    return { post_type: config.platformSettings?.instagram?.post_type || "post" };
  }
  if (post.platform === "tiktok") {
    const { note, ...settings } = config.platformSettings?.tiktok || {};
    return settings;
  }
  return {};
}

/* ── decide + act per post ────────────────────────────────────────────────── */

const results = [];
for (const item of schedule) {
  const { post, hhmm, at, postId } = item;
  const base = {
    dedupeKey: post.dedupeKey,
    platform: post.platform,
    slot: post.slot,
    scheduledFor: at.toISOString(),
    localTime: `${hhmm} ${TZ}`,
  };

  const skip = (reason) => results.push({ ...base, action: "skipped", reason });

  if (postedStore[post.dedupeKey]) {
    skip(`already published (local posted-keys store, ${postedStore[post.dedupeKey].at})`);
    continue;
  }
  if (existingIds.has(postId)) {
    skip("already scheduled in Postiz (deterministic post id found in day window)");
    continue;
  }
  if (integrations) {
    const integration = integrationFor(post.platform);
    if (!integration) {
      skip("platform not connected in Postiz");
      continue;
    }
    if (post.platform === "pinterest" && !pinterestBoard) {
      skip("pinterest board not configured (set POSTIZ_PINTEREST_BOARD — docs/social-apps-setup.md)");
      continue;
    }
    if (dryRun) {
      results.push({ ...base, action: "would-schedule", integration: integration.name });
      continue;
    }
    try {
      const media = [];
      for (const asset of post.assets) {
        const up = await uploadAsset(join(dir, asset.path), asset.path.replace(/\//g, "-"));
        media.push({ id: up.id, path: up.path, alt: asset.alt });
      }
      const created = await api("/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "schedule",
          shortLink: false,
          date: at.toISOString(),
          tags: [],
          posts: [
            {
              integration: { id: integration.id },
              value: [{ id: postId, content: post.caption, image: media }],
              settings: settingsFor(post),
            },
          ],
        }),
      });
      postedStore[post.dedupeKey] = {
        at: new Date().toISOString(),
        postizId: created?.[0]?.postId || postId,
        scheduledFor: at.toISOString(),
      };
      writeFileSync(postedStorePath, JSON.stringify(postedStore, null, 2) + "\n");
      results.push({ ...base, action: "scheduled", postizId: postedStore[post.dedupeKey].postizId });
    } catch (err) {
      results.push({ ...base, action: "failed", reason: String(err.message || err) });
    }
  } else {
    // Offline dry-run: connection state unknowable, schedule still provable.
    results.push({ ...base, action: "would-schedule", integration: "(unchecked — offline dry-run)" });
  }
}

/* ── ledger commit + push (live runs that scheduled something) ────────────── */

const git = (...args) => spawnSync("git", ["-C", ROOT, ...args], { encoding: "utf8" });
const ledger = { committed: false, pushed: false };
const scheduledCount = results.filter((r) => r.action === "scheduled").length;

if (!dryRun && scheduledCount > 0) {
  git("add", "data/social-ledger.json");
  const staged = git("diff", "--cached", "--quiet", "--", "data/social-ledger.json");
  if (staged.status === 1) {
    const c = git("commit", "-m", `Social: ledger ${date} published`, "--", "data/social-ledger.json");
    if (c.status !== 0) {
      ledger.error = `commit failed: ${c.stderr}`;
    } else {
      ledger.committed = true;
    }
  } else {
    ledger.committed = "already-committed";
  }
  if (!ledger.error) {
    for (let attempt = 1; attempt <= 3 && !ledger.pushed; attempt++) {
      const p = git("push", "origin", "main");
      if (p.status === 0) {
        ledger.pushed = true;
      } else if (attempt < 3) {
        const r = git("pull", "--rebase", "origin", "main");
        if (r.status !== 0) {
          git("rebase", "--abort");
          ledger.error = `push rejected and rebase failed: ${r.stderr.slice(0, 300)}`;
          break;
        }
      } else {
        ledger.error = `push failed after ${attempt} attempts: ${p.stderr.slice(0, 300)}`;
      }
    }
  }
}

/* ── report ───────────────────────────────────────────────────────────────── */

const failed = results.filter((r) => r.action === "failed");
const ok = failed.length === 0 && !ledger.error;
const status = {
  date,
  runAt: new Date().toISOString(),
  dryRun,
  api: apiState,
  durationMs: Date.now() - startedAt,
  posts: results,
  ledger: dryRun ? { skipped: "dry-run" } : ledger,
  ok,
};
appendFileSync(join(STATUS_DIR, "publish-status.jsonl"), JSON.stringify(status) + "\n");
writeFileSync(join(STATUS_DIR, "last-run.json"), JSON.stringify(status, null, 2) + "\n");

console.log(`\n[social-publish] ${date} — ${dryRun ? "DRY-RUN" : "live"} (Postiz: ${apiState})`);
for (const r of results) {
  const when = `${r.localTime} → ${r.scheduledFor}`;
  const tail =
    r.action === "skipped" || r.action === "failed" ? ` — ${r.reason}` :
    r.integration ? ` — ${r.integration}` : "";
  console.log(`  ${r.action.padEnd(14)} ${r.dedupeKey.padEnd(34)} ${when}${tail}`);
}
if (!dryRun) {
  console.log(`  ledger: committed=${ledger.committed} pushed=${ledger.pushed}${ledger.error ? ` ERROR: ${ledger.error}` : ""}`);
}
console.log(`  status → ${join(STATUS_DIR, "last-run.json")} (${status.durationMs} ms)${ok ? "" : "  ✗ FAILURES"}`);

process.exit(ok ? 0 : 1);
