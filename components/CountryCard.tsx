"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { CountryMeta } from "@/lib/types";
import { formatPopulation, formatArea } from "@/lib/format";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow text-chalk-faint">{label}</dt>
      <dd className="mt-1 text-[0.95rem] leading-snug text-chalk">{value}</dd>
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
      initial={{ opacity: 0, x: 28, filter: "blur(6px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, x: 28, filter: "blur(6px)" }}
      transition={{ type: "spring", stiffness: 240, damping: 28 }}
      className="pointer-events-auto w-[min(92vw,25rem)] overflow-hidden rounded-[var(--radius-card)]
        border border-brass/25 bg-void-soft/85 shadow-[var(--shadow-float)] backdrop-blur-xl"
    >
      {/* header */}
      <div className="relative flex items-start gap-4 px-6 pt-6 pb-5">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brass/60 to-transparent" />
        <div className="text-5xl leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          {meta.flag ?? "🏳️"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="eyebrow text-brass">{meta.code}</div>
          <h2 className="mt-1 font-display text-[1.7rem] leading-[1.05] text-chalk">
            {meta.name}
          </h2>
          {meta.officialName !== meta.name && (
            <p className="mt-1 font-mono text-[0.7rem] leading-snug text-chalk-soft">
              {meta.officialName}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="-mr-1.5 -mt-1 grid h-8 w-8 place-items-center rounded-full border border-void-line
            text-chalk-soft transition hover:border-brass/50 hover:text-chalk"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      {/* stats */}
      <dl className="grid grid-cols-2 gap-x-5 gap-y-4 px-6 pb-5">
        <Stat label="Capital" value={meta.capital[0] ?? "—"} />
        <Stat label="Population" value={formatPopulation(meta.population)} />
        <Stat
          label="Region"
          value={meta.subregion ?? meta.region ?? "—"}
        />
        <Stat label="Area" value={formatArea(meta.area)} />
        <Stat
          label="Languages"
          value={meta.languages.slice(0, 3).join(", ") || "—"}
        />
        <Stat
          label="Currency"
          value={
            meta.currencies[0]
              ? `${meta.currencies[0].name}${
                  meta.currencies[0].symbol ? ` (${meta.currencies[0].symbol})` : ""
                }`
              : "—"
          }
        />
        {headline && <Stat label="GDP" value={headline.gdp} />}
        {headline && <Stat label="GDP / capita" value={headline.gdpPerCapita} />}
      </dl>

      {foundingNote && (
        <div className="mx-6 mb-5 rounded-lg border border-brass/20 bg-brass/[0.06] px-4 py-3">
          <div className="eyebrow text-brass/80">Became a nation</div>
          <p className="mt-1 text-[0.9rem] leading-snug text-chalk-soft">{foundingNote}</p>
        </div>
      )}

      {/* CTA */}
      <div className="px-6 pb-6">
        <Link
          href={`/country/${meta.code}`}
          className="group flex items-center justify-between rounded-xl bg-brass px-5 py-3.5 text-[0.95rem] font-medium text-void shadow-[0_8px_24px_-8px_rgba(191,149,80,0.7)] transition hover:bg-brass-bright"
        >
          <span>Open the dossier</span>
          <span className="flex items-center gap-2">
            {hasHistory && (
              <span className="font-mono text-[0.6rem] uppercase tracking-wider opacity-70">
                + history
              </span>
            )}
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              className="transition-transform group-hover:translate-x-1"
            >
              <path
                d="M4 10h12m0 0l-5-5m5 5l-5 5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </Link>
      </div>
    </motion.aside>
  );
}
