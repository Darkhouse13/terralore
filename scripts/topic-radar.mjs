#!/usr/bin/env node
// ── The topic radar: which nation, which story, right now ──────────────────
// The growth loop's input (docs/growth-loop.md). A reel wins when a HOT topic
// meets a reel good enough to be watched to the end and sent to a compatriot.
// The corpus says what we can tell truthfully; the radar says what people want
// to know. Three layers, cheapest first:
//
//   1. HEAT (free) — Wikipedia pageviews. Every nation's article, daily, in
//      the trailing 45 days: spike = mean of the last 2 days ÷ median of the
//      28 days before. Plus the daily top-read lists (several languages) for
//      articles that NAME a nation (elections, disasters, anniversaries…) —
//      the news hook, i.e. why the nation is hot.
//   2. CHATTER (monid, ~$0.0015/call) — the hot feed of the map/geography/
//      history subreddits: the questions the audience is asking this week.
//   3. PROOF (monid, ~$0.0015 TikTok + ~$0.0015 YouTube Shorts per query) —
//      has this topic ALREADY gone viral in short form? The best predictor we
//      have: "Why Cyprus is divided" had 2.5M TikTok / 4.3M Shorts views
//      before our Cyprus reel became our best. Probed for the top candidates
//      only, cached 14 days, hard-capped by --budget.
//
// Then FIT: the nation has an authored, sourced history in the corpus, and
// was not reeled in the trailing 30 days (reel codes come from the latest
// stats snapshot, scripts/social-stats-pull.mjs).
//
//   node scripts/topic-radar.mjs [--budget 0.05] [--top 8] [--probe "query" …]
//                                [--evergreen] [--no-paid]
//
//   --probe      also prove specific story queries ("why is chile so long")
//   --evergreen  prove EVERY corpus nation ("<name> history") — the standing
//                demand map; ~$0.003 × 184 ≈ $0.55, cached for 14 days
//   --no-paid    free layers only
//
// Writes social-out/radar/<date>.md (+ .json). The radar ranks; it never
// writes an angle — the angle is editorial and must be sourced (the reel skill).

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i < 0 ? dflt : args[i + 1];
};
const probes = args.flatMap((a, i) => (a === "--probe" ? [args[i + 1]] : []));
const BUDGET = Number(opt("budget", 0.05));
const TOP = Number(opt("top", 8));
const PAID = !args.includes("--no-paid");
const EVERGREEN = args.includes("--evergreen");

const OUT = "social-out/radar";
const CACHE = join(OUT, "cache");
mkdirSync(CACHE, { recursive: true });
const UA = "terralore-radar/0.1 (https://terralore.co; contact via site)";
const today = new Date().toISOString().slice(0, 10);
const day = (offset) => {
  const d = new Date(Date.now() + offset * 86_400_000);
  return d.toISOString().slice(0, 10).replaceAll("-", "");
};

let failures = 0;
async function getJson(url, init = {}) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { ...init, headers: { "User-Agent": UA, ...(init.headers ?? {}) } });
    if (res.ok) return res.json();
    if (res.status === 404) return null;
    await new Promise((r) => setTimeout(r, (res.status === 429 ? 5000 : 1500) * (attempt + 1)));
  }
  failures++;
  return null;
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k], k);
      }
    }),
  );
  return out;
}

/* ── the nations ─────────────────────────────────────────────────────────── */

const countries = JSON.parse(readFileSync("data/countries.json", "utf8"));
const registry = readFileSync("lib/histories/index.ts", "utf8");
const inCorpus = new Set([...registry.matchAll(/^\s{2}([A-Z]{3}):/gm)].map((m) => m[1]));

// Nation → English Wikipedia article, via Wikidata ISO 3166-1 alpha-2 (P297);
// the country name is the fallback. Cached — it changes about never.
async function wikiTitles() {
  const file = join(CACHE, "wiki-titles.json");
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  const q = `SELECT ?iso ?article WHERE { ?c wdt:P297 ?iso . ?article schema:about ?c ; schema:isPartOf <https://en.wikipedia.org/> . }`;
  const r = await getJson(`https://query.wikidata.org/sparql?query=${encodeURIComponent(q)}`, {
    headers: { Accept: "application/sparql-results+json" },
  });
  const byIso = new Map((r?.results?.bindings ?? []).map((b) => [b.iso.value, decodeURIComponent(b.article.value.split("/wiki/")[1])]));
  const titles = {};
  for (const c of Object.values(countries)) titles[c.code] = byIso.get(c.iso2) ?? c.name.replaceAll(" ", "_");
  writeFileSync(file, JSON.stringify(titles, null, 1));
  return titles;
}

