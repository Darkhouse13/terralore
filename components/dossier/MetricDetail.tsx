"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { DataSource, Metric } from "@/lib/types";
import { formatMetric } from "@/lib/format";
import { metricDefinition } from "@/lib/metric-defs";
import { commodityByMetricKey } from "@/lib/commodity-meta";
import { rankingSlug } from "@/lib/ranking-meta";
import MetricChart, { type ChartAnnotation, type ChartLine } from "./MetricChart";
import MetricMap from "./MetricMap";

// The metric "window" — the specimen opened flat: the full time series as an
// interactive chart, the plain-language definition, range stats and the
// source citation. Two lenses: VALUE over time, or world RANK over time
// (#1 = highest). Readers can overlay other nations (or, in value mode, the
// world average); series lazy-fetch from public/data/series/<key>.json.
//
// Strata grammar: an opaque bone sheet laid over the page (no scrim, no
// blur — taboo), 2px basalt rules, square corners, the mass curve. Open /
// compare / lens state is owned by the Dossier so it can be mirrored to the
// URL (shareable deep links).

export type ChartMode = "value" | "rank";

// Series palette on bone: the home nation is oxide (the live label); overlays
// walk basalt → clay → umber → the indigo category pigment (a data-encoding
// colour, sanctioned by deviation E4). The world average is the absence tone,
// dashed — an aggregate, not an observation.
const PRIMARY_COLOR = "#a64b26";
const COMPARE_COLORS = ["#221e19", "#c88a5c", "#6e4a32", "#5464a1"];
const WORLD_COLOR = "#b8ac97";
export const WORLD_CODE = "__world";

const rankFmt = (v: number) => `#${Math.round(v)}`;

interface CountrySeries {
  name: string;
  flag: string | null;
  value: number | null;
  year: number | null;
  series: { year: number; value: number }[];
}
interface SeriesFile {
  key: string;
  label: string;
  unit: string;
  countries: Record<string, CountrySeries>;
}

// Cache each metric file across opens so re-entering compare/rank is instant.
const fileCache = new Map<string, Promise<SeriesFile>>();
function loadSeriesFile(key: string): Promise<SeriesFile> {
  let p = fileCache.get(key);
  if (!p) {
    p = fetch(`/data/series/${encodeURIComponent(key)}.json`).then((r) => {
      if (!r.ok) throw new Error(`no series file for ${key}`);
      return r.json() as Promise<SeriesFile>;
    });
    fileCache.set(key, p);
  }
  return p;
}

