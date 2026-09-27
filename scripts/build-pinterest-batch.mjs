#!/usr/bin/env node
// ── The Pinterest batch, v2: search-shaped, map-first, built to be clicked ──
//
//   node --import ./scripts/lib/ts-alias-loader.mjs scripts/build-pinterest-batch.mjs \
//        --from 2026-09-29 [--days 30] [--out pinterest-<from>_<to>.csv] [--only <slug>]
//
// Why this exists (2026-09-27 review): batch 1 (the daily anchor + data card,
// scripts/build-pinterest-csv.mjs) earned 1,511 impressions and ONE outbound
// click in its first 60 days. The cards were text on bone, date-bound, and
// told the whole story in the image — nothing to click for. Pinterest is a
// visual search engine; the searches this corpus can answer are shaped
// "richest countries in africa", "map of europe", "<nation> history
// timeline", "who produces lithium". So every pin here is:
//
//   · titled with the phrase people type (Pinterest typeahead, 2026-09-27);
//   · a picture first — an Equal Earth choropleth or the nation's era beds;
//   · deliberately incomplete — the top five of a region, the era names of a
//     chronicle — with the full, sourced surface named on the pin itself.
//
// The honesty rules of the pages carry over unchanged: figures are the
// published ones with their vintages; regional ranks are re-counted inside
// the region and say how many nations were counted; USGS non-listing is
// never shown as zero; nothing on a pin is authored for the pin.
//
// Output: PNGs into public/social/pins/<slug>.png (served by terralore.co —
// Pinterest fetches Media URLs at upload, so they must be deployed first)
// and the bulk-upload CSV in Pinterest's column order.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { allRankings } from "@/lib/rankings";
import { allCommodities, commoditiesSource } from "@/lib/commodities";
import { allHistories } from "@/lib/histories";
import { getCountry } from "@/lib/countries";
import { formatMetric } from "@/lib/format";
import { choroColor, percentileRanks } from "@/lib/choropleth";
import { renderPng } from "./lib/social/render.mjs";
import { h, CARD, BRAND, eyebrow, signature, baseline, clamp } from "./lib/social/ui.mjs";
import { buildMap, spreadBadges, leaders, WINDOWS } from "./lib/social/pinmap.mjs";

const ROOT = process.cwd();
const ORIGIN = "https://terralore.co";
const PIN_DIR = join(ROOT, "public", "social", "pins");
const W = 1000;
const H = 1500;
const PAD = 64;

const BOARDS = {
  ranking: "World Maps & Country Rankings",
  timeline: "History Timelines by Country",
  mineral: "Mineral & Resource Maps",
};

// Three slots a day, UTC: morning, midday, evening.
const TIMES = ["08:00:00", "14:00:00", "20:00:00"];

const OUTSIDE = "#e7dfcf";
const OUTSIDE_STROKE = "#d2c6ae";
const SEA = BRAND.bone;
const CLAY = "#c88a5c";
const UMBER_DEEP = "#42301f";

/* ── editorial plan ───────────────────────────────────────────────────────── */

// Units that formatMetric leaves bare get their reading suffix here.
const SUFFIX = { fertility: " births per woman", co2PerCapita: " t per person" };

// Region label as it reads in a headline / sentence.
const REGION_WORD = {
  Africa: "Africa",
  Europe: "Europe",
  Asia: "Asia",
  "South America": "South America",
  "North America": "North America",
  World: "the World",
};
const REGION_ADJ = {
  Africa: "African",
  Europe: "European",
  Asia: "Asian",
  "South America": "South American",
  "North America": "North American",
  World: "",
};

