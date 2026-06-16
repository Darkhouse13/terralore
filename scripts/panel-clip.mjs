import { chromium } from "playwright";
const browser = await chromium.launch({
  args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"],
});
const p = await browser.newPage({ viewport:{width:1600,height:1000}, deviceScaleFactor:2 });
p.on("pageerror",e=>console.log("PAGEERR:",e.message));
await p.goto("http://localhost:3000/",{waitUntil:"load",timeout:60000});
await p.waitForTimeout(7000);
await p.getByRole("button",{name:"Life expectancy",exact:true}).click();
await p.waitForTimeout(1500);
// hover over the globe (Africa-ish, front-centre) to drive the legend marker
for (const [x,y] of [[820,560],[860,520],[800,600],[900,540]]) { await p.mouse.move(x,y); await p.waitForTimeout(350); }
await p.waitForTimeout(600);
await p.screenshot({ path:"design/screens-meridian/panel-hover.png", clip:{x:28,y:690,width:480,height:300}, timeout:60000 });
console.log("saved panel-hover");
await browser.close();
