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
    [history],
  );

  const [i, setI] = useState(0);
  const [drawerEra, setDrawerEra] = useState<{
    era: CountryHistory["eras"][number];
    n: number;
  } | null>(null);
  const lock = useRef(false);

  const total = moments.length;
  const m = moments[i];
  const eraIdx = momentEraIndex(m);

  const go = useCallback(
    (next: number) => setI(Math.max(0, Math.min(total - 1, next))),
    [total],
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
    [i, go, drawerEra],
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

  return (
    <main
      className="relative h-[100dvh] w-full overflow-hidden text-chalk"
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        background:
          "radial-gradient(125% 100% at 50% -10%, #14131c 0%, #0b0a10 42%, #07060a 100%)",
      }}
    >
      {/* atmosphere: brass glow + faint starfield */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 55% at 50% 42%, rgba(191,149,80,0.07), rgba(7,6,10,0) 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 12% 24%, rgba(236,228,211,0.5) 50%, transparent), radial-gradient(1px 1px at 82% 16%, rgba(236,228,211,0.35) 50%, transparent), radial-gradient(1px 1px at 67% 70%, rgba(236,228,211,0.3) 50%, transparent), radial-gradient(1px 1px at 28% 80%, rgba(236,228,211,0.4) 50%, transparent), radial-gradient(1px 1px at 91% 60%, rgba(236,228,211,0.25) 50%, transparent), radial-gradient(1px 1px at 45% 12%, rgba(236,228,211,0.3) 50%, transparent)",
        }}
      />

      {/* Top chrome */}
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-4 md:px-11 md:py-5">
        <Link
          href={`/country/${meta.code}`}
          className="group flex items-center gap-2.5 font-mono text-[12px] uppercase tracking-[0.22em] text-chalk-soft transition-colors hover:text-chalk"
        >
          <span className="text-[15px] transition-transform group-hover:-translate-x-0.5">←</span>
          Dossier
        </Link>

        <div className="flex items-center gap-2.5 font-display text-[19px] text-parchment">
          <span className="rounded-[2px] border border-brass/30 px-1.5 py-0.5 font-mono text-[11px] tracking-[0.16em] text-chalk-faint">
            {meta.code}
          </span>
          {history.name}
        </div>

        {/* era progress dots */}
        <div className="flex items-center gap-[7px]">
          {history.eras.map((era, idx) => {
            const firstMoment = moments.findIndex(
              (mm) => mm.kind === "era" && mm.eraIndex === idx,
            );
            const current = idx === eraIdx;
            const passed = idx < eraIdx;
            return (
              <button
                key={era.id}
                onClick={() => go(firstMoment)}
                aria-label={era.title}
                className="h-[3px] rounded-[2px] transition-all duration-300"
                style={{
                  width: current ? 22 : 8,
                  background: current
                    ? "var(--color-brass-bright)"
                    : passed
                      ? "var(--color-brass)"
                      : "rgba(216,181,110,0.25)",
                }}
              />
            );
          })}
        </div>
      </header>

      {/* Stage */}
      <div className="absolute inset-0 z-10 flex items-center justify-center px-6 pb-32 pt-24 md:px-[9vw]">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[820px] text-center"
          >
            <Stage
              m={m}
              history={history}
              meta={meta}
              neighbours={neighbours}
              sourceById={sourceById}
              onOpenChapter={openChapter}
              onBegin={() => go(i + 1)}
              onReplay={() => go(0)}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Prev / Next */}
      <NavButton side="left" dim={i === 0} onClick={() => go(i - 1)} />
      <NavButton side="right" dim={i === total - 1} onClick={() => go(i + 1)} />

      {/* Compass badge */}
      <div className="absolute bottom-[108px] left-[34px] z-20 hidden h-11 w-11 place-items-center rounded-full border border-brass/30 bg-[rgba(12,11,9,0.7)] md:grid">
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
          <circle cx="11" cy="11" r="9" fill="none" stroke="var(--color-brass)" strokeWidth="1" />
          <path d="M11 3 L13 11 L11 19 L9 11 Z" fill="var(--color-brass-bright)" />
          <circle cx="11" cy="11" r="1.4" fill="#07060a" />
        </svg>
      </div>

      {/* Bottom rail */}
      <div className="absolute inset-x-0 bottom-0 z-30 px-5 pb-6 md:px-11">
        <TimelineRail
          moments={moments}
          current={i}
          activeEra={Number.isFinite(eraIdx) ? eraIdx : -1}
          onJump={go}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="font-mono text-[12px] tracking-[0.1em] text-chalk-faint">
            {String(i + 1).padStart(2, "0")} <span className="text-chalk-mute">/ {total}</span>
          </span>
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-chalk-dim sm:block">
            ← → or scroll to travel · click the line to jump
          </span>
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

