"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
// The globe is a hand-rolled canvas-2D renderer (~12 KB) with the same look
// and behaviours as the retired three.js version (GlobeScene.tsx, kept as
// reference) — cheap enough to mount immediately on every device, so the
// globe is alive from its first frame instead of deferred behind a still.
// The SVG still remains as the zero-JS first paint and fades once the canvas
// draws its identical opening frame.
import GlobeLite from "./GlobeLite";
import CountryCard from "./CountryCard";
import { formatMetric } from "@/lib/format";
import { choroColor, choroGradient } from "@/lib/choropleth";
import type { CountryMeta } from "@/lib/types";

export interface ChoroLayer {
  key: string;
  label: string;
  unit: string;
  values: Record<string, number>;
}

// The legend swatch is sampled from the same function that tints the globe, so
// the two cannot drift apart (see lib/choropleth).
const RAMP = choroGradient();

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
  const [hintDismissed, setHintDismissed] = useState(false);
  // globeReady crossfades the still out once the canvas draws its first frame.
  const [globeReady, setGlobeReady] = useState(false);

  const hasHistory = useCallback((code: string) => historySet.has(code), [historySet]);
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
  // The entrance is a CSS animation (`.reveal` in globals.css) — it starts at
  // style-parse time rather than waiting on hydration, which is what keeps the
  // hero eligible to be the largest contentful paint. This only supplies the
  // per-element stagger.
  const reveal = (delay: number): CSSProperties =>
    ({ "--reveal-delay": `${delay}s` }) as CSSProperties;

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
    // A <section>, not the page: the archive continues below the fold now, so
    // the globe is the opening chapter rather than the whole book.
    <section
      className="relative h-[100dvh] w-full overflow-hidden text-chalk"
      style={{
        background:
          "radial-gradient(135% 110% at 60% 46%, #0c2e3d 0%, #082230 44%, #04161f 100%)",
      }}
    >
      {/* Isobaths — faint concentric depth contours radiating from the globe.
          This replaced the starfield (the Chanel cut for this pass, logged in
          PROGRESS.md). A starfield belonged to the old "cosmic void" concept;
          in STRATUM the dark ground is *water*, not space, and stars actively
          contradicted the one idea the whole design rests on. Contour rings say
          the same thing the globe says — this is a chart — and they cost a
          single CSS gradient instead of 152 lines of animated client component. */}
      <div
        aria-hidden
        className="reveal-fade pointer-events-none absolute inset-0"
        style={{
          background:
            "repeating-radial-gradient(circle at 50% 46%, transparent 0 58px, rgba(39,111,128,0.055) 58px 59px)",
          maskImage: "radial-gradient(circle at 50% 46%, black 20%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 46%, black 20%, transparent 78%)",
        }}
      />

      {/* The globe — canvas-2D, alive from its first frame on every device */}
      <GlobeLite
        selectedCode={selected?.code ?? null}
        onSelect={setSelected}
        hasHistory={hasHistory}
        choroplethValues={activeLayer?.values ?? null}
        onHover={setHoveredCode}
        onReady={() => setGlobeReady(true)}
      />

      {/* The still — the globe's exact opening frame, painted before any JS,
          and the landing page's LCP element. Kept as a linked file rather than
          inlined into the HTML: inlining was tried and measured worse (the RSC
          payload duplicates any server-rendered markup, so a 90 KB SVG landed
          in the document twice — doc 34 KB → 104 KB gzipped, TBT 80 → 153 ms,
          and LCP did not move). A cached, separately-compressed file wins.

          Deliberately NOT `.reveal-fade`: an element animating up from
          opacity 0 is not LCP-eligible until substantially visible — the trap
          that already cost the hero paragraph a 7.6s LCP (see globals.css).
          The cross-fade to the canvas is the parent's opacity. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid place-items-center"
        style={{ opacity: globeReady ? 0 : 1, transition: "opacity 0.8s ease" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- build-time SVG, no optimizer pass wanted */}
        <img
          src="/globe-still.svg"
          alt=""
          width={1000}
          height={1000}
          // Sphere = 89.6% of the SVG viewBox (atmosphere padding), so a 71×
          // box puts the drawn sphere at ~64% of the short side — the same
          // R_FRACTION the canvas uses, keeping the handover pixel-stable.
          className="h-[min(71dvh,96vw)] w-[min(71dvh,96vw)] translate-y-[6dvh] select-none sm:translate-y-0"
          fetchPriority="high"
          decoding="sync"
          draggable={false}
        />
      </div>

      {/* soft vignette to seat the globe in the deep */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(2,11,16,0.55) 100%)",
        }}
      />

      {/* focus scrim — gently draws the eye to a selected nation */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{
          background:
            "radial-gradient(circle at 50% 46%, transparent 26%, rgba(2,11,16,0.5) 96%)",
          opacity: selected ? 1 : 0,
          transition: "opacity .5s ease",
        }}
      />

      {/* Logo */}
      <div
        className="reveal absolute left-6 top-6 z-20 flex items-center gap-3 md:left-11 md:top-8"
        style={reveal(0.35)}
      >
        <Compass />
        <span className="font-mono text-[13px] uppercase tracking-[0.28em] text-copper">
          Terralore
        </span>
      </div>

      {/* Index link */}
      <Link
        href="/atlas"
        // The atlas index is a large payload and this link sits on the landing
        // page, so the default viewport prefetch fires several RSC requests at
        // exactly the moment the globe chunk is downloading — competing for
        // bandwidth to preload a page most visitors reach later, if at all.
        prefetch={false}
        style={reveal(0.45)}
        className="reveal absolute right-6 top-6 z-20 inline-flex items-center gap-2.5 rounded-[4px] border border-copper/28 px-4 py-2 font-mono text-[12px] uppercase tracking-[0.2em] text-chalk-2 backdrop-blur transition-colors hover:border-copper hover:text-chalk md:right-11 md:top-7"
      >
        Index <span className="text-copper-bright">{publishedCount}</span>
      </Link>

      {/* Hero */}
      <div
        className="reveal absolute left-6 top-[19%] z-10 max-w-[430px] md:left-11"
        style={reveal(0.55)}
      >
        <h1 className="font-display text-[clamp(27px,5.4vw,68px)] font-[330] leading-none tracking-[-0.02em] text-chalk-hi">
          An atlas of how nations came to be.
        </h1>
        <p className="mt-5 max-w-[380px] font-serif text-[clamp(16px,1.5vw,20px)] font-[340] leading-[1.55] text-[#6c7772]">
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
            <span className="rounded-none border border-copper/15 bg-[rgba(10,11,20,0.4)] px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-chalk-4 backdrop-blur">
              Drag to spin · Click a nation
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Choropleth layer control + legend */}
      <div
        className="reveal absolute bottom-9 left-6 z-20 hidden w-[min(420px,46vw)] md:left-11 md:block"
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

        <div className="rounded-none border border-copper/15 bg-[rgba(10,11,20,0.6)] px-[18px] py-3.5 backdrop-blur">
          <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-chalk-3">
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
                      ? "border-copper-bright bg-copper-bright font-semibold text-[#04161f]"
                      : "border-copper/25 text-chalk-2 hover:border-copper/50 hover:text-chalk"
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
        <div className="reveal absolute inset-x-0 bottom-0 z-20 md:hidden" style={reveal(0.75)}>
          <div className="border-t border-copper/15 bg-[rgba(10,11,20,0.72)] px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur">
            {activeLayer && range && (
              <div className="mb-2.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-2">
                    {activeLayer.label}
                  </span>
                  <span className="font-mono text-[10px] text-chalk-4">
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
                        ? "border-copper-bright bg-copper-bright font-semibold text-[#04161f]"
                        : "border-copper/25 text-chalk-2"
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

      {/* Scroll cue — the archive continues */}
      <a
        href="#archive"
        className="reveal absolute bottom-2 left-1/2 z-10 -translate-x-1/2 p-2 font-mono text-[10px] uppercase tracking-[0.22em] text-chalk-4 transition-colors hover:text-copper-bright"
        style={reveal(1.1)}
      >
        ↓ The archive
      </a>
    </section>
  );
}

