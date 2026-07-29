#!/usr/bin/env node
// ── Palette contrast validator ──────────────────────────────────────────────
// Accessibility is a hard floor on this project (Lighthouse a11y >= 95), so the
// palette is checked arithmetically when it is designed rather than discovered
// to be wrong by an audit afterwards. Every foreground/background pair the
// design system actually uses is declared here with the role it plays, and the
// role sets the threshold:
//
//   body      >= 4.5   (WCAG AA normal text)
//   large     >= 3.0   (>=24px, or >=19px bold)
//   ui        >= 3.0   (WCAG 1.4.11 — anything required to identify a component
//                       or its state: focus rings, selected tabs, active marks)
//   decor     >= 1.25  (purely decorative separation)
//
// The `decor` tier is a deliberate, narrow exemption, not an escape hatch.
// WCAG 1.4.11 covers graphics "required to understand the content" and visuals
// "required to identify UI components and states". A rule between two sections
// that are already distinguished by a heading, or a border on a panel already
// distinguished by its fill, is neither — it is reinforcement. Pushing those to
// 3:1 makes an editorial page look like a spreadsheet. Anything that carries
// state (focus, selection, the active tab, the playhead) is `ui` and gets 3:1;
// if you find yourself wanting to move something from `ui` to `decor`, that is
// the signal it was load-bearing.

const T = { body: 4.5, large: 3.0, ui: 3.0, decor: 1.25 };

// ── STRATUM palette ─────────────────────────────────────────────────────────
const C = {
  // the deep — dark surfaces (globe, journey, dossier)
  depth6: "#04161F",
  depth5: "#082230",
  depth4: "#0C2E3D",
  depth3: "#123B4C",
  depth2: "#1B4E60",
  depth1: "#276F80",

  // the shore — light surfaces (chronicle, atlas, timeline)
  land0: "#EBE9E0",
  land1: "#DEDACD",
  land2: "#C3BEAC",

  // ink on land
  ink: "#16201E",
  ink2: "#454F4C",
  ink3: "#6C7772",

  // chalk on depth
  chalkHi: "#F2F6F4",
  chalk: "#E6ECEA",
  chalk2: "#AFBFC1",
  chalk3: "#8497A0",
  chalk4: "#71858D",
  chalk5: "#5C6E77",
  chalkRead: "#C8D6D5",

  // the ramp — semantic, not decorative
  copper: "#C87244",
  copperBright: "#E39A67",
  copperDeep: "#8A4A28",
  verdigris: "#57A695",
  verdigrisBright: "#7CC4B3",
  verdigrisDeep: "#2F6E62",
  madder: "#B8453B",
  madderBright: "#D9695E",
  madderDeep: "#9B322A",
};

// [foreground, background, role, description]
const PAIRS = [
  // ── reading on land ──
  [C.ink, C.land0, "body", "chronicle prose on limestone"],
  [C.ink2, C.land0, "body", "secondary prose on limestone"],
  [C.ink3, C.land0, "large", "captions / eyebrows on limestone"],
  [C.ink, C.land1, "body", "prose on raised paper"],
  [C.ink2, C.land1, "body", "secondary on raised paper"],
  [C.land2, C.land0, "decor", "hairline rule on limestone"],
  [C.copperDeep, C.land0, "body", "link / accent text on limestone"],
  [C.copperDeep, C.land0, "ui", "focus ring on limestone"],
  [C.verdigrisDeep, C.land0, "body", "measured-data text on limestone"],
  [C.madderDeep, C.land0, "body", "rupture marker on limestone"],
  [C.ink, C.land2, "body", "prose on a rule-tinted block"],

  // ── interface on the deep ──
  [C.chalkHi, C.depth6, "body", "headings / metric values on abyssal"],
  [C.chalkRead, C.depth6, "body", "serif reading on abyssal (tooltips, journey)"],
  [C.chalk4, C.depth6, "large", "micro source / year text on abyssal"],
  [C.chalk5, C.depth6, "decor", "no-data / disabled on abyssal"],
  [C.chalk, C.depth6, "body", "primary text on abyssal"],
  [C.chalk2, C.depth6, "body", "secondary text on abyssal"],
  [C.chalk3, C.depth6, "large", "micro labels on abyssal"],
  [C.chalk, C.depth4, "body", "primary text on panel"],
  [C.chalk2, C.depth4, "body", "secondary text on panel"],
  [C.chalk3, C.depth4, "large", "micro labels on panel"],
  [C.depth2, C.depth6, "decor", "resting panel border on abyssal"],
  [C.depth1, C.depth6, "ui", "active/selected border, graticule"],
  [C.copper, C.depth6, "ui", "focus ring on abyssal"],
  [C.copper, C.depth4, "ui", "focus ring on panel"],

  // ── the ramp on the deep ──
  [C.copperBright, C.depth6, "body", "accent text on abyssal"],
  [C.copperBright, C.depth4, "body", "accent text on panel"],
  [C.copper, C.depth6, "ui", "accent rule / marker on abyssal"],
  [C.verdigrisBright, C.depth6, "body", "data text on abyssal"],
  [C.verdigris, C.depth6, "ui", "data mark on abyssal"],
  [C.madderBright, C.depth6, "body", "rupture text on abyssal"],
  [C.madder, C.depth6, "ui", "rupture mark on abyssal"],
];

