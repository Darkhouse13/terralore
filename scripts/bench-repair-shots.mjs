#!/usr/bin/env node
// ── Bench-repair captures (design-review/20-bench-repair) ───────────────────
// Reproduction + verification driver for the bench defect repair:
//   A. the proof view (dossier, normal + PROOFS) at 390 / 1024 / 1440,
//      worst-case nation (longest OBSERVED+source+note reverse in the corpus)
//   B. the core rail at 1024 / 1440 / 1920 — band-click landing + notch sync
//
// Usage: CHROME_PATH=… node scripts/bench-repair-shots.mjs --out DIR
//        [--base URL] [--nation AFG]

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : d;
};

const BASE = flag("base", "http://127.0.0.1:3311").replace(/\/$/, "");
const OUT = flag("out", null);
const NATION = flag("nation", "AFG");
if (!OUT) {
  console.error("✗ --out required");
  process.exit(1);
}
if (!process.env.CHROME_PATH) {
  console.error("✗ set CHROME_PATH");
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });

async function open(width, height, path) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.addStyleTag({ content: "* { content-visibility: visible !important; }" });
  await page.waitForTimeout(150);
  return { ctx, page };
}

// ── A: proof view, normal + proofs ──────────────────────────────────────────
for (const width of [390, 1024, 1440]) {
  const { ctx, page } = await open(width, 900, `/country/${NATION}`);
  const bench = page.locator("text=PROOF VIEW").first();
  await bench.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/proof-normal-${width}.png`, fullPage: false });
  await bench.click();
  await page.waitForTimeout(600); // flip settled
  await page.screenshot({ path: `${OUT}/proof-proofs-${width}.png`, fullPage: false });
  // the education section holds the worst-case reverse (literacyRate)
  const edu = page.locator("h2", { hasText: "Education" }).first();
  if (await edu.count()) {
    await edu.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/proof-proofs-education-${width}.png` });
  }
  // overlap audit: any flip-scene whose reverse content overflows its row, and
  // any pair of specimen rows whose boxes intersect
  const audit = await page.evaluate(() => {
    const out = { overflows: [], overlaps: 0 };
    const scenes = [...document.querySelectorAll(".flip-scene")];
    for (const s of scenes) {
      const card = s.querySelector(".flip-card");
      if (!card) continue;
      const sr = s.getBoundingClientRect();
      for (const face of card.querySelectorAll(".flip-face")) {
        for (const el of face.querySelectorAll("*")) {
          const r = el.getBoundingClientRect();
          if (r.height && (r.bottom - sr.bottom > 2 || sr.top - r.top > 2)) {
            out.overflows.push(el.textContent?.slice(0, 60) ?? "?");
            break;
          }
        }
      }
    }
    const rows = scenes.map((s) => s.getBoundingClientRect());
    for (let i = 0; i < rows.length; i++)
      for (let j = i + 1; j < rows.length; j++) {
        const a = rows[i], b = rows[j];
        const x = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (x > 4 && y > 4) out.overlaps++;
      }
    return out;
  });
  console.log(`proofs@${width}: ${audit.overflows.length} face overflows, ${audit.overlaps} row overlaps`);
  if (audit.overflows.length) console.log("  e.g.", audit.overflows.slice(0, 3));
  await ctx.close();
}

// ── B: the core rail ────────────────────────────────────────────────────────
for (const [width, height] of [[1024, 768], [1440, 900], [1920, 1080]]) {
  const { ctx, page } = await open(width, height, `/country/${NATION}`);
  await page.screenshot({ path: `${OUT}/rail-top-${width}.png` });
  // click the OLDEST era's band (bottom of the rail), then measure where the
  // target bed's top landed relative to the viewport
  const bands = page.locator("button[aria-label*='events']");
  const n = await bands.count();
  if (n) {
    await bands.nth(n - 1).click();
    await page.waitForTimeout(1200); // smooth scroll done
    const landing = await page.evaluate(() => {
      const beds = [...document.querySelectorAll("[id^='bed-']")];
      const target = beds[beds.length - 1];
      const notch = document.querySelector("button[aria-current='true']");
      return {
        bedTop: Math.round(target?.getBoundingClientRect().top ?? NaN),
        notchLabel: notch?.getAttribute("aria-label")?.slice(0, 50) ?? null,
      };
    });
    console.log(`rail@${width}: oldest bed top after click = ${landing.bedTop}px; notch on "${landing.notchLabel}"`);
    await page.screenshot({ path: `${OUT}/rail-clicked-${width}.png` });
    // scroll back to mid-page and report which band carries the notch (sync test)
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight * 0.35 }));
    await page.waitForTimeout(700);
    const sync = await page.evaluate(() => {
      const beds = [...document.querySelectorAll("[id^='bed-']")];
      let inView = null;
      for (const b of beds) {
        const r = b.getBoundingClientRect();
        if (r.top <= innerHeight * 0.4 && r.bottom > innerHeight * 0.4) inView = b.id;
      }
      const notch = document.querySelector("button[aria-current='true']");
      return { inView, notch: notch?.getAttribute("aria-label")?.slice(0, 50) ?? null };
    });
    console.log(`rail@${width} mid-scroll: bed in view = ${sync.inView}; notch = "${sync.notch}"`);
    await page.screenshot({ path: `${OUT}/rail-midscroll-${width}.png` });
    // band label legibility: is any band's label box taller than the band?
    const labels = await page.evaluate(() => {
      const out = [];
      for (const b of document.querySelectorAll("button[aria-label*='events']")) {
        const s = b.querySelector("span");
        if (!s) continue;
        const br = b.getBoundingClientRect(), sr = s.getBoundingClientRect();
        out.push({
          band: Math.round(br.height),
          label: Math.round(sr.height),
          scroll: s.scrollHeight,
          clipped: s.scrollHeight - sr.height > 2,
          ellipsis: getComputedStyle(s).textOverflow,
        });
      }
      return out;
    });
    console.log(`rail@${width} bands:`, JSON.stringify(labels));
  }
  await ctx.close();
}

await browser.close();
console.log(`✓ captures → ${OUT}/`);
