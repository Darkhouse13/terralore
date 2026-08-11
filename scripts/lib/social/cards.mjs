// ── The four social card types + the two carousels, as compositions ────────
// Pure functions: (subject, format) → element tree. Subjects are plain data
// prepared by the calendar layer (calendar.mjs) from the SAME lib modules the
// pages render from — nothing on a card is authored for the card.
//
// Editorial constraints, inherited from the surfaces these cards trail:
//   · figures are compared/ranked by arithmetic, never graded — "highest",
//     never "best"; the compare card sets values side by side in slug order;
//   · a top-10 strip names how many nations are ranked in full, so ten rows
//     cannot read as the whole table;
//   · the commodity card always carries the "Rest of world" share — producers
//     alone would overstate concentration;
//   · every card carries its source line and the strata baseline seeded by
//     the surface's own identity (reproducible by contract);
//   · no CTA furniture, no arrows, no "link in bio" — these are editorial
//     artifacts; the caption, not the pixels, carries the URL.
//
// Chart marks follow the measured grammar: verdigris is the one data hue
// (D5 — "the measured"), bars are thin with a rounded data end and a clear
// gap, values sit in text tokens beside the mark rather than on it.

import { CATEGORY_META } from "@/lib/types";
import { formatMetric } from "@/lib/format";
import { CARD, h, shell, eyebrow, sourcedLine, clamp, FORMATS } from "./ui.mjs";

/* ── shared pieces ────────────────────────────────────────────────────────── */

/** A thin verdigris bar, width in % of the row's bar track. */
function bar(pct, { height = 14, color = CARD.verdigrisMid } = {}) {
  return h(
    "div",
    { style: { display: "flex", width: "100%", height } },
    h("div", {
      style: {
        width: `${Math.max(pct, 0.5)}%`,
        height,
        background: color,
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
      },
    }),
  );
}

/** Category chip: pigment square + label in the pigment's on-deep text step. */
function categoryChip(category, size = 22) {
  const meta = CATEGORY_META[category];
  if (!meta) return null;
  return h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: 12 } },
    h("div", { style: { width: size * 0.55, height: size * 0.55, background: meta.tint, flexShrink: 0 } }),
    h("div", { style: { fontFamily: "mono", fontSize: size, color: meta.chalk } }, meta.label),
  );
}

const num = (n) => n.toLocaleString("en");

/* ── ON THIS DAY ──────────────────────────────────────────────────────────── */

/**
 * subject: { kind: "day"|"month"|"year", dateText, eyebrowText, event:
 *   { yearText, title, summary, category, nationName, eraTitle, sourceLabels } }
 * The precision kind decides the eyebrow's claim; the composition itself
 * never states more than `dateText`, which the calendar layer derives from
 * the event's own yearLabel.
 */
export function onThisDayCard(subject, format) {
  const ev = subject.event;
  const isPin = format.key === "pin";
  return shell({
    seed: subject.seed,
    format,
    top: h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 26 } },
      eyebrow(subject.eyebrowText),
      h("div", { style: { display: "flex", height: 2, width: 84, background: CARD.copper } }),
    ),
    middle: h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: isPin ? 34 : 28 } },
      h(
        "div",
        { style: { fontFamily: "mono", fontSize: isPin ? 40 : 36, color: CARD.copperBright } },
        subject.dateText,
      ),
      h(
        "div",
        {
          style: {
            fontFamily: "Literata",
            fontSize: ev.title.length > 46 ? (isPin ? 58 : 54) : isPin ? 72 : 66,
            lineHeight: 1.08,
            color: CARD.chalkHi,
          },
        },
        ev.title,
      ),
      h(
        "div",
        {
          style: {
            fontFamily: "Literata",
            fontSize: isPin ? 31 : 29,
            lineHeight: 1.5,
            color: CARD.chalk2,
            maxWidth: format.width - 2 * format.pad.x,
          },
        },
        clamp(ev.summary, isPin ? 300 : 240),
      ),
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 28, marginTop: 6 } },
        categoryChip(ev.category),
        h(
          "div",
          { style: { fontFamily: "mono", fontSize: 22, color: CARD.chalk3 } },
          `${ev.nationName} · ${ev.eraTitle}`,
        ),
      ),
    ),
    stat: sourcedLine(clamp(`Source: ${ev.provenance.join("; ")}`, 52)),
  });
}

/* ── RANKING TOP-10 STRIP ─────────────────────────────────────────────────── */

/**
 * subject: { label, domainLabel, unit, rows: [{rank,name,value,year}] (≤10),
 *   totalRanked, mixedYears, isMineral, sourceLabels, seed }
 */
