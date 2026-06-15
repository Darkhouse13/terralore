import type { DataSource, DomainSection } from "@/lib/types";
import MetricCard from "./MetricCard";

export default function DomainPanel({
  section,
  sources,
}: {
  section: DomainSection;
  sources: Record<string, DataSource>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {section.metrics.map((m) => (
        <MetricCard key={m.key} metric={m} source={sources[m.sourceId]} />
      ))}
    </div>
  );
}
