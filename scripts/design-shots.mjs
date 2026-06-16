// Capture current-state screenshots of every surface for the Claude Design brief.
// Saves to design/screens/. Run with the dev server up on :3000.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = "http://localhost:3000";
const dir = "design/screens";
mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});

async function page() {
  const p = await browser.newPage({ viewport: { width: 1512, height: 950 }, deviceScaleFactor: 2 });
  p.on("pageerror", (e) => console.log("PAGEERR:", e.message));
  return p;
}
const go = (p, path) => p.goto(base + path, { waitUntil: "load", timeout: 60000 });
const shot = (p, name, full = false) =>
  p.screenshot({ path: `${dir}/${name}.png`, fullPage: full, animations: "disabled", timeout: 60000 }).then(() => console.log("saved", name));

// 1 — home globe (default chrome)
{ const p = await page(); await go(p, "/"); await p.waitForTimeout(6500); await shot(p, "01-home-globe"); await p.close(); }

// 2 — home with a choropleth layer on
{ const p = await page(); await go(p, "/"); await p.waitForTimeout(6500);
  await p.getByRole("button", { name: "Life expectancy", exact: true }).click(); await p.waitForTimeout(1600);
  await shot(p, "02-home-choropleth"); await p.close(); }

// 3 — dossier Overview (full page: facts + "How … compares" + highlights)
{ const p = await page(); await go(p, "/country/FRA"); await p.waitForTimeout(1500); await shot(p, "03-dossier-overview", true); await p.close(); }

// 4 — dossier domain tab (metric-card grid + sparklines)
{ const p = await page(); await go(p, "/country/FRA"); await p.waitForTimeout(1200);
  await p.getByRole("button", { name: "Economy", exact: true }).click(); await p.waitForTimeout(900);
  await shot(p, "04-dossier-economy", true); await p.close(); }

// 5 — atlas index
{ const p = await page(); await go(p, "/atlas"); await p.waitForTimeout(1400); await shot(p, "05-atlas", true); await p.close(); }

// 6-9 — history journey
{ const p = await page(); await go(p, "/country/FRA/history"); await p.waitForTimeout(2800);
  await shot(p, "06-journey-intro");
  await p.getByRole("button", { name: /Begin the journey/ }).click(); await p.waitForTimeout(1600);
  await shot(p, "07-journey-era");
  await p.keyboard.press("ArrowRight"); await p.waitForTimeout(1300);
  await shot(p, "08-journey-event");
  try { await p.getByRole("button", { name: /Read the full chapter/ }).click({ timeout: 1500 }); }
  catch { try { await p.getByRole("button", { name: /Read chapter/ }).click({ timeout: 1500 }); } catch {} }
  await p.waitForTimeout(1400);
  await shot(p, "09-journey-chapter-drawer");
  await p.close(); }

await browser.close();
console.log("ALL DONE");
