#!/usr/bin/env node
// ── Social render review sheets ────────────────────────────────────────────
// Renders one sample of every social composition and composes one contact
// sheet per format into design-review/16-social/ — the committed visual
// record for the social pipeline (the same convention as every design-review
// folder). Full-size renders land in design-review/16-social/samples/ but
// only the sheets are meant for review; everything regenerates from here.
//
//   node --import ./scripts/lib/ts-alias-loader.mjs scripts/social-samples.mjs
//
// Sample subjects are fixed, recognisable surfaces (Bastille Day, GDP,
// lithium, deu-vs-fra, Japan's formation) so a reviewer compares layout
// changes against a stable baseline.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { allRankings } from "@/lib/rankings";
import { allCommodities, commoditiesSource, commoditiesUpdated } from "@/lib/commodities";
import { getComparePage } from "@/lib/compare";
import { renderPng } from "./lib/social/render.mjs";
import { h, CARD, FORMATS } from "./lib/social/ui.mjs";
import {
  onThisDayCard,
  rankingCard,
  commodityCard,
  compareCard,
  rankingCarousel,
  formationCarousel,
} from "./lib/social/cards.mjs";
import {
  dateIndex,
  onThisDaySubject,
  rankingSubject,
  commoditySubject,
  compareSubject,
  formationSubject,
} from "./lib/social/subjects.mjs";

const OUT = join(process.cwd(), "design-review/16-social");
mkdirSync(join(OUT, "samples"), { recursive: true });

/* ── sample subjects ──────────────────────────────────────────────────────── */

const otdCandidates = dateIndex().byDay.get("7-14") ?? [];
const otdEntry = otdCandidates.find((e) => e.code === "FRA") ?? otdCandidates[0];
if (!otdEntry) throw new Error("no day-precision event on 14 July — pick another sample day");
const otd = onThisDaySubject(otdEntry, "day", { year: 2026, month: 7, day: 14 });

const gdp = allRankings().find((r) => r.key === "gdp") ?? allRankings()[0];
const rk = rankingSubject(gdp);

const lithium = allCommodities().find((c) => c.slug === "lithium") ?? allCommodities()[0];
const cm = commoditySubject(lithium, commoditiesSource(), commoditiesUpdated());

const pair = getComparePage("deu-vs-fra");
if (!pair) throw new Error("deu-vs-fra is not in the pair set");
const cp = compareSubject(pair);

const fm = formationSubject("JPN");
if (!fm) throw new Error("JPN has no published history");

/* ── render all samples ───────────────────────────────────────────────────── */

async function save(name, element, format) {
  const buf = await renderPng(element, format);
  writeFileSync(join(OUT, "samples", `${name}.png`), buf);
  console.log(`  ${name}.png  ${format.width}×${format.height}  ${(buf.length / 1024).toFixed(0)} KB`);
  return buf;
}

console.log("rendering samples…");
const pin = {
  "pin-on-this-day": await save("pin-on-this-day", onThisDayCard(otd, FORMATS.pin), FORMATS.pin),
  "pin-ranking": await save("pin-ranking", rankingCard(rk, FORMATS.pin), FORMATS.pin),
  "pin-commodity": await save("pin-commodity", commodityCard(cm, FORMATS.pin), FORMATS.pin),
  "pin-compare": await save("pin-compare", compareCard(cp, FORMATS.pin), FORMATS.pin),
};
const vert = {
  "vertical-on-this-day": await save("vertical-on-this-day", onThisDayCard(otd, FORMATS.vertical), FORMATS.vertical),
  "vertical-ranking": await save("vertical-ranking", rankingCard(rk, FORMATS.vertical), FORMATS.vertical),
  "vertical-commodity": await save("vertical-commodity", commodityCard(cm, FORMATS.vertical), FORMATS.vertical),
  "vertical-compare": await save("vertical-compare", compareCard(cp, FORMATS.vertical), FORMATS.vertical),
};

const rkSlides = rankingCarousel(rk);
const rkBufs = [];
for (let i = 0; i < rkSlides.length; i++) {
  rkBufs.push(await save(`carousel-ranking-${i}`, rkSlides[i], FORMATS.vertical));
}
const fmSlides = formationCarousel(fm);
const fmBufs = [];
for (let i = 0; i < fmSlides.length; i++) {
  fmBufs.push(await save(`carousel-formation-${i}`, fmSlides[i], FORMATS.vertical));
}

/* ── contact sheets ───────────────────────────────────────────────────────── */

async function sheet(name, title, cells, { cols, cellW }) {
  const gap = 24;
  const labelH = 34;
  const rows = Math.ceil(cells.length / cols);
  const cellH = Math.round(cellW * (cells[0].h / cells[0].w));
  const width = cols * cellW + (cols + 1) * gap;
  const height = 88 + rows * (cellH + labelH + gap) + gap;
  const tree = h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#0a1d26",
        padding: gap,
      },
    },
    h(
      "div",
      { style: { fontFamily: "mono", fontSize: 26, color: CARD.chalk3, letterSpacing: 6, textTransform: "uppercase", marginBottom: 18 } },
      title,
    ),
    h(
      "div",
      { style: { display: "flex", flexWrap: "wrap", gap } },
      cells.map((c) =>
        h(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: 8 } },
          h("img", {
            src: `data:image/png;base64,${c.buf.toString("base64")}`,
            width: cellW,
            height: cellH,
          }),
          h("div", { style: { fontFamily: "mono", fontSize: 19, color: CARD.chalk3 } }, c.label),
        ),
      ),
    ),
  );
  const buf = await renderPng(tree, { width, height });
  writeFileSync(join(OUT, `${name}.png`), buf);
  console.log(`${name}.png  ${width}×${height}  ${(buf.length / 1024).toFixed(0)} KB`);
}

console.log("composing sheets…");
await sheet(
  "pin-sheet",
  "PIN · 1000×1500 · the four card types",
  Object.entries(pin).map(([label, buf]) => ({ label, buf, w: 1000, h: 1500 })),
  { cols: 4, cellW: 400 },
);
await sheet(
  "vertical-sheet",
  "VERTICAL · 1080×1350 · the four card types",
  Object.entries(vert).map(([label, buf]) => ({ label, buf, w: 1080, h: 1350 })),
  { cols: 4, cellW: 420 },
);
await sheet(
  "carousel-ranking-sheet",
  `CAROUSEL · ranking top-10 · cover + ${rkBufs.length - 1} slides`,
  rkBufs.map((buf, i) => ({ label: i === 0 ? "cover" : `slide ${i}`, buf, w: 1080, h: 1350 })),
  { cols: 4, cellW: 400 },
);
await sheet(
  "carousel-formation-sheet",
  `CAROUSEL · formation story · cover + ${fmBufs.length - 1} slides`,
  fmBufs.map((buf, i) => ({ label: i === 0 ? "cover" : `slide ${i}`, buf, w: 1080, h: 1350 })),
  { cols: 4, cellW: 400 },
);
console.log("done.");
