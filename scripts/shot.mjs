import { chromium } from "playwright";

const url = process.argv[2] || "http://localhost:3000/";
const out = process.argv[3] || "shot.png";
const waitMs = Number(process.argv[4] ?? 4500);

const browser = await chromium.launch({
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
  ],
});
const page = await browser.newPage({
  viewport: {
    width: Number(process.env.WIDTH ?? 1440),
    height: Number(process.env.HEIGHT ?? 900),
  },
  deviceScaleFactor: Number(process.env.DSF ?? 2),
});
page.on("console", (m) => {
  if (m.type() === "error") console.log("PAGE ERROR:", m.text());
});
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(waitMs);
if (process.env.KEYS) {
  for (const k of process.env.KEYS.split(",")) {
    await page.keyboard.press(k.trim());
    await page.waitForTimeout(650);
  }
}
if (process.env.CLICK) {
  const [x, y] = process.env.CLICK.split(",").map(Number);
  await page.mouse.click(x, y);
  await page.waitForTimeout(1200);
}
if (process.env.SCROLL) {
  await page.evaluate((y) => window.scrollTo(0, Number(y)), process.env.SCROLL);
  await page.waitForTimeout(700);
}
await page.screenshot({ path: out, fullPage: process.env.FULL === "1" });
console.log("saved", out);
await browser.close();
