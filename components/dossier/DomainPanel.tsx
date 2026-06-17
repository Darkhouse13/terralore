import type { DataSource, Metric } from "@/lib/types";
import MetricCard from "./MetricCard";

// The Meridian metric grid — used for both a domain tab and the Overview
// highlights. Cards flow at a fixed minimum width so the grid stays dense and
// instrument-like across breakpoints. Clicking a chartable card asks the Dossier
// to open the shared metric window (onOpenMetric).
export default function DomainPanel({
  metrics,
  sources,
  onOpenMetric,
}: {
  metrics: Metric[];
  sources: Record<string, DataSource>;
  onOpenMetric: (key: string) => void;
}) {
  return (
    <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(248px,1fr))]">
      {metrics.map((m) => (
        <MetricCard
          key={m.key}
          metric={m}
          source={sources[m.sourceId]}
          onOpen={() => onOpenMetric(m.key)}
        />
      ))}
    </div>
  );
}
