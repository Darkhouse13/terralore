import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const dir = "design-review/21-ledger-letter";
const shots = [
  ["front-door-390", "http://localhost:3311/", 390, 1600, true],
  ["front-door-1440", "http://localhost:3311/", 1440, 950, true],
  ["ledger-bed-390", "http://localhost:3311/ledger", 390, 1200, true],
  ["ledger-bed-1440", "http://localhost:3311/ledger", 1440, 1100, true],
  ["entry-bed-390", "http://localhost:3311/ledger/0001", 390, 1200, true],
  ["letter-page-1440", "http://localhost:3311/ledger/letter/0001", 1440, 1100, true],
  ["letter-page-390", "http://localhost:3311/ledger/letter/0001", 390, 1200, true],
  ["privacy-390", "http://localhost:3311/privacy", 390, 1200, true],
];
for (const [name, url, width, height, full] of shots) {
  const p = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  await p.goto(url, { waitUntil: "load", timeout: 60000 });
  await p.waitForTimeout(1600);
  await p.screenshot({ path: `${dir}/${name}.png`, fullPage: full, animations: "disabled" });
  console.log("saved", name);
  await p.close();
}
await browser.close();
