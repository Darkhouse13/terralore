#!/usr/bin/env node
// ── Channel art: the YouTube banner ─────────────────────────────────────────
// 2560×1440, everything that must be read inside YouTube's 1546×423 safe
// area (the only part every device shows). The world is drawn in the bed
// pigments — each nation a seeded bed colour, bone seams between them — and
// the signature sits on a bone plate with a 2px basalt rule, over the map.
// Same offline satori path as the social cards (render.mjs): no fetch, no
// emoji, committed faces only.
//
//   node --import ./scripts/lib/ts-alias-loader.mjs scripts/build-channel-art.mjs
//
// Writes social-out/brand/youtube-banner.png (+ a safe-area proof).

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderPng } from "./lib/social/render.mjs";
import { h, BRAND, CARD, zenithMark, baseline } from "./lib/social/ui.mjs";
import { buildMap, WINDOWS } from "./lib/social/pinmap.mjs";
import { mulberry32, seedFrom } from "@/components/brand/strata";
import { readFileSync } from "node:fs";

const W = 2560;
const H = 1440;
const SAFE = { w: 1546, h: 423 };
const BONE = "#efe7d8";
const SAND = "#e2d3b8";
const CLAY = "#c88a5c";
const ABSENT = "#b8ac97";
const UMBER = "#6e4a32";

// Each nation takes a bed pigment, seeded by its code — the world as strata.
const geo = JSON.parse(readFileSync("public/data/countries.geo.json", "utf8"));
const BEDS = [SAND, SAND, CLAY, ABSENT, SAND, CLAY];
const fills = new Map(
  geo.features.map((f) => {
    const r = mulberry32(seedFrom(`banner-${f.properties.code}`))();
    return [f.properties.code, BEDS[Math.floor(r * BEDS.length)]];
  }),
);

// A window tighter than the world view, so the desktop band (the middle
// 423 px, full width) crosses land on both sides of the plate: the Americas
// to the left, Africa, Asia and Australia to the right.
WINDOWS.Banner = { lon: [-118, 158], lat: [-47, 60] };
const MAP_H = H;
const { svg } = buildMap({ window: "Banner", width: W, height: MAP_H, fills, outside: SAND, stroke: BONE, strokeWidth: 2 });

const plate = h(
  "div",
  {
    style: {
      position: "absolute",
      left: (W - SAFE.w) / 2,
      top: (H - SAFE.h) / 2,
      width: SAFE.w,
      height: SAFE.h,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 64,
      background: BONE,
      border: `4px solid ${BRAND.basalt}`,
    },
  },
  zenithMark(230),
  h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 14 } },
    h(
      "div",
      { style: { display: "flex", fontFamily: "Bricolage", fontWeight: 800, fontSize: 150, letterSpacing: -3, lineHeight: 1, color: CARD.chalk } },
      "TERRALORE",
    ),
    h(
      "div",
      { style: { display: "flex", fontFamily: "Schibsted", fontWeight: 700, fontSize: 50, color: CARD.chalk2 } },
      "Why the map looks the way it does.",
    ),
    h(
      "div",
      { style: { display: "flex", alignItems: "center", gap: 16, marginTop: 10, fontFamily: "mono", fontSize: 30, letterSpacing: 7, color: UMBER } },
      h("div", { style: { width: 16, height: 16, background: BRAND.oxide } }),
      "EVERY NATION · SOURCED · TERRALORE.CO",
    ),
  ),
);

const tree = h(
  "div",
  { style: { width: W, height: H, display: "flex", position: "relative", background: BONE } },
  h("div", { style: { position: "absolute", left: 0, top: 0, width: W, height: H, overflow: "hidden", display: "flex" } }, svg),
  plate,
  h(
    "div",
    { style: { position: "absolute", left: 0, bottom: 0, width: W, display: "flex", flexDirection: "column" } },
    h("div", { style: { display: "flex", width: "100%", height: 6, background: BRAND.basalt } }),
    baseline("youtube-banner", { blocks: 90, height: 22 }),
  ),
);

const out = "social-out/brand";
mkdirSync(out, { recursive: true });
const png = await renderPng(tree, { width: W, height: H });
writeFileSync(join(out, "youtube-banner.png"), png);

// The proof: the same art with the safe area and the desktop band outlined.
const proof = h(
  "div",
  { style: { width: W, height: H, display: "flex", position: "relative" } },
  h("img", { src: `data:image/png;base64,${png.toString("base64")}`, width: W, height: H }),
  h("div", { style: { position: "absolute", left: 0, top: (H - SAFE.h) / 2, width: W, height: SAFE.h, border: "6px dashed #1f6feb", display: "flex" } }),
);
writeFileSync(join(out, "youtube-banner-proof.png"), await renderPng(proof, { width: W, height: H }));
console.log(`banner → ${out}/youtube-banner.png (${(png.length / 1024).toFixed(0)} KB)`);

// ── The avatar: 800×800, shown as a circle ──────────────────────────────────
// The site icon's composition (public/icon-512.png): basalt mark, oxide dot,
// on bone. The mark stays inside the inscribed circle with clearspace.
const avatar = h(
  "div",
  { style: { width: 800, height: 800, display: "flex", alignItems: "center", justifyContent: "center", background: BONE } },
  zenithMark(520),
);
writeFileSync(join(out, "avatar.png"), await renderPng(avatar, { width: 800, height: 800 }));
console.log(`avatar → ${out}/avatar.png`);