export function rankingCard(subject, format) {
  const isPin = format.key === "pin";
  const max = Math.max(...subject.rows.map((r) => r.value), 0);
  const rowH = isPin ? 21 : 19;
  return shell({
    seed: subject.seed,
    format,
    top: h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 22 } },
      eyebrow(`World ranking · ${subject.domainLabel}`),
      h(
        "div",
        {
          style: {
            fontFamily: "Literata",
            fontSize: subject.label.length > 22 ? 52 : 64,
            lineHeight: 1.05,
            color: CARD.chalkHi,
          },
        },
        subject.label,
      ),
    ),
    middle: h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: isPin ? 26 : 22, marginTop: 12 } },
      subject.rows.map((r) =>
        h(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: 7 } },
          h(
            "div",
            { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between" } },
            h(
              "div",
              { style: { display: "flex", alignItems: "baseline", gap: 16 } },
              h(
                "div",
                { style: { fontFamily: "mono", fontSize: rowH + 1, color: CARD.chalk3, width: 44 } },
                String(r.rank),
              ),
              h("div", { style: { fontSize: rowH + 7, color: CARD.chalk } }, r.name),
            ),
            h(
              "div",
              { style: { display: "flex", alignItems: "baseline", gap: 12 } },
              h(
                "div",
                { style: { fontFamily: "mono", fontSize: rowH + 3, color: CARD.chalk } },
                formatMetric(r.value, subject.unit),
              ),
              subject.mixedYears && r.year != null
                ? h("div", { style: { fontFamily: "mono", fontSize: rowH - 3, color: CARD.chalk3 } }, String(r.year))
                : null,
            ),
          ),
          bar(max > 0 ? (Math.max(r.value, 0) / max) * 100 : 0, {
            height: isPin ? 13 : 12,
            color: r.rank === 1 ? CARD.verdigris : CARD.verdigrisMid,
          }),
        ),
      ),
      h(
        "div",
        { style: { fontFamily: "mono", fontSize: 21, color: CARD.chalk3, marginTop: 4 } },
        `${num(subject.totalRanked)} ${subject.isMineral ? "producers listed" : "nations ranked"} in full` +
          `${subject.mixedYears ? " · each figure shows its own observation year" : ""}` +
          `${subject.isWgi ? " · absolute 0–100 scores, not percentile ranks" : ""}`,
      ),
    ),
    stat: sourcedLine(clamp(`Source: ${subject.provenance.join("; ")}`, 52)),
  });
}

/* ── COMMODITY SHARE-OF-WORLD ─────────────────────────────────────────────── */

/**
 * subject: { name, detail, estimateYear, worldText, producers:
 *   [{name, shareText, sharePct, valueText}] (≤8), restShareText, restSharePct,
 *   sourceLabel, seed }
 */
export function commodityCard(subject, format) {
  const isPin = format.key === "pin";
  const rowGap = isPin ? 27 : 23;
  const row = (name, sharePct, shareText, valueText, muted) =>
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 7 } },
      h(
        "div",
        { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between" } },
        h("div", { style: { fontSize: isPin ? 28 : 26, color: muted ? CARD.chalk3 : CARD.chalk } }, name),
        h(
          "div",
          { style: { display: "flex", alignItems: "baseline", gap: 14 } },
          h("div", { style: { fontFamily: "mono", fontSize: isPin ? 26 : 24, color: muted ? CARD.chalk3 : CARD.chalk } }, shareText),
          valueText
            ? h("div", { style: { fontFamily: "mono", fontSize: isPin ? 20 : 19, color: CARD.chalk3 } }, valueText)
            : null,
        ),
      ),
      bar(sharePct, { height: isPin ? 13 : 12, color: muted ? "#3a5a55" : CARD.verdigrisMid }),
    );

  return shell({
    seed: subject.seed,
    format,
    top: h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 22 } },
      eyebrow(`Who supplies the world · ${subject.estimateYear} est.`),
      h(
        "div",
        { style: { fontFamily: "Literata", fontSize: subject.name.length > 14 ? 56 : 68, lineHeight: 1.05, color: CARD.chalkHi } },
        subject.name,
      ),
      h(
        "div",
        { style: { fontFamily: "mono", fontSize: 24, color: CARD.chalk2 } },
        `World mine production: ${subject.worldText}`,
      ),
    ),
    middle: h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: rowGap, marginTop: 10 } },
      subject.producers.map((p) => row(p.name, p.sharePct, p.shareText, p.valueText, false)),
      row("Rest of world", subject.restSharePct, subject.restShareText, null, true),
      h(
        "div",
        { style: { fontFamily: "mono", fontSize: 20, color: CARD.chalk3, marginTop: 2, lineHeight: 1.45 } },
        "Shares of the published world total. A nation absent here is not recorded as producing none.",
      ),
    ),
    stat: sourcedLine(clamp(`Source: ${subject.provenance.join("; ")}`, 52)),
  });
}

