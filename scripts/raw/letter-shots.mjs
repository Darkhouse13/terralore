import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const url = "file:///home/darkhouse/terralore/public/ledger/letter/0001.html";
for (const [name, width] of [["digest-email-desktop", 900], ["digest-email-mobile", 390]]) {
  const p = await browser.newPage({ viewport: { width, height: 1200 }, deviceScaleFactor: 2 });
  await p.goto(url, { waitUntil: "load" });
  await p.screenshot({ path: `/home/darkhouse/terralore/design-review/21-ledger-letter/${name}.png`, fullPage: true });
  console.log("saved", name);
  await p.close();
}
await browser.close();
