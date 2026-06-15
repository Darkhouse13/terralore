"use client";

import { useState } from "react";
import type { DataSource, Metric } from "@/lib/types";
import { formatMetric } from "@/lib/format";
import { metricDefinition } from "@/lib/metric-defs";
import Sparkline from "./Sparkline";

export default function MetricCard({
  metric,
  source,
}: {
  metric: Metric;
  source?: DataSource;
}) {
  const [open, setOpen] = useState(false);
  const empty = metric.value == null;
  const hasSeries = !empty && !!metric.series && metric.series.length > 1;
  const info = metricDefinition(metric.key, empty, source?.publisher);

  return (
    <div
      className={`group relative rounded-[4px] border p-5 pb-4 transition-colors ${
        empty
          ? "border-brass/10 bg-[#0d0c12]"
          : "border-brass/15 hover:border-brass/35"
      }`}
      style={
        empty
          ? undefined
          : { background: "linear-gradient(180deg,#13111a,#0e0d13)" }
      }
    >
      {/* label + info trigger */}
      <div className="flex items-start justify-between gap-2">
        <div
          className={`font-mono text-[10.5px] uppercase leading-snug tracking-[0.18em] ${
            empty ? "text-chalk-mute" : "text-chalk-faint"
          }`}
        >
          {metric.label}
        </div>
        <button
          type="button"
          aria-label={`What is ${metric.label}?`}
          aria-expanded={open}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onClick={() => setOpen((v) => !v)}
          className="-mt-0.5 grid h-[18px] w-[18px] flex-none cursor-help place-items-center rounded-full border border-brass/30 font-display text-[11px] italic leading-none text-chalk-faint transition-colors hover:border-brass hover:text-brass-bright"
        >
          i
        </button>
      </div>

      {/* value + sparkline */}
      <div className="mt-3.5 flex min-h-[42px] items-end justify-between gap-2.5 overflow-hidden">
        <div
          className={`whitespace-nowrap font-display text-[30px] font-[360] leading-none ${
            empty ? "text-chalk-mute" : "text-chalk-bright"
          }`}
        >
          {formatMetric(metric.value, metric.unit)}
        </div>
        {hasSeries && <Sparkline series={metric.series!} />}
      </div>

      {/* source + vintage */}
      <div className="mt-4 flex items-center justify-between font-mono text-[10px] tracking-[0.04em] text-chalk-dim">
        {source ? (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="uppercase underline-offset-2 transition-colors hover:text-brass hover:underline"
          >
            {source.publisher}
          </a>
        ) : (
          <span className="uppercase">{empty ? "No data" : "—"}</span>
        )}
        <span>{metric.year ?? "—"}</span>
      </div>

      {/* info popover */}
      <div
        className="pointer-events-none absolute inset-x-3.5 top-10 z-10 transition-[opacity,transform] duration-150 ease-out"
        style={{
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(-4px)",
        }}
      >
        <div className="rounded-[6px] border border-brass/30 bg-[rgba(8,7,13,0.97)] px-3 py-2.5 shadow-[0_18px_44px_-18px_rgba(0,0,0,0.92)]">
          <p className="font-serif text-[13.5px] leading-relaxed text-reading">{info}</p>
        </div>
      </div>
    </div>
  );
}
