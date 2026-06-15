// Bespoke SVG sparkline — no chart library, matching the hand-drawn aesthetic of
// the timeline rail. Meridian spec: a clean trailing polyline in brass with a
// bright end-dot; no area fill, so it reads as a precision instrument trace.
export default function Sparkline({
  series,
  width = 92,
  height = 34,
  className,
}: {
  series: { year: number; value: number }[];
  width?: number;
  height?: number;
  className?: string;
}) {
  if (!series || series.length < 2) return null;

  const ys = series.map((d) => d.value);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanY = maxY - minY || 1;
  const pad = 3;
  const n = series.length;

  const px = (i: number) => pad + (i / (n - 1)) * (width - pad * 2);
  const py = (y: number) => height - pad - ((y - minY) / spanY) * (height - pad * 2);

  const points = series
    .map((d, i) => `${px(i).toFixed(1)},${py(d.value).toFixed(1)}`)
    .join(" ");
  const last = series[n - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ overflow: "visible", flex: "none" }}
      aria-hidden
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-brass-bright)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={px(n - 1)} cy={py(last.value)} r={2.3} fill="var(--color-chalk-bright)" />
    </svg>
  );
}
