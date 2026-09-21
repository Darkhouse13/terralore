#!/usr/bin/env node
// ── Which anniversaries are worth a post: the scoring pass ─────────────────
// Usage (under the alias loader — `npm run social-anniversaries -- <args>`):
//
//   scripts/social-anniversaries.mjs --from 2026-09-22 --to 2026-10-31
//   … add --top N      (candidates listed per day, default 3)
//   … add --json       (machine-readable, for tooling)
//
// Not every calendar day carries a story anyone outside one country would
// stop scrolling for. This ranks each day's DAY-PRECISION corpus events (the
// only ones that can honestly say "on this day") by a transparent score, so
// the editorial call — which dates go into data/social-anniversaries.json —
// starts from a sorted list instead of 366 blank days. The score proposes;
// the curated file decides. Nothing here writes anything.
//
// The score, every term visible in the output:
//   round   — the anniversary's roundness this year: 500/1000 → 6,
//             100/250 → 5, 50 → 4, 25/75 → 3, 10s → 1. A 250th is a story
//             by itself; an 83rd is not.
//   kind    — category weight: independence/founding 3, war/politics 2,
//             disaster/colonization/religion 1, the rest 0. Rupture and
//             birth travel across borders; a currency reform rarely does.
//   reach   — log10 of the nation's population (World Bank, latest) minus 6,
//             floored at 0: an event of a nation of 100M scores 2, of 1M 0.
//             Audience is where a national anniversary gets shared.
//   shared  — +1.5 per OTHER nation whose chronicle records the same
//             date and year (a treaty, a war, a partition told twice is a
//             cross-border story by construction).
//   age     — +1 for events 1800 and later (living-memory adjacent, photo
//             evidence exists for the reel); 0 before.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { dateIndex } from "./lib/social/subjects.mjs";
import { parseDate, isoAddDays } from "./lib/social/calendar.mjs";

const argv = process.argv.slice(2);
const arg = (name, dflt) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : dflt);
const from = parseDate(arg("--from", new Date().toISOString().slice(0, 10))).iso;
const to = parseDate(arg("--to", isoAddDays(from, 27))).iso;
const top = Number(arg("--top", 3));
const asJson = argv.includes("--json");

const society = JSON.parse(readFileSync(join(process.cwd(), "data/domains/society.json"), "utf8"));
const population = (code) => {
  const metrics = society.data?.[code]?.metrics ?? [];
  return metrics.find((m) => m.key === "population")?.value ?? null;
};

const KIND = {
  independence: 3, founding: 3, war: 2, politics: 2,
  disaster: 1, colonization: 1, religion: 1,
};

function roundness(gap) {
  if (gap % 500 === 0) return 6;
  if (gap % 100 === 0 || gap % 250 === 0) return 5;
  if (gap % 50 === 0) return 4;
  if (gap % 25 === 0) return 3;
  if (gap % 10 === 0) return 1;
  return 0;
}

export function scoreEvent(e, year, sameDay) {
  const gap = year - e.year;
  const pop = population(e.code);
  const terms = {
    round: roundness(gap),
    kind: KIND[e.category] ?? 0,
    reach: pop ? Math.max(0, Math.round((Math.log10(pop) - 6) * 10) / 10) : 0,
    shared: 1.5 * sameDay.filter((o) => o.year === e.year && o.code !== e.code).length,
    age: e.year >= 1800 ? 1 : 0,
  };
  const score = Math.round(Object.values(terms).reduce((a, b) => a + b, 0) * 10) / 10;
  return { score, gap, terms };
}

const ordinal = (n) => {
  const t = n % 100;
  return `${n}${t >= 11 && t <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
};

const idx = dateIndex();
const days = [];
for (let iso = from; iso <= to; iso = isoAddDays(iso, 1)) {
  const d = parseDate(iso);
  const pool = (idx.byDay.get(`${d.month}-${d.day}`) ?? []).filter((e) => e.year < d.year);
  const ranked = pool
    .map((e) => ({ e, ...scoreEvent(e, d.year, pool) }))
    .sort((a, b) => b.score - a.score || a.e.year - b.e.year);
  days.push({ iso, candidates: ranked.slice(0, top), poolSize: pool.length });
}

if (asJson) {
  const out = days.map((d) => ({
    date: d.iso,
    poolSize: d.poolSize,
    candidates: d.candidates.map((c) => ({
      event: `${c.e.code}:${c.e.year}:${c.e.title}`,
      score: c.score,
      anniversary: c.gap,
      terms: c.terms,
    })),
  }));
  console.log(JSON.stringify(out, null, 2));
} else {
  for (const d of days) {
    console.log(`\n${d.iso}  (${d.poolSize} day-precision event${d.poolSize === 1 ? "" : "s"})`);
    if (d.candidates.length === 0) console.log("    — nothing can claim this date");
    for (const c of d.candidates) {
      const t = c.terms;
      console.log(
        `  ${c.score.toFixed(1).padStart(5)}  ${c.e.code} ${c.e.dateText} (${ordinal(c.gap)}) — ${c.e.title}` +
          `\n         round ${t.round} · kind ${t.kind} (${c.e.category}) · reach ${t.reach} · shared ${t.shared} · age ${t.age}`,
      );
    }
  }
}
