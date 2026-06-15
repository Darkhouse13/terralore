import type { DataSource, Metric } from "@/lib/types";
import { formatMetric } from "@/lib/format";
import Sparkline from "./Sparkline";

export default function MetricCard({
  metric,
  source,
}: {
  metric: Metric;
  source?: DataSource;
}) {
  const hasSeries = !!metric.series && metric.series.length > 1;

  return (
    <div className="rounded-[var(--radius-card)] border border-void-line bg-void-panel/60 p-4 transition hover:border-brass/30">
      <div className="eyebrow text-chalk-faint">{metric.label}</div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="font-display text-[1.7rem] leading-none text-chalk">
          {formatMetric(metric.value, metric.unit)}
        </div>
        {hasSeries && <Sparkline series={metric.series!} className="mb-0.5 shrink-0" />}
      </div>
      <div className="mt-3 flex items-center justify-between font-mono text-[0.6rem] uppercase tracking-[0.12em]">
        {source ? (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-chalk-faint underline-offset-2 transition hover:text-brass hover:underline"
          >
            {source.publisher}
          </a>
        ) : (
          <span />
        )}
        <span className="text-chalk-faint">{metric.year ?? "—"}</span>
      </div>
    </div>
  );
}
