"use client";

import { useCallback, useRef } from "react";
import Link from "next/link";
import { CATEGORY_META, type EventCategory } from "@/lib/types";

export interface RailPeriod {
  slug: string;
  label: string;
  count: number;
  dominant: string | null;
}

/**
 * The Time Globe's scrubber — sixty periods of the corpus as one horizontal
 * core sample, deep prehistory at the left, the 2020s at the right.
 *
 * Same grammar as the chronology page's column and the journey's rail: each
 * segment is a band in its period's dominant pigment, so the rail *is* the
 * stratum rule, laid on its side. Equal-width segments, deliberately — the
 * scrubber is a control, and a control whose targets shrink toward deep time
 * would make antiquity untouchable on mobile.
 *
 * Accessibility: one slider, not sixty buttons. role="slider" with arrow-key
 * travel and aria-valuetext speaking the period; a tab stop per period would
 * make the landing page a sixty-stop keyboard labyrinth.
 */
export default function TimeRail({
  periods,
  active,
  engaged,
  onScrub,
  onDismiss,
}: {
  periods: RailPeriod[];
  active: number;
  engaged: boolean;
  onScrub: (index: number) => void;
  onDismiss: () => void;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const scrubbing = useRef(false);

  const indexFromX = useCallback(
    (clientX: number) => {
      const rect = railRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return 0;
      const t = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      return Math.min(periods.length - 1, Math.floor(t * periods.length));
    },
    [periods.length],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    scrubbing.current = true;
    railRef.current?.setPointerCapture(e.pointerId);
    onScrub(indexFromX(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (scrubbing.current) onScrub(indexFromX(e.clientX));
  };
  const endScrub = () => {
    scrubbing.current = false;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onScrub(Math.min(periods.length - 1, active + 1));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onScrub(Math.max(0, active - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      onScrub(0);
    } else if (e.key === "End") {
      e.preventDefault();
      onScrub(periods.length - 1);
    } else if (e.key === "Escape" && engaged) {
      e.preventDefault();
      onDismiss();
    }
  };

  const p = periods[active];
  const dom = p?.dominant ? CATEGORY_META[p.dominant as EventCategory] : null;

  return (
    <div className="pointer-events-auto w-[min(680px,92vw)]">
      {/* the readout: what period, how much of the record, made of what */}
      <div className="mb-2 flex min-h-[20px] items-baseline gap-x-3 overflow-hidden whitespace-nowrap font-mono text-[10.5px] uppercase tracking-[0.16em]">
        {engaged && p ? (
          <>
            <span className="text-chalk">{p.label}</span>
            <span className="tabular-nums text-chalk-3">
              {p.count} event{p.count === 1 ? "" : "s"}
            </span>
            {dom && (
              <span className="hidden sm:inline" style={{ color: dom.chalk }}>
                mostly {dom.label}
              </span>
            )}
            <Link
              href={`/timeline/${p.slug}`}
              prefetch={false}
              className="ml-auto text-copper-bright transition-colors hover:text-chalk"
            >
              read the period →
            </Link>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Leave time travel"
              className="-my-1 px-1 py-1 text-chalk-4 transition-colors hover:text-chalk"
            >
              ✕
            </button>
          </>
        ) : (
          <span className="text-chalk-3">
            Travel time <span aria-hidden>—</span> drag the strata
          </span>
        )}
      </div>

      {/* the strata */}
      <div
        ref={railRef}
        role="slider"
        tabIndex={0}
        aria-label="Travel through the archive by period"
        aria-valuemin={0}
        aria-valuemax={periods.length - 1}
        aria-valuenow={active}
        aria-valuetext={p ? `${p.label}, ${p.count} events` : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endScrub}
        onPointerCancel={endScrub}
        onKeyDown={onKeyDown}
        className="flex h-[22px] cursor-ew-resize touch-none items-end gap-px py-[5px]"
      >
        {periods.map((seg, i) => {
          const tint = seg.dominant
            ? CATEGORY_META[seg.dominant as EventCategory]?.tint
            : "var(--color-copper)";
          const isActive = engaged && i === active;
          return (
            <span
              key={seg.slug}
              aria-hidden
              className="min-w-0 flex-1 rounded-[1px] transition-[height,opacity] duration-150"
              style={{
                background: tint,
                height: isActive ? 12 : 5,
                opacity: isActive ? 1 : engaged ? 0.42 : 0.55,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
