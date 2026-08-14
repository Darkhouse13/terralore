"use client";

import { useState } from "react";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";

/**
 * The proof-flip — the brand thesis as an interaction (contract §deviations
 * 1–2, DESIGN.md §4): every observed value turns over on press to its basalt
 * reverse — the year it was observed and who observed it. Fires on press,
 * returns on release; a surface-level "proof view" can hold every specimen
 * flipped at once via `forced`.
 *
 * Physics live in globals.css (.flip-scene/.flip-card/.flip-face/.flip-back,
 * 320ms on the mass curve, rotateX — a specimen turned over on a table).
 * This component owns only behavior:
 *
 *   - pointer: down flips, up/leave/cancel returns. `touch-action: pan-y`
 *     (from .flip-scene) keeps vertical scroll native; a scroll that takes
 *     the pointer fires pointercancel and the specimen falls back.
 *   - keyboard: Enter/Space latch the flip (press-and-hold has no keyboard
 *     equivalent); Escape or blur releases it.
 *   - the inactive face is aria-hidden; the control is a toggle button.
 *   - under prefers-reduced-motion the global collapse makes the swap
 *     instant — same faces, no rotation.
 *
 * Layout: the faces grid-stack in one cell (globals.css .flip-card), so the
 * row sizes to its taller face — no height contract; callers set min-height
 * on a face for row rhythm if they need one.
 */
export default function ProofFlip({
  front,
  back,
  forced = false,
  className,
  ariaLabel,
}: {
  front: ReactNode;
  back: ReactNode;
  forced?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const [pressed, setPressed] = useState(false);
  const [latched, setLatched] = useState(false);
  const flipped = forced || pressed || latched;

  const down = (e: PointerEvent) => {
    // Suppresses text selection and focus-scroll; touch-action still owns
    // scrolling, so this never traps a vertical swipe.
    e.preventDefault();
    setPressed(true);
  };
  const up = () => setPressed(false);
  const key = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setLatched((v) => !v);
    } else if (e.key === "Escape") {
      setLatched(false);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={ariaLabel}
      className={`flip-scene ${className ?? ""}`}
      onPointerDown={down}
      onPointerUp={up}
      onPointerLeave={up}
      onPointerCancel={up}
      onKeyDown={key}
      onBlur={() => setLatched(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flip-card" data-flipped={flipped}>
        <div className="flip-face" aria-hidden={flipped}>
          {front}
        </div>
        <div className="flip-face flip-back" aria-hidden={!flipped}>
          {back}
        </div>
      </div>
    </div>
  );
}
