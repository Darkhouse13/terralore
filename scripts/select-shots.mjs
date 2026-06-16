import { chromium } from "playwright";
const browser = await chromium.launch({ args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"] });
const p = await browser.newPage({ viewport:{width:1500,height:940}, deviceScaleFactor:1.5 });
p.on("pageerror",e=>console.log("PAGEERR:",e.message));
await p.goto("http://localhost:3000/",{waitUntil:"load",timeout:60000});
await p.waitForTimeout(7000);
// click a front-centre country on the globe to trigger the selection card
for (const [x,y] of [[760,470],[800,500],[720,440],[840,520]]) {
  await p.mouse.click(x,y); await p.waitForTimeout(900);
  const has = await p.evaluate(()=>!!document.querySelector('a[href^="/country/"]'));
  if (has) { console.log("selected at", x, y); break; }
}
await p.waitForTimeout(1200);
await p.screenshot({ path:"design/screens-meridian/home-selected.png", timeout:60000 });
console.log("saved home-selected");
await browser.close();