/* ── layer 1: heat ───────────────────────────────────────────────────────── */

const median = (xs) => {
  const v = [...xs].sort((a, b) => a - b);
  return v.length ? (v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2) : 0;
};

async function heat(titles) {
  const start = day(-45);
  const end = day(-1);
  const rows = await pool(Object.entries(titles), 4, async ([code, title]) => {
    const r = await getJson(
      `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${encodeURIComponent(title)}/daily/${start}/${end}`,
    );
    const series = (r?.items ?? []).map((i) => i.views);
    if (series.length < 10) return { code, title, recent: 0, base: 0, spike: 0 };
    const recent = (series.at(-1) + series.at(-2)) / 2;
    const base = median(series.slice(-30, -2)) || 1;
    return { code, title, recent, base, spike: recent / base };
  });
  return new Map(rows.map((r) => [r.code, r]));
}

// Articles on the daily top-read lists that name a nation — the "why now".
// Names match in en/fr/es/de/pt only where the spelling survives translation
// (Iran, Cuba…); that is enough for a signal. Only EVENT articles count — a
// year-titled article ("2026 Iran war") or one carrying an event word —
// so a TV series, a person called Jordan or a broadcaster never reads as news.
const LANGS = ["en", "fr", "es", "de", "pt"];
const EVENT = new RegExp(
  "(^|_)(1\\d{3}|20\\d{2})_|" +
    ["war", "election", "referendum", "crisis", "coup", "protests?", "invasion", "conflict", "earthquake", "flood", "attack",
     "independence", "treaty", "border", "dispute", "annexation", "partition", "revolution", "genocide", "massacre", "siege",
     "summit", "sanctions", "ceasefire", "occupation", "blockade", "assassination", "uprising", "civil_war", "famine",
     "guerre", "élection", "crise", "attentat", "séisme", "guerra", "elecci", "elei", "golpe", "terremoto", "krieg", "wahl",
     "krise", "überfall", "anschlag", "erdbeben"].map((w) => `(^|_)${w}`).join("|"),
  "i",
);
const NOISE = /(^|_)(Deaths_in|List_of|Main_Page|Special:|Wikipedia:|Portal:|Cleopatra_\(film\))|film\)|TV_series|season\)|_national_.*_team|football|cricket|_Cup|_Games|Olympic|Grand_Prix|_League|Championship|album\)|song\)|\(band\)|\.xxx|\.xyz/i;

async function hooks() {
  const needles = Object.values(countries).flatMap((c) =>
    [c.name, c.demonym].filter((s) => s && s.length > 3).map((s) => ({ code: c.code, re: new RegExp(`(^|[_ (])${s.replaceAll(" ", "_")}($|[_ ,)])`, "i") })),
  );
  const found = [];
  for (const lang of LANGS) {
    for (const off of [-1, -2, -3]) {
      const d = day(off);
      const r = await getJson(
        `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/${lang}.wikipedia/all-access/${d.slice(0, 4)}/${d.slice(4, 6)}/${d.slice(6)}`,
      );
      for (const a of r?.items?.[0]?.articles?.slice(0, 300) ?? []) {
        if (NOISE.test(a.article) || !EVENT.test(a.article)) continue;
        const hit = needles.find((n) => n.re.test(a.article));
        if (!hit) continue;
        if (a.article.replaceAll("_", " ").toLowerCase() === countries[hit.code].name.toLowerCase()) continue;
        found.push({ code: hit.code, lang, date: d, article: a.article.replaceAll("_", " "), views: a.views });
      }
    }
  }
  // One line per (lang, article), with its best day.
  const best = new Map();
  for (const h of found) {
    const k = `${h.lang}:${h.article}`;
    if (!best.has(k) || best.get(k).views < h.views) best.set(k, h);
  }
  return [...best.values()].sort((a, b) => b.views - a.views);
}

/* ── monid (layers 2 and 3) ──────────────────────────────────────────────── */

let spent = 0;
const PRICE = 0.0015;

