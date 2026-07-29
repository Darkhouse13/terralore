"use client";

import Link from "next/link";
import type { CountryMeta } from "@/lib/types";
import { formatPopulation, formatArea } from "@/lib/format";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-chalk-3">
        {label}
      </div>
      <div className="mt-1.5 font-display text-[21px] leading-none text-land-0">{value}</div>
    </div>
  );
}

export default function CountryCard({
  meta,
  hasHistory,
  foundingNote,
  headline,
  activeMetric,
  onClose,
}: {
  meta: CountryMeta;
  hasHistory: boolean;
  foundingNote?: string;
  headline?: { gdp: string; gdpPerCapita: string };
  /** The metric the globe is currently coloured by (if any), pre-formatted —
   * lets the card jump straight into that metric's window on the dossier. */
  activeMetric?: { key: string; label: string; value: string };
  onClose: () => void;
}) {
  return (
    // A CSS entrance rather than a motion one. This card is the only thing on
    // the landing page that used framer-motion, and importing it here pulled a
    // 121 KB (40 KB transfer) chunk into the landing bundle for an element that
    // does not exist until someone clicks a nation. `card-rise` is a plain
    // keyframe in globals.css and collapses under prefers-reduced-motion with
    // everything else.
    <aside
      key={meta.code}
      className="card-rise pointer-events-auto w-[min(92vw,21.5rem)] rounded-[8px] border border-copper/28 p-6 shadow-[0_30px_70px_-30px_rgba(2,11,16,0.9)] backdrop-blur-xl"
      style={{
        background:
          "linear-gradient(180deg,rgba(12,46,61,0.93),rgba(4,22,31,0.95))",
      }}
    >
      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <span className="grid h-8 w-11 flex-none place-items-center text-[18px] leading-none">
            {meta.flag ?? "🏳️"}
          </span>
          <div className="min-w-0">
            <div className="font-display text-[28px] leading-none text-chalk-hi">
              {meta.name}
            </div>
            <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-copper">
              {meta.code} · {meta.subregion ?? meta.region}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="grid h-[30px] w-[30px] flex-none place-items-center rounded-full border border-copper/25 text-chalk-2 transition-colors hover:border-copper hover:text-chalk"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      {/* stats */}
      <div className="mt-[22px] flex gap-[22px] border-y border-copper/12 py-4">
        <Stat label="Population" value={formatPopulation(meta.population)} />
        {headline ? (
          <Stat label="GDP" value={headline.gdp} />
        ) : (
          <Stat label="Area" value={formatArea(meta.area)} />
        )}
        <Stat label="Region" value={meta.subregion ?? meta.region ?? "—"} />
      </div>

      {/* the layer you're colouring by — a one-click jump into its metric window */}
      {activeMetric && (
        <Link
          href={`/country/${meta.code}#m=${activeMetric.key}&map=1`}
          className="group mt-4 flex items-center justify-between gap-3 rounded-[4px] border border-copper/30 bg-copper/[0.06] px-4 py-3 transition-colors hover:border-copper hover:bg-copper/[0.1]"
        >
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-copper/80">
              {activeMetric.label}
            </div>
            <div className="mt-1 font-display text-[20px] leading-none text-land-0">
              {activeMetric.value}
            </div>
          </div>
          <span className="flex-none whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-2 transition-colors group-hover:text-chalk">
            Explore{" "}
            <span className="inline-block text-[14px] transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </span>
        </Link>
      )}

      {foundingNote && (
        <div className="mt-4 rounded-[4px] border border-copper/20 bg-copper/[0.06] px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-copper/80">
            Became a nation
          </div>
          <p className="mt-1 text-[0.9rem] leading-snug text-chalk-2">{foundingNote}</p>
        </div>
      )}

      {/* CTA */}
      <Link
        href={`/country/${meta.code}`}
        className="group mt-5 flex items-center justify-center gap-2.5 rounded-[4px] py-3.5 text-[15px] font-semibold text-[#04161f]"
        style={{ background: "linear-gradient(180deg,#e39a67,#c87244)" }}
      >
        Open the dossier
        {hasHistory && (
          <span className="font-mono text-[0.6rem] uppercase tracking-wider opacity-60">
            + history
          </span>
        )}
        <span className="text-[16px] transition-transform group-hover:translate-x-1">→</span>
      </Link>
    </aside>
  );
}
