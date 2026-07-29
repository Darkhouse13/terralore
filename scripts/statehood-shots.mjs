#!/usr/bin/env node
// ── Verification shots for the statehood shading ───────────────────────────
// Drives the landing globe's time rail to named periods and photographs the
// sphere, so the claim "Morocco is limestone in the 12th century, dimmed under
// the protectorate, copper in the 1950s" is checked against pixels rather than
// asserted. Written for docs/statehood-plan.md §5 and §8.4.
//
// Run against a server already listening on :3000 (`npm start` after a build):
//   node scripts/statehood-shots.mjs "The 12th century" "The 1880s" "The 1960s"
// With no arguments it shoots the plan's own verification set.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = process.env.BASE ?? "http://localhost:3000";
const dir = process.env.OUT ?? "design-review/12-statehood";
mkdirSync(dir, { recursive: true });

// [period label, drag in px, file slug] — the globe auto-rotates, so a shot is
// only evidence if it is pointed at the region under test. Drag is in screen
// pixels and roughly 1° of longitude each: positive turns the sphere westward
// (toward the Americas), negative eastward (toward Asia). 0 leaves the opening
// view, which is centred on Europe, Africa and the Middle East.
const DEFAULT = [
  ["The 12th century", 55, "12th-century-morocco-limestone"],
  ["The 1800s", 55, "1800s-poland-partitioned"],
  ["The 1880s", 40, "1880s-africa-and-europe"],
  ["The 1880s", -25, "1880s-india-dimmed"],
  ["The 1910s", 55, "1910s-poland-restored"],
  ["The 1950s", 55, "1950s-maghreb-restored"],
  ["The 1960s", 45, "1960s-africa-ablaze"],
  ["The 2020s", 0, "2020s-the-world-today"],
];

const targets = process.argv.length > 2
  ? process.argv.slice(2).map((label) => [label, 0, label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")])
  : DEFAULT;

// CHROME_PATH lets this run where `npx playwright install` has no build for the
// host distro — point it at any Chrome/Chromium binary (e.g. Chrome for Testing).
const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
);
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1.5 });
page.on("pageerror", (e) => console.log("PAGEERR:", e.message));

const rail = page.getByRole("slider", { name: /Travel through the archive/i });
// The readout renders uppercase in CSS, so compare on the DOM text, lowercased.
const shownLabel = () =>
  page.locator("div.mb-2 span").first().textContent().then((t) => (t ?? "").trim().toLowerCase());

/** Scrub to a period by its rail label: engage at the far left, then arrow. */
async function goTo(label) {
  const want = label.trim().toLowerCase();
  const box = await rail.boundingBox();
  if (!box) return false;
  await page.mouse.click(box.x + 2, box.y + box.height / 2); // engage at period 0
  await page.waitForTimeout(1200);
  await rail.focus();
  for (let i = 0; i < 70; i++) {
    if ((await shownLabel()) === want) return true;
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(70);
  }
  return false;
}

/** Drag the globe by `dx` screen pixels, then park the pointer off the sphere. */
async function face(dx) {
  // A zero drag is a *click* as far as the globe is concerned: it selects the
  // nation under the pointer, flies to it, paints it in the selection copper
  // and opens its card over the rail. That is how the first run of this script
  // lost the rail three shots in. Leave the sphere alone when there is nothing
  // to turn.
  if (dx === 0) {
    await page.mouse.move(4, 4);
    await page.waitForTimeout(300);
    return;
  }
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (!box) return;
  // A drag both turns the sphere and suspends auto-rotation while held.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + dx, box.y + box.height / 2, { steps: 12 });
  await page.mouse.up();
  // Park the pointer off the sphere: a hovered nation is painted in the hover
  // tint, which is limestone warmed toward copper — close enough to the
  // shading's own fills to make a screenshot lie about what it is showing.
  await page.mouse.move(4, 4);
  await page.waitForTimeout(300);
}

for (const [label, dx, slug] of targets) {
  // Reload for every shot. The sphere auto-rotates at 1.92 deg/s and a run of
  // eight shots drifts most of the way round the world, so a sequence taken in
  // one page load photographs a different hemisphere each time — the third shot
  // of the first run was captioned Africa and showed south Asia. A fresh load
  // always opens on the same meridian.
  await page.goto(base, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(5000);
  const ok = await goTo(label);
  if (!ok) {
    console.log(`  ✗ ${label} — period not reachable on the rail`);
    continue;
  }
  await face(dx);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${dir}/${slug}.png`, animations: "disabled" });
  console.log(`  ✓ ${slug}.png — ${label}`);
}


await browser.close();
console.log("done.");
