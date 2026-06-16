// Capture the redesigned (Meridian) history journey. Dev server on :3000.
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
const shot = (p, name) =>
  p.screenshot({ path: `${dir}/${name}.png`, animations: "disabled", timeout: 60000 }).then(() => console.log("saved", name));

const p = await page();
await go(p, "/country/FRA/history");
await p.waitForTimeout(2600);
await shot(p, "journey-01-intro");

await p.getByRole("button", { name: /Begin the journey/ }).click();
await p.waitForTimeout(1400);
await shot(p, "journey-02-era");

// open the chapter drawer from the era moment
await p.getByRole("button", { name: /Read the full chapter/ }).click();
await p.waitForTimeout(1200);
await shot(p, "journey-03-drawer");
await p.keyboard.press("Escape");
await p.waitForTimeout(900);

// advance to an event moment
await p.keyboard.press("ArrowRight");
await p.waitForTimeout(1100);
await shot(p, "journey-04-event");

// travel to the outro
for (let k = 0; k < 45; k++) { await p.keyboard.press("ArrowRight"); await p.waitForTimeout(70); }
await p.waitForTimeout(900);
await shot(p, "journey-05-outro");

await p.close();
await browser.close();
console.log("ALL DONE");