/* ── COMPARE HEADLINE CONTRAST ────────────────────────────────────────────── */

/**
 * subject: { aName, bName, aFormation, bFormation, metricLabel, aValueText,
 *   aYear, bValueText, bYear, aPct, bPct, bothCount, crossedCount, seed }
 * Values sit side by side in slug order; nothing on the card ranks them.
 */
export function compareCard(subject, format) {
  const isPin = format.key === "pin";
  const side = (name, formation, valueText, year, pct, weight) =>
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 14 } },
      h(
        "div",
        { style: { fontFamily: "Literata", fontSize: name.length > 14 ? 44 : 54, lineHeight: 1.08, color: CARD.chalkHi } },
        name,
      ),
      h("div", { style: { fontFamily: "mono", fontSize: 22, color: CARD.chalk3 } }, `formed ${formation}`),
      h(
        "div",
        { style: { display: "flex", alignItems: "baseline", gap: 12, marginTop: isPin ? 18 : 10 } },
        h("div", { style: { fontFamily: "mono", fontSize: isPin ? 46 : 42, color: CARD.verdigris } }, valueText),
        year != null ? h("div", { style: { fontFamily: "mono", fontSize: 20, color: CARD.chalk3 } }, String(year)) : null,
      ),
      bar(pct, { height: 12, color: weight === "a" ? CARD.verdigris : CARD.verdigrisMid }),
    );

  return shell({
    seed: subject.seed,
    format,
    top: h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 22 } },
      eyebrow("Compared · side by side"),
      h(
        "div",
        { style: { fontFamily: "Literata", fontSize: 38, color: CARD.chalk2 } },
        subject.metricLabel,
      ),
    ),
    middle: h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: isPin ? 56 : 40 } },
      side(subject.aName, subject.aFormation, subject.aValueText, subject.aYear, subject.aPct, "a"),
      h("div", { style: { display: "flex", height: 1, width: "100%", background: "#1c3a44" } }),
      side(subject.bName, subject.bFormation, subject.bValueText, subject.bYear, subject.bPct, "b"),
      h(
        "div",
        { style: { fontFamily: "mono", fontSize: 21, color: CARD.chalk3, marginTop: 4 } },
        `${subject.bothCount} shared sourced indicators · ${subject.crossedCount} crossed chronicle ${subject.crossedCount === 1 ? "event" : "events"}`,
      ),
    ),
    stat: sourcedLine("Figures compared, never graded"),
  });
}

/* ── CAROUSELS (slides share the vertical frame) ──────────────────────────── */

const SLIDE = FORMATS.vertical;

/** Slide N-of-M dots, mono voice — orientation without arrows. */
function slideIndex(i, total) {
  return h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: 8 } },
    Array.from({ length: total }, (_, k) =>
      h("div", {
        style: {
          width: 9,
          height: 9,
          borderRadius: 9,
          background: k === i ? CARD.copper : "#2a4650",
        },
      }),
    ),
  );
}

/**
 * Ranking carousel: cover + 3 slides of rows (1–4, 5–7, 8–10).
 * subject: the rankingCard subject.
 */
