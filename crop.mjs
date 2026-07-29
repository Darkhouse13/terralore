import { chromium } from "playwright";
import { readdirSync, existsSync, mkdirSync } from "node:fs";
const pw = process.env.HOME + "/.cache/ms-playwright";
const exe = readdirSync(pw).filter(n=>n.startsWith("chromium-")).map(d=>`${pw}/${d}/chrome-linux64/chrome`).find(existsSync);
mkdirSync("design-review/10-audit", { recursive: true });
const b = await chromium.launch({ executablePath: exe, args:["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 2 });
for (const [name, path, scroll] of JSON.parse(process.argv[2])) {
  await p.goto("http://127.0.0.1:3000" + path, { waitUntil: "load", timeout: 60000 });
  await p.waitForTimeout(1400);
  if (scroll) { await p.evaluate(y => window.scrollTo(0, y), scroll); await p.waitForTimeout(500); }
  await p.screenshot({ path: `design-review/10-audit/${name}.png` });
}
await b.close();
