#!/usr/bin/env node
// ── Mounted-core screenshot matrix ──────────────────────────────────────────
// Captures the mission's surfaces at the four verification widths
// (390 / 1280 / 1440 / 1920) against a running build, asserting zero
// horizontal overflow at capture. CHROME_PATH required (the Playwright CDN
// has no build for this distro — see the verification-environment memory).
//
// Usage: CHROME_PATH=… node scripts/mounted-shots.mjs [--base URL] [--out DIR]
//        [--only name1,name2] [--widths 390,1440] [--full]

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : d;
};

const BASE = flag("base", "http://127.0.0.1:3311").replace(/\/$/, "");
const OUT = flag("out", "design-review/18-mounted-core");
const FULL = args.includes("--full");

const ALL = [
  { name: "home", path: "/" },
  { name: "atlas", path: "/atlas" },
  { name: "dossier", path: "/country/FRA" },
  { name: "chronicle", path: "/country/FRA/chronicle" },
  { name: "rankings", path: "/rankings" },
  { name: "ranking-gdp", path: "/rankings/gdp" },
  { name: "compare-index", path: "/compare" },
  { name: "compare-pair", path: "/compare/deu-vs-fra" },
  { name: "commodities", path: "/commodities" },
  { name: "commodity-copper", path: "/commodities/copper" },
  { name: "timeline", path: "/timeline" },
  { name: "period-1940s", path: "/timeline/1940s" },
  { name: "themes", path: "/themes" },
];
const ONLY = flag("only", null)?.split(",");
const PAGES = ONLY ? ALL.filter((p) => ONLY.includes(p.name)) : ALL;
const WIDTHS = flag("widths", "390,1280,1440,1920").split(",").map(Number);

if (!process.env.CHROME_PATH) {
  console.error("✗ set CHROME_PATH (find ~/.cache/ms-playwright -name chrome -path '*chrome-linux64*')");
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
let overflowFailures = 0;

for (const width of WIDTHS) {
  const ctx = await browser.newContext({
    viewport: { width, height: width < 800 ? 844 : 900 },
    deviceScaleFactor: 1,
  });
  for (const page of PAGES) {
    const p = await ctx.newPage();
    await p.goto(`${BASE}${page.path}`, { waitUntil: "networkidle" });
    // let the overture/settle finish so shots are the settled state
    await p.waitForTimeout(1400);
    const overflow = await p.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (overflow > 0) {
      overflowFailures++;
      console.error(`✗ ${page.name}@${width}: horizontal overflow ${overflow}px`);
    }
    await p.screenshot({ path: `${OUT}/${page.name}-${width}.png`, fullPage: FULL });
    await p.close();
  }
  await ctx.close();
  console.log(`✓ ${PAGES.length} pages @ ${width}px`);
}

await browser.close();
if (overflowFailures) {
  console.error(`✗ ${overflowFailures} overflow failure(s)`);
  process.exit(1);
}
console.log(`✓ zero horizontal overflow everywhere → ${OUT}/`);
