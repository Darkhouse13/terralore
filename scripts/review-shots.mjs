#!/usr/bin/env node
// ── Design-review screenshot harness ────────────────────────────────────────
// Captures every surface at desktop (1440) and mobile (390) into
// design-review/<label>/, so a redesign pass can be critiqued against DESIGN.md
// and compared to the pass before it.
//
// Usage: node scripts/review-shots.mjs --label before [--only landing,dossier]
//        node scripts/review-shots.mjs --label after-globe --base http://127.0.0.1:3000

import { chromium } from "playwright";
import { mkdirSync, existsSync, readdirSync } from "node:fs";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : d;
};

const BASE = flag("base", "http://127.0.0.1:3000").replace(/\/$/, "");
const LABEL = flag("label", "shots");
const ONLY = flag("only", null)?.split(",").map((s) => s.trim());
const OUT = `design-review/${LABEL}`;

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const pw = `${process.env.HOME}/.cache/ms-playwright`;
  if (!existsSync(pw)) return undefined;
  for (const d of readdirSync(pw).filter((n) => n.startsWith("chromium-"))) {
    const p = `${pw}/${d}/chrome-linux64/chrome`;
    if (existsSync(p)) return p;
  }
  return undefined;
}

// Every surface the identity has to hold together across. `settle` is how long
// to wait for entrance choreography; `full` captures the whole scrolling page.
const SURFACES = [
  { name: "landing", path: "/", settle: 4200 },
  { name: "landing-scrolled", path: "/", settle: 3800, scroll: 900 },
  { name: "atlas", path: "/atlas", settle: 1200, full: true },
  { name: "dossier", path: "/country/FRA", settle: 1800 },
  { name: "dossier-full", path: "/country/FRA", settle: 1800, full: true },
  { name: "dossier-empty", path: "/country/ATA", settle: 1500, full: true },
  { name: "chronicle", path: "/country/FRA/chronicle", settle: 1200 },
  { name: "chronicle-full", path: "/country/JPN/chronicle", settle: 1200, full: true },
  { name: "journey", path: "/country/FRA/history", settle: 3000 },
  { name: "journey-event", path: "/country/FRA/history", settle: 2600, keys: ["ArrowRight", "ArrowRight"] },
  { name: "timeline", path: "/timeline", settle: 1000, full: true },
  { name: "timeline-period", path: "/timeline/19th-century", settle: 1000, full: true },
  { name: "themes", path: "/themes", settle: 1000, full: true },
  { name: "theme", path: "/themes/independence", settle: 1000, full: true },
  { name: "notfound", path: "/country/ZZZ", settle: 900 },
];

const VIEWPORTS = [
  { tag: "desktop", width: 1440, height: 900, dsf: 2 },
  { tag: "mobile", width: 390, height: 844, dsf: 2, mobile: true },
];

const surfaces = ONLY ? SURFACES.filter((s) => ONLY.includes(s.name)) : SURFACES;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: findChrome(),
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

let n = 0;
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dsf,
    isMobile: vp.mobile ?? false,
    hasTouch: vp.mobile ?? false,
    // The screenshots are the record of the *designed* state, not of the
    // entrance animation — but reduced-motion also has to be reviewable, so it
    // gets its own pass below rather than being forced here.
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  for (const s of surfaces) {
    const url = `${BASE}${s.path}`;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    } catch {
      // networkidle can hang on a page with a live canvas loop; load is enough.
      await page.goto(url, { waitUntil: "load", timeout: 60000 });
    }
    await page.waitForTimeout(s.settle ?? 1200);

    for (const k of s.keys ?? []) {
      await page.keyboard.press(k);
      await page.waitForTimeout(700);
    }
    if (s.scroll) {
      await page.evaluate((y) => window.scrollTo(0, y), s.scroll);
      await page.waitForTimeout(800);
    }

    const file = `${OUT}/${s.name}-${vp.tag}.png`;
    await page.screenshot({ path: file, fullPage: s.full ?? false });
    n++;
    process.stdout.write(`\r  ${n} shots…`);
  }

  if (errors.length) {
    console.log(`\n  ⚠ ${vp.tag} console errors:`);
    for (const e of [...new Set(errors)].slice(0, 8)) console.log(`    ${e.slice(0, 140)}`);
  }
  await ctx.close();
}

// ── reduced-motion pass ─────────────────────────────────────────────────────
// prefers-reduced-motion is a quality floor, not an afterthought: the journey
// must be fully usable with it on. Captured so it can actually be reviewed.
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  for (const s of surfaces.filter((x) => ["landing", "journey", "dossier"].includes(x.name))) {
    await page.goto(`${BASE}${s.path}`, { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(2200);
    await page.screenshot({ path: `${OUT}/${s.name}-reduced-motion.png` });
    n++;
  }
  await ctx.close();
}

await browser.close();
console.log(`\n✓ ${n} screenshots → ${OUT}/`);
