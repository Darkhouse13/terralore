import { chromium } from "playwright";
const browser = await chromium.launch({
  args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"],
});
// mid-entrance (~0.9s in): expect partial reveal
{ const p = await browser.newPage({ viewport:{width:1500,height:940}, deviceScaleFactor:1.5 });
  await p.goto("http://localhost:3000/",{waitUntil:"load",timeout:60000});
  await p.waitForTimeout(900);
  await p.screenshot({ path:"design/screens-meridian/entrance-mid.png", timeout:60000 });
  console.log("saved entrance-mid"); await p.close(); }
// settled (final state)
{ const p = await browser.newPage({ viewport:{width:1500,height:940}, deviceScaleFactor:1.5 });
  await p.goto("http://localhost:3000/",{waitUntil:"load",timeout:60000});
  await p.waitForTimeout(7000);
  await p.screenshot({ path:"design/screens-meridian/entrance-settled.png", timeout:60000 });
  console.log("saved entrance-settled"); await p.close(); }
await browser.close(); console.log("ALL DONE");
