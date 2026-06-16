import { chromium } from "playwright";
const browser = await chromium.launch({ args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"] });
const p = await browser.newPage({ viewport:{width:1500,height:940}, deviceScaleFactor:1 });
await p.goto("http://localhost:3000/",{waitUntil:"load",timeout:60000});
await p.waitForTimeout(7000);
// hover a country
for (const [x,y] of [[760,470],[800,500]]) { await p.mouse.move(x,y); await p.waitForTimeout(500); }
const info = await p.evaluate(() => {
  const out = [];
  document.querySelectorAll("div").forEach(d => {
    const cls = d.getAttribute("class") || "";
    if (/tooltip/i.test(cls)) out.push({ cls, html: d.innerHTML.slice(0,40) });
  });
  return out;
});
console.log(JSON.stringify(info, null, 0));
await browser.close();