// Each topic: the metric, the end of the table it shows, the headline as
// people search it, and the keyword stem. `{R}` = region word.
const TOPICS = {
  richest: { key: "gdpPerCapita", dir: "top", head: "Richest Countries in {R}", by: "by GDP per capita", kw: "richest countries" },
  poorest: { key: "gdpPerCapita", dir: "bottom", head: "Poorest Countries in {R}", by: "by GDP per capita (lowest first)", kw: "poorest countries" },
  economies: { key: "gdp", dir: "top", head: "Largest Economies in {R}", by: "by GDP, current US$", kw: "largest economies" },
  populous: { key: "population", dir: "top", head: "Most Populous Countries in {R}", by: "by population", kw: "most populated countries" },
  largest: { key: "landArea", dir: "top", head: "Largest Countries in {R}", by: "by land area", kw: "largest countries" },
  lifeexp: { key: "lifeExpectancy", dir: "top", head: "Highest Life Expectancy in {R}", by: "life expectancy at birth", kw: "life expectancy by country" },
  forest: { key: "forestPct", dir: "top", head: "Most Forested Countries in {R}", by: "forest area, % of land", kw: "most forested countries" },
  fertHigh: { key: "fertility", dir: "top", head: "Highest Fertility Rates in {R}", by: "births per woman", kw: "fertility rate by country" },
  fertLow: { key: "fertility", dir: "bottom", head: "Lowest Fertility Rates in {R}", by: "births per woman (lowest first)", kw: "fertility rate by country" },
  military: { key: "milExpUsd", dir: "top", head: "Biggest Military Spenders in {R}", by: "defense spending, US$", kw: "military spending by country" },
  internet: { key: "internetUsers", dir: "top", head: "Most Online Countries in {R}", by: "internet users, % of people", kw: "internet usage by country" },
  co2: { key: "co2PerCapita", dir: "top", head: "Highest CO₂ Emissions per Person in {R}", by: "tonnes of CO₂ per person", kw: "co2 emissions by country" },
  renewable: { key: "renewablePct", dir: "top", head: "Most Renewable Energy in {R}", by: "renewables, % of final energy use", kw: "renewable energy by country" },
  literacy: { key: "literacyRate", dir: "top", head: "Highest Literacy Rates in {R}", by: "adult literacy rate", kw: "literacy rate by country" },
  growth: { key: "gdpGrowth", dir: "top", head: "Fastest-Growing Economies in {R}", by: "real GDP growth, latest year", kw: "fastest growing economies" },
};

// The regional ranking pins, in publishing order (varied region and topic).
const REGION_PINS = [
  ["richest", "Africa"], ["populous", "Asia"], ["largest", "Europe"], ["economies", "South America"],
  ["lifeexp", "Europe"], ["poorest", "Africa"], ["forest", "South America"], ["richest", "Europe"],
  ["fertHigh", "Africa"], ["economies", "Asia"], ["largest", "Africa"], ["richest", "Asia"],
  ["military", "Europe"], ["populous", "Africa"], ["fertLow", "Europe"], ["richest", "South America"],
  ["internet", "Africa"], ["lifeexp", "Asia"], ["co2", "Asia"], ["largest", "Asia"],
  ["economies", "Africa"], ["renewable", "Europe"], ["poorest", "Asia"], ["richest", "North America"],
  ["literacy", "Africa"], ["forest", "Europe"], ["growth", "Africa"], ["populous", "Europe"],
  ["economies", "Europe"], ["lifeexp", "Africa"], ["military", "Asia"], ["largest", "South America"],
  ["renewable", "Africa"], ["fertLow", "Asia"], ["co2", "Europe"], ["populous", "South America"],
  ["forest", "Africa"], ["growth", "Asia"], ["literacy", "Asia"], ["poorest", "Europe"],
];

const WORLD_PINS = [
  "richest", "populous", "largest", "poorest", "economies", "lifeexp", "forest", "fertHigh", "military", "renewable",
];