// ── WCAG relative luminance + contrast ──────────────────────────────────────
function srgbToLin(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
function luminance(hex) {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * srgbToLin(r) + 0.7152 * srgbToLin(g) + 0.0722 * srgbToLin(b);
}
function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

// ── Event-category pigments ─────────────────────────────────────────────────
// Ten categories, drawn from the mineral and earth pigments an atlas or an
// illuminated manuscript would actually have used. These are a different axis
// from the three-tint semantic ramp above — except war and disaster, which stay
// in the madder/graphite family because rupture is what madder means.
//
// The hard constraint: a category mark appears on BOTH grounds — the journey and
// timeline rail are on the deep, the chronicle and theme pages are on limestone.
// A single value must therefore clear 3:1 against #04161F *and* #EBE9E0, which
// confines every pigment to a narrow mid-dark luminance window (roughly
// 0.116 <= L <= 0.24). That window is why these read as pigments rather than as
// the bright category colours a chart library would hand you.
const CATEGORY = {
  founding: "#8E6E2E",
  independence: "#A85B2E",
  war: "#B0463C",
  politics: "#5464A1",
  religion: "#85578A",
  culture: "#2C7566",
  economy: "#566F3C",
  colonization: "#96583B",
  migration: "#2C6C84",
  disaster: "#5F6D6C",
};

const CATEGORY_CHALK = {"founding": "#987b41", "independence": "#b26f47", "war": "#be675f", "politics": "#717eb1", "religion": "#99729d", "culture": "#4e8b7e", "economy": "#71865b", "colonization": "#a7735a", "migration": "#54889b", "disaster": "#778382"};

const CATEGORY_INK = {"founding": "#806329", "independence": "#9c552b", "war": "#ae453b", "politics": "#5464a1", "religion": "#85578a", "culture": "#2b7364", "economy": "#566f3c", "colonization": "#95573a", "migration": "#2c6c84", "disaster": "#5c6a69"};

for (const [name, hex] of Object.entries(CATEGORY)) {
  PAIRS.push([hex, C.depth6, "ui", `category ${name} — mark on the deep`]);
  PAIRS.push([hex, C.land0, "ui", `category ${name} — mark on limestone`]);
  // The `ink` variant is what may carry words: the mark pigments are sized for
  // 3:1 and four of the ten miss 4.5:1 as small text, which is a real bug and
  // not a near miss. Asserting both keeps the pair honest.
  PAIRS.push([CATEGORY_INK[name], C.land0, "body", `category ${name} — INK, small text on limestone`]);
  PAIRS.push([CATEGORY_CHALK[name], C.depth6, "body", `category ${name} — CHALK, small text on the deep`]);
}

let failed = 0;
console.log("STRATUM — contrast check\n");
console.log("  ratio  need  role   pair");
for (const [fg, bg, role, desc] of PAIRS) {
  const r = contrast(fg, bg);
  const need = T[role];
  const ok = r >= need;
  if (!ok) failed++;
  console.log(
    `  ${ok ? "✓" : "✗"} ${r.toFixed(2).padStart(5)}  ${need.toFixed(1)}  ${role.padEnd(5)}  ${fg} on ${bg} — ${desc}`,
  );
}

console.log();
if (failed) {
  console.error(`✗ ${failed} pair(s) below threshold — fix the palette, not the threshold.`);
  process.exit(1);
}
console.log(`✓ all ${PAIRS.length} declared pairs meet WCAG AA for their role.`);
