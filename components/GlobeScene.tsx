"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useElementSize } from "./useElementSize";
import type { CountryMeta, CountryMetaMap } from "@/lib/types";

// react-globe.gl touches `window` on import — load it client-only.
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

type Feature = {
  properties: { code: string; name: string };
  geometry: unknown;
};

interface Props {
  selectedCode: string | null;
  onSelect: (meta: CountryMeta | null) => void;
  /** Notifies parent which codes have an authored history (for badge). */
  hasHistory?: (code: string) => boolean;
  /** When set, colour each country by its value (a choropleth layer). */
  choroplethValues?: Record<string, number> | null;
}

const OCEAN = "#0a1422";
const LAND = [205, 191, 161] as const; // parchment relief
const LAND_DIM = "rgba(150, 139, 116, 0.55)";

// Choropleth ramp: cool/recessive (low) → warm brass (high). Exported so the
// legend in AtlasHome draws the exact same gradient.
export const CHORO_LOW = [86, 112, 138] as const;
export const CHORO_HIGH = [233, 198, 120] as const;
const CHORO_NODATA = "rgba(120, 120, 132, 0.30)";

function choroColor(t: number) {
  const c = (i: number) => Math.round(CHORO_LOW[i] + (CHORO_HIGH[i] - CHORO_LOW[i]) * t);
  return `rgb(${c(0)}, ${c(1)}, ${c(2)})`;
}

// Brass graticule — meridians + parallels every 30°, drawn as paths that hug the
// sphere. Turns the globe into a cartographer's instrument (echoing the logo).
const GRATICULE: [number, number][][] = (() => {
  const lines: [number, number][][] = [];
  const step = 3;
  for (let lng = -180; lng < 180; lng += 30) {
    const pts: [number, number][] = [];
    for (let lat = -90; lat <= 90; lat += step) pts.push([lat, lng]);
    lines.push(pts);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const pts: [number, number][] = [];
    for (let lng = -180; lng <= 180; lng += step) pts.push([lat, lng]);
    lines.push(pts);
  }
  return lines;
})();