// Nations for the timeline pins, by Pinterest search demand ("<nation>
// history", "history of <nation>") — only those with a published chronicle
// are used.
const TIMELINE_ORDER = [
  "IND", "EGY", "JPN", "MEX", "PAK", "PHL", "CHN", "FRA", "NGA", "USA", "DEU", "ITA", "TUR", "IRN", "GBR",
  "ESP", "GRC", "KOR", "BGD", "IDN", "VNM", "BRA", "RUS", "ETH", "MAR", "NPL", "MYS", "ZAF", "KEN", "PER",
  "POL", "ARG", "IRQ", "SAU", "AFG", "COL", "CAN", "UKR", "THA", "LKA",
];

/* ── shared pieces ───────────────────────────────────────────────────────── */

const fmt = (v, r) => `${formatMetric(v, r.unit)}${SUFFIX[r.key] ?? ""}`;

function headline(text, size) {
  return h(
    "div",
    {
      style: {
        display: "flex",
        fontFamily: "Bricolage",
        fontWeight: 800,
        textTransform: "uppercase",
        fontSize: size,
        lineHeight: 1.0,
        letterSpacing: -1,
        color: CARD.chalkHi,
      },
    },
    text,
  );
}

/** The click line: what the pin leaves out, and exactly where it is. */
function teaser(line, path) {
  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: `22px ${PAD}px`,
        background: BRAND.basalt,
      },
    },
    h("div", { style: { display: "flex", fontFamily: "Bricolage", fontWeight: 800, fontSize: 36, color: BRAND.bone } }, line),
    h("div", { style: { display: "flex", fontFamily: "mono", fontSize: 25, color: "#e0a47f" } }, `terralore.co${path}`),
  );
}

function footer(sourceText, seed) {
  return h(
    "div",
    { style: { display: "flex", flexDirection: "column" } },
    h(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `18px ${PAD}px 20px`,
        },
      },
      h(
        "div",
        { style: { display: "flex", maxWidth: 560, fontFamily: "mono", fontSize: 19, lineHeight: 1.35, color: CARD.chalk3 } },
        sourceText,
      ),
      signature(1),
    ),
    baseline(seed),
  );
}

