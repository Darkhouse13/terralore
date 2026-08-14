#!/usr/bin/env node
// ── Bench-build 390px identity captures ─────────────────────────────────────
// Full-page phone captures for the pixel-identity gate of the bench build
// (design-review/19-bench). content-visibility is forced visible before the
// shot: cv:auto placeholder heights depend on how far the capturer scrolled,
// which made two captures of IDENTICAL markup differ — the gate compares
// true layout, not placeholder estimates.
//
// Usage: CHROME_PATH=… node scripts/bench-shots.mjs --out DIR [--base URL]
//        [--width 390]

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : d;
};

const BASE = flag("base", "http://127.0.0.1:3311").replace(/\/$/, "");
const OUT = flag("out", null);
const WIDTH = Number(flag("width", "390"));
if (!OUT) {
  console.error("✗ --out required");
  process.exit(1);
}
if (!process.env.CHROME_PATH) {
  console.error("✗ set CHROME_PATH");
  process.exit(1);
}

const PAGES = [
  { name: "home", path: "/" },
  { name: "atlas", path: "/atlas" },
  { name: "dossier", path: "/country/FRA" },
  { name: "ranking-gdp", path: "/rankings/gdp" },
  { name: "compare-index", path: "/compare" },
  { name: "compare-pair", path: "/compare/deu-vs-fra" },
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const ctx = await browser.newContext({
  viewport: { width: WIDTH, height: 844 },
  deviceScaleFactor: 1,
});
for (const p of PAGES) {
  const page = await ctx.newPage();
  await page.goto(`${BASE}${p.path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1400); // settle/overture done
  await page.addStyleTag({ content: "* { content-visibility: visible !important; }" });
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT}/${p.name}-${WIDTH}.png`, fullPage: true });
  await page.close();
}
await ctx.close();
await browser.close();
console.log(`✓ ${PAGES.length} pages @ ${WIDTH}px (cv forced) → ${OUT}/`);
