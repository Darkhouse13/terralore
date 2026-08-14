// ── The letter's stamp — TERRALORE as a hosted image ───────────────────────
// Email clients cannot load the strata faces, so the letter's one piece of
// true brand typography is a pre-rendered PNG: the ZENITH compact cut beside
// the Bricolage-800 wordmark, basalt on transparent, oxide dot — rendered at
// 2× through the same offline satori pipeline as the social cards
// (scripts/lib/social/render.mjs; fetch fused shut, committed fonts only).
//
// Output: public/brand/letter-stamp.png (displayed at 260×32 in the letter).
// Deterministic: same fonts + same tree → same bytes. Run once, commit.
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { renderPng } from "./lib/social/render.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const BASALT = "#221E19";
const OXIDE = "#A64B26";

// The ZENITH compact cut (app/icon0.svg geometry), drawn inline for satori.
const mark = {
  type: "svg",
  props: {
    viewBox: "0 0 32 32",
    width: 56,
    height: 56,
    children: [
      {
        type: "path",
        props: {
          d: "M2 23.5 H30 M6 23.5 A10 10 0 0 1 26 23.5 M16 23.5 V13.5 M10.5 23.5 A5.5 10 0 0 1 16 13.5 M16 13.5 A5.5 10 0 0 1 21.5 23.5",
          fill: "none",
          stroke: BASALT,
          strokeWidth: 2.75,
        },
      },
      { type: "circle", props: { cx: 16, cy: 8.5, r: 2, fill: OXIDE } },
    ],
  },
};

const tree = {
  type: "div",
  props: {
    style: {
      width: 520,
      height: 64,
      display: "flex",
      alignItems: "center",
      gap: 14,
      backgroundColor: "transparent",
    },
    children: [
      mark,
      {
        type: "div",
        props: {
          style: {
            fontFamily: "Bricolage",
            fontSize: 52,
            fontWeight: 800,
            letterSpacing: "0.01em",
            color: BASALT,
            display: "flex",
          },
          children: "TERRALORE",
        },
      },
    ],
  },
};

const png = await renderPng(tree, { width: 520, height: 64 });
mkdirSync(join(root, "public", "brand"), { recursive: true });
writeFileSync(join(root, "public", "brand", "letter-stamp.png"), png);
console.log(`✓ public/brand/letter-stamp.png — ${png.length.toLocaleString("en")} bytes (display at 260×32)`);