function NavButton({
  side,
  dim,
  onClick,
}: {
  side: "left" | "right";
  dim: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={side === "left" ? "Previous" : "Next"}
      style={{ opacity: dim ? 0.25 : 1 }}
      className={`absolute top-1/2 z-20 hidden h-[50px] w-[50px] -translate-y-1/2 place-items-center rounded-full border border-brass/20 bg-[rgba(20,18,26,0.5)] text-[18px] text-chalk backdrop-blur transition-colors hover:border-brass md:grid ${
        side === "left" ? "left-[34px]" : "right-[34px]"
      }`}
    >
      {side === "left" ? "←" : "→"}
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
  onReplay,
}: {
  m: Moment;
  history: CountryHistory;
  meta: CountryMeta;
  neighbours: { code: string; name: string; flag: string | null }[];
  sourceById: Map<string, CountryHistory["sources"][number]>;
  onOpenChapter: () => void;
  onBegin: () => void;
  onReplay: () => void;
}) {
  if (m.kind === "intro") {
    return (
      <div>
        <div className="flex items-center justify-center gap-2.5 font-mono text-[12px] uppercase tracking-[0.26em] text-brass">
          <span className="rounded-[2px] border border-brass/30 px-1.5 py-0.5 text-[10px]">
            {meta.code}
          </span>
          {meta.subregion ?? meta.region} · {meta.continent}
        </div>
        <h1 className="mt-[1.4vh] font-display text-[clamp(46px,12vmin,140px)] font-[330] leading-[0.92] tracking-[-0.02em] text-chalk-bright">
          {history.name}
        </h1>
        <p className="mt-[1.2vh] font-serif text-[clamp(18px,3vmin,28px)] font-[340] italic text-brass-bright">
          {history.tagline}
        </p>
        <p className="mx-auto mt-[2vh] max-w-[720px] font-serif text-[clamp(15px,2.2vmin,19px)] font-[340] leading-[1.55] text-[#c2b9a4]">
          {history.summary}
        </p>
        <div className="mt-[2.4vh] flex justify-center gap-[clamp(26px,5vw,54px)]">
          <Fact label="Capital" value={meta.capital[0] ?? "—"} />
          <Fact label="Population" value={formatPopulation(meta.population)} />
          <Fact label="Became a nation" value={history.founding.yearLabel} />
        </div>
        <button
          onClick={onBegin}
          className="group mx-auto mt-[2.6vh] inline-flex items-center gap-2.5 whitespace-nowrap rounded-[4px] px-[30px] py-[15px] text-[16px] font-semibold text-[#1a140a] shadow-[0_12px_32px_-14px_rgba(216,181,110,0.8)] transition hover:brightness-105"
          style={{ background: "linear-gradient(180deg,#d8b56e,#bf9550)" }}
        >
          Begin the journey
          <span className="text-[17px] transition-transform group-hover:translate-x-1">→</span>
        </button>
      </div>
    );
  }

  if (m.kind === "era") {
    return (
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[54%] font-display text-[clamp(150px,40vmin,420px)] font-[300] leading-none text-brass/[0.05]"
        >
          {String(m.eraIndex + 1).padStart(2, "0")}
        </div>
        <div className="relative">
          <div className="font-mono text-[12px] uppercase tracking-[0.3em] text-brass">
            Chapter {String(m.eraIndex + 1).padStart(2, "0")} of{" "}
            {String(history.eras.length).padStart(2, "0")}
          </div>
          <h1 className="mt-[2vh] font-display text-[clamp(44px,11vmin,108px)] font-[340] leading-none tracking-[-0.015em] text-chalk-bright">
            {m.era.title}
          </h1>
          <div className="mt-[2vh] font-mono text-[clamp(12px,1.7vmin,14px)] uppercase tracking-[0.22em] text-chalk-soft">
            {m.era.period}
          </div>
          <p className="mx-auto mt-[2.6vh] max-w-[640px] font-serif text-[clamp(18px,2.7vmin,25px)] font-[340] italic leading-[1.5] text-[#c2b9a4]">
            {m.era.standfirst}
          </p>
          <button
            onClick={onOpenChapter}
            className="group mt-[3.2vh] inline-flex items-center gap-2.5 whitespace-nowrap rounded-[4px] border border-brass/40 px-[26px] py-[13px] text-[15px] font-semibold text-chalk transition-colors hover:border-brass hover:text-chalk-bright"
          >
            Read the full chapter <span className="text-brass">→</span>
          </button>
        </div>
      </div>
    );
  }

  if (m.kind === "event") {
    const cat = CATEGORY_META[m.event.category];
    const yr = bigYear(m.event.year);
    const showSuffix = m.event.year < 1000; // BCE always; CE only for early years
    const srcs = m.event.sources
      .map((id) => sourceById.get(id))
      .filter(Boolean) as CountryHistory["sources"];
    return (
      <div>
        <div className="flex items-center justify-center gap-2.5 font-mono text-[12px] uppercase tracking-[0.26em]">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: cat.tint, boxShadow: `0 0 12px ${cat.tint}` }}
          />
          <span style={{ color: cat.tint }}>{cat.label}</span>
          <span className="text-chalk-dim">· {m.era.title}</span>
        </div>

        <div className="mt-[2.2vh] flex items-start justify-center gap-2.5">
          <span className="font-display text-[clamp(68px,18vmin,184px)] font-[330] leading-[0.9] tracking-[-0.02em] text-chalk-bright">
            {yr.num}
          </span>
          {showSuffix && (
            <span className="mt-3.5 font-mono text-[clamp(14px,1.4vw,18px)] tracking-[0.16em] text-brass">
              {yr.suffix}
            </span>
          )}
        </div>
        <div className="mt-1.5 font-mono text-[13px] tracking-[0.16em] text-chalk-faint">
          {m.event.yearLabel ?? `${yr.num} ${yr.suffix}`}
        </div>

        <h2 className="mx-auto mt-[2.2vh] max-w-[680px] font-display text-[clamp(26px,5.4vmin,56px)] font-[360] leading-[1.06] tracking-[-0.01em] text-parchment">
          {m.event.title}
        </h2>
        <p className="mx-auto mt-[2.2vh] max-w-[600px] font-serif text-[clamp(17px,2.5vmin,22px)] font-[340] leading-[1.55] text-[#c2b9a4]">
          {m.event.summary}
        </p>

        <div className="mt-[3vh] flex flex-wrap items-center justify-center gap-3.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-chalk-dim">
            Sources
          </span>
          {srcs.map((s) =>
            s.url ? (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-[4px] border border-brass/30 px-3 py-1.5 font-mono text-[11px] text-reading transition-colors hover:border-brass"
              >
                {s.publisher ?? s.label}
              </a>
            ) : (
              <span
                key={s.id}
                className="rounded-[4px] border border-brass/30 px-3 py-1.5 font-mono text-[11px] text-reading"
              >
                {s.publisher ?? s.label}
              </span>
            ),
          )}
          <button
            onClick={onOpenChapter}
            className="font-semibold text-[13px] text-brass transition-colors hover:text-brass-bright"
          >
            Read chapter →
          </button>
        </div>
      </div>
    );
  }

  // outro
  return (
    <div>
      <div className="font-mono text-[12px] uppercase tracking-[0.3em] text-brass">
        The present
      </div>
      <h1 className="mt-5 font-display text-[clamp(44px,7vw,92px)] font-[330] leading-none tracking-[-0.015em] text-chalk-bright">
        {history.name}, today
      </h1>
      <p className="mx-auto mt-7 max-w-[620px] font-serif text-[clamp(18px,2.1vw,23px)] font-[340] leading-[1.6] text-[#c2b9a4]">
        You have travelled {history.eras.length} chapters of {history.name}&rsquo;s story —
        from {history.founding.yearLabel} to the present. Every claim along the way is
        traceable; open any chapter to see its sources.
      </p>

      {neighbours.length > 0 && (
        <div className="mt-9">
          <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-chalk-dim">
            Continue at a neighbour
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2.5">
            {neighbours.map((nb) => (
              <Link
                key={nb.code}
                href={`/country/${nb.code}`}
                className="flex items-center gap-2 rounded-[4px] border border-brass/15 bg-void-soft/40 px-3.5 py-1.5 text-sm text-chalk-soft transition-colors hover:border-brass/40 hover:text-chalk"
              >
                <span>{nb.flag}</span>
                {nb.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 flex flex-wrap justify-center gap-3.5">
        <button
          onClick={onReplay}
          className="rounded-[4px] border border-brass/40 px-[26px] py-[13px] text-[15px] font-semibold text-chalk transition-colors hover:border-brass"
        >
          ↺ Replay the journey
        </button>
        <Link
          href={`/country/${meta.code}`}
          className="inline-flex items-center gap-2.5 rounded-[4px] px-[27px] py-3.5 text-[15px] font-semibold text-[#1a140a]"
          style={{ background: "linear-gradient(180deg,#d8b56e,#bf9550)" }}
        >
          Back to the dossier →
        </Link>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-chalk-faint">
        {label}
      </div>
      <div className="mt-1.5 font-display text-[clamp(18px,2.7vmin,24px)] text-parchment">
        {value}
      </div>
    </div>
  );
}