export default function MetricDetail({
  open,
  onClose,
  metric,
  source,
  country,
  compare,
  onCompareChange,
  mode,
  onModeChange,
  mapOpen,
  onMapToggle,
  annotations = [],
}: {
  open: boolean;
  onClose: () => void;
  metric: Metric;
  source?: DataSource;
  country: { code: string; name: string; flag: string | null };
  compare: string[];
  onCompareChange: (next: string[]) => void;
  mode: ChartMode;
  onModeChange: (m: ChartMode) => void;
  mapOpen: boolean;
  onMapToggle: () => void;
  /** Chronicle moments falling inside this series' span (see lib/annotations). */
  annotations?: ChartAnnotation[];
}) {
  const [mounted, setMounted] = useState(false);
  // defer the portal until after hydration (document.body isn't there on the server)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  // transient UI state
  const [file, setFile] = useState<SeriesFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [picking, setPicking] = useState(false);
  const [query, setQuery] = useState("");

  // Escape to close + lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  // reset the picker when the window closes (compare/mode are owned upstream)
  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear transient UI on close
      setPicking(false);
      setQuery("");
    }
  }, [open]);

  // lazy-load the series file the moment anything needs it (compare or rank),
  // including when the window opens straight into that state from a deep link.
  const needsFile = open && (compare.length > 0 || mode === "rank" || mapOpen);
  useEffect(() => {
    // `loading` is intentionally NOT a dep: setting it here would re-run this
    // effect and cancel the in-flight fetch before it resolves.
    if (!needsFile || file || failed) return;
    /* eslint-disable react-hooks/set-state-in-effect -- lazy fetch of an external file */
    let active = true;
    setLoading(true);
    loadSeriesFile(metric.key)
      .then((f) => active && setFile(f))
      .catch(() => active && setFailed(true))
      .finally(() => active && setLoading(false));
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => {
      active = false;
    };
  }, [needsFile, file, failed, metric.key]);

  async function enterCompare() {
    setPicking(true);
    if (file || loading || failed) return;
    setLoading(true);
    try {
      setFile(await loadSeriesFile(metric.key));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  const series = metric.series ?? [];
  const hasSeries = series.length > 1;
  const info = metricDefinition(metric.key, metric.value == null, source?.publisher);

  // world-average series (value lens only), mean across every nation per year
  const worldSeries = useMemo(() => {
    if (!file) return [];
    const sum = new Map<number, { total: number; n: number }>();
    for (const c of Object.values(file.countries)) {
      for (const p of c.series) {
        const e = sum.get(p.year) ?? { total: 0, n: 0 };
        e.total += p.value;
        e.n += 1;
        sum.set(p.year, e);
      }
    }
    return [...sum.entries()]
      .map(([year, { total, n }]) => ({ year, value: total / n }))
      .sort((a, b) => a.year - b.year);
  }, [file]);

  // rank lens: a nation's value → its world rank that year (1 = highest)
  const valuesByYear = useMemo(() => {
    if (!file) return null;
    const m = new Map<number, number[]>();
    for (const c of Object.values(file.countries)) {
      for (const p of c.series) {
        const arr = m.get(p.year);
        if (arr) arr.push(p.value);
        else m.set(p.year, [p.value]);
      }
    }
    return m;
  }, [file]);

  const toRank = useMemo(
    () =>
      (s: { year: number; value: number }[]) => {
        if (!valuesByYear) return [];
        return s
          .map((p) => {
            const arr = valuesByYear.get(p.year);
            if (!arr) return null;
            return { year: p.year, value: arr.filter((v) => v > p.value).length + 1 };
          })
          .filter((p): p is { year: number; value: number } => p != null);
      },
    [valuesByYear],
  );

  const isRank = mode === "rank";

  // assemble chart lines for the active lens
  const lines: ChartLine[] = [];
  if (isRank) {
    lines.push({ label: country.name, color: PRIMARY_COLOR, series: toRank(series) });
    compare.forEach((code, i) => {
      if (code === WORLD_CODE) return; // ranking an average is meaningless
      const c = file?.countries[code];
      if (c) lines.push({ label: c.name, color: COMPARE_COLORS[i % COMPARE_COLORS.length], series: toRank(c.series) });
    });
  } else {
    lines.push({ label: country.name, color: PRIMARY_COLOR, series, area: true });
    compare.forEach((code, i) => {
      const color = COMPARE_COLORS[i % COMPARE_COLORS.length];
      if (code === WORLD_CODE) {
        lines.push({ label: "World average", color: WORLD_COLOR, series: worldSeries, dashed: true });
      } else if (file?.countries[code]) {
        lines.push({ label: file.countries[code].name, color, series: file.countries[code].series });
      }
    });
  }

  // range stats (home nation, value lens) + change line
  const first = hasSeries ? series[0] : null;
  const lo = hasSeries ? series.reduce((a, b) => (b.value < a.value ? b : a)) : null;
  const hi = hasSeries ? series.reduce((a, b) => (b.value > a.value ? b : a)) : null;
  const change = computeChange(first, metric);

  const candidates = useMemo(() => {
    if (!file) return [];
    const q = query.trim().toLowerCase();
    return Object.entries(file.countries)
      .filter(([code, c]) => code !== country.code && !compare.includes(code) && c.series.length > 1)
      .filter(([, c]) => !q || c.name.toLowerCase().includes(q))
      .slice(0, 60);
  }, [file, query, compare, country.code]);

  const nationCount = compare.filter((c) => c !== WORLD_CODE).length;
  const atLimit = nationCount >= COMPARE_COLORS.length;
  const worldPicked = compare.includes(WORLD_CODE);

  // chips reflect what's actually drawn (world is hidden in rank mode)
  const shownCompare = isRank ? compare.filter((c) => c !== WORLD_CODE) : compare;

  // ── spatial map: latest value + name per nation, from the same file ──────
  const mapCompare = compare.filter((c) => c !== WORLD_CODE);
  const mapValues = useMemo(() => {
    const out: Record<string, number> = {};
    if (file) {
      for (const [code, c] of Object.entries(file.countries)) {
        if (c.value != null) out[code] = c.value;
      }
    }
    return out;
  }, [file]);
  const mapNames = useMemo(() => {
    const out: Record<string, { name: string; flag: string | null }> = {};
    if (file) {
      for (const [code, c] of Object.entries(file.countries)) {
        out[code] = { name: c.name, flag: c.flag };
      }
    }
    return out;
  }, [file]);
  // click a nation on the map → toggle it in the comparison (respecting the cap)
  const toggleCompare = (code: string) => {
    if (compare.includes(code)) onCompareChange(compare.filter((c) => c !== code));
    else if (nationCount < COMPARE_COLORS.length) onCompareChange([...compare, code]);
  };
  const colorForCode = (code: string) =>
    COMPARE_COLORS[compare.indexOf(code) % COMPARE_COLORS.length];

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] overflow-y-auto bg-bone"
      role="dialog"
      aria-modal="true"
      aria-label={`${metric.label} — detail`}
    >
      <div className="settle mx-auto max-w-2xl px-5 pt-4 pb-16">
        {/* window bar */}
        <div className="flex items-center justify-between">
          <div className="eyebrow text-umber">Specimen · {country.name}</div>
          <button
            type="button"
            onClick={onClose}
            className="pressable -mr-1 border-2 border-basalt px-3 py-1.5 font-mono text-[11px]"
          >
            CLOSE ✕
          </button>
        </div>

        {/* heading */}
        <div className="mt-4">
          <div className="font-display text-[20px] leading-tight font-extrabold tracking-tight uppercase">
            {metric.label}
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <div className="font-mono text-[34px] leading-none">
              {formatMetric(metric.value, metric.unit)}
            </div>
            {metric.year != null && (
              <span className="pill">OBSERVED {metric.year}</span>
            )}
            {change && (
              <span className="font-mono text-[11px] text-umber">
                {change.arrow} {change.text}
              </span>
            )}
          </div>
        </div>

        <p className="mt-3 max-w-[56ch] font-sans text-[14px] leading-relaxed text-umber">
          {info}
        </p>

        {/* chart + lens toggle */}
        {hasSeries ? (
          <div className="mt-5 border-2 border-basalt p-2">
            <div className="flex items-center justify-between gap-3 px-1 pb-1.5">
              <span className="font-mono text-[10px] tracking-[0.14em] text-umber uppercase">
                {isRank ? "World rank · #1 = highest" : "Over time"}
              </span>
              <div className="inline-flex flex-none">
                <LensButton active={!isRank} onClick={() => onModeChange("value")}>
                  Value
                </LensButton>
                <LensButton active={isRank} onClick={() => onModeChange("rank")}>
                  Rank
                </LensButton>
                <LensButton active={mapOpen} onClick={onMapToggle}>
                  Map
                </LensButton>
              </div>
            </div>
            {isRank && !file ? (
              <div className="grid h-[220px] place-items-center px-2 font-mono text-[11px] tracking-[0.14em] text-umber uppercase">
                {failed ? "World rankings unavailable" : "Computing world rankings…"}
              </div>
            ) : (
              <MetricChart
                lines={lines}
                unit={metric.unit}
                invertY={isRank}
                formatValue={isRank ? rankFmt : undefined}
                annotations={annotations}
              />
            )}
          </div>
        ) : (
          <p className="mt-5 font-mono text-[11px] tracking-[0.14em] text-umber uppercase">
            No time series available for this indicator.
          </p>
        )}

        {/* spatial map — the world coloured by this metric */}
        {hasSeries && mapOpen && (
          <div className="mt-3 border-2 border-basalt p-2">
            <div className="px-1 pb-1.5 font-mono text-[10px] tracking-[0.14em] text-umber uppercase">
              World by {metric.label} · press a nation to compare
            </div>
            {file ? (
              <MetricMap
                values={mapValues}
                unit={metric.unit}
                names={mapNames}
                homeCode={country.code}
                compare={mapCompare}
                colorFor={colorForCode}
                onToggle={toggleCompare}
              />
            ) : (
              <div className="grid h-[200px] place-items-center font-mono text-[11px] tracking-[0.14em] text-umber uppercase">
                {failed ? "Map data unavailable" : "Loading map…"}
              </div>
            )}
          </div>
        )}

        {/* ── What the archive says happened here — the readable half of the
            chart's marks. "In the archive during this period", never "which
            caused this": the corpus asserts sourced events, not causation. */}
        {hasSeries && annotations.length > 0 && (
          <div className="mt-4 border-2 border-basalt px-4 py-3">
            <div className="eyebrow mb-2 text-umber">In the archive during this period</div>
            <ul className="flex flex-col gap-1.5">
              {annotations.map((a) => (
                <li key={`${a.year}-${a.title}`} className="flex items-baseline gap-2.5">
                  <span
                    aria-hidden
                    className="mt-[5px] h-[7px] w-[7px] flex-none"
                    style={{ background: a.tint }}
                  />
                  <span className="flex-none font-mono text-[11px] text-umber tabular-nums">
                    {a.yearLabel}
                  </span>
                  <a href={a.href} className="font-sans text-[13.5px] leading-snug text-oxide">
                    {a.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* legend + compare controls */}
        {hasSeries && (
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <LegendChip color={PRIMARY_COLOR} code={country.code} label={country.name} />
              {shownCompare.map((code) => {
                const idx = compare.indexOf(code);
                const isWorld = code === WORLD_CODE;
                const color = isWorld ? WORLD_COLOR : COMPARE_COLORS[idx % COMPARE_COLORS.length];
                const label = isWorld ? "World average" : file?.countries[code]?.name ?? code;
                return (
                  <LegendChip
                    key={code}
                    color={color}
                    code={isWorld ? "AVG" : code}
                    label={label}
                    onRemove={() => onCompareChange(compare.filter((c) => c !== code))}
                  />
                );
              })}
              {!picking && (
                <button
                  type="button"
                  onClick={enterCompare}
                  className="pressable border-2 border-basalt px-3 py-[5px] font-mono text-[11px] tracking-[0.1em] uppercase"
                >
                  + Compare
                </button>
              )}
            </div>

            {picking && (
              <div className="mt-3 border-2 border-basalt p-3">
                {loading && (
                  <div className="px-1 py-2 font-mono text-[11px] tracking-[0.14em] text-umber uppercase">
                    Loading nations…
                  </div>
                )}
                {failed && (
                  <div className="px-1 py-2 font-mono text-[11px] tracking-[0.14em] text-umber uppercase">
                    Comparison data unavailable.
                  </div>
                )}
                {file && !failed && (
                  <>
                    <div className="flex items-center gap-3">
                      <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search nations…"
                        className="min-w-0 flex-1 border-2 border-basalt bg-bone px-3 py-2 font-sans text-[13px] placeholder:text-umber"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPicking(false);
                          setQuery("");
                        }}
                        className="pressable font-mono text-[11px] tracking-[0.1em] text-oxide uppercase"
                      >
                        Done
                      </button>
                    </div>

                    {!isRank && !worldPicked && !query && (
                      <button
                        type="button"
                        onClick={() => onCompareChange([...compare, WORLD_CODE])}
                        className="pressable mt-2 flex w-full items-center gap-2.5 px-2 py-2 text-left font-sans text-[13px]"
                      >
                        <span className="font-mono text-[10px] text-umber">AVG</span>
                        <span>World average</span>
                      </button>
                    )}

                    {atLimit ? (
                      <div className="mt-2 px-2 py-2 font-mono text-[10.5px] tracking-[0.12em] text-umber uppercase">
                        Up to {COMPARE_COLORS.length} nations at once — remove one to add another.
                      </div>
                    ) : (
                      <div className="mt-1 max-h-[200px] overflow-y-auto">
                        {candidates.map(([code, c]) => (
                          <button
                            key={code}
                            type="button"
                            onClick={() => {
                              onCompareChange([...compare, code]);
                              setQuery("");
                            }}
                            className="pressable flex w-full items-center gap-2.5 px-2 py-2 text-left font-sans text-[13px]"
                          >
                            <span className="w-[34px] flex-none font-mono text-[10px] text-umber">
                              {code}
                            </span>
                            <span className="truncate">{c.name}</span>
                            <span className="ml-auto flex-none font-mono text-[11px] text-umber">
                              {formatMetric(c.value, metric.unit)}
                            </span>
                          </button>
                        ))}
                        {candidates.length === 0 && (
                          <div className="px-2 py-3 font-mono text-[11px] tracking-[0.12em] text-umber uppercase">
                            No matches.
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* range stats */}
        {hasSeries && (
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <Stat label={`${first!.year}`} value={formatMetric(first!.value, metric.unit)} caption="First" />
            <Stat label={`${lo!.year}`} value={formatMetric(lo!.value, metric.unit)} caption="Lowest" />
            <Stat label={`${hi!.year}`} value={formatMetric(hi!.value, metric.unit)} caption="Highest" />
            <Stat label={`${metric.year ?? "—"}`} value={formatMetric(metric.value, metric.unit)} caption="Latest" />
          </dl>
        )}

        {/* source */}
        {source && (
          <div className="bed mt-6 pt-4">
            <div className="eyebrow text-umber">Source</div>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-block font-sans font-medium text-oxide underline underline-offset-2"
            >
              {source.label}
            </a>
            <div className="mt-1 font-mono text-[10.5px] text-umber">
              {source.publisher} · {source.license} · accessed {source.accessed}
            </div>
            {commodityByMetricKey.has(metric.key) && (
              <Link
                href={`/commodities/${commodityByMetricKey.get(metric.key)!.slug}`}
                prefetch={false}
                className="mt-2.5 inline-block font-mono text-[11px] tracking-[0.12em] text-oxide uppercase"
              >
                Who supplies the world · {commodityByMetricKey.get(metric.key)!.name} →
              </Link>
            )}
            {/* Every metric has a slug (validator-enforced); block wrapper so
                this stacks under the commodity link on the prod* metrics. */}
            {rankingSlug(metric.key) && (
              <div>
                <Link
                  href={`/rankings/${rankingSlug(metric.key)}`}
                  prefetch={false}
                  className="mt-2.5 inline-block font-mono text-[11px] tracking-[0.12em] text-oxide uppercase"
                >
                  World ranking · {metric.label} →
                </Link>
              </div>
            )}
            {shownCompare.length > 0 && (
              <p className="mt-2 font-sans text-[12.5px] leading-relaxed text-umber">
                Compared nations draw on the same indicator and source; figures show each
                nation&apos;s latest available year.
              </p>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function LensButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`pressable border-2 border-basalt px-2.5 py-[3px] font-mono text-[10.5px] tracking-[0.1em] uppercase ${
        active ? "bg-basalt text-bone" : "text-basalt"
      } -ml-0.5 first:ml-0`}
    >
      {children}
    </button>
  );
}

function LegendChip({
  color,
  code,
  label,
  onRemove,
}: {
  color: string;
  code: string;
  label: string;
  onRemove?: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-2 border-2 border-basalt py-[4px] pr-2 pl-2.5 font-sans text-[12px]">
      <span className="h-2.5 w-2.5 flex-none" style={{ background: color }} />
      <span className="font-mono text-[9.5px] text-umber">{code}</span>
      <span className="max-w-[160px] truncate">{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="grid h-4 w-4 flex-none place-items-center text-[13px] leading-none text-umber"
        >
          ×
        </button>
      )}
    </span>
  );
}

function Stat({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <div>
      <div className="font-mono text-[9.5px] tracking-[0.16em] text-umber uppercase">{caption}</div>
      <div className="mt-1.5 font-mono text-[17px] leading-none">{value}</div>
      <div className="mt-1 font-mono text-[10px] text-umber">{label}</div>
    </div>
  );
}

// Change from the start of the trailing series to the latest value. For
// already-percentage units we report the swing in percentage points; otherwise a
// percent change. One neutral tone — up/down is not framed as good or bad.
function computeChange(
  first: { year: number; value: number } | null,
  metric: Metric,
): { text: string; arrow: string } | null {
  if (!first || metric.value == null) return null;
  const diff = metric.value - first.value;
  const arrow = diff > 0 ? "▲" : diff < 0 ? "▼" : "—";
  // Units already expressed on a 0–100 scale move in points, not in percent of
  // themselves: a governance score going 40 → 44 rose four points, and calling
  // that "10%" would invite a comparison the scale does not support.
  const pointUnit =
    metric.unit === "%" || metric.unit === "% of GDP" || metric.unit === "% gross"
      ? "pp"
      : metric.unit === "score"
        ? "pts"
        : null;
  if (pointUnit) {
    return { text: `${Math.abs(diff).toFixed(1)} ${pointUnit} since ${first.year}`, arrow };
  }
  if (first.value === 0) return null;
  const pct = (diff / Math.abs(first.value)) * 100;
  return {
    text: `${Math.abs(pct).toFixed(pct >= 100 || pct <= -100 ? 0 : 1)}% since ${first.year}`,
    arrow,
  };
}
