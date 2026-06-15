// Bespoke SVG sparkline — no chart library, matching the hand-drawn aesthetic of
// the timeline rail. Renders a trailing series as a small brass line + faint area.
export default function Sparkline({
  series,
  width = 92,
  height = 26,
  className,
}: {
  series: { year: number; value: number }[];
  width?: number;
  height?: number;
  className?: string;
}) {
  if (!series || series.length < 2) return null;

  const xs = series.map((d) => d.year);
  const ys = series.map((d) => d.value);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const pad = 2;

  const px = (x: number) => pad + ((x - minX) / spanX) * (width - pad * 2);
  const py = (y: number) => height - pad - ((y - minY) / spanY) * (height - pad * 2);

  const pts = series.map((d) => `${px(d.year).toFixed(1)},${py(d.value).toFixed(1)}`);
  const line = "M" + pts.join(" L");
  const area = `${line} L${px(maxX).toFixed(1)},${(height - pad).toFixed(1)} L${px(
    minX,
  ).toFixed(1)},${(height - pad).toFixed(1)} Z`;
  const last = series[series.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
    >
      <path d={area} fill="var(--color-brass-bright)" opacity={0.08} />
      <path
        d={line}
        fill="none"
        stroke="var(--color-brass-bright)"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={px(last.year)} cy={py(last.value)} r={1.9} fill="var(--color-brass-bright)" />
    </svg>
  );
}