function badge(n, [x, y], size = 46) {
  return h(
    "div",
    {
      style: {
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: size,
        background: BRAND.basalt,
        border: `3px solid ${BRAND.bone}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Bricolage",
        fontWeight: 800,
        fontSize: size * 0.5,
        color: BRAND.bone,
      },
    },
    String(n),
  );
}

function legend(lowLabel, highLabel) {
  const stops = Array.from({ length: 9 }, (_, i) => choroColor(i / 8));
  return h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: 12, fontFamily: "mono", fontSize: 18, color: CARD.chalk3 } },
    h("span", {}, lowLabel),
    h(
      "div",
      { style: { display: "flex" } },
      stops.map((c) => h("div", { style: { width: 22, height: 12, background: c } })),
    ),
    h("span", {}, highLabel),
  );
}

function frame(children) {
  return h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: CARD.ground,
        color: CARD.chalk2,
      },
    },
    ...children,
  );
}

/** A competition re-rank inside a subset (ties share a rank). */
function rerank(rows, dir) {
  const sorted = [...rows].sort((a, b) => (dir === "top" ? b.value - a.value : a.value - b.value));
  let prev = null;
  let rank = 0;
  return sorted.map((r, i) => {
    if (prev === null || r.value !== prev) rank = i + 1;
    prev = r.value;
    return { ...r, rank };
  });
}

const yearsOf = (rows) => {
  const ys = rows.map((r) => r.year).filter((y) => y != null);
  if (!ys.length) return "";
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  return lo === hi ? String(hi) : `${lo}–${hi}`;
};

const sourceNames = (r) => [...new Set(r.sources.map((s) => s.publisher || s.label))].join("; ");

/* ── RANKING MAP (a region or the world) ─────────────────────────────────── */

function rankingPlan(topicKey, region, rankings) {
  const topic = TOPICS[topicKey];
  const r = rankings.get(topic.key);
  if (!r) throw new Error(`no ranking for ${topic.key}`);
  const inRegion = region === "World" ? r.rows : r.rows.filter((row) => getCountry(row.code)?.continent === region);
  if (inRegion.length < 8) throw new Error(`${topicKey}/${region}: only ${inRegion.length} nations`);
  const ranked = rerank(inRegion, topic.dir);
  const top = ranked.slice(0, 5);
  const R = REGION_WORD[region];
  const head = topic.head.replace("{R}", R);
  const regionSlug = region.toLowerCase().replace(/\s+/g, "-");
  const slug = `${topicKey === "fertHigh" ? "highest-fertility" : topicKey === "fertLow" ? "lowest-fertility" : topicKey}-${regionSlug}`;
  return { kind: "ranking", slug, topicKey, topic, region, r, inRegion, ranked, top, head, path: `/rankings/${r.slug}` };
}

function rankingPin(p) {
  const { r, region, top, ranked, topic } = p;
  const MAP_H = region === "World" ? 540 : 580;
  const values = Object.fromEntries(p.inRegion.map((row) => [row.code, row.value]));
  const pct = percentileRanks(values);
  const fills = new Map([...pct].map(([code, t]) => [code, choroColor(t)]));
  const map = buildMap({
    window: region,
    width: W,
    height: MAP_H,
    fills,
    outside: OUTSIDE,
    stroke: region === "World" ? SEA : "#f4eee3",
    strokeWidth: region === "World" ? 0.6 : 1,
  });
  const pts = spreadBadges(
    top
      .map((row, i) => ({ n: i + 1, code: row.code, at: map.anchors.get(row.code) }))
      .filter((b) => b.at),
    { width: W, height: MAP_H, min: 48 },
  );
  const years = yearsOf(top);
  const counted =
    region === "World"
      ? `${ranked.length} nations`
      : `${ranked.length} ${REGION_ADJ[region]} nations`;
  const endWord = topic.dir === "top" ? "highest" : "lowest";

  const rows = top.map((row, i) =>
    h(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          height: 56,
          borderTop: i === 0 ? `2px solid ${BRAND.basalt}` : "none",
          borderBottom: `1px solid #d8ccb5`,
        },
      },
      h("div", { style: { display: "flex", width: 64, fontFamily: "Bricolage", fontWeight: 800, fontSize: 32, color: CARD.copper } }, String(row.rank)),
      h("div", { style: { display: "flex", flexGrow: 1, fontFamily: "Schibsted", fontWeight: 700, fontSize: 32, color: CARD.chalkHi } }, clamp(row.name, 26)),
      h(
        "div",
        { style: { display: "flex", alignItems: "baseline", gap: 10 } },
        h("span", { style: { fontFamily: "mono", fontSize: 29, color: CARD.chalkHi } }, fmt(row.value, r)),
        h("span", { style: { fontFamily: "mono", fontSize: 17, color: CARD.chalk3 } }, row.year ? String(row.year) : ""),
      ),
    ),
  );

  const moreLine =
    region === "World"
      ? `See all ${ranked.length} nations, ranked`
      : `Where do the other ${ranked.length - top.length} rank?`;

  return frame([
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 16, padding: `52px ${PAD}px 10px` } },
      eyebrow(`${region === "World" ? "World" : region} · ${r.label}${years ? ` · ${years}` : ""}`, { size: 21 }),
      headline(p.head, p.head.length > 34 ? 62 : 74),
      h("div", { style: { display: "flex", fontSize: 27, color: CARD.chalk2 } }, `${topic.by} · ${endWord} five of ${counted}`),
    ),
    h(
      "div",
      { style: { display: "flex", position: "relative", width: W, height: MAP_H, background: SEA } },
      map.svg,
      leaders(pts, { width: W, height: MAP_H, color: BRAND.basalt }),
      ...pts.map((b) => badge(b.n, b.at)),
    ),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", padding: `6px ${PAD}px 18px`, gap: 12 } },
      legend("LOWER", "HIGHER"),
      h("div", { style: { display: "flex", flexDirection: "column" } }, ...rows),
    ),
    h("div", { style: { display: "flex", flexGrow: 1 } }),
    teaser(moreLine, p.path),
    footer(`Source: ${sourceNames(r)}. ${region === "World" ? "Latest published year per nation." : `Ranks counted within ${region}.`}`, p.slug),
  ]);
}

