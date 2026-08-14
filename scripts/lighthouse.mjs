#!/usr/bin/env node
// ── Lighthouse mobile audit ─────────────────────────────────────────────────
// Runs the mission's three representative surfaces — landing, a dossier and a
// chronicle — against a *running production build*, on the mobile preset, and
// prints the four category scores. Exits non-zero if any falls below the floor.
//
// Why a script and not the raw CLI: the floor (≥95 ×4) is a project invariant,
// and the three URLs are the ones the mission names. Encoding both here means a
// later run is comparable to an earlier one rather than depending on whoever
// typed the flags.
//
// Usage: node scripts/lighthouse.mjs [--base URL] [--label before|after] [--runs N]

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : d;
};

const BASE = flag("base", "http://127.0.0.1:3000").replace(/\/$/, "");
const LABEL = flag("label", "run");
const RUNS = Number(flag("runs", 1));
// --form desktop runs Lighthouse's desktop preset (the bench build's second
// floor); default stays mobile, unchanged.
const FORM = flag("form", "mobile");
const OUT = "design-review/lighthouse";

// Chrome: prefer a system install, fall back to the Playwright chromium that is
// already a dev dependency here.
function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const pw = `${process.env.HOME}/.cache/ms-playwright`;
  if (!existsSync(pw)) return null;
  // Prefer a full chromium build over the headless shell (Lighthouse wants both
  // the renderer and DevTools protocol surface a real Chrome exposes).
  for (const d of readdirSync(pw).filter((n) => n.startsWith("chromium-"))) {
    const p = `${pw}/${d}/chrome-linux64/chrome`;
    if (existsSync(p)) return p;
  }
  return null;
}

const CHROME = findChrome();
if (!CHROME) {
  console.error("✗ no Chrome found. Set CHROME_PATH, or `npx playwright install chromium`.");
  process.exit(1);
}

// The surfaces the strata-rebuild mission names: the front door, one nation,
// one ranking, one compare — plus the chronicle (the GEO-critical reading
// depth, kept from the earlier floor).
const ALL_PAGES = [
  { name: "landing", path: "/" },
  { name: "dossier", path: "/country/JPN" },
  { name: "ranking", path: "/rankings/gdp" },
  { name: "compare", path: "/compare/deu-vs-fra" },
  { name: "compare-hub", path: "/compare" },
  { name: "chronicle", path: "/country/FRA/chronicle" },
  // The capture surface (deviations E16): the ledger hub carries the letter's
  // subscription bed, so it holds the floor like every surface class.
  { name: "ledger", path: "/ledger" },
];
const ONLY = flag("only", null)?.split(",");
const PAGES = ONLY ? ALL_PAGES.filter((p) => ONLY.includes(p.name)) : ALL_PAGES;

const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];
const FLOOR = 95;

mkdirSync(OUT, { recursive: true });

function runOne(url, outPath) {
  // No --preset: mobile (moto-g4 viewport, 4× CPU throttle, slow 4G) is
  // Lighthouse's default form factor, and mobile is the floor the mission sets.
  execFileSync(
    "npx",
    [
      "--yes",
      "lighthouse",
      url,
      "--quiet",
      "--output=json",
      `--output-path=${outPath}`,
      "--chrome-flags=--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage",
      "--only-categories=performance,accessibility,best-practices,seo",
      ...(FORM === "desktop" ? ["--preset=desktop"] : []),
    ],
    { stdio: ["ignore", "ignore", "pipe"], env: { ...process.env, CHROME_PATH: CHROME } },
  );
  return JSON.parse(readFileSync(outPath, "utf8"));
}

const results = [];
let failed = false;

for (const page of PAGES) {
  const url = `${BASE}${page.path}`;
  // Multiple runs: performance is noisy on a shared box, so take the median run.
  const scoreSets = [];
  for (let i = 0; i < RUNS; i++) {
    const tmp = `${OUT}/.tmp-${page.name}-${i}.json`;
    let lhr;
    try {
      lhr = runOne(url, tmp);
    } catch (e) {
      console.error(`✗ lighthouse failed on ${url}\n${e.stderr?.toString().slice(-800) ?? e.message}`);
      process.exit(1);
    }
    scoreSets.push({
      lhr,
      scores: Object.fromEntries(
        CATEGORIES.map((c) => [c, Math.round((lhr.categories[c]?.score ?? 0) * 100)]),
      ),
    });
    rmSync(tmp, { force: true });
  }

  // median by performance score
  scoreSets.sort((a, b) => a.scores.performance - b.scores.performance);
  const median = scoreSets[Math.floor(scoreSets.length / 2)];
  const { lhr, scores } = median;

  writeFileSync(`${OUT}/${LABEL}-${page.name}.json`, JSON.stringify(lhr));

  const metrics = {
    lcp: lhr.audits["largest-contentful-paint"]?.numericValue,
    tbt: lhr.audits["total-blocking-time"]?.numericValue,
    cls: lhr.audits["cumulative-layout-shift"]?.numericValue,
    fcp: lhr.audits["first-contentful-paint"]?.numericValue,
  };

  results.push({ page: page.name, path: page.path, scores, metrics });

  const line = CATEGORIES.map((c) => {
    const v = scores[c];
    return `${c.slice(0, 4)} ${String(v).padStart(3)}${v < FLOOR ? "✗" : " "}`;
  }).join("  ");
  if (CATEGORIES.some((c) => scores[c] < FLOOR)) failed = true;

  console.log(
    `${page.name.padEnd(10)} ${line}   ` +
      `LCP ${(metrics.lcp / 1000).toFixed(2)}s  TBT ${Math.round(metrics.tbt)}ms  CLS ${metrics.cls?.toFixed(3)}`,
  );
}

writeFileSync(`${OUT}/${LABEL}-summary.json`, JSON.stringify(results, null, 2));
console.log(`\nreports → ${OUT}/${LABEL}-*.json`);

if (failed) {
  console.error(`\n✗ at least one category below the ${FLOOR} floor`);
  process.exit(1);
}
console.log(`✓ all categories ≥ ${FLOOR} (${FORM})`);
