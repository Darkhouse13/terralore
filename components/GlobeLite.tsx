"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useElementSize } from "./useElementSize";
import { CHORO_NODATA, choroColor, percentileRanks } from "@/lib/choropleth";
import { PULSE_LIVE_MS, DEG, centerYFor, radiusFor, renderGlobe, type DrawShape, type RenderState, type Shape } from "./globe-render";
import { CATEGORY_META, type CountryMeta, type CountryMetaMap, type EventCategory } from "@/lib/types";

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

/** One corpus event as the time-events file encodes it. */
export type TimeEventTuple = [code: string, year: number, category: string, title: string, eraId: string];

interface Props {
  selectedCode: string | null;
  onSelect: (meta: CountryMeta | null) => void;
  hasHistory?: (code: string) => boolean;
  choroplethValues?: Record<string, number> | null;
  /** The active period's events, or null when the Time Globe is disengaged. */
  timeEvents?: TimeEventTuple[] | null;
  /** Existence shading: sourced founding years + the active period's span. */
  timeShading?: { founding: Record<string, number>; start: number; end: number } | null;
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
  timeEvents = null,
  timeShading = null,
  onHover,
  onReady,
}: Props) {
  const { ref, width, height } = useElementSize<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [metaMap, setMetaMap] = useState<CountryMetaMap>({});
  const [hoverCode, setHoverCode] = useState<string | null>(null);
  const [tip, setTip] = useState<
    | { x: number; y: number; code: string }
    | { x: number; y: number; ev: { title: string; yearLabel: string; name: string; tint: string } }
    | null
  >(null);
  const [dragging, setDragging] = useState(false);

  // View state lives in refs — it changes every frame and must not re-render React.
  const view = useRef({ lambda: 14, phi: 24, scale: 1 });
  const target = useRef<{ lambda: number; phi: number; scale: number; from: typeof view.current; t0: number; dur: number } | null>(null);
  const spinning = useRef(true);
  const interacted = useRef(false);
  // Inertia: view velocity in deg/ms, fed by the last few drag samples and
  // decayed by the sim loop. What separates "a globe you spun" from "a globe
  // that stops dead the millisecond you let go".
  const vel = useRef({ l: 0, p: 0 });
  const dragSamples = useRef<{ t: number; x: number; y: number }[]>([]);
  // Auto-rotate resume: the old behaviour was that the FIRST touch silenced the
  // rotation forever — the quality that makes the globe feel alive on arrival
  // died permanently at first contact. After interaction ends, this timer
  // re-arms the spin; the ramp makes it ease back in rather than jerk.
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinRampT0 = useRef(0);
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

  // ── The Time Globe's pulses ──────────────────────────────────────────────
  // The active period's events, resolved against centroids and pigments the
  // client already holds, packed once per period change: trig for the worker,
  // a parallel JS list for hover/click on this thread.
  const pulseBundle = useMemo(() => {
    if (!timeEvents || !timeEvents.length || !Object.keys(metaMap).length) return null;
    const tints: string[] = [];
    const tintIdx = new Map<string, number>();
    const list: { lat: number; lon: number; tint: string; title: string; yearLabel: string; name: string; href: string }[] = [];
    const packed: number[] = [];
    const n = timeEvents.length;
    // Born in year order (the file is sorted) across a spread that stays under
    // a second regardless of density — a 215-event decade cascades, a 5-event
    // century still reads as a sequence.
    const spread = Math.min(900, Math.max(260, n * 22));
    let i = 0;
    for (const [code, year, cat, title, eraId] of timeEvents) {
      const m = metaMap[code];
      if (!m?.latlng) continue;
      const meta = CATEGORY_META[cat as EventCategory];
      const tint = meta?.tint ?? "#c87244";
      let ti = tintIdx.get(tint);
      if (ti == null) { ti = tints.length; tints.push(tint); tintIdx.set(tint, ti); }
      const [lat, lon] = m.latlng;
      packed.push(
        Math.sin(lat * DEG), Math.cos(lat * DEG),
        Math.sin(lon * DEG), Math.cos(lon * DEG),
        ti, n > 1 ? (i / (n - 1)) * spread : 0,
      );
      list.push({
        lat, lon, tint, title,
        yearLabel: year < 0 ? `${-year} BCE` : String(year),
        name: m.name,
        href: `/country/${code}/chronicle#${eraId}`,
      });
      i++;
    }
    return list.length ? { data: new Float64Array(packed), tints, list } : null;
  }, [timeEvents, metaMap]);

  const pulseT0 = useRef(0);

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

  // ── Existence shading: the world, filled in only as far as it has come ──
  // Three states per nation, all derived from the corpus's own sourced
  // `founding` claim: not yet a state (a ghost — land barely lifted off the
  // ocean, coastline and shelf halo carrying the outline), born in the active
  // period (a copper wash — the moment of becoming), and existing (limestone,
  // as ever). Nations without a history make no founding claim and are
  // rendered as today — the rail's caption carries the caveat.
  const timeFills = useMemo(() => {
    if (!timeShading) return null;
    const out: Record<string, string> = {};
    for (const s of shapes) {
      const born = timeShading.founding[s.code];
      if (born == null) continue; // no claim, no shading
      if (born > timeShading.end) out[s.code] = "rgba(235, 233, 224, 0.15)";
      else if (born >= timeShading.start) out[s.code] = "rgba(200, 114, 68, 0.88)";
    }
    return out;
  }, [timeShading, shapes]);

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
      fills: timeFills ?? fills,
      ringCenter,
      ringT0: ringT0.current,
      pulses: pulseBundle ? { data: pulseBundle.data, tints: pulseBundle.tints } : null,
      pulseT0: pulseT0.current,
    }),
    [hoverCode, selectedCode, fills, timeFills, ringCenter, pulseBundle],
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
    } else {
      // Inertia first: released momentum decays exponentially (~180 ms time
      // constant, OrbitControls-damping territory). Latitude momentum dies at
      // the pole clamp instead of grinding against it.
      const v = vel.current;
      if (v.l !== 0 || v.p !== 0) {
        view.current.lambda = ((view.current.lambda + v.l * dt + 540) % 360) - 180;
        const nextPhi = view.current.phi + v.p * dt;
        view.current.phi = Math.max(-75, Math.min(75, nextPhi));
        if (nextPhi !== view.current.phi) v.p = 0;
        const decay = Math.exp(-dt / 180);
        v.l *= decay;
        v.p *= decay;
        if (Math.hypot(v.l, v.p) < 0.0004) v.l = v.p = 0;
      }
      if (spinning.current && !reduceMotion) {
        // Ease the ambient spin back in over ~1.6 s — resuming at full speed
        // after stillness reads as a glitch, not a behaviour.
        const ramp = spinRampT0.current
          ? Math.min(1, (t - spinRampT0.current) / 1600)
          : 1;
        view.current.lambda += (SPIN_DEG_S * dt * easeCubic(ramp)) / 1000;
      }
    }

    paint();
    const pulsesLive =
      pulseBundle !== null && pulseT0.current !== 0 && t - pulseT0.current < PULSE_LIVE_MS;
    const more =
      target.current !== null ||
      vel.current.l !== 0 ||
      vel.current.p !== 0 ||
      pulsesLive ||
      (spinning.current && !reduceMotion);
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

  // Re-arm the ambient spin after 7 s of stillness. No stale-selection guard is
  // needed in the timeout body: the selection effect below clears this timer
  // the moment a nation is selected, which is the only way it could go stale.
  const scheduleResume = useCallback(() => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      spinning.current = true;
      spinRampT0.current = performance.now();
      wakeSim();
    }, 7000);
  }, [wakeSim]);

  // Selection owns the stage: never drift away from what the reader framed.
  // When the card closes, the stage is unowned again — let the world resume.
  useEffect(() => {
    if (selectedCode) {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    } else if (interacted.current) {
      scheduleResume();
    }
  }, [selectedCode, scheduleResume]);

  useEffect(() => () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, []);

  // Kick the spin once geometry is in; pause off-screen / hidden tab.
  useEffect(() => {
    if (shapes.length) wakeSim();
  }, [shapes, wakeSim]);

  // A new period restarts the bloom clock. Under reduced motion the epoch is 0,
  // which the renderer reads as "fully settled": the dots simply exist.
  useEffect(() => {
    pulseT0.current = pulseBundle && !reduceMotion ? performance.now() : 0;
    if (pulseBundle) wakeSim();
    paint();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- epoch keyed to bundle identity only
  }, [pulseBundle]);


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

  /** Screen position of a lat/lon under the current view, or null if hidden. */
  const project = useCallback(
    (lat: number, lon: number): [number, number] | null => {
      if (!width || !height) return null;
      const r = radiusFor(width, height) * view.current.scale;
      const phi = view.current.phi * DEG;
      const la = lat * DEG;
      const dl = (lon - view.current.lambda) * DEG;
      const cosc = Math.sin(phi) * Math.sin(la) + Math.cos(phi) * Math.cos(la) * Math.cos(dl);
      if (cosc < 0.02) return null;
      const x = width / 2 + r * Math.cos(la) * Math.sin(dl);
      const y = centerYFor(width, height) - r * (Math.cos(phi) * Math.sin(la) - Math.sin(phi) * Math.cos(la) * Math.cos(dl));
      return [x, y];
    },
    [width, height],
  );

  /** The pulse nearest the pointer, within `radius` px — the Time Globe's hit test. */
  const pickPulse = useCallback(
    (px: number, py: number, radius: number) => {
      if (!pulseBundle) return null;
      let best = null as null | (typeof pulseBundle.list)[number];
      let bestD = radius * radius;
      for (const ev of pulseBundle.list) {
        const pt = project(ev.lat, ev.lon);
        if (!pt) continue;
        const d = (pt[0] - px) ** 2 + (pt[1] - py) ** 2;
        if (d < bestD) { bestD = d; best = ev; }
      }
      return best;
    },
    [pulseBundle, project],
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
    spinRampT0.current = 0;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    vel.current.l = vel.current.p = 0; // catching the globe stops it
    drag.current = { x: e.clientX, y: e.clientY, moved: false };
    dragSamples.current = [{ t: e.timeStamp, x: e.clientX, y: e.clientY }];
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
        // Radian-true: dragging one radius of pixels turns the sphere ~57.3°,
        // which keeps the ground under the finger instead of outrunning it (the
        // old 90/r slid ~1.6× faster than the pointer — the "slippery" half of
        // "feels buggy when touched"). Longitude is compensated for latitude so
        // east–west drags don't turn to treacle near the pole clamp; capped at
        // 2× so the compensation never becomes a whip.
        const k = 57.2958 / r;
        const comp = Math.min(2, 1 / Math.max(0.5, Math.cos(view.current.phi * DEG)));
        view.current.lambda = ((view.current.lambda - dx * k * comp + 540) % 360) - 180;
        view.current.phi = Math.max(-75, Math.min(75, view.current.phi + dy * k));
        drag.current.x = e.clientX;
        drag.current.y = e.clientY;
        const now = e.timeStamp;
        dragSamples.current.push({ t: now, x: e.clientX, y: e.clientY });
        while (dragSamples.current.length > 2 && now - dragSamples.current[0].t > 90) {
          dragSamples.current.shift();
        }
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
    // A pulse under the pointer outranks the country beneath it: the dot is
    // the smaller, more deliberate target, and it is the whole point of the
    // time mode being open.
    if (pulseBundle) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      const ev = pickPulse(px, py, 12);
      if (ev) {
        if (hoverCode) { setHoverCode(null); onHover?.(null); }
        setTip({ x: px, y: py, ev: { title: ev.title, yearLabel: ev.yearLabel, name: ev.name, tint: ev.tint } });
        return;
      }
    }
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

  /** Release velocity from the last ≤90 ms of samples, in the drag's own mapping. */
  const releaseVelocity = () => {
    const ss = dragSamples.current;
    dragSamples.current = [];
    if (reduceMotion || ss.length < 2) return;
    const a = ss[0];
    const b = ss[ss.length - 1];
    const dtMs = b.t - a.t;
    if (dtMs < 8 || dtMs > 160) return; // a stale gap means the finger paused: no fling
    const r = radiusFor(width, height) * view.current.scale;
    const k = 57.2958 / r;
    const comp = Math.min(2, 1 / Math.max(0.5, Math.cos(view.current.phi * DEG)));
    vel.current.l = (-(b.x - a.x) * k * comp) / dtMs;
    vel.current.p = ((b.y - a.y) * k) / dtMs;
    // Clamp: a wild fling should feel spirited, not send the planet into orbit.
    const speed = Math.hypot(vel.current.l, vel.current.p);
    const MAX = 0.35; // deg/ms
    if (speed > MAX) {
      vel.current.l *= MAX / speed;
      vel.current.p *= MAX / speed;
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const wasDrag = drag.current?.moved;
    drag.current = null;
    setDragging(false);
    if (wasDrag) {
      releaseVelocity();
      scheduleResume();
      wakeSim();
      return;
    }
    if (pulseBundle) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const ev = pickPulse(e.clientX - rect.left, e.clientY - rect.top, 14);
      if (ev) {
        // Descend into the chronicle at the era that holds this event — the
        // globe → time → place → sourced account chain in one gesture.
        window.location.assign(ev.href);
        return;
      }
    }
    const code = locate(e);
    if (code) {
      const meta = metaMap[code];
      if (meta) {
        setTip(null);
        onSelect(meta);
      }
    } else onSelect(null);
  };

  /**
   * The browser reclaiming the gesture. With `touch-action: pan-y` (the
   * deliberate compromise that keeps the page scrollable over a full-screen
   * globe), a touch judged vertical is taken by the scroller mid-drag and
   * arrives here as `pointercancel` — which this component previously ignored,
   * leaving a live drag ref and a stuck `dragging` state. That intermittent
   * dead gesture was the touch half of "feels buggy". No fling on cancel: the
   * user's finger is now scrolling the page, and a planet spinning underneath
   * a scroll reads as noise.
   */
  const onPointerCancel = () => {
    drag.current = null;
    dragSamples.current = [];
    setDragging(false);
    scheduleResume();
  };

  const onPointerLeave = () => {
    if (drag.current) {
      drag.current = null;
      releaseVelocity();
      scheduleResume();
      wakeSim();
    }
    setDragging(false);
    if (hoverCode) {
      setHoverCode(null);
      onHover?.(null);
    }
    setTip(null);
  };

  const tipMeta = tip && "code" in tip ? metaMap[tip.code] : null;
  const tipHasHistory = tip && "code" in tip ? (hasHistory?.(tip.code) ?? false) : false;
  const tipEv = tip && "ev" in tip ? tip.ev : null;

  return (
    <div
      ref={ref}
      className="absolute inset-0"
      style={{ opacity: shapes.length ? 1 : 0, transition: "opacity 0.9s ease" }}
    >
      {/* copper bloom — seats the globe in light, not on black */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(38% 38% at 50% 50%, rgba(227, 154, 103,0.11), rgba(227, 154, 103,0.035) 55%, transparent 72%)",
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
        onPointerCancel={onPointerCancel}
        onPointerLeave={onPointerLeave}
      />
      {/* event tooltip — a moment from the archive, under the pointer */}
      {tip && tipEv && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full"
          style={{ left: tip.x, top: tip.y - 14 }}
        >
          <div className="max-w-[240px] rounded-[3px] border border-[rgba(39,111,128,0.5)] bg-[rgba(4,22,31,0.95)] px-[13px] py-[9px] shadow-[0_12px_30px_rgba(2,11,16,0.6)]">
            <div className="flex items-baseline gap-2 font-mono text-[9.5px] uppercase tracking-[0.14em]">
              <span aria-hidden className="h-[7px] w-[7px] flex-none translate-y-[-1px] rounded-full" style={{ background: tipEv.tint }} />
              <span className="tabular-nums text-[#afbfc1]">{tipEv.yearLabel}</span>
              <span className="truncate text-[#8497a0]">{tipEv.name}</span>
            </div>
            <div className="mt-[5px] font-display text-[14px] leading-[1.25] text-[#f2f6f4]">{tipEv.title}</div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#e39a67]">read the chapter →</div>
          </div>
        </div>
      )}
      {/* hover tooltip — same card the three.js globe drew */}
      {tip && "code" in tip && tipMeta && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full"
          style={{ left: tip.x, top: tip.y - 14 }}
        >
          <div className="min-w-[120px] rounded-[6px] border border-[rgba(227, 154, 103,0.34)] bg-[rgba(8,9,14,0.94)] px-[13px] py-[9px] shadow-[0_12px_30px_rgba(0,0,0,0.6)]">
            <div className="font-display text-[16px] leading-[1.1] text-[#f2f6f4]">{tipMeta.name}</div>
            <div className="mt-[5px] font-mono text-[9.5px] uppercase tracking-[0.14em] text-copper">
              {tip.code}
              {tipMeta.subregion ? ` · ${tipMeta.subregion}` : ""}
            </div>
            <div className="mt-1 font-mono text-[9.5px] tracking-[0.06em]">
              {tipHasHistory ? (
                <span className="text-[#e39a67]">● archive ready</span>
              ) : (
                <span className="text-[#8497a0]">○ in progress</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
