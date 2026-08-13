"use client";

import { useState } from "react";
import { formatMetric } from "@/lib/format";

// Full-size, interactive line chart for one metric. Renders one or more lines on
// a shared year-based x-axis (so series of differing spans overlay correctly) and
// a shared value scale. Dependency-free SVG, same hand as the in-card Sparkline.
//
// The viewBox is fixed and the <svg> scales to its container via width:100%, so
// hover math maps the pointer back into viewBox units — correct at any size.
export interface ChartLine {
  label: string;
  color: string;
  series: { year: number; value: number }[];
  /** Primary line gets an area wash; comparisons are plain strokes. */
  area?: boolean;
  /** Render as a dashed stroke (used for the world-average line). */
  dashed?: boolean;
}

const W = 680;
const H = 300;
const PAD_L = 66;
const PAD_R = 20;
const PAD_T = 16;
const PAD_B = 34;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;
const BASE_Y = PAD_T + PLOT_H;

/**
 * A moment from the nation's own chronicle, marked on the series.
 *
 * These are an invitation to read the sourced account, never a claim that the
 * event caused the movement in the data — see lib/annotations.ts.
 */
export interface ChartAnnotation {
  year: number;
  yearLabel: string;
  title: string;
  tint: string;
  href: string;
}

export default function MetricChart({
  lines,
  unit,
  invertY = false,
  formatValue,
  annotations = [],
}: {
  lines: ChartLine[];
  unit: string;
  /** Place the smallest value at the top (used for rank, where #1 is best). */
  invertY?: boolean;
  /** Override the value formatter for y labels + tooltip (e.g. "#3" for rank). */
  formatValue?: (v: number) => string;
  /** Events from this nation's chronicle that fall inside the series' span. */
  annotations?: ChartAnnotation[];
}) {
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const fmt = formatValue ?? ((v: number) => formatMetric(v, unit));

  const active = lines.filter((l) => l.series && l.series.length > 0);
  if (!active.length) return null;

  const allVals = active.flatMap((l) => l.series.map((d) => d.value));
  const allYears = active.flatMap((l) => l.series.map((d) => d.year));
  const minY = Math.min(...allVals);
  const maxY = Math.max(...allVals);
  const spanY = maxY - minY || Math.abs(maxY) || 1;
  const minYr = Math.min(...allYears);
  const maxYr = Math.max(...allYears);
  const spanYr = maxYr - minYr || 1;
  const years = Array.from(new Set(allYears)).sort((a, b) => a - b);

  const x = (yr: number) => PAD_L + ((yr - minYr) / spanYr) * PLOT_W;
  const y = (v: number) => {
    const t = (v - minY) / spanY;
    return PAD_T + (invertY ? t : 1 - t) * PLOT_H;
  };

  const yTicks = [minY, (minY + maxY) / 2, maxY];
  const xTicks = Array.from(
    new Set([
      minYr,
      Math.round(minYr + spanYr / 3),
      Math.round(minYr + (2 * spanYr) / 3),
      maxYr,
    ]),
  );

  function locate(clientX: number, rect: DOMRect) {
    const ratio = (clientX - rect.left) / rect.width;
    const xv = ratio * W;
    const raw = minYr + ((xv - PAD_L) / PLOT_W) * spanYr;
    let nearest = years[0];
    let best = Infinity;
    for (const yr of years) {
      const d = Math.abs(yr - raw);
      if (d < best) {
        best = d;
        nearest = yr;
      }
    }
    setHoverYear(nearest);
  }

  // rows visible in the hover readout: lines that have a sample at hoverYear
  const readout =
    hoverYear == null
      ? []
      : active
          .map((l) => ({ line: l, pt: l.series.find((d) => d.year === hoverYear) }))
          .filter((r): r is { line: ChartLine; pt: { year: number; value: number } } => !!r.pt);

  // tooltip geometry, clamped to the plot
  const TT_W = 132;
  const ROW_H = 17;
  const TT_H = 20 + readout.length * ROW_H + 6;
  const ttAnchorX = hoverYear == null ? 0 : x(hoverYear);
  const ttX = Math.min(Math.max(ttAnchorX - TT_W / 2, PAD_L), W - PAD_R - TT_W);
  const ttTopVal = readout.length ? Math.max(...readout.map((r) => r.pt.value)) : minY;
  const ttY = Math.max(y(ttTopVal) - TT_H - 12, PAD_T);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Time-series chart"
      style={{ display: "block", touchAction: "none" }}
      onMouseMove={(e) => locate(e.clientX, e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => setHoverYear(null)}
      onTouchStart={(e) =>
        locate(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())
      }
      onTouchMove={(e) =>
        locate(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())
      }
      onTouchEnd={() => setHoverYear(null)}
    >
      <defs>
        <linearGradient id="metric-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a64b26" stopOpacity={0.16} />
          <stop offset="100%" stopColor="#a64b26" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* ── Chronicle annotations ─────────────────────────────────────────
          A moment from this nation's own history, marked where it falls on the
          series. Drawn BEFORE the data so the lines always sit on top: the
          chart is the subject and these are margin marks, not content.
          Category-tinted, so a rupture reads as madder and a formation as
          ochre — the same pigment the timeline rail and the chronicle use. */}
      {placeAnnotations(annotations, x, PAD_L, W - PAD_R).map(
        ({ a, ax, showLabel }) => {
          return (
            <g key={`ann-${a.year}-${a.title}`}>
              <title>{`${a.yearLabel} — ${a.title} (in the archive)`}</title>
              <line
                x1={ax}
                y1={PAD_T + 10}
                x2={ax}
                y2={BASE_Y}
                stroke={a.tint}
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.6}
              />
              <circle cx={ax} cy={PAD_T + 8} r={3} fill={a.tint} />
              {showLabel && (
                <text
                  x={ax}
                  y={PAD_T + 2}
                  textAnchor="middle"
                  className="font-mono"
                  style={{ fontSize: 9, fill: a.tint, letterSpacing: "0.04em" }}
                >
                  {a.year < 0 ? `${Math.abs(a.year)} BCE` : a.year}
                </text>
              )}
            </g>
          );
        },
      )}

      {/* gridlines + y labels */}
      {yTicks.map((v, i) => {
        const yy = y(v);
        return (
          <g key={i}>
            <line
              x1={PAD_L}
              y1={yy}
              x2={W - PAD_R}
              y2={yy}
              stroke="#d9cdb8"
              strokeWidth={1}
            />
            <text
              x={PAD_L - 10}
              y={yy + 3.5}
              textAnchor="end"
              className="font-mono"
              style={{ fontSize: 11, fill: "var(--color-umber)" }}
            >
              {fmt(v)}
            </text>
          </g>
        );
      })}

      {/* x labels */}
      {xTicks.map((yr) => (
        <text
          key={yr}
          x={x(yr)}
          y={H - PAD_B + 20}
          textAnchor={yr === minYr ? "start" : yr === maxYr ? "end" : "middle"}
          className="font-mono"
          style={{ fontSize: 11, fill: "var(--color-umber)" }}
        >
          {yr}
        </text>
      ))}

      {/* area wash under the primary line */}
      {active.map((l, li) =>
        l.area && l.series.length > 1 ? (
          <path
            key={`area-${li}`}
            d={`M${x(l.series[0].year)},${BASE_Y} L${l.series
              .map((d) => `${x(d.year).toFixed(1)},${y(d.value).toFixed(1)}`)
              .join(" L")} L${x(l.series[l.series.length - 1].year)},${BASE_Y} Z`}
            fill="url(#metric-area)"
          />
        ) : null,
      )}

      {/* lines */}
      {active.map((l, li) => (
        <path
          key={`line-${li}`}
          d={`M${l.series
            .map((d) => `${x(d.year).toFixed(1)},${y(d.value).toFixed(1)}`)
            .join(" L")}`}
          fill="none"
          stroke={l.color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={l.dashed ? "5 4" : undefined}
          opacity={l.dashed ? 0.85 : 1}
        />
      ))}

      {/* hover crosshair, dots + readout */}
      {hoverYear != null && readout.length > 0 && (
        <g>
          <line
            x1={x(hoverYear)}
            y1={PAD_T}
            x2={x(hoverYear)}
            y2={BASE_Y}
            stroke="#b8ac97"
            strokeWidth={1}
          />
          {readout.map((r, i) => (
            <circle
              key={i}
              cx={x(hoverYear)}
              cy={y(r.pt.value)}
              r={4}
              fill={r.line.color}
              stroke="var(--color-bone)"
              strokeWidth={1.5}
            />
          ))}
          <g transform={`translate(${ttX},${ttY})`}>
            <rect
              width={TT_W}
              height={TT_H}
              rx={5}
              fill="#221e19"
              stroke="#221e19"
            />
            <text
              x={10}
              y={15}
              className="font-mono"
              style={{ fontSize: 10, letterSpacing: "0.08em", fill: "#c88a5c" }}
            >
              {hoverYear}
            </text>
            {readout.map((r, i) => (
              <g key={i} transform={`translate(10,${24 + i * ROW_H})`}>
                <rect width={8} height={8} rx={1.5} y={-7} fill={r.line.color} />
                <text
                  x={TT_W - 20}
                  y={0}
                  textAnchor="end"
                  style={{ fontSize: 12, fontWeight: 600, fill: "#efe7d8" }}
                >
                  {fmt(r.pt.value)}
                </text>
              </g>
            ))}
          </g>
        </g>
      )}
    </svg>
  );
}

/**
 * Decide which annotation marks get a visible year label.
 *
 * Two events in the same year (a referendum and an accession, say) land on the
 * same x and their labels overprint into unreadable mush. The tick always draws
 * — a reader should see that two things happened — but the label is suppressed
 * when it would collide with the last one placed.
 *
 * Kept as a pure function over the list rather than a counter mutated inside
 * `.map`: mutating a variable during render is exactly the pattern that goes
 * wrong when React re-renders or replays, and the linter is right to reject it.
 */
function placeAnnotations(
  annotations: ChartAnnotation[],
  x: (year: number) => number,
  left: number,
  right: number,
): { a: ChartAnnotation; ax: number; showLabel: boolean }[] {
  const MIN_GAP = 30;
  const out: { a: ChartAnnotation; ax: number; showLabel: boolean }[] = [];
  let lastLabelX = -Infinity;
  for (const a of annotations) {
    const ax = x(a.year);
    if (ax < left || ax > right) continue;
    const showLabel = ax - lastLabelX >= MIN_GAP;
    if (showLabel) lastLabelX = ax;
    out.push({ a, ax, showLabel });
  }
  return out;
}
