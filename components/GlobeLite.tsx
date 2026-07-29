"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useElementSize } from "./useElementSize";
import { CHORO_NODATA, choroColor, percentileRanks } from "@/lib/choropleth";
import {
  DEG,
  centerYFor,
  radiusFor,
  renderGlobe,
  type DrawShape,
  type RenderState,
  type Shape,
} from "./globe-render";
import type { CountryMeta, CountryMetaMap } from "@/lib/types";

/**
 * GlobeLite — the antique globe, without three.js.
 *
 * Architecture: three threads of concern.
 *  - React (this file) owns *interaction*: pointer → drag deltas, hover
 *    hit-tests, selection, tooltip. Pure event handling, no rasterisation.
 *  - A tiny simulation loop (rAF here) advances the view: auto-rotate,
 *    fly-to easing. It does arithmetic on three numbers and posts the result.
 *  - An **OffscreenCanvas worker** (globe.worker.ts) does all drawing via the
 *    shared pure renderer (globe-render.ts). Rasterising ~190 country paths
 *    at retina resolution is the only genuinely expensive part of a globe,
 *    and it now happens entirely off the main thread — the page's blocking
 *    time is architecturally immune to the globe, not just tuned around it.
 *
 * Where OffscreenCanvas is unavailable, the same renderer runs on the main
 * thread — identical pixels, pre-worker cost profile.
 *
 * The three.js implementation is kept in GlobeScene.tsx as the reference.
 */

/** OrbitControls autoRotateSpeed 0.32 ≈ 1.92°/s. */
const SPIN_DEG_S = 1.92;
/** Selection zoom: altitude 2.5 → 1.7 is a ~1.3× apparent scale. */
const SELECT_SCALE = 1.3;

type Feature = {
  properties: { code: string; name: string };
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: number[][][] | number[][][][] };
};

interface Props {
  selectedCode: string | null;
  onSelect: (meta: CountryMeta | null) => void;
  hasHistory?: (code: string) => boolean;
  choroplethValues?: Record<string, number> | null;
  onHover?: (code: string | null) => void;
  onReady?: () => void;
}

function buildShapes(features: Feature[]): Shape[] {
  return features.map((f) => {
    const polys =
      f.geometry.type === "Polygon"
        ? [f.geometry.coordinates as number[][][]]
        : (f.geometry.coordinates as number[][][][]);
    const rings: Float64Array[] = [];
    const trig: Float64Array[] = [];
    let minLon = 180, minLat = 90, maxLon = -180, maxLat = -90;
    for (const poly of polys) {
      for (const ring of poly) {
        const arr = new Float64Array(ring.length * 2);
        const tg = new Float64Array(ring.length * 4);
        for (let i = 0; i < ring.length; i++) {
          const [lon, lat] = ring[i];
          arr[i * 2] = lon;
          arr[i * 2 + 1] = lat;
          tg[i * 4] = Math.sin(lon * DEG);
          tg[i * 4 + 1] = Math.cos(lon * DEG);
          tg[i * 4 + 2] = Math.sin(lat * DEG);
          tg[i * 4 + 3] = Math.cos(lat * DEG);
          if (lon < minLon) minLon = lon;
          if (lon > maxLon) maxLon = lon;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        }
        rings.push(arr);
        trig.push(tg);
      }
    }
    return { code: f.properties.code, name: f.properties.name, rings, trig, bbox: [minLon, minLat, maxLon, maxLat] };
  });
}

