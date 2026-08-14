#!/usr/bin/env node
// ── The shipped-surface contrast sweep ──────────────────────────────────────
// The arithmetic proof (check-contrast-strata.mjs) proves the PALETTE; this
// sweep proves the USAGE: every visible text node on the shipped surfaces,
// computed foreground against the nearest painted ancestor ground, asserted
// at the WCAG threshold for its rendered size (4.5:1, or 3:1 at ≥24px /
// ≥18.66px bold). Written for the cascade-layer repair — the unlayered
// `a { color }` rule used to outrank text utilities and no static check
// could see it; computed styles can.
//
// Usage: CHROME_PATH=… node scripts/contrast-sweep.mjs [--base URL]

import { chromium } from "playwright";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : d;
};
const BASE = flag("base", "http://127.0.0.1:3311").replace(/\/$/, "");
if (!process.env.CHROME_PATH) {
  console.error("✗ set CHROME_PATH");
  process.exit(1);
}

const PAGES = [
  "/",
  "/atlas",
  "/country/FRA",
  "/country/AFG",
  "/country/JPN",
  "/rankings",
  "/rankings/gdp",
  "/compare",
  "/compare/deu-vs-fra",
  "/commodities",
  "/commodities/lithium",
  "/timeline",
  "/themes",
  "/country/FRA/chronicle",
];

const AUDIT = () => {
  const lum = (r, g, b) => {
    const f = (c) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const parse = (s) => {
    const m = s.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
    return m ? [+m[1], +m[2], +m[3], m[4] == null ? 1 : +m[4]] : null;
  };
  const ground = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c[3] > 0.9) return c;
    }
    return [255, 255, 255, 1];
  };
  const bad = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const t = walker.currentNode;
    if (!t.textContent.trim()) continue;
    const el = t.parentElement;
    if (!el || seen.has(el)) continue;
    seen.add(el);
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    // skip sr-only / clipped-away text
    if (r.width <= 1 || r.height <= 1) continue;
    // skip the rotated-away face of a proof-flip: its backface is hidden
    if (el.closest(".flip-back") && !el.closest("[data-flipped='true']")) {
      const card = el.closest(".flip-card");
      const tf = card ? getComputedStyle(card).transform : "none";
      if (tf === "none" || tf === "matrix(1, 0, 0, 1, 0, 0)") continue;
    }
    const fg = parse(cs.color);
    if (!fg || fg[3] < 0.99) continue;
    const bg = ground(el);
    const L1 = lum(fg[0], fg[1], fg[2]);
    const L2 = lum(bg[0], bg[1], bg[2]);
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const px = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const large = px >= 24 || (bold && px >= 18.66);
    // The strata "label class" (check-contrast-strata.mjs): mono micro-labels
    // that ride beside stronger text and repeat information — held to ≥3:1.
    const label = px <= 12.5 && /mono/i.test(cs.fontFamily);
    const min = large || label ? 3 : 4.5;
    if (ratio < min) {
      bad.push({
        text: t.textContent.trim().slice(0, 48),
        fg: cs.color,
        bg: `rgb(${bg[0]}, ${bg[1]}, ${bg[2]})`,
        ratio: +ratio.toFixed(2),
        min,
        px,
        tag: el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.split(" ").slice(0, 3).join(".") : ""),
      });
    }
  }
  return bad;
};

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
let total = 0;
for (const width of [390, 1440]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  for (const path of PAGES) {
    const page = await ctx.newPage();
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    const bad = await page.evaluate(AUDIT);
    // dedupe identical (fg,bg,tag) shapes per page
    const uniq = [...new Map(bad.map((b) => [`${b.fg}|${b.bg}|${b.tag}`, b])).values()];
    if (uniq.length) {
      total += uniq.length;
      console.log(`✗ ${path} @${width}:`);
      for (const b of uniq) console.log(`   ${b.ratio}:1 (≥${b.min}) ${b.fg} on ${b.bg} — <${b.tag}> "${b.text}"`);
    } else {
      console.log(`✓ ${path} @${width}`);
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
if (total) {
  console.error(`\n✗ ${total} failing computed pair(s) across the sweep`);
  process.exit(1);
}
console.log("\n✓ shipped-surface sweep clean — every rendered pair clears its threshold");
