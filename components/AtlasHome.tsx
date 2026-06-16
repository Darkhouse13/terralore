"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  publishedCount,
}: {
  historyCodes: string[];
  foundingNotes: Record<string, string>;
  headlines: Record<string, { gdp: string; gdpPerCapita: string }>;
  layers: ChoroLayer[];
  publishedCount: number;
}) {
  const historySet = useMemo(() => new Set(historyCodes), [historyCodes]);
  const [selected, setSelected] = useState<CountryMeta | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const hasHistory = useCallback((code: string) => historySet.has(code), [historySet]);

  const activeLayer = useMemo(
    () => layers.find((l) => l.key === activeKey) ?? null,
    [layers, activeKey],
  );
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
      <Starfield />

      {/* The globe */}
      <GlobeScene
        selectedCode={selected?.code ?? null}
        onSelect={setSelected}
        hasHistory={hasHistory}
        choroplethValues={activeLayer?.values ?? null}
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

      {/* Logo */}
      <div className="absolute left-6 top-6 z-20 flex items-center gap-3 md:left-11 md:top-8">
        <Compass />
        <span className="font-mono text-[13px] uppercase tracking-[0.28em] text-brass">
          Terralore
        </span>
      </div>

      {/* Index link */}
      <Link
        href="/atlas"
        className="absolute right-6 top-6 z-20 inline-flex items-center gap-2.5 rounded-[4px] border border-brass/28 px-4 py-2 font-mono text-[12px] uppercase tracking-[0.2em] text-chalk-soft backdrop-blur transition-colors hover:border-brass hover:text-chalk md:right-11 md:top-7"
      >
        Index <span className="text-brass-bright">{publishedCount}</span>
      </Link>

      {/* Hero */}
      <div className="absolute left-6 top-[19%] z-10 max-w-[430px] md:left-11">
        <h1 className="font-display text-[clamp(34px,5.4vw,68px)] font-[330] leading-none tracking-[-0.02em] text-chalk-bright">
          An atlas of how nations came to be.
        </h1>
        <p className="mt-5 max-w-[380px] font-serif text-[clamp(16px,1.5vw,20px)] font-[340] leading-[1.55] text-[#b6ad99]">
          Turn the globe. Choose a country. Trace the long path — empires, ruptures and
          revolutions — that made it a nation. Every claim sourced.
        </p>
      </div>

      {/* Hint */}
      <AnimatePresence>
        {!selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.6 }}
            className="pointer-events-none absolute inset-x-0 bottom-7 z-10 flex justify-center"
          >
            <span className="rounded-none border border-brass/15 bg-[rgba(10,11,20,0.4)] px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-chalk-dim backdrop-blur">
              Drag to spin · Scroll to zoom · Click a nation
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Choropleth layer control + legend */}
      <div className="absolute bottom-9 left-6 z-20 hidden w-[min(360px,40vw)] md:left-11 md:block">
        <AnimatePresence>
          {activeLayer && range && (
            <motion.div
              key={activeLayer.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.3 }}
              className="mb-3.5 rounded-none border border-brass/15 bg-[rgba(10,11,20,0.6)] px-4 py-3.5 backdrop-blur"
            >
              <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-chalk-soft">
                {activeLayer.label}
              </div>
              <div className="h-3 rounded-[2px]" style={{ background: RAMP }} />
              <div className="mt-2 flex justify-between font-mono text-[11px] text-chalk-soft">
                <span>{formatMetric(range.min, activeLayer.unit)}</span>
                <span>{formatMetric(range.max, activeLayer.unit)}</span>
              </div>
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

      {/* Selection card */}
      <div className="pointer-events-none fixed inset-0 z-30 flex items-end justify-center p-4 md:items-end md:justify-end md:p-9">
        <AnimatePresence mode="wait">
          {selected && (
            <CountryCard
              meta={selected}
              hasHistory={hasHistory(selected.code)}
              foundingNote={foundingNotes[selected.code]}
              headline={headlines[selected.code]}
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
