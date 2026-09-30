#!/usr/bin/env node
// ── The nightly stats snapshot (the reel scorecard's raw material) ─────────
// Runs on the hetzner HOST (not in the runner): the Instagram and Facebook
// Page tokens live in the Postiz database, reached with `docker exec psql`.
// Writes one dated JSON per run to $STATS_DIR (default
// /data/terralore-social/status/stats/<UTC date>.json). Snapshots are kept, not
// overwritten across days, so the scorecard can read every reel at the same
// age (48 h) instead of comparing a 7-day-old reel's lifetime to a 1-day-old
// one's. See docs/growth-loop.md.
//
// Host cron (installed 2026-09-30), fetching the script from the runner's
// clone so the host copy never drifts from git:
//   30 3 * * * docker exec <runner> cat /work/repo/scripts/social-stats-pull.mjs > /root/social-stats-pull.mjs && node /root/social-stats-pull.mjs
//
// Graph API v21 metric notes (probed 2026-09-30):
//   · IG reels: views, reach, likes, comments, shares, saved, reposts,
//     total_interactions, reels_skip_rate, ig_reels_avg_watch_time (ms),
//     ig_reels_video_view_total_time (ms). `follows`/`profile_visits` are
//     rejected for REELS. IG gives no duration — the FB twin carries `length`.
//   · FB reels (/videos + /video_insights): fb_reels_total_plays,
//     blue_reels_play_count, fb_reels_replay_count, post_video_avg_time_watched
//     (ms), post_video_followers (follows attributed to the reel). The
//     total_video_* family returns empty for reels.
//   · IG account insights need since/until ≤ 30 days apart.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PG = process.env.POSTIZ_PG ?? "postgres-aaga0pmd4y7elompbck0aafl";
const STATS_DIR = process.env.STATS_DIR ?? "/data/terralore-social/status/stats";
const POSTED_KEYS = process.env.POSTED_KEYS ?? "/data/terralore-social/status/posted-keys.json";
const G = "https://graph.facebook.com/v21.0/";

// SQL goes in on stdin, so no quoting survives a shell.
const psql = (sql) =>
  execFileSync("docker", ["exec", "-i", PG, "sh", "-c", 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -F "|"'], {
    input: sql,
    encoding: "utf8",
  }).trim();

const tokens = {};
for (const row of psql(`select "providerIdentifier","internalId",token from "Integration" where "deletedAt" is null`).split("\n")) {
  const [provider, id, token] = row.split("|");
  tokens[provider] = { id, token };
}
if (!tokens.instagram || !tokens.facebook) throw new Error("instagram/facebook integration missing from Postiz");

async function get(path, token, params = {}) {
  const url = G + path + "?" + new URLSearchParams({ ...params, access_token: token });
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url);
    const body = await res.json().catch(() => ({}));
    if (res.ok) return body;
    if (res.status < 500 || attempt === 2) return { error: body.error?.message ?? `HTTP ${res.status}` };
    await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
  }
}

async function pages(path, token, params) {
  const out = [];
  let after;
  for (let i = 0; i < 10; i++) {
    const r = await get(path, token, { ...params, ...(after ? { after } : {}) });
    if (r.error) throw new Error(`${path}: ${r.error}`);
    out.push(...(r.data ?? []));
    after = r.paging?.cursors?.after;
    if (!r.paging?.next || !after) break;
  }
  return out;
}

/** Insights for one object: one batched call, per-metric fallback if the batch is refused. */
async function insights(path, token, metrics) {
  const flat = (r) => Object.fromEntries((r.data ?? []).map((d) => [d.name, d.values?.[0]?.value ?? d.total_value?.value ?? null]));
  const all = await get(path, token, { metric: metrics.join(",") });
  if (!all.error) return flat(all);
  const out = {};
  for (const m of metrics) {
    const r = await get(path, token, { metric: m });
    if (!r.error) Object.assign(out, flat(r));
  }
  return out;
}

// Postiz post id → publisher dedupe key (date:platform:reel-N), via posted-keys.
const keyByReleaseId = new Map();
try {
  const posted = JSON.parse(readFileSync(POSTED_KEYS, "utf8"));
  const byPostiz = new Map(Object.entries(posted).filter(([k]) => /:reel-\d$/.test(k)).map(([k, v]) => [v.postizId, k]));
  if (byPostiz.size) {
    const ids = [...byPostiz.keys()].filter((id) => /^[a-z0-9]+$/.test(id)).map((id) => `'${id}'`).join(",");
    const rows = psql(`select id, "releaseId" from "Post" where id in (${ids}) and "releaseId" is not null`);
    for (const row of rows.split("\n").filter(Boolean)) {
      const [postizId, releaseId] = row.split("|");
      keyByReleaseId.set(releaseId, byPostiz.get(postizId));
    }
  }
} catch (e) {
  console.warn(`posted-keys join skipped: ${e.message}`);
}

