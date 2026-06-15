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

export default function TimelineRail({ moments, current, activeEra, onJump }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const total = moments.length;
  const pos = (i: number) => (total > 1 ? (i / (total - 1)) * 100 : 0);

  // Era bands: span from each era's first moment to its last.
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

  const tickMeta = (m: Moment) => {
    if (m.kind === "event") return { tint: CATEGORY_META[m.event.category].tint, big: false };
    if (m.kind === "era") return { tint: "var(--color-brass)", big: true };
    return { tint: "var(--color-chalk-faint)", big: false };
  };

  const label = (m: Moment) => {
    if (m.kind === "intro") return "Overview";
    if (m.kind === "outro") return "Present day";
    if (m.kind === "era") return m.era.title;
    return `${m.event.yearLabel ?? m.event.year} · ${m.event.title}`;
  };

  return (
    <div className="select-none">
      {/* era markers: number always; full title only for the active era */}
      <div className="relative mb-2 hidden h-4 sm:block">
        {bands.map((b) => {
          const left = (pos(b.first) + pos(b.last)) / 2;
          const on = b.eraIndex === activeEra;
          const width = Math.max(8, pos(b.last) - pos(b.first));
          return (
            <button
              key={b.eraIndex}
              onClick={() => onJump(b.first)}
              className={`absolute -translate-x-1/2 overflow-hidden whitespace-nowrap font-mono text-[0.58rem] uppercase tracking-[0.14em] transition ${
                on ? "text-brass" : "text-chalk-faint hover:text-chalk-soft"
              }`}
              style={{ left: `${left}%`, maxWidth: on ? "32%" : `${width}%`, textOverflow: "ellipsis" }}
              title={b.title}
            >
              {String(b.eraIndex + 1).padStart(2, "0")}
              {on ? ` · ${b.title}` : ""}
            </button>
          );
        })}
      </div>

      {/* track */}
      <div className="relative h-9">
        {/* base line */}
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-void-line" />
        {/* traversed */}
        <div
          className="absolute top-1/2 left-0 h-px -translate-y-1/2 bg-gradient-to-r from-brass-deep to-brass transition-[width] duration-500"
          style={{ width: `${pos(current)}%` }}
        />
        {/* era band underlines */}
        {bands.map((b) => (
          <div
            key={b.eraIndex}
            className="absolute bottom-0 h-[2px] rounded bg-brass/15"
            style={{ left: `${pos(b.first)}%`, width: `${pos(b.last) - pos(b.first)}%` }}
          />
        ))}

        {/* ticks */}
        {moments.map((m, i) => {
          const { tint, big } = tickMeta(m);
          const active = i === current;
          const passed = i <= current;
          return (
            <button
              key={i}
              onClick={() => onJump(i)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((h) => (h === i ? null : h))}
              aria-label={label(m)}
              className="group absolute top-1/2 -translate-x-1/2 -translate-y-1/2 p-2"
              style={{ left: `${pos(i)}%` }}
            >
              <span
                className="block rounded-full transition-all duration-300"
                style={{
                  width: active ? 13 : big ? 9 : 6,
                  height: active ? 13 : big ? 9 : 6,
                  background: passed || active ? tint : "transparent",
                  border: `1.5px solid ${tint}`,
                  opacity: passed ? 1 : 0.5,
                  boxShadow: active ? `0 0 0 4px color-mix(in srgb, ${tint} 22%, transparent)` : "none",
                }}
              />
            </button>
          );
        })}

        {/* hover preview */}
        {hover != null && hover !== current && (
          <div
            className="pointer-events-none absolute bottom-full z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-brass/30 bg-void-soft/95 px-2.5 py-1 text-[0.72rem] text-chalk shadow-lg backdrop-blur"
            style={{ left: `${pos(hover)}%`, maxWidth: 280 }}
          >
            <span className="truncate">{label(moments[hover])}</span>
          </div>
        )}
      </div>
    </div>
  );
}
