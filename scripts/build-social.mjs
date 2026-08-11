#!/usr/bin/env node
// ── The daily social build: assets + manifest, deterministic per date ──────
// Usage (always under the alias loader — `npm run build-social -- <args>`):
//
//   scripts/build-social.mjs --date 2026-08-12
//   scripts/build-social.mjs --range 2026-08-12 2026-08-18
//   … either may add --review-sheet   (also compose a contact sheet of the
//                                      day into design-review/16-social/week/)
//
// Output: social-out/YYYY-MM-DD/ — the rendered PNGs and manifest.json, the
// machine-readable contract a downstream publisher consumes (see
// docs/social-surface.md for the consumption rules; the short form: posts
// are idempotent by dedupeKey, assets are referenced relative to the
// manifest's own directory, nothing here posts anything). social-out/ is
// gitignored: the artifact is reproducible from the repo by construction,
// because the plan is (date, committed ledger) → plan and the renders are
// satori with committed fonts.
//
// NOT part of `next build`, deliberately: the site's build must not grow a
// render farm, and the social cadence (daily) is not the deploy cadence.
//
// Each generated day is validated before it is reported: every asset is a
// real PNG at its declared size, every caption re-passes the rules the
// offline validator enforces, every target URL is a published page, and
// dedupe keys are unique. The ledger entry for the day is written back to
// data/social-ledger.json (keyed by date — regenerating a day rewrites the
// same entry; a range accumulates day by day so no-repeat windows hold
// across the batch).

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { allTwins } from "@/lib/geo";
import sitemap from "@/app/sitemap";
import { SITE_URL, abs } from "@/lib/seo";
import { planDay, ledgerEntry, parseDate, isoAddDays } from "./lib/social/calendar.mjs";
import { altText } from "./lib/social/subjects.mjs";
import {
  captionFor,
  assembleCaption,
  hashtagsFor,
  allPoolTags,
  LIMITS,
  BANNED,
  CHARSET,
  CITATION_RE,
} from "./lib/social/captions.mjs";
import { renderPng } from "./lib/social/render.mjs";
import { h, CARD, FORMATS, clamp } from "./lib/social/ui.mjs";
import {
  onThisDayCard,
  rankingCard,
  commodityCard,
  compareCard,
  rankingCarousel,
  formationCarousel,
} from "./lib/social/cards.mjs";

export const MANIFEST_SCHEMA_VERSION = 1;

const ROOT = process.cwd();
const OUT_ROOT = join(ROOT, "social-out");
const LEDGER_PATH = join(ROOT, "data/social-ledger.json");
const WEEK_DIR = join(ROOT, "design-review/16-social/week");

/* ── argument parsing ─────────────────────────────────────────────────────── */

const argv = process.argv.slice(2);
const reviewSheet = argv.includes("--review-sheet");
const args = argv.filter((x) => x !== "--review-sheet");
let dates = [];
if (args[0] === "--date" && args[1]) {
  dates = [parseDate(args[1]).iso];
} else if (args[0] === "--range" && args[1] && args[2]) {
  let iso = parseDate(args[1]).iso;
  const end = parseDate(args[2]).iso;
  if (iso > end) throw new Error(`--range start ${iso} is after end ${end}`);
  while (iso <= end) {
    dates.push(iso);
    iso = isoAddDays(iso, 1);
  }
  if (dates.length > 62) throw new Error(`--range spans ${dates.length} days — cap is 62`);
} else {
  console.error("usage: build-social.mjs --date YYYY-MM-DD | --range START END [--review-sheet]");
  process.exit(2);
}

/* ── the URL universe (same set the validator asserts against) ────────────── */

const published = new Set();
for (const e of sitemap()) published.add(e.url.replace(SITE_URL, "") || "/");
for (const t of allTwins()) {
  published.add(t.canonicalPath);
  published.add(t.path);
}

/* ── caption re-checks (the build must not trust itself) ──────────────────── */

