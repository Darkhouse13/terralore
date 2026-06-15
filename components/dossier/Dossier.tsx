"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import type { Comparison, CountryDossier, CountryMeta, DomainKey } from "@/lib/types";
import { DOMAIN_META } from "@/lib/types";
import { formatPopulation, formatArea, formatMetric } from "@/lib/format";
import DomainPanel from "./DomainPanel";
import MetricCard from "./MetricCard";

type Tab = "overview" | DomainKey;

export default function Dossier({
  meta,
  dossier,
  comparisons,
  regionLabel,
  hasHistory,
  historyTagline,
}: {
  meta: CountryMeta;
  dossier: CountryDossier | null;
  comparisons: Comparison[];
  regionLabel: string | null;
  hasHistory: boolean;
  historyTagline: string | null;
}) {
  const domains = dossier
    ? (Object.keys(dossier.sections) as DomainKey[])
    : [];
  const [tab, setTab] = useState<Tab>("overview");
  const sources = dossier?.sources ?? {};

  return (
    <main
      className="relative min-h-[100dvh] w-full overflow-x-hidden bg-void text-chalk"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 0%, #14110b 0%, #0a0a0c 55%, #07070a 100%)",
      }}
    >
      <div className="mx-auto max-w-5xl px-5 pb-24 pt-6 md:px-8 md:pt-9">
        {/* back to the globe */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-chalk-soft transition hover:text-chalk"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="transition-transform group-hover:-translate-x-0.5">
            <path d="M16 10H4m0 0l5 5m-5-5l5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-mono text-[0.66rem] uppercase tracking-[0.16em]">The Globe</span>
        </Link>

        {/* title */}
        <header className="mt-7 flex items-start gap-5">
          <div className="text-6xl leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            {meta.flag ?? "🏳️"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="eyebrow flex flex-wrap items-center gap-2 text-brass">
              <span>{meta.code}</span>
              <span className="text-brass/40">·</span>
              <span>{meta.subregion ?? meta.region}</span>
              {meta.continent && (
                <>
                  <span className="text-brass/40">·</span>
                  <span>{meta.continent}</span>
                </>
              )}
            </div>
            <h1 className="mt-2 font-display text-[2.6rem] font-medium leading-[1.02] text-chalk md:text-[3.4rem]">
              {meta.name}
            </h1>
            {meta.officialName !== meta.name && (
              <p className="mt-1 font-mono text-[0.74rem] text-chalk-soft">{meta.officialName}</p>
            )}
          </div>
        </header>

        {/* tabs */}
        <nav className="mt-9 flex items-center gap-1 overflow-x-auto border-b border-void-line">
          <TabButton label="Overview" active={tab === "overview"} onClick={() => setTab("overview")} />
          {domains.map((d) => (
            <TabButton
              key={d}
              label={DOMAIN_META[d].label}
              active={tab === d}
              onClick={() => setTab(d)}
            />
          ))}
        </nav>

        {/* panel */}
        <div className="mt-7 min-h-[12rem]">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
            >
              {tab === "overview" ? (
                <Overview
                  meta={meta}
                  dossier={dossier}
                  comparisons={comparisons}
                  regionLabel={regionLabel}
                />
              ) : (
                dossier && (
                  <DomainPanel section={dossier.sections[tab]!} sources={sources} />
                )
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* history — the flagship sub-experience */}
        <HistoryHero
          code={meta.code}
          name={meta.name}
          hasHistory={hasHistory}
          tagline={historyTagline}
        />

        {/* sources & methodology */}
        {Object.keys(sources).length > 0 && (
          <footer className="mt-14 border-t border-void-line pt-6">
            <div className="eyebrow text-chalk-faint">Sources &amp; methodology</div>
            <ul className="mt-3 space-y-1.5">
              {Object.values(sources).map((s) => (
                <li key={s.id} className="text-[0.82rem] leading-snug text-chalk-soft">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-chalk transition hover:text-brass hover:underline"
                  >
                    {s.label}
                  </a>{" "}
                  — {s.publisher} · {s.license} · accessed {s.accessed}
                </li>
              ))}
            </ul>
            {dossier && (
              <p className="mt-4 max-w-2xl text-[0.78rem] leading-relaxed text-chalk-faint">
                Figures show the latest year with data for each indicator; gaps appear as “—”.
                Disputed and non-UN territories may be partially or wholly absent from these
                datasets. Data last refreshed {dossier.updated}.
              </p>
            )}
          </footer>
        )}
      </div>
    </main>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative whitespace-nowrap px-4 py-2.5 text-[0.92rem] transition ${
        active ? "text-chalk" : "text-chalk-soft hover:text-chalk"
      }`}
    >
      {label}
      {active && (
        <motion.span
          layoutId="dossier-tab"
          className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brass"
        />
      )}
    </button>
  );
}

function Overview({
  meta,
  dossier,
  comparisons,
  regionLabel,
}: {
  meta: CountryMeta;
  dossier: CountryDossier | null;
  comparisons: Comparison[];
  regionLabel: string | null;
}) {
  // A few highlight metrics drawn from across the available domains.
  const highlights = dossier
    ? (Object.values(dossier.sections).flatMap((s) =>
        s!.metrics.slice(0, 2).map((m) => ({ metric: m, source: dossier.sources[m.sourceId] })),
      ))
    : [];

  return (
    <div className="space-y-9">
      <section>
        <div className="eyebrow text-chalk-faint">Quick facts</div>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 md:grid-cols-4">
          <Fact label="Capital" value={meta.capital[0] ?? "—"} />
          <Fact label="Population" value={formatPopulation(meta.population)} />
          <Fact label="Area" value={formatArea(meta.area)} />
          <Fact label="Region" value={meta.subregion ?? meta.region ?? "—"} />
          <Fact label="Languages" value={meta.languages.slice(0, 3).join(", ") || "—"} />
          <Fact
            label="Currency"
            value={
              meta.currencies[0]
                ? `${meta.currencies[0].name}${
                    meta.currencies[0].symbol ? ` (${meta.currencies[0].symbol})` : ""
                  }`
                : "—"
            }
          />
          <Fact label="Demonym" value={meta.demonym ?? "—"} />
          <Fact label="UN member" value={meta.unMember == null ? "—" : meta.unMember ? "Yes" : "No"} />
        </dl>
      </section>

      {comparisons.length > 0 && (
        <section>
          <div className="eyebrow text-chalk-faint">
            How {meta.name} compares
          </div>
          <div className="mt-3 divide-y divide-void-line/70 rounded-[var(--radius-card)] border border-void-line bg-void-panel/40">
            {comparisons.map((c) => (
              <ComparisonRow key={`${c.domain}-${c.key}`} c={c} regionLabel={regionLabel} />
            ))}
          </div>
        </section>
      )}

      {highlights.length > 0 && (
        <section>
          <div className="eyebrow text-chalk-faint">Highlights</div>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
            {highlights.map(({ metric, source }) => (
              <MetricCard key={metric.key} metric={metric} source={source} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow text-chalk-faint">{label}</dt>
      <dd className="mt-1 text-[0.95rem] leading-snug text-chalk">{value}</dd>
    </div>
  );
}

const ordinal = (n: number) => {
  const t = n % 100;
  const s = t >= 11 && t <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `${n}${s}`;
};

function ComparisonRow({ c, regionLabel }: { c: Comparison; regionLabel: string | null }) {
  // Fill = how high it ranks worldwide (rank 1 → full bar).
  const fill =
    c.global.total > 1 ? (c.global.total - c.global.rank) / (c.global.total - 1) : 1;
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[0.92rem] text-chalk">{c.label}</span>
          <span className="font-display text-[1.05rem] leading-none text-chalk">
            {formatMetric(c.value, c.unit)}
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-void-line">
          <div
            className="h-full rounded-full bg-brass/80"
            style={{ width: `${Math.max(3, fill * 100)}%` }}
          />
        </div>
        <div className="mt-1.5 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-chalk-faint">
          {ordinal(c.global.rank)} of {c.global.total} worldwide
          {c.regional && regionLabel && (
            <>
              {" · "}
              {ordinal(c.regional.rank)} of {c.regional.total} in {regionLabel}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryHero({
  code,
  name,
  hasHistory,
  tagline,
}: {
  code: string;
  name: string;
  hasHistory: boolean;
  tagline: string | null;
}) {
  if (!hasHistory) {
    return (
      <div className="mt-12 rounded-[var(--radius-card)] border border-void-line bg-void-panel/40 px-6 py-5">
        <div className="eyebrow text-chalk-faint">History</div>
        <p className="mt-1.5 text-[0.95rem] text-chalk-soft">
          The sourced time-journey through {name} is being charted and verified — it will arrive complete.
        </p>
      </div>
    );
  }
  return (
    <Link
      href={`/country/${code}/history`}
      className="group mt-12 flex items-center justify-between gap-5 rounded-[var(--radius-card)] border border-brass/30 bg-brass/[0.07] px-6 py-6 transition hover:border-brass/60 hover:bg-brass/[0.12]"
    >
      <div className="min-w-0">
        <div className="eyebrow text-brass">The history journey</div>
        <p className="mt-1.5 font-display text-[1.4rem] leading-tight text-chalk">
          {tagline ?? `How ${name} came to be`}
        </p>
        <p className="mt-1 text-[0.86rem] text-chalk-soft">
          Pilot a cinematic, sourced journey through its eras — moment by moment.
        </p>
      </div>
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brass text-void transition-transform group-hover:translate-x-1">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 10h12m0 0l-5-5m5 5l-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  );
}