const now = Math.floor(Date.now() / 1000);
const ig = tokens.instagram;
const fb = tokens.facebook;
const code = (text) => /terralore\.co\/country\/([A-Z]{3})/.exec(text ?? "")?.[1] ?? null;
const hook = (text) => (text ?? "").split(/\n/)[0].trim();

// ── Instagram ──
const igProfile = await get(ig.id, ig.token, { fields: "username,followers_count,media_count" });
const igDaily = {};
for (const metric of ["reach", "follower_count"]) {
  const r = await get(`${ig.id}/insights`, ig.token, { metric, period: "day", since: now - 29 * 86400, until: now });
  igDaily[metric] = r.error ? { error: r.error } : Object.fromEntries((r.data?.[0]?.values ?? []).map((v) => [v.end_time.slice(0, 10), v.value]));
}
const IG_REEL_METRICS = [
  "views", "reach", "likes", "comments", "shares", "saved", "reposts", "total_interactions",
  "reels_skip_rate", "ig_reels_avg_watch_time", "ig_reels_video_view_total_time",
];
const igMedia = await pages(`${ig.id}/media`, ig.token, {
  fields: "id,caption,media_product_type,timestamp,permalink",
  limit: 50,
});
const reels = [];
for (const m of igMedia.filter((m) => m.media_product_type === "REELS")) {
  reels.push({
    platform: "instagram",
    id: m.id,
    publishedAt: m.timestamp,
    key: keyByReleaseId.get(m.id) ?? null,
    code: code(m.caption),
    hook: hook(m.caption),
    permalink: m.permalink,
    metrics: await insights(`${m.id}/insights`, ig.token, IG_REEL_METRICS),
  });
}

// ── Facebook Page ──
const fbPage = await get(fb.id, fb.token, { fields: "name,followers_count,fan_count" });
const fbDaily = {};
for (const metric of ["page_media_view", "page_daily_follows_unique", "page_video_views"]) {
  const r = await get(`${fb.id}/insights`, fb.token, { metric, period: "day", since: now - 29 * 86400, until: now });
  fbDaily[metric] = r.error ? { error: r.error } : Object.fromEntries((r.data?.[0]?.values ?? []).map((v) => [v.end_time.slice(0, 10), v.value]));
}
const FB_REEL_METRICS = [
  "fb_reels_total_plays", "blue_reels_play_count", "fb_reels_replay_count",
  "post_video_avg_time_watched", "post_video_followers",
];
const fbVideos = await pages(`${fb.id}/videos`, fb.token, {
  fields: "id,description,created_time,length,views,post_id,permalink_url",
  limit: 50,
});
for (const v of fbVideos) {
  const post = v.post_id
    ? await get(`${fb.id}_${v.post_id}`, fb.token, {
        fields: "shares,reactions.summary(true).limit(0),comments.summary(true).limit(0)",
      })
    : {};
  reels.push({
    platform: "facebook",
    id: v.id,
    publishedAt: v.created_time,
    key: keyByReleaseId.get(v.id) ?? keyByReleaseId.get(v.post_id) ?? null,
    code: code(v.description),
    hook: hook(v.description),
    permalink: v.permalink_url ? `https://www.facebook.com${v.permalink_url}` : null,
    length: v.length ?? null,
    metrics: {
      views: v.views ?? null,
      ...(await insights(`${v.id}/video_insights`, fb.token, FB_REEL_METRICS)),
      reactions: post.reactions?.summary?.total_count ?? null,
      comments: post.comments?.summary?.total_count ?? null,
      shares: post.shares?.count ?? 0,
    },
  });
}

const snapshot = {
  pulledAt: new Date().toISOString(),
  instagram: { profile: igProfile, daily: igDaily },
  facebook: { page: fbPage, daily: fbDaily },
  reels,
};
mkdirSync(STATS_DIR, { recursive: true });
const file = join(STATS_DIR, `${snapshot.pulledAt.slice(0, 10)}.json`);
writeFileSync(file, JSON.stringify(snapshot, null, 1) + "\n");
console.log(`stats: ${reels.length} reels (${reels.filter((r) => r.key).length} keyed) → ${file}`);
