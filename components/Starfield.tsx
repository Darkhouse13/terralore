"use client";
import { useMemo } from "react";

// Deterministic pseudo-random so the field is stable across renders/SSR.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A still, faint starfield — the void behind the globe. */
export default function Starfield({ count = 140 }: { count?: number }) {
  const stars = useMemo(() => {
    const rand = mulberry32(20260613);
    // viewBox is 0..100 stretched across the viewport, so radii must stay small.
    return Array.from({ length: count }, () => {
      const r = rand();
      return {
        cx: (rand() * 100).toFixed(3),
        cy: (rand() * 100).toFixed(3),
        rad: (r * r * 0.22 + 0.05).toFixed(3),
        op: (0.2 + (1 - r) * 0.6).toFixed(2),
        warm: rand() > 0.86,
      };
    });
  }, [count]);

  return (
    <svg
      aria-hidden
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 100 100"
    >
      <defs>
        <radialGradient id="neb" cx="68%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#16203a" stopOpacity="0.55" />
          <stop offset="38%" stopColor="#0b1020" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#06070b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="neb2" cx="22%" cy="78%" r="60%">
          <stop offset="0%" stopColor="#1a1530" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#06070b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill="url(#neb)" />
      <rect width="100" height="100" fill="url(#neb2)" />
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={s.cx}
          cy={s.cy}
          r={s.rad}
          fill={s.warm ? "#dcb56e" : "#eaf0ff"}
          opacity={s.op}
        />
      ))}
    </svg>
  );
}