function Compass() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
      <circle cx="13" cy="13" r="11" fill="none" stroke="var(--color-copper)" strokeWidth="1.2" />
      <path d="M13 2 L15.4 13 L13 24 L10.6 13 Z" fill="var(--color-copper-bright)" />
      <path d="M2 13 L13 10.6 L24 13 L13 15.4 Z" fill="rgba(227, 154, 103,0.45)" />
      <circle cx="13" cy="13" r="1.6" fill="#04161f" />
    </svg>
  );
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
    <div className="rounded-none border border-copper/15 bg-[rgba(10,11,20,0.62)] px-4 py-3.5 backdrop-blur">
      <div className="mb-6 flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-chalk-2">
          {layer.label}
        </span>
        <span className="font-mono text-[10px] tracking-[0.06em] text-chalk-4">
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
                background: choroColor((i + 0.5) / BINS),
                opacity: 0.5,
              }}
            />
          ))}
        </div>
        <div className="mt-1 h-2.5 rounded-[2px]" style={{ background: RAMP }} />

        {hoverPct != null && (
          <div
            className="pointer-events-none absolute -top-1 bottom-[2px] z-10 w-px bg-chalk-hi"
            style={{ left: `${hoverPct * 100}%`, transition: "left .25s cubic-bezier(.16,1,.3,1)" }}
          >
            <div className="absolute -top-[18px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[3px] border border-copper/45 bg-[rgba(8,9,14,0.96)] px-2 py-0.5 font-mono text-[10px] text-chalk">
              {short(hoverName)} · <span className="text-copper-bright">{fmt(hv!)}</span>
            </div>
            <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full border border-[rgba(8,9,14,0.9)] bg-chalk-hi" />
          </div>
        )}
      </div>

      {/* extreme nations */}
      <div className="mt-2.5 flex items-center justify-between gap-2 font-mono text-[10px] text-chalk-4">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="text-[12px] leading-none">{metaIndex[loCode]?.flag ?? "🏳️"}</span>
          <span className="truncate text-chalk-2">{short(metaIndex[loCode]?.name)}</span>
          <span>{fmt(layer.values[loCode])}</span>
        </span>
        <span className="flex min-w-0 items-center justify-end gap-1.5 text-right">
          <span>{fmt(layer.values[hiCode])}</span>
          <span className="truncate text-chalk-2">{short(metaIndex[hiCode]?.name)}</span>
          <span className="text-[12px] leading-none">{metaIndex[hiCode]?.flag ?? "🏳️"}</span>
        </span>
      </div>
    </div>
  );
}