function monid(endpoint, query, cacheKey, maxAgeDays = 14) {
  const file = join(CACHE, `${cacheKey.replace(/[^a-z0-9]+/gi, "_").slice(0, 80)}.json`);
  if (existsSync(file)) {
    const c = JSON.parse(readFileSync(file, "utf8"));
    if (Date.now() - Date.parse(c.at) < maxAgeDays * 86_400_000) return c.data;
  }
  if (!PAID || spent + PRICE > BUDGET + 1e-9) return null;
  const tmp = `${file}.raw`;
  try {
    execFileSync("monid", ["run", "-p", "tikhub", "-e", endpoint, "--query", JSON.stringify(query), "-w", "120", "-o", tmp, "-j"], {
      stdio: ["ignore", "ignore", "pipe"],
    });
  } catch (e) {
    console.warn(`monid ${endpoint} failed: ${String(e.stderr ?? e.message).slice(0, 200)}`);
    return null;
  }
  spent += PRICE;
  const data = JSON.parse(readFileSync(tmp, "utf8"));
  execFileSync("rm", ["-f", tmp]);
  const kept = slim(endpoint, data);
  // An empty answer is a failed answer: paid for, but never cached.
  if (kept?.items?.length) writeFileSync(file, JSON.stringify({ at: new Date().toISOString(), data: kept }));
  else console.warn(`monid ${endpoint}: empty result for ${cacheKey}`);
  return kept;
}

// Keep only what the radar reads — raw responses run to megabytes.
function slim(endpoint, data) {
  if (data?.items) return data; // already slim (cache)
  if (endpoint.includes("tiktok")) {
    return {
      items: (data.search_item_list ?? [])
        .map((x) => x.aweme_info)
        .filter(Boolean)
        .map((a) => ({
          views: a.statistics?.play_count ?? 0,
          shares: a.statistics?.share_count ?? 0,
          date: a.create_time ? new Date(a.create_time * 1000).toISOString().slice(0, 10) : null,
          by: a.author?.unique_id ?? "",
          title: (a.desc ?? "").slice(0, 120),
        })),
    };
  }
  if (endpoint.includes("youtube")) {
    const items = [];
    const walk = (o) => {
      if (!o || typeof o !== "object") return;
      if (o.shortsLockupViewModel) {
        const t = o.shortsLockupViewModel.accessibilityText ?? "";
        const m = /^(.*), ([\d.,]+)\s*(thousand|million|billion)? views/i.exec(t);
        if (m) {
          const mult = { thousand: 1e3, million: 1e6, billion: 1e9 }[m[3]?.toLowerCase()] ?? 1;
          items.push({ views: Math.round(parseFloat(m[2].replaceAll(",", "")) * mult), title: m[1].slice(0, 120), date: null, by: "" });
        }
        return;
      }
      for (const v of Object.values(o)) walk(v);
    };
    walk(data);
    return { items };
  }
  if (endpoint.includes("reddit")) {
    // Each post is an edge whose cells split the title and the score apart.
    const items = [];
    for (const e of data?.subredditfeed?.subredditV3?.elements?.edges ?? []) {
      const cells = e?.node?.cells ?? [];
      const title = cells.find((c) => typeof c?.title === "string")?.title;
      if (!title) continue;
      items.push({
        title: title.slice(0, 160),
        score: cells.find((c) => c?.score != null)?.score ?? 0,
        comments: cells.find((c) => c?.commentCount != null)?.commentCount ?? 0,
      });
    }
    return { items };
  }
  return data;
}

/** Short-form proof for one query: TikTok + YouTube Shorts. */
function proof(query) {
  const tt = monid("/api/v1/tiktok/app/v3/fetch_video_search_result", { keyword: query, count: 20 }, `tt-${query}`);
  const yt = monid("/api/v1/youtube/web_v2/get_shorts_search", { search_query: query }, `yt-${query}`);
  if (!tt && !yt) return null;
  const all = [...(tt?.items ?? []).map((x) => ({ ...x, src: "TikTok" })), ...(yt?.items ?? []).map((x) => ({ ...x, src: "Shorts" }))];
  const top = [...all].sort((a, b) => b.views - a.views);
  const views = top.slice(0, 10).map((x) => x.views);
  return {
    query,
    max: top[0]?.views ?? 0,
    median10: median(views),
    over100k: all.filter((x) => x.views >= 1e5).length,
    over1m: all.filter((x) => x.views >= 1e6).length,
    recentViral: all.filter((x) => x.views >= 1e5 && x.date && x.date >= new Date(Date.now() - 60 * 86_400_000).toISOString().slice(0, 10)).length,
    best: top.slice(0, 3).map((x) => ({ src: x.src, views: x.views, title: x.title, by: x.by, date: x.date })),
  };
}