function rankingText(p) {
  const { r, region, top, ranked, topic } = p;
  const years = yearsOf(top);
  const R = REGION_WORD[region];
  const three = top.slice(0, 3).map((row) => `${row.rank}. ${row.name} (${fmt(row.value, r)})`).join(", ");
  const title = clamp(`${p.head} — Map & Top 5${years && !years.includes("–") ? ` (${years})` : ""}`, 100);
  const desc = [
    `${p.head}, ${topic.by}: ${three}.`,
    `The map shades all ${ranked.length} ${region === "World" ? "nations" : `${REGION_ADJ[region]} nations`} with a published figure. See where every one ranks — with its source and year — in the full ranking on Terralore.`,
    `Source: ${sourceNames(r)}${years ? `, ${years}` : ""}.`,
  ].join(" ");
  const kwRegion = region === "World" ? "world" : R.toLowerCase();
  const keywords = [
    `${topic.kw} ${region === "World" ? "in the world" : `in ${kwRegion}`}`,
    region === "World" ? "world map" : `${kwRegion} map`,
    r.label.toLowerCase(),
    region === "World" ? "countries of the world" : `${REGION_ADJ[region].toLowerCase()} countries`,
    "geography",
    "world data",
    "infographic",
  ].join(", ");
  return { title, desc: clamp(desc, 500), keywords };
}

/* ── MINERAL MAP ─────────────────────────────────────────────────────────── */

function mineralPlan(c) {
  return { kind: "mineral", slug: `who-mines-${c.slug}`, c, path: `/commodities/${c.slug}` };
}

const pctText = (x) => `${(x * 100).toFixed(x >= 0.1 ? 0 : 1)}%`;

function mineralPin(p) {
  const { c } = p;
  const producers = c.producers.filter((x) => x.shareEstimate != null && x.shareEstimate > 0);
  const values = Object.fromEntries(producers.map((x) => [x.code, x.shareEstimate]));
  const pct = percentileRanks(values);
  const fills = new Map([...pct].map(([code, t]) => [code, choroColor(0.15 + t * 0.85)]));
  const MAP_H = 560;
  const map = buildMap({ window: "World", width: W, height: MAP_H, fills, outside: OUTSIDE, stroke: SEA, strokeWidth: 0.6 });
  const top = producers.slice(0, 5);
  const pts = spreadBadges(
    top.map((x, i) => ({ n: i + 1, code: x.code, at: map.anchors.get(x.code) })).filter((b) => b.at),
    { width: W, height: MAP_H, min: 48 },
  );
  const name = c.name.replace(/\s*\(mined\)/i, "");
  const lead = top[0];
  const rows = [
    ...top.map((x, i) => ({ n: String(i + 1), name: x.name, share: pctText(x.shareEstimate), t: formatMetric(x.estimate, "tonnes") })),
    { n: "", name: "Rest of world", share: pctText(c.restOfWorld.shareEstimate), t: formatMetric(c.restOfWorld.estimate, "tonnes") },
  ].map((row, i) =>
    h(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          height: 54,
          borderTop: i === 0 ? `2px solid ${BRAND.basalt}` : "none",
          borderBottom: "1px solid #d8ccb5",
        },
      },
      h("div", { style: { display: "flex", width: 60, fontFamily: "Bricolage", fontWeight: 800, fontSize: 30, color: CARD.copper } }, row.n),
      h("div", { style: { display: "flex", flexGrow: 1, fontFamily: "Schibsted", fontWeight: 700, fontSize: 30, color: row.n ? CARD.chalkHi : CARD.chalk3 } }, clamp(row.name, 26)),
      h("div", { style: { display: "flex", width: 120, justifyContent: "flex-end", fontFamily: "mono", fontSize: 29, color: CARD.chalkHi } }, row.share),
      h("div", { style: { display: "flex", width: 170, justifyContent: "flex-end", fontFamily: "mono", fontSize: 21, color: CARD.chalk3 } }, row.t),
    ),
  );
  return frame([
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 16, padding: `52px ${PAD}px 12px` } },
      eyebrow(`World mine production · ${c.years.estimate} estimate`, { size: 21 }),
      headline(`Who mines the world's ${name.toLowerCase()}?`, name.length > 8 ? 64 : 72),
      h(
        "div",
        { style: { display: "flex", fontSize: 28, lineHeight: 1.35, color: CARD.chalk2 } },
        `${lead.name} alone: ${pctText(lead.shareEstimate)} of the published world total of ${formatMetric(c.world.estimate, "tonnes")}.`,
      ),
    ),
    h(
      "div",
      { style: { display: "flex", position: "relative", width: W, height: MAP_H, background: SEA } },
      map.svg,
      leaders(pts, { width: W, height: MAP_H, color: BRAND.basalt }),
      ...pts.map((b) => badge(b.n, b.at)),
    ),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", padding: `4px ${PAD}px 12px`, gap: 10 } },
      h(
        "div",
        { style: { display: "flex", fontFamily: "mono", fontSize: 18, color: CARD.chalk3 } },
        "Unshaded: not listed by USGS — which is not the same as producing none.",
      ),
      h("div", { style: { display: "flex", flexDirection: "column" } }, ...rows),
    ),
    h("div", { style: { display: "flex", flexGrow: 1 } }),
    teaser(`All ${c.producers.length} listed producers, year by year`, p.path),
    footer(`Source: U.S. Geological Survey, Mineral Commodity Summaries. Shares of the published world total.`, p.slug),
  ]);
}

