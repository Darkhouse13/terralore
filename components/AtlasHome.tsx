"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import GlobeScene, { CHORO_LOW, CHORO_HIGH } from "./GlobeScene";
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

const gradientCss = `linear-gradient(90deg, rgb(${CHORO_LOW.join(",")}), rgb(${CHORO_HIGH.join(",")}))`;

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
    <main className="relative h-[100dvh] w-full overflow-hidden bg-void text-chalk">
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

      {/* Header */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-6 md:p-9">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-3">
            <Compass />
            <span className="eyebrow text-brass">Terra Historica</span>
          </div>
          <h1 className="mt-3 max-w-md font-display text-[1.9rem] font-medium leading-[1.08] text-chalk md:text-[2.4rem]">
            An atlas of how nations came to be.
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-chalk-soft">
            Turn the globe. Choose a country. Trace the long path — empires,
            ruptures and revolutions — that made it a nation. Every claim sourced.
          </p>
        </div>

        <Link
          href="/atlas"
          className="pointer-events-auto hidden items-center gap-2 rounded-full border border-void-line
            bg-void-soft/60 px-4 py-2 text-sm text-chalk-soft backdrop-blur
            transition hover:border-brass/40 hover:text-chalk md:flex"
        >
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.14em]">Index</span>
          <span className="text-brass">{publishedCount}</span>
        </Link>
      </header>

      {/* Hint */}
      <AnimatePresence>
        {!selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.6 }}
            className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center"
          >
            <span className="rounded-full border border-void-line bg-void-soft/50 px-4 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-chalk-faint backdrop-blur">
              Drag to spin · Scroll to zoom · Click a nation
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Choropleth layer control + legend */}
      <div className="pointer-events-none absolute bottom-6 left-6 z-20 hidden md:block">
        <div className="pointer-events-auto max-w-xs">
          <AnimatePresence>
            {activeLayer && range && (
              <motion.div
                key={activeLayer.key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2 }}
                className="mb-2 rounded-xl border border-void-line bg-void-soft/70 px-3 py-2.5 backdrop-blur"
              >
                <div className="eyebrow text-chalk-faint">{activeLayer.label}</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="font-mono text-[0.62rem] text-chalk-soft">
                    {formatMetric(range.min, activeLayer.unit)}
                  </span>
                  <div className="h-2 w-28 rounded-full" style={{ background: gradientCss }} />
                  <span className="font-mono text-[0.62rem] text-chalk-soft">
                    {formatMetric(range.max, activeLayer.unit)}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap items-center gap-1.5 rounded-full border border-void-line bg-void-soft/50 px-3 py-2 backdrop-blur">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-chalk-faint">
              Color by
            </span>
            {layers.map((l) => {
              const active = l.key === activeKey;
              return (
                <button
                  key={l.key}
                  onClick={() => setActiveKey(active ? null : l.key)}
                  className={`rounded-full px-2.5 py-1 text-[0.72rem] transition ${
                    active
                      ? "bg-brass text-void"
                      : "text-chalk-soft hover:bg-void-line/60 hover:text-chalk"
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
      <div className="pointer-events-none fixed inset-0 z-30 flex items-end justify-center p-4 md:items-center md:justify-end md:p-10">
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9.2" stroke="var(--color-brass)" strokeWidth="1.1" opacity="0.7" />
      <path d="M12 4.5l2.1 5.4L19.5 12l-5.4 2.1L12 19.5l-2.1-5.4L4.5 12l5.4-2.1z" fill="var(--color-brass)" opacity="0.85" />
    </svg>
  );
}