/* ── fit: what we reeled lately ──────────────────────────────────────────── */

function lastReeled() {
  const dir = "social-out/stats";
  const last = new Map();
  if (!existsSync(dir)) return last;
  const files = readdirSync(dir).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  if (!files.length) return last;
  const snap = JSON.parse(readFileSync(join(dir, files.at(-1)), "utf8"));
  for (const r of snap.reels) {
    if (!r.code) continue;
    const d = r.publishedAt.slice(0, 10);
    if (!last.has(r.code) || last.get(r.code) < d) last.set(r.code, d);
  }
  return last;
}

/* ── run ─────────────────────────────────────────────────────────────────── */

const titles = await wikiTitles();
if (failures) console.warn(`radar: ${failures} Wikipedia requests failed`);
console.error("radar: heat (Wikipedia pageviews, 186 nations)…");
const heatBy = await heat(titles);
console.error("radar: hooks (top-read, 6 languages × 3 days)…");
const hookList = await hooks();
if (failures) console.error(`radar: ${failures} Wikipedia request(s) failed after retries — heat may read 0 for those nations`);
const hooksBy = new Map();
for (const h of hookList) (hooksBy.get(h.code) ?? hooksBy.set(h.code, []).get(h.code)).push(h);
const reeled = lastReeled();
const daysSince = (d) => (d ? Math.round((Date.parse(today) - Date.parse(d)) / 86_400_000) : null);

// Candidate score before proof: heat and hooks, gated by fit.
const cands = Object.values(countries).map((c) => {
  const h = heatBy.get(c.code) ?? { spike: 0, recent: 0 };
  const hk = hooksBy.get(c.code) ?? [];
  const hookViews = hk.reduce((a, x) => a + x.views, 0);
  const since = daysSince(reeled.get(c.code));
  const heatScore = Math.min(Math.max(Math.log2(h.spike || 1), 0), 3) / 3; // 1× → 0, 8× → 1
  const levelScore = Math.min(Math.log10((h.recent || 1) / 1000) / 2, 1); // 1k/day → 0, 100k → 1
  const hookScore = Math.min(Math.log10(hookViews + 1) / 6, 1);
  return {
    code: c.code,
    name: c.name,
    corpus: inCorpus.has(c.code),
    spike: h.spike,
    recent: h.recent,
    hooks: hk.slice(0, 4),
    reeledDaysAgo: since,
    pre: 0.45 * heatScore + 0.2 * Math.max(levelScore, 0) + 0.35 * hookScore,
  };
});
const eligible = (c) => c.corpus && (c.reeledDaysAgo == null || c.reeledDaysAgo > 30);
const ranked = cands.filter(eligible).sort((a, b) => b.pre - a.pre);

// Reddit chatter.
const SUBS = ["MapPorn", "geography", "history", "europe"];
const chatter = [];
for (const sub of SUBS) {
  const r = monid("/api/v1/reddit/app/fetch_subreddit_feed", { subreddit_name: sub, sort: "HOT", need_format: true }, `rd-${sub}-${today}`, 1);
  for (const p of (r?.items ?? []).filter((p) => p.score >= 20)) {
    const hit = Object.values(countries).find((c) => new RegExp(`\\b(${c.name}|${c.demonym})\\b`, "i").test(p.title));
    chatter.push({ sub, ...p, code: hit?.code ?? null });
  }
}

// Proof for the top candidates, the explicit probes, and (optionally) everything.
const proofQueue = [
  ...probes.map((q) => ({ q, code: null })),
  ...ranked.slice(0, TOP).map((c) => ({ q: `${c.name} history`, code: c.code })),
  ...(EVERGREEN ? cands.filter((c) => c.corpus).map((c) => ({ q: `${c.name} history`, code: c.code })) : []),
];
const proofs = new Map();
for (const { q } of proofQueue) if (!proofs.has(q)) proofs.set(q, proof(q));

for (const c of cands) {
  const p = proofs.get(`${c.name} history`);
  c.proof = p ?? null;
  const proofScore = p ? Math.min(Math.max(Math.log10(p.median10 + 1) - 3, 0) / 3, 1) : null; // 1k → 0, 1M → 1
  c.score = Math.round(100 * (proofScore == null ? c.pre : 0.55 * c.pre + 0.45 * proofScore));
}
ranked.sort((a, b) => b.score - a.score);

