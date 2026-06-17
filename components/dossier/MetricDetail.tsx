"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import type { DataSource, Metric } from "@/lib/types";
import { formatMetric } from "@/lib/format";
import { metricDefinition } from "@/lib/metric-defs";
import MetricChart, { type ChartLine } from "./MetricChart";
import MetricMap from "./MetricMap";

// The metric "window" — a modal that shows the full time series as an interactive
// chart, with the plain-language definition, range stats and the source citation.
// Two lenses: VALUE over time, or world RANK over time (#1 = highest). Readers can
// overlay other nations (or, in value mode, the world average). All comparison
// series come from a single per-metric file lazy-fetched from public/data/series/
// (built by scripts/build-series-index.mjs).
//
// Open/compare/view state is controlled by the Dossier so it can be mirrored to the
// URL (shareable deep links). Only transient fetch/picker state lives here.

export type ChartMode = "value" | "rank";

const PRIMARY_COLOR = "var(--color-brass-bright)";
const COMPARE_COLORS = ["#7fb2d9", "#cf8fae", "#86c9a0", "#b59ad9"];
const WORLD_COLOR = "#9a9484";
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

  // range stats (home nation, value lens) + change pill
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

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{ background: "rgba(4,3,8,0.74)", backdropFilter: "blur(3px)" }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`${metric.label} — detail`}
        >
          <motion.div
            className="relative max-h-[90dvh] w-full max-w-[660px] overflow-y-auto rounded-[10px] border border-brass/25 p-6 sm:p-8"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              background: "linear-gradient(180deg,#15131c,#0c0b11)",
              boxShadow: "0 40px 110px -30px rgba(0,0,0,0.9)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-brass/25 text-[16px] text-chalk-faint transition-colors hover:border-brass hover:text-chalk-bright"
            >
              ×
            </button>

            {/* heading */}
            <div className="pr-10">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-chalk-faint">
                {metric.label}
              </div>
              <div className="mt-3 flex items-end gap-3.5">
                <div className="font-display text-[40px] font-[360] leading-none text-chalk-bright">
                  {formatMetric(metric.value, metric.unit)}
                </div>
                {change && (
                  <span className="mb-1 font-mono text-[12px] tracking-[0.04em]" style={{ color: change.tint }}>
                    {change.arrow} {change.text}
                  </span>
                )}
                {metric.year != null && (
                  <span className="mb-1 font-mono text-[11px] tracking-[0.06em] text-chalk-dim">
                    in {metric.year}
                  </span>
                )}
              </div>
            </div>

            <p className="mt-4 max-w-[52ch] font-serif text-[14.5px] leading-relaxed text-reading">
              {info}
            </p>

            {/* chart + lens toggle */}
            {hasSeries ? (
              <div className="mt-6 rounded-[6px] border border-brass/12 bg-[#0b0a10] p-2">
                <div className="flex items-center justify-between gap-3 px-1.5 pb-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-dim">
                    {isRank ? "World rank · #1 = highest" : "Over time"}
                  </span>
                  <div className="inline-flex flex-none rounded-full border border-brass/20 p-0.5">
                    <LensButton active={!isRank} onClick={() => onModeChange("value")}>
                      Value
                    </LensButton>
                    <LensButton active={isRank} onClick={() => onModeChange("rank")}>
                      Rank
                    </LensButton>
                  </div>
                </div>
                {isRank && !file ? (
                  <div className="grid h-[220px] place-items-center px-2 font-mono text-[11px] uppercase tracking-[0.14em] text-chalk-dim">
                    {failed ? "World rankings unavailable" : "Computing world rankings…"}
                  </div>
                ) : (
                  <MetricChart
                    lines={lines}
                    unit={metric.unit}
                    invertY={isRank}
                    formatValue={isRank ? rankFmt : undefined}
                  />
                )}
              </div>
            ) : (
              <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-chalk-mute">
                No time series available for this indicator.
              </p>
            )}

            {/* legend + compare controls */}
            {hasSeries && (
              <div className="mt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <LegendChip color={PRIMARY_COLOR} flag={country.flag} label={country.name} />
                  {shownCompare.map((code) => {
                    const idx = compare.indexOf(code);
                    const isWorld = code === WORLD_CODE;
                    const color = isWorld ? WORLD_COLOR : COMPARE_COLORS[idx % COMPARE_COLORS.length];
                    const label = isWorld ? "World average" : file?.countries[code]?.name ?? code;
                    const flag = isWorld ? "🌍" : file?.countries[code]?.flag ?? null;
                    return (
                      <LegendChip
                        key={code}
                        color={color}
                        flag={flag}
                        label={label}
                        onRemove={() => onCompareChange(compare.filter((c) => c !== code))}
                      />
                    );
                  })}
                  {!picking && (
                    <button
                      type="button"
                      onClick={enterCompare}
                      className="rounded-full border border-brass/30 px-3 py-[5px] font-mono text-[11px] uppercase tracking-[0.1em] text-chalk-soft transition-colors hover:border-brass hover:text-chalk-bright"
                    >
                      + Compare
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onMapToggle}
                    aria-pressed={mapOpen}
                    className={`rounded-full border px-3 py-[5px] font-mono text-[11px] uppercase tracking-[0.1em] transition-colors ${
                      mapOpen
                        ? "border-brass bg-brass/15 text-chalk-bright"
                        : "border-brass/30 text-chalk-soft hover:border-brass hover:text-chalk-bright"
                    }`}
                  >
                    🗺 Map
                  </button>
                </div>

                {picking && (
                  <div className="mt-3 rounded-[8px] border border-brass/15 bg-[#0c0b12] p-3">
                    {loading && (
                      <div className="px-1 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-chalk-dim">
                        Loading nations…
                      </div>
                    )}
                    {failed && (
                      <div className="px-1 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-chalk-mute">
                        Comparison data unavailable.
                      </div>
                    )}
                    {file && !failed && (
                      <>
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search nations…"
                            className="min-w-0 flex-1 rounded-[5px] border border-brass/20 bg-[#08070d] px-3 py-2 text-[13px] text-chalk placeholder:text-chalk-mute focus:border-brass/50 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPicking(false);
                              setQuery("");
                            }}
                            className="font-mono text-[11px] uppercase tracking-[0.1em] text-chalk-dim transition-colors hover:text-chalk"
                          >
                            Done
                          </button>
                        </div>

                        {!isRank && !worldPicked && !query && (
                          <button
                            type="button"
                            onClick={() => onCompareChange([...compare, WORLD_CODE])}
                            className="mt-2 flex w-full items-center gap-2 rounded-[5px] px-2 py-2 text-left text-[13px] text-chalk-soft transition-colors hover:bg-brass/10"
                          >
                            <span className="text-[15px]">🌍</span>
                            <span>World average</span>
                          </button>
                        )}

                        {atLimit ? (
                          <div className="mt-2 px-2 py-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-chalk-mute">
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
                                className="flex w-full items-center gap-2.5 rounded-[5px] px-2 py-2 text-left text-[13px] text-chalk-soft transition-colors hover:bg-brass/10"
                              >
                                <span className="w-[18px] flex-none text-[15px]">{c.flag ?? "·"}</span>
                                <span className="truncate">{c.name}</span>
                                <span className="ml-auto flex-none font-mono text-[11px] text-chalk-dim">
                                  {formatMetric(c.value, metric.unit)}
                                </span>
                              </button>
                            ))}
                            {candidates.length === 0 && (
                              <div className="px-2 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-chalk-mute">
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

            {/* spatial map — the world coloured by this metric */}
            {hasSeries && mapOpen && (
              <div className="mt-4 rounded-[6px] border border-brass/12 bg-[#0b0a10] p-2">
                <div className="px-1.5 pb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-dim">
                  World by {metric.label} · click a nation to compare
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
                  <div className="grid h-[200px] place-items-center font-mono text-[11px] uppercase tracking-[0.14em] text-chalk-dim">
                    {failed ? "Map data unavailable" : "Loading map…"}
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
              <div className="mt-6 border-t border-brass/12 pt-4">
                <div className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-chalk-faint">Source</div>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-block font-semibold text-reading underline-offset-2 transition-colors hover:text-brass hover:underline"
                >
                  {source.label}
                </a>
                <div className="mt-1 font-mono text-[10.5px] tracking-[0.04em] text-chalk-dim">
                  {source.publisher} · {source.license} · accessed {source.accessed}
                </div>
                {shownCompare.length > 0 && (
                  <p className="mt-2 font-serif text-[12.5px] italic leading-relaxed text-chalk-dim">
                    Compared nations draw on the same indicator and source; figures show each nation&apos;s latest available year.
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
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
      className={`rounded-full px-3 py-[3px] font-mono text-[10.5px] uppercase tracking-[0.1em] transition-colors ${
        active ? "bg-brass/20 text-chalk-bright" : "text-chalk-dim hover:text-chalk"
      }`}
    >
      {children}
    </button>
  );
}

function LegendChip({
  color,
  flag,
  label,
  onRemove,
}: {
  color: string;
  flag: string | null;
  label: string;
  onRemove?: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-brass/15 bg-[#0e0d14] py-[5px] pl-2.5 pr-2 text-[12px] text-chalk">
      <span className="h-2.5 w-2.5 flex-none rounded-[2px]" style={{ background: color }} />
      {flag && <span className="text-[13px] leading-none">{flag}</span>}
      <span className="max-w-[160px] truncate">{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="grid h-4 w-4 flex-none place-items-center rounded-full text-[13px] leading-none text-chalk-dim transition-colors hover:text-chalk-bright"
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
      <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-chalk-faint">{caption}</div>
      <div className="mt-1.5 font-display text-[19px] leading-none text-chalk">{value}</div>
      <div className="mt-1 font-mono text-[10px] tracking-[0.06em] text-chalk-dim">{label}</div>
    </div>
  );
}

// Change from the start of the trailing series to the latest value. For
// already-percentage units we report the swing in percentage points; otherwise a
// percent change. Neutral palette — up/down is not framed as good or bad.
function computeChange(
  first: { year: number; value: number } | null,
  metric: Metric,
): { text: string; arrow: string; tint: string } | null {
  if (!first || metric.value == null) return null;
  const diff = metric.value - first.value;
  const arrow = diff > 0 ? "▲" : diff < 0 ? "▼" : "—";
  const tint =
    diff > 0 ? "var(--color-verdigris)" : diff < 0 ? "var(--color-crimson)" : "var(--color-chalk-dim)";
  const pointUnit = metric.unit === "%" || metric.unit === "% of GDP";
  if (pointUnit) {
    return { text: `${Math.abs(diff).toFixed(1)} pp since ${first.year}`, arrow, tint };
  }
  if (first.value === 0) return null;
  const pct = (diff / Math.abs(first.value)) * 100;
  return {
    text: `${Math.abs(pct).toFixed(pct >= 100 || pct <= -100 ? 0 : 1)}% since ${first.year}`,
    arrow,
    tint,
  };
}
