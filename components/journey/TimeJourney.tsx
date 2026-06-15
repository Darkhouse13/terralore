"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import type { CountryHistory, CountryMeta } from "@/lib/types";
import { CATEGORY_META } from "@/lib/types";
import { buildMoments, bigYear, momentEraIndex, type Moment } from "@/lib/journey";
import { formatPopulation } from "@/lib/format";
import TimelineRail from "./TimelineRail";
import ChapterDrawer from "./ChapterDrawer";

export default function TimeJourney({
  history,
  meta,
  neighbours,
}: {
  history: CountryHistory;
  meta: CountryMeta;
  neighbours: { code: string; name: string; flag: string | null }[];
}) {
  const moments = useMemo(() => buildMoments(history), [history]);
  const sourceById = useMemo(
    () => new Map(history.sources.map((s) => [s.id, s])),
    [history]
  );

  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [drawerEra, setDrawerEra] = useState<{ era: CountryHistory["eras"][number]; n: number } | null>(null);
  const lock = useRef(false);

  const total = moments.length;
  const m = moments[i];
  const eraIdx = momentEraIndex(m);

  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(total - 1, next));
      setDir(clamped >= i ? 1 : -1);
      setI(clamped);
    },
    [i, total]
  );

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (drawerEra) {
        if (e.key === "Escape") setDrawerEra(null);
        return;
      }
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        go(i + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        go(i - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, go, drawerEra]);

  // Wheel / trackpad → travel time (locked between steps)
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (drawerEra) return;
      const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(d) < 18 || lock.current) return;
      lock.current = true;
      go(i + (d > 0 ? 1 : -1));
      setTimeout(() => (lock.current = false), 520);
    },
    [i, go, drawerEra]
  );

  // Touch swipe
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current || drawerEra) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(i + (dx < 0 ? 1 : -1));
    touch.current = null;
  };

  const openChapter = () => {
    if (m.kind === "era" || m.kind === "event") {
      setDrawerEra({ era: m.era, n: m.eraIndex + 1 });
    }
  };

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d * 64, filter: "blur(6px)" }),
    center: { opacity: 1, x: 0, filter: "blur(0px)" },
    exit: (d: number) => ({ opacity: 0, x: d * -64, filter: "blur(6px)" }),
  };

  return (
    <main
      className="relative h-[100dvh] w-full overflow-hidden bg-void text-chalk"
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        background:
          "radial-gradient(120% 100% at 50% 0%, #14110b 0%, #0a0a0c 55%, #07070a 100%)",
      }}
    >
      {/* faint constellation grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(191,149,80,.06), transparent 40%), radial-gradient(circle at 80% 70%, rgba(75,125,114,.05), transparent 40%)",
        }}
      />

      {/* Top chrome */}
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-4 md:px-9 md:py-6">
        <Link
          href={`/country/${meta.code}`}
          className="group flex items-center gap-2 text-chalk-soft transition hover:text-chalk"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="transition-transform group-hover:-translate-x-0.5">
            <path d="M16 10H4m0 0l5 5m-5-5l5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-mono text-[0.66rem] uppercase tracking-[0.16em]">Dossier</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <span className="text-lg leading-none">{meta.flag}</span>
          <span className="font-display text-lg text-chalk">{history.name}</span>
        </div>

        {/* era dots */}
        <div className="flex items-center gap-1.5">
          {history.eras.map((era, idx) => {
            const firstMoment = moments.findIndex(
              (mm) => mm.kind === "era" && mm.eraIndex === idx
            );
            const on = idx === eraIdx;
            return (
              <button
                key={era.id}
                onClick={() => go(firstMoment)}
                aria-label={era.title}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: on ? 22 : 7,
                  background: on ? "var(--color-brass)" : "var(--color-void-line)",
                }}
              />
            );
          })}
        </div>
      </header>

      {/* Stage */}
      <div className="absolute inset-0 flex items-center justify-center px-6 md:px-10">
        <AnimatePresence custom={dir} mode="popLayout">
          <motion.div
            key={i}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-3xl"
          >
            <Stage
              m={m}
              history={history}
              meta={meta}
              neighbours={neighbours}
              sourceById={sourceById}
              onOpenChapter={openChapter}
              onBegin={() => go(i + 1)}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Prev / Next */}
      {i > 0 && (
        <NavButton side="left" onClick={() => go(i - 1)} />
      )}
      {i < total - 1 && (
        <NavButton side="right" onClick={() => go(i + 1)} />
      )}

      {/* Bottom rail */}
      <div className="absolute inset-x-0 bottom-0 z-30 px-5 pb-5 pt-10 md:px-10 md:pb-7">
        <div className="mx-auto max-w-5xl">
          <TimelineRail
            moments={moments}
            current={i}
            activeEra={Number.isFinite(eraIdx) ? eraIdx : -1}
            onJump={go}
          />
          <div className="mt-2.5 flex items-center justify-between">
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-chalk-faint">
              {i + 1} / {total}
            </span>
            <span className="hidden font-mono text-[0.6rem] uppercase tracking-[0.16em] text-chalk-faint sm:block">
              ← → or scroll to travel · click the line to jump
            </span>
          </div>
        </div>
      </div>

      <ChapterDrawer
        era={drawerEra?.era ?? null}
        n={drawerEra?.n ?? 0}
        sources={history.sources}
        onClose={() => setDrawerEra(null)}
      />
    </main>
  );
}

function NavButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={side === "left" ? "Previous" : "Next"}
      className={`absolute top-1/2 z-20 hidden -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full border border-void-line bg-void-soft/40 text-chalk-soft backdrop-blur transition hover:border-brass/50 hover:text-chalk md:grid ${
        side === "left" ? "left-5" : "right-5"
      }`}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={side === "left" ? "" : "rotate-180"}>
        <path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

// ── The stage content per moment ──────────────────────────────────────────
function Stage({
  m,
  history,
  meta,
  neighbours,
  sourceById,
  onOpenChapter,
  onBegin,
}: {
  m: Moment;
  history: CountryHistory;
  meta: CountryMeta;
  neighbours: { code: string; name: string; flag: string | null }[];
  sourceById: Map<string, CountryHistory["sources"][number]>;
  onOpenChapter: () => void;
  onBegin: () => void;
}) {
  if (m.kind === "intro") {
    return (
      <div className="text-center">
        <div className="eyebrow flex items-center justify-center gap-2 text-brass">
          <span className="text-base leading-none">{meta.flag}</span>
          <span>{meta.subregion ?? meta.region} · {meta.continent}</span>
        </div>
        <h1 className="mt-5 font-display text-[3.6rem] font-medium leading-[0.95] tracking-tight text-chalk md:text-[6rem]">
          {history.name}
        </h1>
        <p className="mx-auto mt-3 max-w-xl font-serif text-[1.45rem] italic text-brass-bright">
          {history.tagline}
        </p>
        <p className="mx-auto mt-6 max-w-xl font-serif text-[1.1rem] leading-relaxed text-chalk-soft">
          {history.summary}
        </p>
        <div className="mx-auto mt-8 inline-flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          <Fact label="Capital" value={meta.capital[0] ?? "—"} />
          <Fact label="Population" value={formatPopulation(meta.population)} />
          <Fact label="Became a nation" value={history.founding.yearLabel} />
        </div>
        <button
          onClick={onBegin}
          className="group mx-auto mt-10 flex items-center gap-2.5 rounded-full bg-brass px-6 py-3 text-[0.95rem] font-medium text-void transition hover:bg-brass-bright"
        >
          Begin the journey
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="transition-transform group-hover:translate-x-1">
            <path d="M4 10h12m0 0l-5-5m5 5l-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    );
  }

  if (m.kind === "era") {
    return (
      <div className="relative text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 font-display text-[22rem] font-medium leading-none text-brass/[0.05]"
        >
          {String(m.eraIndex + 1).padStart(2, "0")}
        </div>
        <div className="eyebrow text-brass">
          Chapter {String(m.eraIndex + 1).padStart(2, "0")} of {String(history.eras.length).padStart(2, "0")}
        </div>
        <h2 className="mt-4 font-display text-[3rem] font-medium leading-[1.02] text-chalk md:text-[4.2rem]">
          {m.era.title}
        </h2>
        <div className="mt-3 font-mono text-sm uppercase tracking-[0.14em] text-brass-bright">
          {m.era.period}
        </div>
        <p className="mx-auto mt-6 max-w-2xl font-serif text-[1.3rem] italic leading-snug text-chalk-soft">
          {m.era.standfirst}
        </p>
        <button
          onClick={onOpenChapter}
          className="group mx-auto mt-9 flex items-center gap-2.5 rounded-full border border-brass/40 px-5 py-2.5 text-[0.9rem] text-brass-bright transition hover:bg-brass/10"
        >
          Read the full chapter
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="transition-transform group-hover:translate-x-0.5">
            <path d="M4 10h12m0 0l-5-5m5 5l-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    );
  }

  if (m.kind === "event") {
    const cat = CATEGORY_META[m.event.category];
    const yr = bigYear(m.event.year);
    const srcs = m.event.sources.map((id) => sourceById.get(id)).filter(Boolean) as CountryHistory["sources"];
    return (
      <div className="text-center">
        <div className="flex items-center justify-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: cat.tint }} />
          <span className="font-mono text-[0.66rem] uppercase tracking-[0.18em]" style={{ color: cat.tint }}>
            {cat.label}
          </span>
          <span className="font-mono text-[0.66rem] uppercase tracking-[0.14em] text-chalk-faint">
            · {m.era.title}
          </span>
        </div>

        <div className="mt-4 flex items-baseline justify-center gap-3">
          <span className="font-display text-[5rem] font-medium leading-none tracking-tight text-chalk md:text-[8rem]">
            {m.event.yearLabel && m.event.yearLabel.startsWith("c.") ? "" : ""}
            {yr.num}
          </span>
          <span className="font-mono text-base text-brass">{yr.suffix}</span>
        </div>
        {m.event.yearLabel && !/^\d/.test(m.event.yearLabel) && (
          <div className="mt-1 font-mono text-xs text-chalk-faint">{m.event.yearLabel}</div>
        )}

        <h3 className="mx-auto mt-5 max-w-2xl font-display text-[2rem] font-medium leading-[1.1] text-chalk md:text-[2.6rem]">
          {m.event.title}
        </h3>
        <p className="mx-auto mt-4 max-w-xl font-serif text-[1.2rem] leading-relaxed text-chalk-soft">
          {m.event.summary}
        </p>

        {srcs.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-chalk-faint">Sources</span>
            {srcs.map((s) =>
              s.url ? (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-void-line px-3 py-1 text-[0.72rem] text-chalk-soft transition hover:border-brass/50 hover:text-chalk"
                >
                  {s.publisher ?? s.label}
                </a>
              ) : (
                <span key={s.id} className="rounded-full border border-void-line px-3 py-1 text-[0.72rem] text-chalk-soft">
                  {s.publisher ?? s.label}
                </span>
              )
            )}
            <button
              onClick={onOpenChapter}
              className="rounded-full px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-brass transition hover:text-brass-bright"
            >
              Read chapter →
            </button>
          </div>
        )}
      </div>
    );
  }

  // outro
  return (
    <div className="text-center">
      <div className="eyebrow text-brass">The present</div>
      <h2 className="mt-4 font-display text-[2.6rem] font-medium leading-tight text-chalk md:text-[3.6rem]">
        {history.name}, today
      </h2>
      <p className="mx-auto mt-5 max-w-xl font-serif text-[1.15rem] leading-relaxed text-chalk-soft">
        You have travelled {history.eras.length} chapters of {history.name}&rsquo;s
        story — from {history.founding.yearLabel} to the present. Every claim along
        the way is traceable; open any chapter to see its sources.
      </p>

      {neighbours.length > 0 && (
        <div className="mt-9">
          <div className="eyebrow text-chalk-faint">Continue at a neighbour</div>
          <div className="mt-4 flex flex-wrap justify-center gap-2.5">
            {neighbours.map((nb) => (
              <Link
                key={nb.code}
                href={`/country/${nb.code}`}
                className="flex items-center gap-2 rounded-full border border-void-line bg-void-soft/40 px-3.5 py-1.5 text-sm text-chalk-soft transition hover:border-brass/40 hover:text-chalk"
              >
                <span>{nb.flag}</span>
                {nb.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <Link
        href="/"
        className="group mx-auto mt-10 flex w-fit items-center gap-2 rounded-full border border-brass/30 px-5 py-2.5 text-sm text-brass-bright transition hover:bg-brass/10"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <path d="M16 10H4m0 0l5 5m-5-5l5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Return to the globe
      </Link>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="eyebrow text-chalk-faint">{label}</div>
      <div className="mt-1 font-sans text-[0.98rem] font-medium text-chalk">{value}</div>
    </div>
  );
}