function assertCaption(spec, text, platform, label) {
  if (text.length > LIMITS[platform].margin) {
    throw new Error(`${label}: caption ${text.length} chars > ${platform} margin ${LIMITS[platform].margin}`);
  }
  if (!CHARSET.test(text)) throw new Error(`${label}: caption has a character outside the committed charset`);
  for (const b of spec.blocks) {
    if (b.kind === "authored" && BANNED.test(b.text)) {
      throw new Error(`${label}: authored copy trips the neutrality scan ("${b.text.match(BANNED)[0]}")`);
    }
  }
  if (!CITATION_RE.test(spec.citation)) throw new Error(`${label}: citation is not the GEO template shape`);
  const tags = hashtagsFor(spec.type);
  const pool = allPoolTags();
  if (tags.length > 5) throw new Error(`${label}: ${tags.length} hashtags — cap is 5`);
  for (const t of tags) if (!pool.has(t)) throw new Error(`${label}: hashtag ${t} not in the committed pool`);
}

function assertPng(path, width, height) {
  const buf = readFileSync(path);
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`${path}: not a PNG`);
  const w = buf.readUInt32BE(16);
  const hgt = buf.readUInt32BE(20);
  if (w !== width || hgt !== height) {
    throw new Error(`${path}: ${w}×${hgt} does not match declared ${width}×${height}`);
  }
}

/* ── per-slide alt text for carousels ─────────────────────────────────────── */

function carouselAlts(carousel) {
  const s = carousel.subject;
  if (carousel.kind === "formation") {
    return [
      altText(s),
      ...s.events.map((e) => clamp(`${e.yearText}: ${e.title}. ${e.summary}`, 480)),
    ];
  }
  // ranking: cover + grouped-row slides (mirror cards.mjs's 4/3/3 grouping).
  const groups = [s.rows.slice(0, 4), s.rows.slice(4, 7), s.rows.slice(7, 10)].filter((g) => g.length > 0);
  return [
    altText(s),
    ...groups.map((g) =>
      clamp(
        `${s.label}, ranks ${g[0].rank} to ${g[g.length - 1].rank}: ` +
          g.map((r) => `${r.rank}. ${r.name}`).join("; ") +
          ".",
        480,
      ),
    ),
  ];
}

/* ── one day ──────────────────────────────────────────────────────────────── */

function dataCardFor(subject, format) {
  if (subject.type === "ranking") return rankingCard(subject, format);
  if (subject.type === "commodity") return commodityCard(subject, format);
  if (subject.type === "compare") return compareCard(subject, format);
  throw new Error(`no single-card composition for ${subject.type}`);
}

async function buildDay(iso, ledger) {
  const plan = planDay(iso, ledger);
  const dir = join(OUT_ROOT, iso);
  mkdirSync(join(dir, "carousel"), { recursive: true });

  // Render the day's assets.
  const files = [];
  const put = async (rel, element, format) => {
    const buf = await renderPng(element, format);
    writeFileSync(join(dir, rel), buf);
    files.push({ rel, width: format.width, height: format.height, buf });
    return rel;
  };

  await put("pin-anchor.png", onThisDayCard(plan.anchor, FORMATS.pin), FORMATS.pin);
  await put("pin-data.png", dataCardFor(plan.dataCard, FORMATS.pin), FORMATS.pin);
  await put("vertical-anchor.png", onThisDayCard(plan.anchor, FORMATS.vertical), FORMATS.vertical);

  const slides =
    plan.carousel.kind === "ranking" ? rankingCarousel(plan.carousel.subject) : formationCarousel(plan.carousel.subject);
  const slideRels = [];
  for (let i = 0; i < slides.length; i++) {
    const rel = `carousel/${String(i).padStart(2, "0")}${i === 0 ? "-cover" : ""}.png`;
    await put(rel, slides[i], FORMATS.vertical);
    slideRels.push(rel);
  }
  const slideAlts = carouselAlts(plan.carousel);
  if (slideAlts.length !== slideRels.length) {
    throw new Error(`${iso}: ${slideRels.length} carousel slides but ${slideAlts.length} alt texts`);
  }

  // Assemble the manifest.
  const asset = (rel, alt) => {
    const f = files.find((x) => x.rel === rel);
    return { path: rel, width: f.width, height: f.height, alt };
  };
  const post = (platform, slot, subject, assets, { type = subject.type } = {}) => {
    const spec = captionFor(subject, platform);
    const caption = assembleCaption(spec, platform);
    assertCaption(spec, caption, platform, `${iso}:${platform}:${slot}`);
    if (!published.has(subject.targetPath)) {
      throw new Error(`${iso}:${platform}:${slot}: target ${subject.targetPath} is not a published page`);
    }
    return {
      dedupeKey: `${iso}:${platform}:${slot}`,
      platform,
      slot,
      type,
      format: assets.length > 1 ? "carousel" : assets[0].width === 1000 ? "pin" : "vertical",
      assets,
      caption,
      targetUrl: abs(subject.targetPath),
      hashtags: hashtagsFor(spec.type),
    };
  };

  const carouselAssets = slideRels.map((rel, i) => asset(rel, slideAlts[i]));
  const posts = [
    post("pinterest", "anchor", plan.anchor, [asset("pin-anchor.png", altText(plan.anchor))]),
    post("pinterest", "data", plan.dataCard, [asset("pin-data.png", altText(plan.dataCard))]),
    post("instagram", "anchor", plan.anchor, [asset("vertical-anchor.png", altText(plan.anchor))]),
    post("instagram", "carousel", plan.carousel.subject, carouselAssets),
    post("tiktok", "carousel", plan.carousel.subject, carouselAssets),
  ];

  const keys = new Set(posts.map((p) => p.dedupeKey));
  if (keys.size !== posts.length) throw new Error(`${iso}: duplicate dedupe keys`);

  const manifest = {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    date: iso,
    plan: {
      anchor: { kind: plan.anchor.kind, event: ledgerEntry(plan).event },
      dataCard: plan.dataCard.surfaceKey,
      carousel: ledgerEntry(plan).carousel,
    },
    posts,
  };
  writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  // Verify what was written (the build must not trust itself).
  for (const f of files) assertPng(join(dir, f.rel), f.width, f.height);

  if (reviewSheet) await composeSheet(iso, plan, files);

  return { plan, manifest, files };
}

