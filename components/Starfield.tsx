"use client";

import { useEffect, useMemo, useRef } from "react";

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

type Star = {
  cx: string;
  cy: string;
  r: string;
  fill: string;
  twinkle: boolean;
  op: string;
  lo: string;
  hi: string;
  dur: string;
  delay: string;
};

// Depth layers: far stars (slow parallax, dim) → near stars (fast, bright).
const LAYERS = [
  { seed: 101, n: 64, depth: 6, rMin: 0.035, rMax: 0.1, opLo: 0.12, opHi: 0.45, tw: 0.2 },
  { seed: 202, n: 44, depth: 15, rMin: 0.06, rMax: 0.16, opLo: 0.2, opHi: 0.7, tw: 0.38 },
  { seed: 303, n: 26, depth: 30, rMin: 0.09, rMax: 0.24, opLo: 0.3, opHi: 1, tw: 0.58 },
];

function buildLayer(cfg: (typeof LAYERS)[number]): Star[] {
  const rand = mulberry32(cfg.seed);
  return Array.from({ length: cfg.n }, () => {
    const b = rand(); // brightness bias
    const op = cfg.opLo + (1 - b) * (cfg.opHi - cfg.opLo);
    const twinkle = rand() < cfg.tw;
    const warm = rand() > 0.85;
    return {
      cx: (rand() * 100).toFixed(3),
      cy: (rand() * 100).toFixed(3),
      r: (cfg.rMin + b * b * (cfg.rMax - cfg.rMin)).toFixed(3),
      fill: warm ? "#e3c07e" : "#eaf0ff",
      twinkle,
      op: op.toFixed(2),
      lo: (op * 0.35).toFixed(2),
      hi: Math.min(1, op * 1.25 + 0.1).toFixed(2),
      dur: (2.6 + rand() * 4.5).toFixed(2),
      delay: (rand() * 5).toFixed(2),
    };
  });
}

/** A living void — parallax star layers, twinkle, galactic dust + nebula. */
export default function Starfield() {
  const ref = useRef<HTMLDivElement>(null);
  const layers = useMemo(() => LAYERS.map((c) => ({ depth: c.depth, stars: buildLayer(c) })), []);

  // Pointer parallax — far layers drift a little, near layers a lot.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const px = (e.clientX / window.innerWidth - 0.5) * 2;
        const py = (e.clientY / window.innerHeight - 0.5) * 2;
        el.style.setProperty("--px", px.toFixed(3));
        el.style.setProperty("--py", py.toFixed(3));
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="absolute inset-0 overflow-hidden">
      {/* nebula — two soft clouds, slowly drifting */}
      <svg
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 100 100"
        style={{ animation: "nebula-drift 90s ease-in-out infinite alternate" }}
      >
        <defs>
          <radialGradient id="neb" cx="66%" cy="30%" r="72%">
            <stop offset="0%" stopColor="#1a2748" stopOpacity="0.6" />
            <stop offset="40%" stopColor="#0c1226" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#06070b" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="neb2" cx="20%" cy="80%" r="64%">
            <stop offset="0%" stopColor="#1d1636" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#06070b" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="url(#neb)" />
        <rect width="100" height="100" fill="url(#neb2)" />
      </svg>

      {/* faint galactic-dust band */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(108deg, transparent 36%, rgba(190,170,210,0.05) 47%, rgba(216,181,110,0.04) 53%, transparent 64%)",
        }}
      />

      {/* parallax star layers */}
      {layers.map((layer, li) => (
        <svg
          key={li}
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid slice"
          viewBox="0 0 100 100"
          style={{
            transform: `translate(calc(var(--px, 0) * ${layer.depth}px), calc(var(--py, 0) * ${layer.depth}px)) scale(1.05)`,
            transition: "transform .45s cubic-bezier(.16,1,.3,1)",
          }}
        >
          {layer.stars.map((s, i) => (
            <circle
              key={i}
              cx={s.cx}
              cy={s.cy}
              r={s.r}
              fill={s.fill}
              opacity={s.op}
              style={
                s.twinkle
                  ? ({
                      animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
                      "--tw-lo": s.lo,
                      "--tw-hi": s.hi,
                    } as React.CSSProperties)
                  : undefined
              }
            />
          ))}
        </svg>
      ))}
    </div>
  );
}