export function rankingCarousel(subject) {
  const groups = [subject.rows.slice(0, 4), subject.rows.slice(4, 7), subject.rows.slice(7, 10)].filter(
    (g) => g.length > 0,
  );
  const total = groups.length + 1;
  const max = Math.max(...subject.rows.map((r) => r.value), 0);

  const cover = shell({
    seed: subject.seed,
    format: SLIDE,
    top: h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 26 } },
      eyebrow(`World ranking · ${subject.domainLabel}`),
      h("div", { style: { display: "flex", height: 2, width: 84, background: CARD.copper } }),
    ),
    middle: h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 30 } },
      h(
        "div",
        { style: { fontFamily: "Literata", fontSize: subject.label.length > 22 ? 64 : 84, lineHeight: 1.05, color: CARD.chalkHi } },
        subject.label,
      ),
      h(
        "div",
        { style: { fontFamily: "Literata", fontSize: 30, lineHeight: 1.45, color: CARD.chalk2, maxWidth: 880 } },
        `The ten highest published figures, of ${num(subject.totalRanked)} ${subject.isMineral ? "producers listed" : "nations ranked"} — every figure sourced and dated.` +
          `${subject.isWgi ? " WGI absolute 0–100 scores — model estimates, not percentile ranks." : ""}`,
      ),
      slideIndex(0, total),
    ),
    stat: sourcedLine(clamp(`Source: ${subject.provenance.join("; ")}`, 52)),
  });

  const slides = groups.map((rows, gi) =>
    shell({
      seed: subject.seed,
      format: SLIDE,
      top: h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 20 } },
        eyebrow(`${subject.label} · ${rows[0].rank}–${rows[rows.length - 1].rank}`),
      ),
      middle: h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 44 } },
        rows.map((r) =>
          h(
            "div",
            { style: { display: "flex", flexDirection: "column", gap: 10 } },
            h(
              "div",
              { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between" } },
              h(
                "div",
                { style: { display: "flex", alignItems: "baseline", gap: 20 } },
                h("div", { style: { fontFamily: "mono", fontSize: 30, color: CARD.chalk3, width: 58 } }, String(r.rank)),
                h("div", { style: { fontFamily: "Literata", fontSize: r.name.length > 18 ? 36 : 44, color: CARD.chalkHi } }, r.name),
              ),
              h(
                "div",
                { style: { display: "flex", alignItems: "baseline", gap: 12 } },
                h("div", { style: { fontFamily: "mono", fontSize: 34, color: CARD.verdigris } }, formatMetric(r.value, subject.unit)),
                subject.mixedYears && r.year != null
                  ? h("div", { style: { fontFamily: "mono", fontSize: 20, color: CARD.chalk3 } }, String(r.year))
                  : null,
              ),
            ),
            bar(max > 0 ? (Math.max(r.value, 0) / max) * 100 : 0, {
              height: 14,
              color: r.rank === 1 ? CARD.verdigris : CARD.verdigrisMid,
            }),
          ),
        ),
        slideIndex(gi + 1, total),
      ),
      stat: sourcedLine(
        subject.mixedYears ? "Each figure shows its own observation year" : "Every figure sourced and dated",
      ),
    }),
  );

  return [cover, ...slides];
}

/**
 * Formation-story carousel: cover + one slide per key event (≤6).
 * subject: { nationName, tagline, foundingText, foundingLabel, events:
 *   [{yearText, title, summary, category, eraTitle, sourceLabels}], seed }
 */
export function formationCarousel(subject) {
  const total = subject.events.length + 1;

  const cover = shell({
    seed: subject.seed,
    format: SLIDE,
    top: h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 26 } },
      eyebrow("How a nation came to be"),
      h("div", { style: { display: "flex", height: 2, width: 84, background: CARD.copper } }),
    ),
    middle: h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 30 } },
      h(
        "div",
        { style: { fontFamily: "Literata", fontSize: subject.nationName.length > 14 ? 66 : 88, lineHeight: 1.05, color: CARD.chalkHi } },
        subject.nationName,
      ),
      h(
        "div",
        { style: { fontFamily: "Literata", fontSize: 32, lineHeight: 1.4, color: CARD.chalk2, maxWidth: 880 } },
        subject.tagline,
      ),
      h(
        "div",
        { style: { fontFamily: "mono", fontSize: 24, color: CARD.copperBright } },
        `${subject.foundingText} — ${clamp(subject.foundingLabel, 64)}`,
      ),
      slideIndex(0, total),
    ),
    stat: sourcedLine(),
  });

  const slides = subject.events.map((ev, i) =>
    shell({
      seed: subject.seed,
      format: SLIDE,
      top: h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 20 } },
        eyebrow(`${subject.nationName} · ${ev.eraTitle}`),
      ),
      middle: h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 26 } },
        h("div", { style: { fontFamily: "mono", fontSize: 34, color: CARD.copperBright } }, ev.yearText),
        h(
          "div",
          { style: { fontFamily: "Literata", fontSize: ev.title.length > 46 ? 50 : 60, lineHeight: 1.1, color: CARD.chalkHi } },
          ev.title,
        ),
        h(
          "div",
          { style: { fontFamily: "Literata", fontSize: 29, lineHeight: 1.5, color: CARD.chalk2 } },
          clamp(ev.summary, 260),
        ),
        categoryChip(ev.category),
        slideIndex(i + 1, total),
      ),
      stat: sourcedLine(clamp(`Source: ${ev.provenance.join("; ")}`, 52)),
    }),
  );

  return [cover, ...slides];
}