export default function GlobeScene({
  selectedCode,
  onSelect,
  hasHistory,
  choroplethValues,
}: Props) {
  const { ref, width, height } = useElementSize<HTMLDivElement>();
  const globeRef = useRef<any>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [metaMap, setMetaMap] = useState<CountryMetaMap>({});
  const [hoverCode, setHoverCode] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const interacted = useRef(false);

  // Load geometry + metadata.
  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch("/data/countries.geo.json").then((r) => r.json()),
      fetch("/data/countries.json").then((r) => r.json()),
    ]).then(([geo, meta]) => {
      if (!alive) return;
      setFeatures(geo.features as Feature[]);
      setMetaMap(meta as CountryMetaMap);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Deep-ocean sphere material (no photographic texture — an atlas, not a satellite).
  const globeMaterial = useMemo(() => {
    const m = new THREE.MeshPhongMaterial({ color: new THREE.Color(OCEAN) });
    m.shininess = 16;
    m.specular = new THREE.Color("#2c4e74");
    return m;
  }, []);

  // Initial camera + lighting + gentle idle spin.
  useEffect(() => {
    const g = globeRef.current;
    if (!g || !ready) return;
    g.pointOfView({ lat: 24, lng: 14, altitude: 2.5 }, 0);
    const controls = g.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.32;
    controls.enableZoom = true;
    controls.minDistance = 180;
    controls.maxDistance = 520;
    controls.rotateSpeed = 0.7;
    const stop = () => {
      interacted.current = true;
      controls.autoRotate = false;
    };
    controls.addEventListener("start", stop);

    // Warmer key light so the parchment land reads gold, not grey.
    const scene = g.scene();
    const key = new THREE.DirectionalLight(0xffe9c8, 1.1);
    key.position.set(-1, 0.6, 1.2);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x6f86b8, 0.5);
    rim.position.set(1, -0.4, -0.8);
    scene.add(rim);

    return () => controls.removeEventListener("start", stop);
  }, [ready]);

  // Fly to a country when selected externally (click or from list).
  useEffect(() => {
    const g = globeRef.current;
    if (!g || !ready || !selectedCode) return;
    const meta = metaMap[selectedCode];
    if (meta?.latlng) {
      g.controls().autoRotate = false;
      g.pointOfView({ lat: meta.latlng[0], lng: meta.latlng[1], altitude: 1.7 }, 900);
    }
  }, [selectedCode, ready, metaMap]);

  // Rank each country's value into [0,1] so colour spreads evenly even when the
  // underlying values are heavily skewed (e.g. GDP per capita).
  const pct = useMemo(() => {
    if (!choroplethValues) return null;
    const entries = Object.entries(choroplethValues).sort((a, b) => a[1] - b[1]);
    const n = entries.length;
    const m = new Map<string, number>();
    entries.forEach(([code], i) => m.set(code, n <= 1 ? 1 : i / (n - 1)));
    return m;
  }, [choroplethValues]);

  // A pulsing brass ring on the selected nation — a "locked target" readout.
  const selectedRing = useMemo(() => {
    if (!selectedCode) return [];
    const meta = metaMap[selectedCode];
    return meta?.latlng ? [{ lat: meta.latlng[0], lng: meta.latlng[1] }] : [];
  }, [selectedCode, metaMap]);

  const capColor = useMemo(
    () => (o: object) => {
      const code = (o as Feature).properties.code;
      if (code === selectedCode) return "#d8b56e";
      if (code === hoverCode) return "#e7c98c";
      if (pct) {
        const t = pct.get(code);
        return t == null ? CHORO_NODATA : choroColor(t);
      }
      return `rgba(${LAND[0]}, ${LAND[1]}, ${LAND[2]}, 0.92)`;
    },
    [selectedCode, hoverCode, pct]
  );

  const altitude = useMemo(
    () => (o: object) => {
      const code = (o as Feature).properties.code;
      if (code === selectedCode) return 0.07;
      if (code === hoverCode) return 0.05;
      return 0.012;
    },
    [selectedCode, hoverCode]
  );

  const label = useMemo(
    () => (o: object) => {
      const d = o as Feature;
      const meta = metaMap[d.properties.code];
      const name = meta?.name ?? d.properties.name;
      const region = meta?.subregion ?? meta?.region ?? "";
      const badge = hasHistory?.(d.properties.code)
        ? `<span style="color:#d8b56e">● archive ready</span>`
        : `<span style="color:#8c8472">○ in progress</span>`;
      return `<div style="font-family:var(--ff-sans),sans-serif;background:rgba(8,9,14,.94);
        border:1px solid rgba(216,181,110,.34);padding:9px 13px;border-radius:6px;
        box-shadow:0 12px 30px rgba(0,0,0,.6);transform:translateY(-8px);min-width:120px">
        <div style="font-family:var(--ff-display),serif;color:#f7f0e1;font-size:16px;line-height:1.1">${name}</div>
        <div style="font-family:var(--ff-mono),monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#bf9550;margin-top:5px">${d.properties.code}${region ? " · " + region : ""}</div>
        <div style="font-family:var(--ff-mono),monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;margin-top:5px">${badge}</div></div>`;
    },
    [metaMap, hasHistory]
  );

  return (
    <div ref={ref} className="absolute inset-0">
      {/* brass glow bloom — seats the globe in light, not on black */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(38% 38% at 50% 50%, rgba(216,181,110,0.13), rgba(216,181,110,0.04) 55%, transparent 72%)",
        }}
      />
      {width > 0 && height > 0 && (
        <Globe
          ref={globeRef}
          width={width}
          height={height}
          onGlobeReady={() => setReady(true)}
          backgroundColor="rgba(0,0,0,0)"
          showGlobe
          globeMaterial={globeMaterial}
          showAtmosphere
          atmosphereColor="#cfa45f"
          atmosphereAltitude={0.22}
          pathsData={GRATICULE}
          pathPoints={(d: object) => d as [number, number][]}
          pathPointLat={(p: object) => (p as [number, number])[0]}
          pathPointLng={(p: object) => (p as [number, number])[1]}
          pathPointAlt={0.005}
          pathColor={() => "rgba(216,181,110,0.34)"}
          pathStroke={0.35}
          pathTransitionDuration={0}
          ringsData={selectedRing}
          ringColor={() => (t: number) => `rgba(216,181,110,${(0.5 * (1 - t)).toFixed(3)})`}
          ringMaxRadius={4.5}
          ringPropagationSpeed={1.6}
          ringRepeatPeriod={1500}
          ringAltitude={0.012}
          polygonsData={features}
          polygonAltitude={altitude}
          polygonCapColor={capColor}
          polygonSideColor={() => LAND_DIM}
          polygonStrokeColor={() => "rgba(6,7,11,0.55)"}
          polygonsTransitionDuration={320}
          polygonLabel={label}
          onPolygonHover={(o: object | null) => {
            const code = (o as Feature | null)?.properties.code ?? null;
            setHoverCode(code);
            const c = globeRef.current?.controls();
            if (c) c.autoRotate = o ? false : !interacted.current;
          }}
          onPolygonClick={(o: object) => {
            const meta = metaMap[(o as Feature).properties.code];
            if (meta) onSelect(meta);
          }}
          onGlobeClick={() => onSelect(null)}
        />
      )}
    </div>
  );
}
