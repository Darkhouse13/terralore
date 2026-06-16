import { chromium } from "playwright";
const browser = await chromium.launch({ args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"] });
const p = await browser.newPage({ viewport:{width:1340,height:1000}, deviceScaleFactor:2 });
p.on("pageerror",e=>console.log("PAGEERR:",e.message));
await p.goto("http://localhost:3000/country/MAR",{waitUntil:"load",timeout:60000});
await p.waitForTimeout(1600);
await p.screenshot({ path:"design/screens-meridian/morocco-dossier.png", clip:{x:0,y:0,width:1340,height:620}, timeout:60000 });
console.log("saved morocco-dossier");
await browser.close();
