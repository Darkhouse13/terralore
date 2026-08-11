#!/usr/bin/env node
// ── The social layer's offline validator ───────────────────────────────────
// Run via: node --import ./scripts/lib/ts-alias-loader.mjs scripts/validate-social.mjs
// (wired into `npm run validate`). No rendering and no writes — this asserts
// the EDITORIAL layer: the committed ledger and hashtag pool are well-formed,
// the calendar is deterministic, every caption a plan can produce passes the
// rules, and every target URL is a page the site actually publishes (sitemap
// ∪ GEO twins). The render path is asserted by scripts/build-social.mjs at
// generation time, where the PNGs are actually produced.
//
// Probe dates are FIXED calendar days plus one corpus-derived sparse day (a
// calendar day with no day-precision event, which must exercise the fallback
// tiers without fabricating precision). Three consecutive days cover the full
// data-card rotation; a second pass with the first probe's ledger entries
// asserts the recency machinery holds determinism.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import ledger from "@/data/social-ledger.json";
import pool from "@/data/social-hashtags.json";
import { allTwins } from "@/lib/geo";
import sitemap from "@/app/sitemap";
import { SITE_URL } from "@/lib/seo";
import { planDay, ledgerEntry, parseDate, isoAddDays } from "./lib/social/calendar.mjs";
import { dateIndex } from "./lib/social/subjects.mjs";
import {
  captionFor,
  assembleCaption,
  hashtagsFor,
  LIMITS,
  BANNED,
  CHARSET,
  CITATION_RE,
  allPoolTags,
} from "./lib/social/captions.mjs";

let errors = 0;
const fail = (msg) => {
  errors++;
  console.error(`  ✗ ${msg}`);
};

/* ── the committed data files ─────────────────────────────────────────────── */

if (ledger.version !== 1) fail(`ledger version ${ledger.version} — expected 1`);
for (const [iso, entry] of Object.entries(ledger.days ?? {})) {
  try {
    parseDate(iso);
  } catch {
    fail(`ledger day "${iso}" is not a valid date key`);
  }
  for (const field of ["event", "eventNation", "surface", "carousel"]) {
    if (typeof entry[field] !== "string" || !entry[field]) {
      fail(`ledger ${iso}.${field} missing or not a string`);
    }
  }
}

