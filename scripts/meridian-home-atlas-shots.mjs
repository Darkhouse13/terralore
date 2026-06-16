import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const base = "http://localhost:3000";
const dir = "design/screens-meridian";
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({
  args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"],
});
async function page(){ const p = await browser.newPage({ viewport:{width:1512,height:950}, deviceScaleFactor:2 }); p.on("pageerror",e=>console.log("PAGEERR:",e.message)); return p; }
const go=(p,path)=>p.goto(base+path,{waitUntil:"load",timeout:60000});
const shot=(p,n,full=false)=>p.screenshot({path:`${dir}/${n}.png`,fullPage:full,animations:"disabled",timeout:60000}).then(()=>console.log("saved",n));

{ const p=await page(); await go(p,"/"); await p.waitForTimeout(6500);
  await p.getByRole("button",{name:"Life expectancy",exact:true}).click().catch(()=>{}); await p.waitForTimeout(1500);
  await shot(p,"home-01-choropleth"); await p.close(); }
{ const p=await page(); await go(p,"/atlas"); await p.waitForTimeout(1500); await shot(p,"atlas-01"); await p.close(); }
{ const p=await page(); await go(p,"/atlas"); await p.waitForTimeout(1200);
  await p.getByPlaceholder(/Search/).fill("zzzzz"); await p.waitForTimeout(500);
  await shot(p,"atlas-02-empty"); await p.close(); }
await browser.close(); console.log("ALL DONE");