/* ── the review sheet (one per day, for design-review/16-social/week/) ────── */

async function composeSheet(iso, plan, files) {
  mkdirSync(WEEK_DIR, { recursive: true });
  const cellW = 260;
  const gap = 18;
  const cells = files.map((f) => ({
    label: f.rel.replace("carousel/", "c/"),
    buf: f.buf,
    w: f.width,
    h: f.height,
  }));
  const cols = Math.min(cells.length, 6);
  const rows = Math.ceil(cells.length / cols);
  const cellH = Math.round(cellW * 1.5);
  const width = cols * cellW + (cols + 1) * gap;
  const height = 92 + rows * (cellH + 30 + gap);
  const title = `${iso} · anchor ${plan.anchor.kind} (${plan.anchor.event.code}) · data ${plan.dataCard.surfaceKey} · carousel ${plan.carousel.kind}`;
  const tree = h(
    "div",
    { style: { width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#0a1d26", padding: gap } },
    h(
      "div",
      { style: { fontFamily: "mono", fontSize: 20, color: CARD.chalk3, letterSpacing: 3, marginBottom: 14 } },
      title,
    ),
    h(
      "div",
      { style: { display: "flex", flexWrap: "wrap", gap } },
      cells.map((c) =>
        h(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: 6 } },
          h("img", {
            src: `data:image/png;base64,${c.buf.toString("base64")}`,
            width: cellW,
            height: Math.round(cellW * (c.h / c.w)),
          }),
          h("div", { style: { fontFamily: "mono", fontSize: 15, color: CARD.chalk3 } }, c.label),
        ),
      ),
    ),
  );
  const buf = await renderPng(tree, { width, height });
  writeFileSync(join(WEEK_DIR, `${iso}.png`), buf);
}

/* ── run ──────────────────────────────────────────────────────────────────── */

const ledger = JSON.parse(readFileSync(LEDGER_PATH, "utf8"));
for (const iso of dates) {
  const { plan, manifest } = await buildDay(iso, ledger);
  ledger.days[iso] = ledgerEntry(plan);
  console.log(
    `${iso}  anchor=${plan.anchor.kind}:${plan.anchor.event.code}  data=${plan.dataCard.surfaceKey}  ` +
      `carousel=${ledger.days[iso].carousel}  posts=${manifest.posts.length}`,
  );
}

// One sorted write at the end — stable diffs, idempotent per date key.
const sortedDays = Object.fromEntries(Object.entries(ledger.days).sort(([x], [y]) => x.localeCompare(y)));
writeFileSync(LEDGER_PATH, JSON.stringify({ ...ledger, days: sortedDays }, null, 2) + "\n");
console.log(`ledger: ${Object.keys(sortedDays).length} day(s) recorded.`);