if (pool.version !== 1) fail(`hashtag pool version ${pool.version} — expected 1`);
for (const tag of allPoolTags()) {
  if (!/^#[a-z0-9]+$/.test(tag)) fail(`hashtag "${tag}" is not lowercase #alphanumeric`);
}
for (const type of ["on-this-day", "ranking", "commodity", "compare", "formation"]) {
  if (!pool.byType[type]?.length) fail(`hashtag pool has no byType entry for "${type}"`);
  const tags = hashtagsFor(type);
  if (tags.length === 0 || tags.length > 5) fail(`hashtagsFor(${type}) yields ${tags.length} tags`);
}

/* ── the URL universe ─────────────────────────────────────────────────────── */

const published = new Set();
for (const e of sitemap()) published.add(e.url.replace(SITE_URL, "") || "/");
for (const t of allTwins()) {
  published.add(t.canonicalPath);
  published.add(t.path);
}

/* ── probe plans ──────────────────────────────────────────────────────────── */

// One corpus-derived sparse day: the first calendar day of the year with no
// day-precision event — must exercise a fallback tier honestly.
const idx = dateIndex();
let sparseIso = null;
const DAYS_IN_MONTH = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
outer: for (let m = 1; m <= 12; m++) {
  for (let d = 1; d <= DAYS_IN_MONTH[m]; d++) {
    if (!idx.byDay.has(`${m}-${d}`)) {
      sparseIso = `2026-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      break outer;
    }
  }
}

const probes = ["2026-08-12", "2026-08-13", "2026-08-14"];
if (sparseIso) probes.push(sparseIso);

const PLATFORMS = ["pinterest", "instagram", "tiktok"];

function checkCaption(text, platform, label) {
  if (text.length > LIMITS[platform].margin) {
    fail(`${label}: ${text.length} chars exceeds the ${platform} margin ${LIMITS[platform].margin}`);
  }
  if (!CHARSET.test(text)) {
    const bad = [...text].find((ch) => !CHARSET.test(ch));
    fail(`${label}: character outside the committed font charset: ${JSON.stringify(bad)}`);
  }
}

function checkPlan(plan, label) {
  const subjects = [plan.anchor, plan.dataCard, plan.carousel.subject];
  for (const subject of subjects) {
    if (!published.has(subject.targetPath)) {
      fail(`${label}: target ${subject.targetPath} is not in the sitemap or twins`);
    }
    for (const platform of PLATFORMS) {
      const spec = captionFor(subject, platform);
      for (const block of spec.blocks) {
        if (block.kind === "authored" && BANNED.test(block.text)) {
          fail(
            `${label}: authored copy for ${subject.type} trips the neutrality scan: ` +
              `"${block.text.match(BANNED)[0]}" in "${block.text.slice(0, 60)}…"`,
          );
        }
      }
      if (!CITATION_RE.test(spec.citation)) {
        fail(`${label}: citation line does not match the GEO template: "${spec.citation}"`);
      }
      const poolTags = allPoolTags();
      const tags = hashtagsFor(spec.type);
      if (tags.length > 5) fail(`${label}: ${tags.length} hashtags — the cap is 5`);
      for (const t of tags) if (!poolTags.has(t)) fail(`${label}: hashtag ${t} is not in the committed pool`);
      checkCaption(assembleCaption(spec, platform), platform, `${label}/${subject.type}/${platform}`);
    }
  }
  // The anchor's precision claim must be supported by the record it selected.
  const { kind, event } = plan.anchor;
  if (kind === "day" && event.precision !== "day") {
    fail(`${label}: a "day" anchor selected a ${event.precision}-precision record — fabricated precision`);
  }
  if (kind === "month" && event.precision === "year") {
    fail(`${label}: a "month" anchor selected a year-precision record — fabricated precision`);
  }
  if (kind === "year" && (plan.date.year - event.year) % 25 !== 0) {
    fail(`${label}: a "year" anchor is not a round (25×) anniversary`);
  }
}

const emptyLedger = { version: 1, days: {} };
for (const iso of probes) {
  const p1 = planDay(iso, emptyLedger);
  const p2 = planDay(iso, emptyLedger);
  if (JSON.stringify(p1) !== JSON.stringify(p2)) fail(`${iso}: two runs from equal state disagree — nondeterminism`);
  checkPlan(p1, iso);
}

// The recency machinery: a synthetic three-day sequence must be reproducible
// and must not repeat the anchor event or data surface inside the window.
{
  const led = { version: 1, days: {} };
  const seen = { events: new Set(), surfaces: new Set() };
  let iso = "2026-08-12";
  for (let i = 0; i < 3; i++) {
    const plan = planDay(iso, led);
    const entry = ledgerEntry(plan);
    if (seen.events.has(entry.event)) fail(`sequence: anchor event repeated within 3 days (${entry.event})`);
    if (seen.surfaces.has(entry.surface)) fail(`sequence: data surface repeated within 3 days (${entry.surface})`);
    seen.events.add(entry.event);
    seen.surfaces.add(entry.surface);
    led.days[iso] = entry;
    // Regenerating a day whose own entry is in the ledger must not change it.
    const again = planDay(iso, led);
    if (JSON.stringify(ledgerEntry(again)) !== JSON.stringify(entry)) {
      fail(`sequence ${iso}: a day's own ledger entry changed its plan on regeneration`);
    }
    iso = isoAddDays(iso, 1);
  }
}

/* ── verdict ──────────────────────────────────────────────────────────────── */

const dayCount = idx.byDay.size;
console.log(
  `✓ social: ${idx.all.length} events indexed (${[...idx.byDay.values()].reduce((n, l) => n + l.length, 0)} ` +
    `day-precision over ${dayCount} calendar days), ${probes.length} probe plans validated ` +
    `across ${PLATFORMS.length} platforms${sparseIso ? ` (fallback exercised on ${sparseIso})` : ""}`,
);
console.log(`\n${errors} error(s) in the social layer.`);
process.exit(errors ? 1 : 0);
