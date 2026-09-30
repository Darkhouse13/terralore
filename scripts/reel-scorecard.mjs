#!/usr/bin/env node
// ── The reel scorecard: which reels earned the watch, the send, the follow ──
// Reads the nightly snapshots written by scripts/social-stats-pull.mjs (on the
// hetzner host, /data/terralore-social/status/stats/) and ranks every reel on
// the numbers the growth loop cares about (docs/growth-loop.md): not site
// clicks — Pinterest's job — but whether people watched to the end, sent it on,
// saved it, and followed.
//
//   node scripts/reel-scorecard.mjs [--fetch] [--days 21] [--age 48]
//
//   --fetch   rsync the host's snapshots into social-out/stats/ first
//   --days    only reels published in the trailing N days (default 21)
//   --age     read each reel at this age in hours (default 48): the EARLIEST
//             snapshot taken at least that long after publication. A reel
//             younger than that, or older than the first snapshot, is read
//             from the nearest snapshot and its age is shown — so a fresh
//             reel is never ranked against another's lifetime unmarked.
//
// Writes social-out/scorecard/<date>.md and prints the table.
//
// The composite is deliberately simple: the mean percentile rank (within the
// window) of five signals — IG views, IG hold, IG sends+saves per 1k reached,
// FB plays, FB follows. Hold = average watch time ÷ reel length (the length
// comes from the Facebook twin; Instagram does not expose it).

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i < 0 ? dflt : args[i + 1];
};
const DAYS = Number(flag("days", 21));
const AGE_H = Number(flag("age", 48));
const STATS = "social-out/stats";
const OUT = "social-out/scorecard";

if (args.includes("--fetch")) {
  mkdirSync(STATS, { recursive: true });
  execFileSync("rsync", ["-a", "hetzner:/data/terralore-social/status/stats/", `${STATS}/`], { stdio: "inherit" });
}
if (!existsSync(STATS)) throw new Error(`no snapshots in ${STATS} — run with --fetch`);

const snapshots = readdirSync(STATS)
  .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
  .sort()
  .map((f) => JSON.parse(readFileSync(join(STATS, f), "utf8")));
if (!snapshots.length) throw new Error("no snapshots");
const latest = snapshots.at(-1);
const today = latest.pulledAt.slice(0, 10);
const H = 3_600_000;

/** Each reel read at AGE_H (see the header), keyed by platform:id. */
function readAt(platform, id, publishedAt) {
  const pub = Date.parse(publishedAt);
  let best = null;
  for (const s of snapshots) {
    const r = s.reels.find((x) => x.platform === platform && x.id === id);
    if (!r) continue;
    const age = (Date.parse(s.pulledAt) - pub) / H;
    if (age >= AGE_H) return { ...r, ageH: age };
    best = { ...r, ageH: age };
  }
  return best;
}

const cutoff = Date.parse(latest.pulledAt) - DAYS * 24 * H;
const norm = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 60);

// Pair each Instagram reel with its Facebook twin (same caption, same day).
const rows = [];
const fbAll = latest.reels.filter((r) => r.platform === "facebook");
for (const igLatest of latest.reels.filter((r) => r.platform === "instagram")) {
  if (Date.parse(igLatest.publishedAt) < cutoff) continue;
  const ig = readAt("instagram", igLatest.id, igLatest.publishedAt);
  const twin = fbAll.find(
    (f) => norm(f.hook) === norm(igLatest.hook) && Math.abs(Date.parse(f.publishedAt) - Date.parse(igLatest.publishedAt)) < 36 * H,
  );
  const fb = twin ? readAt("facebook", twin.id, twin.publishedAt) : null;
  const len = twin?.length ?? null;
  const m = ig.metrics;
  const reach = m.reach || 0;
  const per1k = (n) => (reach ? (1000 * (n ?? 0)) / reach : null);
  rows.push({
    date: igLatest.publishedAt.slice(0, 10),
    slot: (igLatest.key ?? "").split(":").pop() || "manual",
    code: igLatest.code ?? "—",
    hook: igLatest.hook,
    ageH: Math.min(ig.ageH, fb?.ageH ?? Infinity),
    len,
    igViews: m.views ?? null,
    igReach: reach,
    igHold: len && m.ig_reels_avg_watch_time ? m.ig_reels_avg_watch_time / 1000 / len : null,
    igAvgS: m.ig_reels_avg_watch_time ? m.ig_reels_avg_watch_time / 1000 : null,
    igSkip: m.reels_skip_rate ?? null,
    igSendsSaves1k: per1k((m.shares ?? 0) + (m.saved ?? 0)),
    igShares: m.shares ?? 0,
    igSaves: m.saved ?? 0,
    igLikes: m.likes ?? 0,
    fbPlays: fb?.metrics.fb_reels_total_plays ?? fb?.metrics.views ?? null,
    fbHold: len && fb?.metrics.post_video_avg_time_watched ? fb.metrics.post_video_avg_time_watched / 1000 / len : null,
    fbFollows: fb?.metrics.post_video_followers ?? null,
    fbReactions: fb?.metrics.reactions ?? null,
    fbShares: fb?.metrics.shares ?? null,
  });
}

