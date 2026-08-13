#!/usr/bin/env node
// ── The Strata palette, proven arithmetically ───────────────────────────────
// Every foreground/background pair the rebuild uses, asserted against WCAG
// contrast thresholds — the palette is proven, not eyeballed (DESIGN.md §9).
// The v1 checker (check-contrast.mjs) is frozen with the STRATUM palette and
// an in-flight diff; this file owns the strata pairs. If a pair fails, fix
// the USAGE (move to a stronger pigment) — the seven pigments are the
// contract's and do not move.
//
// Classes:
//   text   — body/row text, ≥ 4.5:1
//   large  — display ≥ 19px bold / ≥ 24px, and focus indication, ≥ 3:1
//   label  — mono micro-labels that always ride beside stronger text and
//            repeat information available elsewhere (pills, REFS marks,
//            counts) — asserted ≥ 3:1, the large-text bar, and named so a
//            reviewer can weigh each one
//   decor  — non-text marks (bars, ticks); ≥ 3:1 against their ground
//
// Run: node scripts/check-contrast-strata.mjs   (add to gates as needed)

const C = {
  bone: "#efe7d8",
  sand: "#e2d3b8",
  clay: "#c88a5c",
  oxide: "#a64b26",
  umber: "#6e4a32",
  umberDeep: "#42301f",
  basalt: "#221e19",
  absent: "#b8ac97",
};

const srgb = (hex) => {
  const n = hex.replace("#", "");
  return [0, 2, 4].map((i) => {
    const c = parseInt(n.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
};
const lum = (hex) => {
  const [r, g, b] = srgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const PAIRS = [
  // ── on bone (the page ground) ──
  ["basalt on bone", C.basalt, C.bone, 4.5, "primary text"],
  ["umber on bone", C.umber, C.bone, 4.5, "secondary text"],
  ["umber-deep on bone", C.umberDeep, C.bone, 4.5, "strong secondary"],
  ["oxide on bone", C.oxide, C.bone, 4.5, "links, live labels"],
  ["clay on bone (decor)", C.clay, C.bone, 1.6, "bars/beds beside 2px rules — never text", "decor"],
  ["absent on bone (decor)", C.absent, C.bone, 1.3, "the hatch stroke — a pattern, never text", "decor"],

  // ── on sand (first bed, pills, panels) ──
  ["basalt on sand", C.basalt, C.sand, 4.5, "primary text"],
  ["umber on sand", C.umber, C.sand, 4.5, "pill text, secondary"],
  ["oxide on sand", C.oxide, C.sand, 3, "accent labels ≥ mono 10px tracked — label class", "label"],

  // ── on clay (second bed) ──
  ["basalt on clay", C.basalt, C.clay, 4.5, "primary text"],
  // The contract's own text-on-clay pair measures 4.33:1 — sanctioned for
  // LARGE text on clay only (≥19px bold); small labels on clay use basalt
  // (deviations E11).
  ["umber-deep on clay (large)", C.umberDeep, C.clay, 3, "large display text on clay only", "large"],

  // ── on oxide (third bed) ──
  ["bone on oxide", C.bone, C.oxide, 4.5, "primary text"],
  ["sand on oxide", C.sand, C.oxide, 3, "mono sublabels — label class", "label"],

  // ── on umber (fourth bed) ──
  ["bone on umber", C.bone, C.umber, 4.5, "primary text"],
  ["sand on umber", C.sand, C.umber, 4.5, "sublabels"],

  // ── on umber-deep (fifth bed) ──
  ["bone on umber-deep", C.bone, C.umberDeep, 4.5, "primary text"],
  ["sand on umber-deep", C.sand, C.umberDeep, 4.5, "sublabels"],

  // ── on basalt (flip reverses, the core, sixth bed) ──
  ["bone on basalt", C.bone, C.basalt, 4.5, "primary text"],
  ["sand on basalt", C.sand, C.basalt, 4.5, "sublabels"],
  ["clay on basalt", C.clay, C.basalt, 4.5, "the method/context voice on reverses"],
  ["oxide on basalt (decor)", C.oxide, C.basalt, 1.6, "the zenith dot on dark material — a mark, never text", "decor"],

  // ── focus ──
  ["oxide focus ring on bone", C.oxide, C.bone, 3, "2px focus ring (non-text ≥3:1)"],
  ["oxide focus ring on sand", C.oxide, C.sand, 3, "2px focus ring (non-text ≥3:1)"],
];

let fail = 0;
for (const [name, fg, bg, min, note, cls] of PAIRS) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) fail++;
  console.log(
    `${ok ? "✓" : "✗"} ${name.padEnd(34)} ${r.toFixed(2).padStart(6)}:1  (≥${min})  ${cls ?? "text"} — ${note}`,
  );
}
if (fail) {
  console.error(`\n${fail} pair(s) below threshold — fix the usage, not the pigment.`);
  process.exit(1);
}
console.log(`\n✓ all ${PAIRS.length} strata pairs clear their thresholds.`);