function mineralText(p) {
  const { c } = p;
  const name = c.name.replace(/\s*\(mined\)/i, "");
  const lower = name.toLowerCase();
  const top3 = c.producers.slice(0, 3).map((x) => `${x.name} ${pctText(x.shareEstimate)}`).join(", ");
  const title = clamp(`Who Mines the World's ${name}? ${name} Production by Country (Map, ${c.years.estimate})`, 100);
  const desc = [
    `Where does the world's ${lower} come from? World mine production was ${formatMetric(c.world.estimate, "tonnes")} in ${c.years.estimate} (estimate).`,
    `The three largest producers: ${top3} — together ${pctText(c.topThreeShare)} of the published total.`,
    `See every listed producer, with year-on-year figures and the rest-of-world share, on Terralore.`,
    `Source: U.S. Geological Survey, Mineral Commodity Summaries.`,
  ].join(" ");
  const keywords = [`${lower} production by country`, `${lower} map`, `where does ${lower} come from`, "mining", "minerals", "world map", "geography"].join(", ");
  return { title, desc: clamp(desc, 500), keywords };
}

/* ── HISTORY TIMELINE ────────────────────────────────────────────────────── */

const BEDS = ["#e2d3b8", "#d6b48f", CLAY, "#8f6043", BRAND.umber, UMBER_DEEP, BRAND.basalt];

function timelinePlan(hist) {
  return { kind: "timeline", slug: `${hist.code.toLowerCase()}-history-timeline`, hist, path: `/country/${hist.code}/chronicle` };
}

function splitTitle(t) {
  const i = t.indexOf(":");
  return i > 0 ? [t.slice(0, i).trim(), t.slice(i + 1).trim()] : [t, ""];
}