/** Point-in-polygon over all rings (even–odd), in geographic coordinates. */
function hitShape(s: Shape, lon: number, lat: number): boolean {
  const [a, b, c, d] = s.bbox;
  if (lon < a || lon > c || lat < b || lat > d) return false;
  let inside = false;
  for (const ring of s.rings) {
    const n = ring.length / 2;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = ring[i * 2], yi = ring[i * 2 + 1];
      const xj = ring[j * 2], yj = ring[j * 2 + 1];
      if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}

const easeCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export default function GlobeLite({
  selectedCode,
  onSelect,
  hasHistory,
  choroplethValues,
  onHover,
  onReady,
}: Props) {
  const { ref, width, height } = useElementSize<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [metaMap, setMetaMap] = useState<CountryMetaMap>({});
  const [hoverCode, setHoverCode] = useState<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; code: string } | null>(null);
  const [dragging, setDragging] = useState(false);

  // View state lives in refs — it changes every frame and must not re-render React.
  const view = useRef({ lambda: 14, phi: 24, scale: 1 });
  const target = useRef<{ lambda: number; phi: number; scale: number; from: typeof view.current; t0: number; dur: number } | null>(null);
  const spinning = useRef(true);
  const interacted = useRef(false);
  const visible = useRef(true);
  const rafId = useRef(0);
  const lastT = useRef(0);
  const ringT0 = useRef(0);
  const workerRef = useRef<Worker | null>(null);
  const fallbackCtx = useRef<CanvasRenderingContext2D | null>(null);
  const readyFired = useRef(false);

  const reduceMotion = useMemo(
    () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  // Geometry + metadata — the same two files the three.js globe fetched.
  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch("/data/countries.geo.json").then((r) => r.json()),
      fetch("/data/countries.json").then((r) => r.json()),
    ]).then(([geo, meta]) => {
      if (!alive) return;
      setShapes(buildShapes(geo.features as Feature[]));
      setMetaMap(meta as CountryMetaMap);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Choropleth: resolve every country's fill to a colour string up front, so
  // the render state is plain data (and structured-cloneable to the worker).
  const fills = useMemo(() => {
    if (!choroplethValues) return null;
    const pct = percentileRanks(choroplethValues);
    const out: Record<string, string> = {};
    for (const s of shapes) {
      const t = pct.get(s.code);
      out[s.code] = t == null ? CHORO_NODATA : choroColor(t);
    }
    return out;
  }, [choroplethValues, shapes]);

  const ringCenter = useMemo<[number, number] | null>(() => {
    if (!selectedCode) return null;
    const m = metaMap[selectedCode];
    return m?.latlng ? [m.latlng[0], m.latlng[1]] : null;
  }, [selectedCode, metaMap]);

  // ── worker bring-up ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || shapes.length === 0) return;

    const drawShapes: DrawShape[] = shapes.map((s) => ({ code: s.code, trig: s.trig, bbox: s.bbox }));

    if ("transferControlToOffscreen" in canvas && typeof Worker !== "undefined") {
      const worker = new Worker(new URL("./globe.worker.ts", import.meta.url));
      const off = canvas.transferControlToOffscreen();
      worker.postMessage({ type: "init", canvas: off, shapes: drawShapes }, [off]);
      worker.onmessage = (e: MessageEvent<{ type: string }>) => {
        if (e.data.type === "ready" && !readyFired.current) {
          readyFired.current = true;
          onReady?.();
        }
      };
      workerRef.current = worker;
      return () => {
        worker.terminate();
        workerRef.current = null;
      };
    }

    // Fallback: same renderer, main thread.
    fallbackCtx.current = canvas.getContext("2d");
    return () => {
      fallbackCtx.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once per canvas/shapes
  }, [shapes]);

  const snapshot = useCallback(
    (): RenderState => ({
      view: { ...view.current },
      hoverCode,
      selectedCode,
      fills,
      ringCenter,
      ringT0: ringT0.current,
    }),
    [hoverCode, selectedCode, fills, ringCenter],
  );

  const paint = useCallback(() => {
    const w = workerRef.current;
    if (w) {
      w.postMessage({ type: "state", state: snapshot(), animating: false });
      return;
    }
    const ctx = fallbackCtx.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas || !width || !height || shapes.length === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    if (canvas.width !== Math.round(width * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    renderGlobe(ctx, width, height, dpr, shapes, snapshot(), performance.now());
    if (!readyFired.current) {
      readyFired.current = true;
      onReady?.();
    }
  }, [snapshot, width, height, shapes, onReady]);

  // Size changes reach the worker as messages (the canvas itself is transferred).
  useEffect(() => {
    if (!width || !height) return;
    workerRef.current?.postMessage({
      type: "size",
      width,
      height,
      dpr: Math.min(window.devicePixelRatio || 1, 1.75),
    });
    paint();
  }, [width, height, paint]);

  // Any interaction-state change repaints once (worker coalesces at its own rAF).
  useEffect(() => {
    paint();
  }, [paint]);

  // ── simulation loop: advances the view, posts frames; draws nothing ──────
  const simRef = useRef<(t: number) => void>(() => {});
  const sim = (t: number) => {
    rafId.current = 0;
    const dt = lastT.current ? Math.min(64, t - lastT.current) : 16;
    lastT.current = t;

    if (target.current) {
      const tg = target.current;
      const k = Math.min(1, (t - tg.t0) / tg.dur);
      const e = easeCubic(k);
      let dl = tg.lambda - tg.from.lambda;
      dl = ((dl + 540) % 360) - 180; // shortest way round
      view.current.lambda = tg.from.lambda + dl * e;
      view.current.phi = tg.from.phi + (tg.phi - tg.from.phi) * e;
      view.current.scale = tg.from.scale + (tg.scale - tg.from.scale) * e;
      if (k >= 1) target.current = null;
    } else if (spinning.current && !reduceMotion) {
      view.current.lambda += (SPIN_DEG_S * dt) / 1000;
    }

    paint();
    const more = target.current !== null || (spinning.current && !reduceMotion);
    if (more && visible.current && !document.hidden) {
      rafId.current = requestAnimationFrame((x) => simRef.current(x));
    } else {
      lastT.current = 0;
    }
  };
  useEffect(() => {
    simRef.current = sim;
  });

  const wakeSim = useCallback(() => {
    if (!rafId.current && visible.current && !document.hidden) {
      lastT.current = 0;
      rafId.current = requestAnimationFrame((x) => simRef.current(x));
    }
  }, []);

  // Kick the spin once geometry is in; pause off-screen / hidden tab.
  useEffect(() => {
    if (shapes.length) wakeSim();
  }, [shapes, wakeSim]);

  // Fly to a country when selected externally (click or from a list).
  useEffect(() => {
    if (!selectedCode) return;
    const meta = metaMap[selectedCode];
    if (!meta?.latlng) return;
    spinning.current = false;
    target.current = {
      lambda: meta.latlng[1],
      phi: meta.latlng[0],
      scale: SELECT_SCALE,
      from: { ...view.current },
      t0: performance.now(),
      dur: 900,
    };
    ringT0.current = performance.now();
    wakeSim();
  }, [selectedCode, metaMap, wakeSim]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting;
      if (e.isIntersecting) wakeSim();
    });
    io.observe(el);
    const onVis = () => {
      if (!document.hidden) wakeSim();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [ref, wakeSim]);

  // ── pointer interaction ──────────────────────────────────────────────────
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const lastHitT = useRef(0);

  const invert = useCallback(
    (px: number, py: number): [number, number] | null => {
      if (!width || !height) return null;
      const r = radiusFor(width, height) * view.current.scale;
      const X = (px - width / 2) / r;
      const Y = -(py - centerYFor(width, height)) / r;
      const rho = Math.hypot(X, Y);
      if (rho > 1) return null;
      const c = Math.asin(Math.min(1, rho));
      const sinc = Math.sin(c), cosc = Math.cos(c);
      const phi = view.current.phi * DEG;
      const lat = Math.asin(cosc * Math.sin(phi) + (rho ? (Y * sinc * Math.cos(phi)) / rho : 0)) / DEG;
      const lon =
        view.current.lambda +
        Math.atan2(X * sinc, rho * cosc * Math.cos(phi) - Y * sinc * Math.sin(phi)) / DEG;
      return [((lon + 540) % 360) - 180, lat];
    },
    [width, height],
  );

  const locate = useCallback(
    (e: React.PointerEvent): string | null => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return null;
      const pt = invert(e.clientX - rect.left, e.clientY - rect.top);
      if (!pt) return null;
      for (const s of shapes) if (hitShape(s, pt[0], pt[1])) return s.code;
      return null;
    },
    [invert, shapes],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    interacted.current = true;
    spinning.current = false;
    drag.current = { x: e.clientX, y: e.clientY, moved: false };
    setDragging(true);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (drag.current) {
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) drag.current.moved = true;
      if (drag.current.moved) {
        target.current = null;
        const r = radiusFor(width, height) * view.current.scale;
        const k = 90 / r; // degrees per pixel, tuned to OrbitControls' feel
        view.current.lambda = ((view.current.lambda - dx * k + 540) % 360) - 180;
        view.current.phi = Math.max(-75, Math.min(75, view.current.phi + dy * k));
        drag.current.x = e.clientX;
        drag.current.y = e.clientY;
        if (tip) setTip(null);
        // One post per event is fine — the worker renders at its own rAF pace
        // and later posts simply replace the pending state.
        paint();
      }
      return;
    }
    // Hit-testing every pointermove is wasted precision — 30 Hz is plenty.
    const now = performance.now();
    if (now - lastHitT.current < 33) return;
    lastHitT.current = now;
    const code = locate(e);
    if (code !== hoverCode) {
      setHoverCode(code);
      onHover?.(code);
    }
    if (code && !selectedCode) {
      const rect = canvasRef.current!.getBoundingClientRect();
      setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, code });
    } else setTip(null);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const wasDrag = drag.current?.moved;
    drag.current = null;
    setDragging(false);
    if (wasDrag) return;
    const code = locate(e);
    if (code) {
      const meta = metaMap[code];
      if (meta) {
        setTip(null);
        onSelect(meta);
      }
    } else onSelect(null);
  };

  const onPointerLeave = () => {
    drag.current = null;
    setDragging(false);
    if (hoverCode) {
      setHoverCode(null);
      onHover?.(null);
    }
    setTip(null);
  };

  const tipMeta = tip ? metaMap[tip.code] : null;
  const tipHasHistory = tip ? (hasHistory?.(tip.code) ?? false) : false;

  return (
    <div
      ref={ref}
      className="absolute inset-0"
      style={{ opacity: shapes.length ? 1 : 0, transition: "opacity 0.9s ease" }}
    >
      {/* brass glow bloom — seats the globe in light, not on black */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(38% 38% at 50% 50%, rgba(216,181,110,0.11), rgba(216,181,110,0.035) 55%, transparent 72%)",
        }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{
          cursor: dragging ? "grabbing" : hoverCode ? "pointer" : "grab",
          // Vertical swipes keep scrolling the page on touch; horizontal
          // drags spin the globe. The compromise that keeps mobile scrollable.
          touchAction: "pan-y",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
      />
      {/* hover tooltip — same card the three.js globe drew */}
      {tip && tipMeta && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full"
          style={{ left: tip.x, top: tip.y - 14 }}
        >
          <div className="min-w-[120px] rounded-[6px] border border-[rgba(216,181,110,0.34)] bg-[rgba(8,9,14,0.94)] px-[13px] py-[9px] shadow-[0_12px_30px_rgba(0,0,0,0.6)]">
            <div className="font-display text-[16px] leading-[1.1] text-[#f7f0e1]">{tipMeta.name}</div>
            <div className="mt-[5px] font-mono text-[9.5px] uppercase tracking-[0.14em] text-brass">
              {tip.code}
              {tipMeta.subregion ? ` · ${tipMeta.subregion}` : ""}
            </div>
            <div className="mt-1 font-mono text-[9.5px] tracking-[0.06em]">
              {tipHasHistory ? (
                <span className="text-[#d8b56e]">● archive ready</span>
              ) : (
                <span className="text-[#8c8472]">○ in progress</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
