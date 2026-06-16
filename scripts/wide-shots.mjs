import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const base = "http://localhost:3000";
const dir = "design/screens-meridian";
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({
  args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"],
});
async function page(){ const p = await browser.newPage({ viewport:{width:1920,height:1080}, deviceScaleFactor:1 }); p.on("pageerror",e=>console.log("PAGEERR:",e.message)); return p; }
const go=(p,path)=>p.goto(base+path,{waitUntil:"load",timeout:60000});
const shot=(p,n,full=false)=>p.screenshot({path:`${dir}/${n}.png`,fullPage:full,animations:"disabled",timeout:60000}).then(()=>console.log("saved",n));
{ const p=await page(); await go(p,"/country/FRA"); await p.waitForTimeout(1600); await shot(p,"wide-dossier-overview",true); await p.close(); }
{ const p=await page(); await go(p,"/atlas"); await p.waitForTimeout(1400); await shot(p,"wide-atlas"); await p.close(); }
await browser.close(); console.log("ALL DONE");