function timelinePin(p) {
  const { hist } = p;
  const meta = getCountry(hist.code);
  const eras = [...hist.eras].reverse(); // newest on top: depth is time
  const n = eras.length;
  const events = hist.eras.reduce((a, e) => a + e.events.length, 0);
  const bedsFor = BEDS.slice(BEDS.length - n); // the deepest bed is always the darkest
  const win = WINDOWS[meta?.continent] ? meta.continent : "World";
  const loc = buildMap({
    window: win,
    width: 300,
    height: 250,
    fills: new Map([[hist.code, CARD.copper]]),
    outside: OUTSIDE,
    stroke: "#f4eee3",
    strokeWidth: 0.6,
  });
  const BED_H = Math.floor(900 / n);
  const nameSize = hist.name.length > 13 ? 60 : hist.name.length > 9 ? 76 : 92;

  const beds = eras.map((era, i) => {
    const bg = bedsFor[i];
    const dark = i >= n - 3 && n >= 4 ? true : bg === BRAND.basalt || bg === UMBER_DEEP || bg === BRAND.umber || bg === "#8f6043";
    const ink = dark ? BRAND.bone : BRAND.basalt;
    const sub = dark ? "#e6d6bf" : UMBER_DEEP;
    const [main, rest] = splitTitle(era.title);
    return h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 6,
          height: BED_H,
          padding: `0 ${PAD}px`,
          background: bg,
          borderTop: `2px solid ${BRAND.basalt}`,
        },
      },
      h("div", { style: { display: "flex", fontFamily: "mono", fontSize: 23, color: sub } }, era.period),
      h(
        "div",
        { style: { display: "flex", fontFamily: "Bricolage", fontWeight: 800, fontSize: main.length > 44 ? 29 : main.length > 34 ? 32 : 38, lineHeight: 1.05, color: ink } },
        clamp(main, 64),
      ),
      rest
        ? h("div", { style: { display: "flex", fontSize: 23, color: sub } }, clamp(rest, 62))
        : null,
    );
  });

  return frame([
    h(
      "div",
      { style: { display: "flex", justifyContent: "space-between", padding: `48px ${PAD}px 20px`, height: 330 } },
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 14, maxWidth: 560 } },
        eyebrow(`History timeline · ${n} eras`, { size: 21 }),
        headline(hist.name, nameSize),
        h("div", { style: { display: "flex", fontSize: 26, lineHeight: 1.35, color: CARD.chalk2 } }, clamp(hist.tagline || "", 124)),
      ),
      h("div", { style: { display: "flex", width: 300, height: 250, background: SEA, marginRight: -24 } }, loc.svg),
    ),
    h(
      "div",
      { style: { display: "flex", justifyContent: "space-between", padding: `0 ${PAD}px 8px`, fontFamily: "mono", fontSize: 18, color: CARD.chalk3 } },
      h("span", {}, "TODAY"),
      h("span", {}, "READ DOWN: OLDER"),
    ),
    h("div", { style: { display: "flex", flexDirection: "column" } }, ...beds),
    h("div", { style: { display: "flex", flexGrow: 1, background: BRAND.basalt } }),
    h("div", { style: { display: "flex", height: 6, background: CARD.copper } }),
    teaser(`Read all ${events} dated events, each sourced`, p.path),
    footer(`${hist.sources.length} cited sources`, p.slug),
  ]);
}

function timelineText(p) {
  const { hist } = p;
  const eras = hist.eras;
  const events = eras.reduce((a, e) => a + e.events.length, 0);
  const name = hist.name;
  const first = splitTitle(eras[0].title)[0].replace(/^The\s+/, "the ");
  const title = clamp(`${name} History Timeline: ${eras.length} Eras, from ${first} to Today`, 100);
  const tail = `Read the full chronicle — ${events} dated events and key figures, every one traced to its source (${hist.sources.length} references) — on Terralore.`;
  const intro = `The history of ${name} in ${eras.length} eras:`;
  const withPeriods = `${intro} ${eras.map((e) => `${splitTitle(e.title)[0]} (${e.period})`).join("; ")}. ${tail}`;
  const namesOnly = `${intro} ${eras.map((e) => splitTitle(e.title)[0]).join("; ")}. ${tail}`;
  const desc = withPeriods.length <= 500 ? withPeriods : namesOnly;
  const lower = name.toLowerCase();
  const keywords = [`${lower} history timeline`, `history of ${lower}`, `${lower} history`, "world history", "history timeline", "history facts"].join(", ");
  return { title, desc: clamp(desc, 500), keywords };
}

