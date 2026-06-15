// Capture the redesigned (Meridian) dossier to verify fidelity. Dev server on :3000.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = "http://localhost:3000";
const dir = "design/screens-meridian";
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

// dossier overview (full page)
{ const p = await page(); await go(p, "/country/FRA"); await p.waitForTimeout(1800); await shot(p, "01-dossier-overview", true); await p.close(); }

// economy domain tab
{ const p = await page(); await go(p, "/country/FRA"); await p.waitForTimeout(1400);
  await p.getByRole("button", { name: "Economy", exact: true }).click(); await p.waitForTimeout(700);
  await shot(p, "02-dossier-economy", true); await p.close(); }

// info tooltip on a metric card (hover the first "i")
{ const p = await page(); await go(p, "/country/FRA"); await p.waitForTimeout(1400);
  await p.getByRole("button", { name: "Economy", exact: true }).click(); await p.waitForTimeout(700);
  const info = p.getByRole("button", { name: /^What is / }).first();
  await info.hover(); await p.waitForTimeout(400);
  await shot(p, "03-info-tooltip"); await p.close(); }

// a contested / partial-data country (graceful degradation)
{ const p = await page(); await go(p, "/country/TWN"); await p.waitForTimeout(1600); await shot(p, "04-dossier-degraded", true); await p.close(); }

await browser.close();
console.log("ALL DONE");