/* ── report ──────────────────────────────────────────────────────────────── */

const k = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : `${Math.round(n)}`);
const L = [];
L.push(`# Topic radar — ${today}`, "");
L.push(
  `Heat = English Wikipedia pageviews, last 2 days vs the 28-day median. Hooks = top-read articles (${LANGS.join("/")}, last 3 days) naming the nation. ` +
    `Proof = TikTok + YouTube Shorts search for "<nation> history" (top-10 median views; count ≥100k). ` +
    `Only nations with an authored history, not reeled in 30 days. monid spend this run: $${spent.toFixed(4)}.`,
  "",
);
L.push("## Hot now", "", "| # | Score | Nation | Heat | Views/day | Why now (top-read) | Short-form proof | Last reel |", "|---|---|---|---|---|---|---|---|");
ranked.slice(0, 20).forEach((c, i) => {
  const why = c.hooks.map((h) => `${h.article} (${h.lang}, ${k(h.views)})`).join("; ") || "—";
  const pr = c.proof ? `median ${k(c.proof.median10)}, ${c.proof.over100k}×≥100k, max ${k(c.proof.max)}` : "—";
  L.push(`| ${i + 1} | ${c.score} | ${c.name} (${c.code}) | ${c.spike.toFixed(1)}× | ${k(c.recent)} | ${why.replaceAll("|", "/")} | ${pr} | ${c.reeledDaysAgo == null ? "never" : `${c.reeledDaysAgo}d`} |`);
});

L.push("", "## What already went viral (learn the hook, never copy it)", "");
const showcase = new Set([...probes, ...ranked.slice(0, TOP).map((c) => `${c.name} history`)]);
for (const [q, p] of proofs) {
  if (!p || !p.best.length || !showcase.has(q)) continue;
  L.push(`**${q}** — ${p.over1m} over 1M, ${p.over100k} over 100k, ${p.recentViral} viral in the last 60 days`);
  for (const b of p.best) L.push(`- ${b.src} ${k(b.views)}${b.date ? ` · ${b.date}` : ""}${b.by ? ` · @${b.by}` : ""} — ${b.title.replace(/\s+/g, " ")}`);
  L.push("");
}

L.push("## News hooks outside the corpus or reeled recently", "");
const other = cands.filter((c) => !eligible(c) && c.hooks.length).sort((a, b) => b.pre - a.pre).slice(0, 10);
for (const c of other) {
  L.push(`- ${c.name} (${c.code}) — ${c.corpus ? `reeled ${c.reeledDaysAgo}d ago` : "no authored history yet"}: ${c.hooks.map((h) => `${h.article} (${h.lang}, ${k(h.views)})`).join("; ")}`);
}

// The standing demand map: every corpus nation whose proof is on hand (the
// --evergreen run, cached 14 days), best short-form audience first.
const standing = cands.filter((c) => c.corpus && c.proof).sort((a, b) => b.proof.median10 - a.proof.median10);
if (standing.length >= 20) {
  L.push("", "## Evergreen demand (short-form audience for \"<nation> history\")", "");
  L.push("| # | Nation | Top-10 median | ≥1M | ≥100k | Viral in 60 d | Last reel |", "|---|---|---|---|---|---|---|");
  standing.forEach((c, i) =>
    L.push(`| ${i + 1} | ${c.name} (${c.code}) | ${k(c.proof.median10)} | ${c.proof.over1m} | ${c.proof.over100k} | ${c.proof.recentViral} | ${c.reeledDaysAgo == null ? "never" : `${c.reeledDaysAgo}d`} |`),
  );
}

if (chatter.length) {
  L.push("", "## Reddit this week (hot)", "");
  for (const p of chatter.sort((a, b) => b.score - a.score).slice(0, 20)) {
    L.push(`- r/${p.sub} · ${k(p.score)} points · ${p.comments} comments${p.code ? ` · ${p.code}` : ""} — ${p.title}`);
  }
}
L.push("");

writeFileSync(join(OUT, `${today}.md`), L.join("\n"));
writeFileSync(join(OUT, `${today}.json`), JSON.stringify({ today, spent, ranked: ranked.slice(0, 40), hooks: hookList.slice(0, 60), chatter, proofs: Object.fromEntries(proofs) }, null, 1));
console.log(L.join("\n"));
console.error(`\n→ ${join(OUT, `${today}.md`)} · monid spend $${spent.toFixed(4)}`);