/* ── the batch ───────────────────────────────────────────────────────────── */

const argv = process.argv.slice(2);
const arg = (name, dflt) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : dflt;
};
const from = arg("--from");
if (!/^\d{4}-\d{2}-\d{2}$/.test(from ?? "")) throw new Error("usage: --from YYYY-MM-DD [--days N] [--out file.csv] [--only slug]");
const days = Number(arg("--days", "30"));
const only = arg("--only", null);
const csvOnly = argv.includes("--csv-only");

const rankings = new Map(allRankings().map((r) => [r.key, r]));
const histories = new Map(allHistories().map((x) => [x.code, x]));
const timelineCodes = TIMELINE_ORDER.filter((c) => histories.has(c));
const commodities = allCommodities();

const regionPlans = REGION_PINS.map(([t, reg]) => rankingPlan(t, reg, rankings));
const worldPlans = WORLD_PINS.map((t) => rankingPlan(t, "World", rankings));
const mineralPlans = commodities.map(mineralPlan);
const timelinePlans = timelineCodes.map((c) => timelinePlan(histories.get(c)));

// Day d: slot 0 a timeline, slot 1 a regional map, slot 2 rotates
// world map → mineral map → regional map.
const schedule = [];
const q = { region: [...regionPlans], world: [...worldPlans], mineral: [...mineralPlans], timeline: [...timelinePlans] };
const take = (k, ...fallbacks) => {
  for (const key of [k, ...fallbacks]) if (q[key].length) return q[key].shift();
  throw new Error("ran out of pins");
};
const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
for (let d = 0; d < days; d += 1) {
  const date = addDays(from, d);
  const third = ["world", "mineral", "region"][d % 3];
  const picks = [take("timeline", "region"), take("region", "world"), take(third, "region", "world", "mineral")];
  picks.forEach((p, s) => schedule.push({ ...p, at: `${date}T${TIMES[s]}` }));
}
const to = addDays(from, days - 1);

mkdirSync(PIN_DIR, { recursive: true });
const seen = new Set();
const rows = [];
for (const p of schedule) {
  if (seen.has(p.slug)) throw new Error(`duplicate pin slug ${p.slug}`);
  seen.add(p.slug);
  const [el, text, board] =
    p.kind === "ranking"
      ? [rankingPin(p), rankingText(p), BOARDS.ranking]
      : p.kind === "mineral"
        ? [mineralPin(p), mineralText(p), BOARDS.mineral]
        : [timelinePin(p), timelineText(p), BOARDS.timeline];
  if (!csvOnly && (!only || only.split(",").includes(p.slug))) {
    const png = await renderPng(el, { width: W, height: H });
    writeFileSync(join(PIN_DIR, `${p.slug}.png`), png);
    process.stdout.write(`  ${p.at}  ${p.slug}  (${Math.round(png.length / 1024)} KB)\n`);
  }
  if (text.title.length > 100 || text.desc.length > 500) throw new Error(`${p.slug}: text over Pinterest limits`);
  rows.push([text.title, `${ORIGIN}/social/pins/${p.slug}.png`, board, "", text.desc, `${ORIGIN}${p.path}`, p.at, text.keywords]);
}

const titles = new Set(rows.map((r) => r[0]));
if (titles.size !== rows.length) throw new Error("duplicate titles — Pinterest rejects them");

const csvField = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const HEADERS = ["Title", "Media URL", "Pinterest board", "Thumbnail", "Description", "Link", "Publish date", "Keywords"];
const out = arg("--out", join(ROOT, `pinterest-${from}_${to}.csv`));
writeFileSync(out, [HEADERS, ...rows].map((r) => r.map(csvField).join(",")).join("\n") + "\n");
console.log(`\n${rows.length} pins, ${from} → ${to} → ${out}`);
