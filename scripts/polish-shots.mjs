import { chromium } from "playwright";
const browser = await chromium.launch({ args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"] });
// desktop selection: focus scrim + brass outline
{ const p = await browser.newPage({ viewport:{width:1500,height:940}, deviceScaleFactor:1.5 });
  p.on("pageerror",e=>console.log("PAGEERR:",e.message));
  await p.goto("http://localhost:3000/",{waitUntil:"load",timeout:60000}); await p.waitForTimeout(7000);
  for (const [x,y] of [[760,470],[800,500],[720,440]]) { await p.mouse.click(x,y); await p.waitForTimeout(900);
    if (await p.evaluate(()=>!!document.querySelector('a[href^="/country/"]'))) break; }
  await p.waitForTimeout(1000);
  await p.screenshot({ path:"design/screens-meridian/polish-desktop-select.png", timeout:60000 });
  console.log("saved polish-desktop-select"); await p.close(); }
// mobile default (color-by bar)
{ const p = await browser.newPage({ viewport:{width:390,height:844}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  p.on("pageerror",e=>console.log("PAGEERR:",e.message));
  await p.goto("http://localhost:3000/",{waitUntil:"load",timeout:60000}); await p.waitForTimeout(7000);
  await p.screenshot({ path:"design/screens-meridian/polish-mobile.png", timeout:60000 });
  console.log("saved polish-mobile");
  // tap a layer pill → legend appears
  await p.getByRole("button",{name:"Life expectancy",exact:true}).click().catch(()=>{}); await p.waitForTimeout(1800);
  await p.screenshot({ path:"design/screens-meridian/polish-mobile-active.png", timeout:60000 });
  console.log("saved polish-mobile-active"); await p.close(); }
await browser.close(); console.log("ALL DONE");
