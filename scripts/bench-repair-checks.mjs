#!/usr/bin/env node
// Targeted assertions for the bench repair (beyond the screenshot driver):
// notch scroll-sync to a MIDDLE bed, the sparse-era band floor, the ranking
// chip's computed color, the desktop dig cell's BY THEME link, idle loops.
// Usage: CHROME_PATH=… node scripts/bench-repair-checks.mjs [--base URL]
import { chromium } from "playwright";

const base = (() => {
  const i = process.argv.indexOf("--base");
  return (i !== -1 ? process.argv[i + 1] : "http://127.0.0.1:3311").replace(/\/$/, "");
})();
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
let fail = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) fail++;
};

// ── notch sync: scroll a MIDDLE bed to the top, notch must follow ──
{
  const page = await ctx.newPage();
  await page.goto(`${base}/country/AFG`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const r = await page.evaluate(async () => {
    const beds = [...document.querySelectorAll("[id^='bed-']")];
    const mid = beds[3]; // 1747–1919, the fourth bed
    window.scrollTo({ top: scrollY + mid.getBoundingClientRect().top, behavior: "auto" });
    await new Promise((res) => setTimeout(res, 500));
    const notch = document.querySelector("button[aria-current='true']");
    return { midId: mid.id, notch: notch?.getAttribute("aria-label") ?? null };
  });
  check("notch tracks mid-bed scroll", (r.notch ?? "").includes("Durrani"), `scrolled to ${r.midId}, notch="${r.notch}"`);
  // and scrolling back to the very top returns the notch to era 0
  const top = await page.evaluate(async () => {
    window.scrollTo({ top: 0, behavior: "auto" });
    await new Promise((res) => setTimeout(res, 500));
    return document.querySelector("button[aria-current='true']")?.getAttribute("aria-label") ?? null;
  });
  check("notch returns to newest era at top", (top ?? "").includes("Taliban"), `notch="${top}"`);
  // keyboard: focus a band, press Enter, landing must be exact
  const kb = await page.evaluate(async () => {
    const bands = [...document.querySelectorAll("button[aria-label*='events']")];
    bands[5].focus();
    bands[5].click(); // Enter on a focused button fires click
    await new Promise((res) => setTimeout(res, 1400));
    const bed = [...document.querySelectorAll("[id^='bed-']")].at(-1);
    return Math.round(bed.getBoundingClientRect().top);
  });
  check("keyboard band activation lands at 0", kb === 0, `top=${kb}px`);
  // band tooltips carry the full label
  const titles = await page.evaluate(() =>
    [...document.querySelectorAll("button[aria-label*='events']")].map((b) => b.title),
  );
  check("all bands carry full-label tooltips", titles.length === 6 && titles.every((t) => t.includes("—") && t.includes("events")), titles[0]);
  await page.close();
}

// ── sparse-era floor: PSE (min band share ≈ .14) at 1024×768 ──
{
  const c2 = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await c2.newPage();
  await page.goto(`${base}/country/PSE`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const bands = await page.evaluate(() =>
    [...document.querySelectorAll("button[aria-label*='events']")].map((b) => {
      const s = b.querySelector("span");
      return {
        h: Math.round(b.getBoundingClientRect().height),
        label: s?.textContent?.slice(0, 24) ?? "",
      };
    }),
  );
  const minBand = Math.min(...bands.map((b) => b.h));
  check("PSE sparse band ≥ 104px floor", minBand >= 104, `min band ${minBand}px; bands=${bands.map((b) => b.h).join(",")}`);
  // rail column must not overflow the viewport
  const overflow = await page.evaluate(() => {
    const rail = document.querySelector("button[aria-label*='events']")?.closest(".sticky");
    return rail ? Math.round(rail.scrollHeight - rail.clientHeight) : -1;
  });
  check("PSE rail fits h-dvh at 768", overflow <= 0, `overflow=${overflow}px`);
  await page.close();
  await c2.close();
}

// ── ranking chip: active sibling chip text must compute to BONE ──
{
  const page = await ctx.newPage();
  await page.goto(`${base}/rankings/gdp`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  const chip = await page.evaluate(() => {
    const el = document.querySelector("a[aria-current='page'].pressable");
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { color: cs.color, bg: cs.backgroundColor };
  });
  check(
    "active ranking chip is bone on basalt",
    chip?.color === "rgb(239, 231, 216)" && chip?.bg === "rgb(34, 30, 25)",
    JSON.stringify(chip),
  );
  await page.close();
}

// ── desktop dig cell: BY THEME present, BY PERIOD hidden at 1440 ──
{
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1600);
  const dig = await page.evaluate(() => {
    const links = [...document.querySelectorAll("a[href='/themes'], a[href='/timeline']")];
    const vis = (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(el).display !== "none";
    };
    return {
      theme: links.filter((l) => l.getAttribute("href") === "/themes").some(vis),
      periodInDig: links.some(
        (l) => l.getAttribute("href") === "/timeline" && l.textContent.includes("BY PERIOD") && vis(l),
      ),
    };
  });
  check("BY THEME visible on desktop front door", dig.theme);
  check("BY PERIOD stays phone-only", !dig.periodInDig);
  await page.close();
}

// ── idle: 0 rAF loops + 0 running animations after settle (nation, 1440) ──
{
  const page = await ctx.newPage();
  await page.goto(`${base}/country/AFG`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  const idle = await page.evaluate(async () => {
    let rafs = 0;
    const orig = window.requestAnimationFrame;
    window.requestAnimationFrame = (cb) => {
      rafs++;
      return orig.call(window, cb);
    };
    await new Promise((res) => setTimeout(res, 1500));
    const anims = document.getAnimations().filter((a) => a.playState === "running").length;
    return { rafs, anims };
  });
  check("idle: 0 rAF + 0 running animations", idle.rafs === 0 && idle.anims === 0, JSON.stringify(idle));
  await page.close();
}

// ── reduced motion: band click lands instantly, flip swap is instant ──
{
  const c3 = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await c3.newPage();
  await page.goto(`${base}/country/AFG`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const rm = await page.evaluate(async () => {
    const bands = [...document.querySelectorAll("button[aria-label*='events']")];
    bands[5].click();
    await new Promise((res) => setTimeout(res, 400)); // instant scroll needs no 1.2s
    const bed = [...document.querySelectorAll("[id^='bed-']")].at(-1);
    return Math.round(bed.getBoundingClientRect().top);
  });
  check("reduced-motion band click lands instantly at 0", rm === 0, `top=${rm}px`);
  await page.close();
  await c3.close();
}

await ctx.close();
await browser.close();
if (fail) {
  console.error(`\n✗ ${fail} check(s) failed`);
  process.exit(1);
}
console.log("\n✓ all bench-repair checks pass");
