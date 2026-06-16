"use client";

import { useMemo, useState } from "react";
import type { Moment } from "@/lib/journey";
import { CATEGORY_META } from "@/lib/types";

interface Props {
  moments: Moment[];
  current: number;
  activeEra: number;
  onJump: (i: number) => void;
}

// Meridian timeline rail — a single 48px scrubber: a brass baseline, era bands
// with mono labels (the active era spells out its title), category-tinted ticks
// that fill as you pass them, and a glowing brass playhead.
export default function TimelineRail({ moments, current, activeEra, onJump }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const total = moments.length;
  const pos = (i: number) => (total > 1 ? (i / (total - 1)) * 100 : 0);

  const bands = useMemo(() => {
    const map = new Map<number, { first: number; last: number; title: string }>();
    moments.forEach((m, i) => {
      if (m.kind === "era" || m.kind === "event") {
        const b = map.get(m.eraIndex);
        if (!b) map.set(m.eraIndex, { first: i, last: i, title: m.era.title });
        else b.last = i;
      }
    });
    return [...map.entries()].map(([eraIndex, b]) => ({ eraIndex, ...b }));
  }, [moments]);

  const tickColor = (m: Moment) =>
    m.kind === "event"
      ? CATEGORY_META[m.event.category].tint
      : m.kind === "era"
        ? "var(--color-brass)"
        : "var(--color-chalk-faint)";

  const tickBig = (m: Moment) => m.kind !== "event";

  const label = (m: Moment) => {
    if (m.kind === "intro") return "Overview";
    if (m.kind === "outro") return "Present day";
    if (m.kind === "era") return m.era.title;
    return `${m.event.yearLabel ?? m.event.year} · ${m.event.title}`;
  };

  return (
    <div className="relative h-12 select-none">
      {/* baseline */}
      <div className="absolute inset-x-0 top-[34px] h-px bg-brass/15" />

      {/* era bands + labels */}
      {bands.map((b) => {
        const left = pos(b.first);
        const width = Math.max(pos(b.last) - left, 0.5);
        const on = b.eraIndex === activeEra;
        return (
          <div key={`band-${b.eraIndex}`}>
            <div
              className="absolute top-[33px] h-[2px]"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                background: on ? "rgba(216,181,110,0.45)" : "rgba(216,181,110,0.16)",
              }}
            />
            <button
              onClick={() => onJump(b.first)}
              title={b.title}
              className={`absolute top-[8px] max-w-[34%] truncate font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                on ? "text-brass" : "text-chalk-dim hover:text-chalk-soft"
              }`}
              style={{ left: `${left}%` }}
            >
              {String(b.eraIndex + 1).padStart(2, "0")}
              {on ? ` · ${b.title}` : ""}
            </button>
          </div>
        );
      })}

      {/* ticks */}
      {moments.map((m, idx) => {
        const col = tickColor(m);
        const big = tickBig(m);
        const passed = idx <= current;
        const active = idx === current;
        return (
          <button
            key={idx}
            onClick={() => onJump(idx)}
            onMouseEnter={() => setHover(idx)}
            onMouseLeave={() => setHover((h) => (h === idx ? null : h))}
            title={label(m)}
            aria-label={label(m)}
            className="absolute top-[27px] -ml-2 flex h-4 w-4 items-center justify-center"
            style={{ left: `${pos(idx)}%` }}
          >
            <span
              className="block rounded-full transition-all duration-300"
              style={{
                width: big ? 9 : 7,
                height: big ? 9 : 7,
                background: passed ? col : "transparent",
                border: passed
                  ? "0"
                  : `1px solid ${m.kind === "event" ? "rgba(168,158,138,0.4)" : "rgba(216,181,110,0.45)"}`,
                boxShadow: active ? `0 0 12px ${col}` : "none",
              }}
            />
          </button>
        );
      })}

      {/* playhead */}
      <div
        className="absolute top-[26px] -ml-[9px] h-[18px] w-[18px] rounded-full bg-brass-bright"
        style={{
          left: `${pos(current)}%`,
          boxShadow: "0 0 0 5px rgba(216,181,110,0.16), 0 0 18px rgba(216,181,110,0.7)",
          transition: "left .5s cubic-bezier(.2,.8,.2,1)",
        }}
      />

      {/* hover preview */}
      {hover != null && hover !== current && (
        <div
          className="pointer-events-none absolute bottom-[44px] z-10 -translate-x-1/2 truncate rounded-[4px] border border-brass/30 bg-void-soft/95 px-2.5 py-1 text-[0.72rem] text-chalk shadow-lg backdrop-blur"
          style={{ left: `${pos(hover)}%`, maxWidth: 280 }}
        >
          {label(moments[hover])}
        </div>
      )}
    </div>
  );
}
