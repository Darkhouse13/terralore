"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMetric } from "@/lib/format";
import { CHORO_HIGH, CHORO_LOW, CHORO_NODATA, choroColor, percentileRanks } from "@/lib/choropleth";

// The spatial half of the metric window: a flat, dependency-free SVG choropleth
// of the world coloured by the open metric (same ramp + percentile scale as the
// home globe). The home nation glows brass, compared nations are outlined in
// their chart colours, and clicking any nation toggles it in the comparison — so
// the map, the chart and the legend all move together.

interface Feature {
  properties: { code: string; name: string };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}

// fetched once, shared across every metric window
let geoCache: Promise<Feature[]> | null = null;
function loadGeo(): Promise<Feature[]> {
  if (!geoCache) {
    geoCache = fetch("/data/countries.geo.json")
      .then((r) => r.json())
      .then((g) => g.features as Feature[]);
  }
  return geoCache;
}

// Equirectangular projection, framed on the inhabited world (drops the empty
// polar bands so the populated latitudes fill the panel).
const W = 640;
const H = 300;
const TOP_LAT = 83;
const BOT_LAT = -56;
const projX = (lng: number) => ((lng + 180) / 360) * W;
const projY = (lat: number) => ((TOP_LAT - lat) / (TOP_LAT - BOT_LAT)) * H;

function ringPath(ring: number[][]): string {
  let d = "";
  for (let i = 0; i < ring.length; i++) {
    d += (i === 0 ? "M" : "L") + projX(ring[i][0]).toFixed(1) + "," + projY(ring[i][1]).toFixed(1);
  }
  return d + "Z";
}
function featurePath(f: Feature): string {
  const g = f.geometry;
  if (g.type === "Polygon") {
    return (g.coordinates as number[][][]).map(ringPath).join("");
  }
  return (g.coordinates as number[][][][]).flatMap((poly) => poly.map(ringPath)).join("");
}

export default function MetricMap({
  values,
  unit,
  names,
  homeCode,
  compare,
  colorFor,
  onToggle,
}: {
  values: Record<string, number>;
  unit: string;
  names: Record<string, { name: string; flag: string | null }>;
  homeCode: string;
  compare: string[]; // nation codes only (no world average)
  colorFor: (code: string) => string;
  onToggle: (code: string) => void;
}) {
  const [features, setFeatures] = useState<Feature[] | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let alive = true;
    loadGeo().then((f) => alive && setFeatures(f));
    return () => {
      alive = false;
    };
  }, []);

  const paths = useMemo(
    () => (features ? features.map((f) => ({ code: f.properties.code, d: featurePath(f) })) : []),
    [features],
  );
  const pct = useMemo(() => percentileRanks(values), [values]);
  const compareSet = useMemo(() => new Set(compare), [compare]);
  const extent = useMemo(() => {
    const vs = Object.values(values);
    return vs.length ? { min: Math.min(...vs), max: Math.max(...vs) } : null;
  }, [values]);

  if (!features) {
    return (
      <div className="grid h-[200px] place-items-center font-mono text-[11px] uppercase tracking-[0.14em] text-chalk-dim">
        Loading map…
      </div>
    );
  }

  const fillFor = (code: string) => {
    const t = pct.get(code);
    return t == null ? CHORO_NODATA : choroColor(t);
  };
  const strokeFor = (code: string, hovered: boolean) => {
    if (code === homeCode) return "var(--color-brass-bright)";
    if (compareSet.has(code)) return colorFor(code);
    if (hovered) return "rgba(232,224,208,0.75)";
    return "rgba(6,7,11,0.45)";
  };
  // home + compared + hovered get redrawn on top so their outlines never hide
  const onTop = paths.filter(
    (p) => p.code === homeCode || compareSet.has(p.code) || p.code === hover,
  );

  const hv = hover != null ? values[hover] : undefined;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label="World choropleth"
        style={{ display: "block" }}
        onMouseLeave={() => {
          setHover(null);
          setTip(null);
        }}
      >
        {/* base layer */}
        {paths.map(({ code, d }) => {
          const hasData = values[code] != null;
          const interactive = hasData && code !== homeCode;
          return (
            <path
              key={code}
              data-code={code}
              d={d}
              fillRule="evenodd"
              fill={fillFor(code)}
              stroke={strokeFor(code, false)}
              strokeWidth={0.4}
              style={{ cursor: interactive ? "pointer" : "default", transition: "fill .2s ease" }}
              onMouseMove={(e) => {
                setHover(code);
                const r = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
                setTip({ x: e.clientX - r.left, y: e.clientY - r.top });
              }}
              onClick={() => interactive && onToggle(code)}
            />
          );
        })}
        {/* highlight layer (home / compared / hovered) on top */}
        {onTop.map(({ code, d }) => (
          <path
            key={`top-${code}`}
            d={d}
            fillRule="evenodd"
            fill={fillFor(code)}
            stroke={strokeFor(code, code === hover)}
            strokeWidth={code === homeCode || compareSet.has(code) ? 1.6 : 1}
            pointerEvents="none"
          />
        ))}
      </svg>

      {/* hover tooltip */}
      {hover && tip && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+8px)] whitespace-nowrap rounded-[4px] border border-brass/35 bg-[rgba(8,7,13,0.97)] px-2.5 py-1.5"
          style={{ left: tip.x, top: tip.y }}
        >
          <div className="flex items-center gap-1.5 text-[12px] text-chalk">
            {names[hover]?.flag && <span>{names[hover].flag}</span>}
            <span>{names[hover]?.name ?? hover}</span>
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-brass-bright">
            {hv != null ? formatMetric(hv, unit) : "No data"}
          </div>
        </div>
      )}

      {/* ramp legend */}
      {extent && (
        <div className="mt-2 flex items-center gap-2.5 px-1">
          <span className="font-mono text-[10px] tracking-[0.04em] text-chalk-dim">
            {formatMetric(extent.min, unit)}
          </span>
          <div
            className="h-1.5 flex-1 rounded-[2px]"
            style={{
              background: `linear-gradient(90deg, rgb(${CHORO_LOW.join(",")}), rgb(${CHORO_HIGH.join(",")}))`,
            }}
          />
          <span className="font-mono text-[10px] tracking-[0.04em] text-chalk-dim">
            {formatMetric(extent.max, unit)}
          </span>
        </div>
      )}
    </div>
  );
}
