"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import GlobeScene from "./GlobeScene";
import CountryCard from "./CountryCard";
import Starfield from "./Starfield";
import { formatMetric } from "@/lib/format";
import type { CountryMeta } from "@/lib/types";

export interface ChoroLayer {
  key: string;
  label: string;
  unit: string;
  values: Record<string, number>;
}

// The choropleth ramp shown in the legend — cool steel → warm brass, matching
// the globe's data tint (see GlobeScene choroColor).
const RAMP = "linear-gradient(90deg,#3c4f63,#5f7796,#9a9a86,#bf9550,#d8b56e)";

export default function AtlasHome({
  historyCodes,
  foundingNotes,
  headlines,
  layers,
  metaIndex,
  publishedCount,
}: {
  historyCodes: string[];
  foundingNotes: Record<string, string>;
  headlines: Record<string, { gdp: string; gdpPerCapita: string }>;
  layers: ChoroLayer[];
  metaIndex: Record<string, { name: string; flag: string | null }>;
  publishedCount: number;
}) {
  const historySet = useMemo(() => new Set(historyCodes), [historyCodes]);
  const [selected, setSelected] = useState<CountryMeta | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);

  const hasHistory = useCallback((code: string) => historySet.has(code), [historySet]);

  // Cinematic entrance: trigger the staggered reveal just after mount.
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 80);
    return () => clearTimeout(t);
  }, []);
  // The onboarding hint bows out after the first interaction (or a fallback).
  useEffect(() => {
    const dismiss = () => setHintDismissed(true);
    const t = setTimeout(dismiss, 10000);
    window.addEventListener("pointerdown", dismiss, { once: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("pointerdown", dismiss);
    };
  }, []);
  const reveal = (delay: number): CSSProperties => ({
    opacity: entered ? 1 : 0,
    transform: entered ? "none" : "translateY(10px)",
    transition: `opacity .8s ease ${delay}s, transform .9s cubic-bezier(.16,1,.3,1) ${delay}s`,
  });

  const activeLayer = useMemo(
    () => layers.find((l) => l.key === activeKey) ?? null,
    [layers, activeKey],
  );
  // The active layer's value for the selected nation — lets the card deep-link
  // straight into that metric's window on the dossier (closing the globe→dossier loop).
  const activeMetric = useMemo(() => {
    if (!activeLayer || !selected) return undefined;
    const v = activeLayer.values[selected.code];
    if (v == null) return undefined;
    return {
      key: activeLayer.key,
      label: activeLayer.label,
      value: formatMetric(v, activeLayer.unit),
    };
  }, [activeLayer, selected]);
  const range = useMemo(() => {
    if (!activeLayer) return null;
    const vs = Object.values(activeLayer.values);
    return { min: Math.min(...vs), max: Math.max(...vs) };
  }, [activeLayer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main
      className="relative h-[100dvh] w-full overflow-hidden text-chalk"
      style={{
        background:
          "radial-gradient(135% 110% at 60% 46%, #141a2e 0%, #0b0c18 44%, #06060c 100%)",
      }}
    >
      <div
        className="absolute inset-0"
        style={{ opacity: entered ? 1 : 0, transition: "opacity 1.5s ease" }}
      >
        <Starfield />
      </div>

      {/* The globe */}
      <GlobeScene
        selectedCode={selected?.code ?? null}
        onSelect={setSelected}
        hasHistory={hasHistory}
        choroplethValues={activeLayer?.values ?? null}
        onHover={setHoveredCode}
      />

      {/* soft vignette to seat the globe in the void */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(3,4,7,0.55) 100%)",
        }}
      />

      {/* focus scrim — gently draws the eye to a selected nation */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{
          background:
            "radial-gradient(circle at 50% 46%, transparent 26%, rgba(4,5,9,0.5) 96%)",
          opacity: selected ? 1 : 0,
          transition: "opacity .5s ease",
        }}
      />

      {/* Logo */}
      <div
        className="absolute left-6 top-6 z-20 flex items-center gap-3 md:left-11 md:top-8"
        style={reveal(0.35)}
      >
        <Compass />
        <span className="font-mono text-[13px] uppercase tracking-[0.28em] text-brass">
          Terralore
        </span>
      </div>

      {/* Index link */}
      <Link
        href="/atlas"
        style={reveal(0.45)}
        className="absolute right-6 top-6 z-20 inline-flex items-center gap-2.5 rounded-[4px] border border-brass/28 px-4 py-2 font-mono text-[12px] uppercase tracking-[0.2em] text-chalk-soft backdrop-blur transition-colors hover:border-brass hover:text-chalk md:right-11 md:top-7"
      >
        Index <span className="text-brass-bright">{publishedCount}</span>
      </Link>

      {/* Hero */}
      <div className="absolute left-6 top-[19%] z-10 max-w-[430px] md:left-11" style={reveal(0.55)}>
        <h1 className="font-display text-[clamp(27px,5.4vw,68px)] font-[330] leading-none tracking-[-0.02em] text-chalk-bright">
          An atlas of how nations came to be.
        </h1>
        <p className="mt-5 max-w-[380px] font-serif text-[clamp(16px,1.5vw,20px)] font-[340] leading-[1.55] text-[#b6ad99]">
          Turn the globe. Choose a country. Trace the long path — empires, ruptures and
          revolutions — that made it a nation. Every claim sourced.
        </p>
      </div>

      {/* Hint */}
      <AnimatePresence>
        {!selected && !hintDismissed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.6 }}
            className="pointer-events-none absolute inset-x-0 bottom-7 z-10 hidden justify-center md:flex"
          >
            <span className="rounded-none border border-brass/15 bg-[rgba(10,11,20,0.4)] px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-chalk-dim backdrop-blur">
              Drag to spin · Scroll to zoom · Click a nation
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Choropleth layer control + legend */}
      <div
        className="absolute bottom-9 left-6 z-20 hidden w-[min(420px,46vw)] md:left-11 md:block"
        style={reveal(0.75)}
      >
        <AnimatePresence>
          {activeLayer && range && (
            <motion.div
              key={activeLayer.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="mb-3.5"
            >
              <ChoroInstrument
                layer={activeLayer}
                range={range}
                metaIndex={metaIndex}
                hoveredCode={hoveredCode}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="rounded-none border border-brass/15 bg-[rgba(10,11,20,0.6)] px-[18px] py-3.5 backdrop-blur">
          <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-chalk-faint">
            Color by
          </div>
          <div className="flex flex-wrap gap-2">
            {layers.map((l) => {
              const active = l.key === activeKey;
              return (
                <button
                  key={l.key}
                  onClick={() => setActiveKey(active ? null : l.key)}
                  className={`whitespace-nowrap rounded-[4px] border px-3 py-1.5 text-[13px] transition-colors ${
                    active
                      ? "border-brass-bright bg-brass-bright font-semibold text-[#1a140a]"
                      : "border-brass/25 text-chalk-soft hover:border-brass/50 hover:text-chalk"
                  }`}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Color by — compact mobile control */}
      {!selected && (
        <div className="absolute inset-x-0 bottom-0 z-20 md:hidden" style={reveal(0.75)}>
          <div className="border-t border-brass/15 bg-[rgba(10,11,20,0.72)] px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur">
            {activeLayer && range && (
              <div className="mb-2.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-soft">
                    {activeLayer.label}
                  </span>
                  <span className="font-mono text-[10px] text-chalk-dim">
                    {formatMetric(range.min, activeLayer.unit)} – {formatMetric(range.max, activeLayer.unit)}
                  </span>
                </div>
                <div className="h-2 rounded-[2px]" style={{ background: RAMP }} />
              </div>
            )}
            <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]">
              {layers.map((l) => {
                const active = l.key === activeKey;
                return (
                  <button
                    key={l.key}
                    onClick={() => setActiveKey(active ? null : l.key)}
                    className={`shrink-0 whitespace-nowrap rounded-[4px] border px-3 py-1.5 text-[13px] transition-colors ${
                      active
                        ? "border-brass-bright bg-brass-bright font-semibold text-[#1a140a]"
                        : "border-brass/25 text-chalk-soft"
                    }`}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Selection card */}
      <div className="pointer-events-none fixed inset-0 z-30 flex items-end justify-center p-4 md:items-end md:justify-end md:p-9">
        <AnimatePresence mode="wait">
          {selected && (
            <CountryCard
              meta={selected}
              hasHistory={hasHistory(selected.code)}
              foundingNote={foundingNotes[selected.code]}
              headline={headlines[selected.code]}
              activeMetric={activeMetric}
              onClose={() => setSelected(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function Compass() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
      <circle cx="13" cy="13" r="11" fill="none" stroke="var(--color-brass)" strokeWidth="1.2" />
      <path d="M13 2 L15.4 13 L13 24 L10.6 13 Z" fill="var(--color-brass-bright)" />
      <path d="M2 13 L13 10.6 L24 13 L13 15.4 Z" fill="rgba(216,181,110,0.45)" />
      <circle cx="13" cy="13" r="1.6" fill="#06060c" />
    </svg>
  );
}

// The choropleth ramp as discrete stops, so the histogram bars can be tinted to
// match the gradient.
const RAMP_STOPS = [
  [60, 79, 99],
  [95, 119, 150],
  [154, 154, 134],
  [191, 149, 80],
  [216, 181, 110],
] as const;

function rampColor(t: number) {
  const x = Math.max(0, Math.min(1, t)) * (RAMP_STOPS.length - 1);
  const i = Math.min(RAMP_STOPS.length - 2, Math.floor(x));
  const f = x - i;
  const a = RAMP_STOPS[i];
  const b = RAMP_STOPS[i + 1];
  const c = (k: number) => Math.round(a[k] + (b[k] - a[k]) * f);
  return `rgb(${c(0)},${c(1)},${c(2)})`;
}

// The "Color by" gauge: a value-distribution histogram over the choropleth ramp,
// the extreme nations anchored at each end, and a marker that tracks the nation
// hovered on the globe.
function ChoroInstrument({
  layer,
  range,
  metaIndex,
  hoveredCode,
}: {
  layer: ChoroLayer;
  range: { min: number; max: number };
  metaIndex: Record<string, { name: string; flag: string | null }>;
  hoveredCode: string | null;
}) {
  const { min, max } = range;
  const span = max - min || 1;
  const entries = Object.entries(layer.values);

  const BINS = 28;
  const counts = new Array(BINS).fill(0);
  let loCode = entries[0]?.[0] ?? "";
  let hiCode = entries[0]?.[0] ?? "";
  for (const [code, v] of entries) {
    const idx = Math.min(BINS - 1, Math.max(0, Math.floor(((v - min) / span) * BINS)));
    counts[idx]++;
    if (v < layer.values[loCode]) loCode = code;
    if (v > layer.values[hiCode]) hiCode = code;
  }
  const maxCount = Math.max(...counts, 1);

  const hv = hoveredCode != null ? layer.values[hoveredCode] : undefined;
  const hoverPct = hv != null ? Math.max(0, Math.min(1, (hv - min) / span)) : null;
  const hoverName = hoveredCode != null ? metaIndex[hoveredCode]?.name : null;

  const fmt = (v: number) => formatMetric(v, layer.unit);
  const short = (s?: string | null) => (s && s.length > 13 ? s.slice(0, 12) + "…" : s ?? "—");

  return (
    <div className="rounded-none border border-brass/15 bg-[rgba(10,11,20,0.62)] px-4 py-3.5 backdrop-blur">
      <div className="mb-6 flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-chalk-soft">
          {layer.label}
        </span>
        <span className="font-mono text-[10px] tracking-[0.06em] text-chalk-dim">
          {entries.length} nations
        </span>
      </div>

      {/* histogram + ramp + hover marker */}
      <div className="relative">
        <div className="flex h-[30px] items-end gap-px">
          {counts.map((c, i) => (
            <div
              key={i}
              className="flex-1"
              style={{
                height: `${Math.max(7, (c / maxCount) * 100)}%`,
                background: rampColor((i + 0.5) / BINS),
                opacity: 0.5,
              }}
            />
          ))}
        </div>
        <div className="mt-1 h-2.5 rounded-[2px]" style={{ background: RAMP }} />

        {hoverPct != null && (
          <div
            className="pointer-events-none absolute -top-1 bottom-[2px] z-10 w-px bg-chalk-bright"
            style={{ left: `${hoverPct * 100}%`, transition: "left .25s cubic-bezier(.16,1,.3,1)" }}
          >
            <div className="absolute -top-[18px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[3px] border border-brass/45 bg-[rgba(8,9,14,0.96)] px-2 py-0.5 font-mono text-[10px] text-chalk">
              {short(hoverName)} · <span className="text-brass-bright">{fmt(hv!)}</span>
            </div>
            <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full border border-[rgba(8,9,14,0.9)] bg-chalk-bright" />
          </div>
        )}
      </div>

      {/* extreme nations */}
      <div className="mt-2.5 flex items-center justify-between gap-2 font-mono text-[10px] text-chalk-dim">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="text-[12px] leading-none">{metaIndex[loCode]?.flag ?? "🏳️"}</span>
          <span className="truncate text-chalk-soft">{short(metaIndex[loCode]?.name)}</span>
          <span>{fmt(layer.values[loCode])}</span>
        </span>
        <span className="flex min-w-0 items-center justify-end gap-1.5 text-right">
          <span>{fmt(layer.values[hiCode])}</span>
          <span className="truncate text-chalk-soft">{short(metaIndex[hiCode]?.name)}</span>
          <span className="text-[12px] leading-none">{metaIndex[hiCode]?.flag ?? "🏳️"}</span>
        </span>
      </div>
    </div>
  );
}