// Composite: mean percentile rank over the signals present.
const SIGNALS = ["igViews", "igHold", "igSendsSaves1k", "fbPlays", "fbFollows"];
for (const s of SIGNALS) {
  const vals = rows.map((r) => r[s]).filter((v) => v != null).sort((a, b) => a - b);
  for (const r of rows) {
    if (r[s] == null || vals.length < 2) continue;
    const below = vals.filter((v) => v < r[s]).length;
    const equal = vals.filter((v) => v === r[s]).length;
    (r.pct ??= {})[s] = (below + (equal - 1) / 2) / (vals.length - 1);
  }
}
for (const r of rows) {
  const p = Object.values(r.pct ?? {});
  r.score = p.length ? Math.round((100 * p.reduce((a, b) => a + b, 0)) / p.length) : null;
}
rows.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

// ── render ──
const f0 = (n) => (n == null ? "—" : Math.round(n).toLocaleString("en-US"));
const f1 = (n) => (n == null ? "—" : n.toFixed(1));
const pc = (n) => (n == null ? "—" : `${Math.round(100 * n)}%`);
const age = (h) => (h >= AGE_H && h < AGE_H + 24 ? "" : ` (${h < 48 ? `${Math.round(h)}h` : `${Math.round(h / 24)}d`})`);
const cut = (t, n) => (t.length > n ? t.slice(0, n - 1) + "…" : t);
const median = (xs) => {
  const v = xs.filter((x) => x != null).sort((a, b) => a - b);
  return v.length ? (v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2) : null;
};

const lines = [];
lines.push(`# Reel scorecard — ${today}`, "");
lines.push(
  `Reels published in the trailing ${DAYS} days, each read at ${AGE_H} h old where a snapshot allows ` +
    `(otherwise the reading's age is shown in brackets). ${snapshots.length} snapshot(s), ` +
    `${snapshots[0].pulledAt.slice(0, 10)} → ${today}. Score = mean percentile of IG views, IG hold, ` +
    `IG sends+saves per 1k reached, FB plays, FB follows.`,
  "",
);
lines.push(
  "| # | Score | Date | Slot | Nation | Hook | Len | IG views | IG hold | IG avg s | Skip | Sends+saves /1k | FB plays | FB hold | FB follows |",
  "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|",
);
rows.forEach((r, i) =>
  lines.push(
    `| ${i + 1} | ${r.score ?? "—"} | ${r.date}${age(r.ageH)} | ${r.slot} | ${r.code} | ${cut(r.hook, 70).replaceAll("|", "/")} | ${r.len ? `${Math.round(r.len)}s` : "—"} | ${f0(r.igViews)} | ${pc(r.igHold)} | ${f1(r.igAvgS)} | ${r.igSkip == null ? "—" : `${Math.round(r.igSkip)}%`} | ${f1(r.igSendsSaves1k)} | ${f0(r.fbPlays)} | ${pc(r.fbHold)} | ${f0(r.fbFollows)} |`,
  ),
);

lines.push("", "## Medians by slot", "", "| Slot | Reels | IG views | IG hold | Sends+saves /1k | FB plays |", "|---|---|---|---|---|---|");
for (const slot of [...new Set(rows.map((r) => r.slot))].sort()) {
  const g = rows.filter((r) => r.slot === slot);
  lines.push(
    `| ${slot} | ${g.length} | ${f0(median(g.map((r) => r.igViews)))} | ${pc(median(g.map((r) => r.igHold)))} | ${f1(median(g.map((r) => r.igSendsSaves1k)))} | ${f0(median(g.map((r) => r.fbPlays)))} |`,
  );
}

lines.push("", "## Audience", "");
for (const s of snapshots.slice(-14)) {
  lines.push(
    `- ${s.pulledAt.slice(0, 10)}: IG ${s.instagram.profile.followers_count ?? "?"} followers · FB ${s.facebook.page.followers_count ?? "?"} followers`,
  );
}
lines.push("");

mkdirSync(OUT, { recursive: true });
const file = join(OUT, `${today}.md`);
writeFileSync(file, lines.join("\n"));
console.log(lines.slice(0, rows.length + 6).join("\n"));
console.log(`\n→ ${file}`);
