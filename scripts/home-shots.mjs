import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const base = "http://localhost:3000";
const dir = "design/screens-meridian";
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({
  args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"],
});
async function page(){ const p = await browser.newPage({ viewport:{width:1600,height:1000}, deviceScaleFactor:1.5 }); p.on("pageerror",e=>console.log("PAGEERR:",e.message)); return p; }
const go=(p,path)=>p.goto(base+path,{waitUntil:"load",timeout:60000});
const shot=(p,n)=>p.screenshot({path:`${dir}/${n}.png`,animations:"disabled",timeout:60000}).then(()=>console.log("saved",n));
// default globe (graticule + space)
{ const p=await page(); await go(p,"/"); await p.waitForTimeout(7000); await shot(p,"home-globe-v2"); await p.close(); }
// with choropleth on
{ const p=await page(); await go(p,"/"); await p.waitForTimeout(7000);
  await p.getByRole("button",{name:"Life expectancy",exact:true}).click().catch(()=>{}); await p.waitForTimeout(2000);
  await shot(p,"home-choropleth-v2"); await p.close(); }
await browser.close(); console.log("ALL DONE");
