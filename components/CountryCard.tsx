"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { CountryMeta } from "@/lib/types";
import { formatPopulation, formatArea } from "@/lib/format";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-chalk-faint">
        {label}
      </div>
      <div className="mt-1.5 font-display text-[21px] leading-none text-parchment">{value}</div>
    </div>
  );
}

export default function CountryCard({
  meta,
  hasHistory,
  foundingNote,
  headline,
  onClose,
}: {
  meta: CountryMeta;
  hasHistory: boolean;
  foundingNote?: string;
  headline?: { gdp: string; gdpPerCapita: string };
  onClose: () => void;
}) {
  return (
    <motion.aside
      key={meta.code}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.45 }}
      className="pointer-events-auto w-[min(92vw,21.5rem)] rounded-[8px] border border-brass/28 p-6 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl"
      style={{
        background:
          "linear-gradient(180deg,rgba(20,22,34,0.92),rgba(12,13,22,0.94))",
      }}
    >
      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <span className="grid h-8 w-11 flex-none place-items-center rounded-[3px] border border-brass/20 bg-void-soft text-[18px] leading-none">
            {meta.flag ?? "🏳️"}
          </span>
          <div className="min-w-0">
            <div className="font-display text-[28px] leading-none text-chalk-bright">
              {meta.name}
            </div>
            <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-brass">
              {meta.code} · {meta.subregion ?? meta.region}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="grid h-[30px] w-[30px] flex-none place-items-center rounded-full border border-brass/25 text-chalk-soft transition-colors hover:border-brass hover:text-chalk"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      {/* stats */}
      <div className="mt-[22px] flex gap-[22px] border-y border-brass/12 py-4">
        <Stat label="Population" value={formatPopulation(meta.population)} />
        {headline ? (
          <Stat label="GDP" value={headline.gdp} />
        ) : (
          <Stat label="Area" value={formatArea(meta.area)} />
        )}
        <Stat label="Region" value={meta.subregion ?? meta.region ?? "—"} />
      </div>

      {foundingNote && (
        <div className="mt-4 rounded-[4px] border border-brass/20 bg-brass/[0.06] px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass/80">
            Became a nation
          </div>
          <p className="mt-1 text-[0.9rem] leading-snug text-chalk-soft">{foundingNote}</p>
        </div>
      )}

      {/* CTA */}
      <Link
        href={`/country/${meta.code}`}
        className="group mt-5 flex items-center justify-center gap-2.5 rounded-[4px] py-3.5 text-[15px] font-semibold text-[#1a140a]"
        style={{ background: "linear-gradient(180deg,#d8b56e,#bf9550)" }}
      >
        Open the dossier
        {hasHistory && (
          <span className="font-mono text-[0.6rem] uppercase tracking-wider opacity-60">
            + history
          </span>
        )}
        <span className="text-[16px] transition-transform group-hover:translate-x-1">→</span>
      </Link>
    </motion.aside>
  );
}
