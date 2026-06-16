"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import type {
  Comparison,
  CountryDossier,
  CountryMeta,
  DataSource,
  DomainKey,
  Metric,
} from "@/lib/types";
import { DOMAIN_META } from "@/lib/types";
import { formatPopulation, formatArea, formatMetric } from "@/lib/format";
import DomainPanel from "./DomainPanel";

type Tab = "overview" | DomainKey;

const ALL_DOMAINS = Object.keys(DOMAIN_META) as DomainKey[];

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
  const available = dossier
    ? ALL_DOMAINS.filter((d) => dossier.sections[d])
    : [];
  const [tab, setTab] = useState<Tab>("overview");
  const sources = dossier?.sources ?? {};
  const isOverview = tab === "overview";

  // Overview highlights: a curated mix — the first two metrics of each domain.
  const highlights: Metric[] = available.flatMap(
    (d) => dossier!.sections[d]!.metrics.slice(0, 2),
  );
  const gridMetrics =
    isOverview || !dossier ? highlights : dossier.sections[tab as DomainKey]?.metrics ?? [];
  const gridLabel = isOverview ? "Highlights" : DOMAIN_META[tab as DomainKey].label;

  return (
    <main
      className="relative min-h-[100dvh] w-full overflow-x-hidden text-chalk"
      style={{
        background:
          "radial-gradient(120% 80% at 50% -8%, #15141d 0%, #0c0b11 46%, #09080d 100%)",
      }}
    >
      <div className="mx-auto max-w-[1340px] px-6 pb-24 pt-9 md:px-10 lg:px-14">
        {/* back to the globe */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 font-mono text-[12px] uppercase tracking-[0.22em] text-chalk-soft transition-colors hover:text-chalk"
        >
          <span className="text-[15px] transition-transform group-hover:-translate-x-0.5">←</span>
          The globe
        </Link>

        {/* header */}
        <header className="mt-8">
          <div className="font-mono text-[12px] uppercase tracking-[0.26em] text-brass sm:ml-[96px]">
            {meta.code}
            {(meta.subregion ?? meta.region) && ` · ${meta.subregion ?? meta.region}`}
            {meta.continent && ` · ${meta.continent}`}
          </div>
          <div className="mt-2 flex items-center gap-[22px]">
            <div className="flex h-[54px] w-[74px] flex-none items-center justify-center rounded-[4px] border border-brass/20 bg-void-soft text-[34px] leading-none shadow-[0_6px_18px_-8px_rgba(0,0,0,0.7)]">
              {meta.flag ?? "🏳️"}
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-[clamp(46px,7vw,82px)] font-[350] leading-[0.92] tracking-[-0.02em] text-chalk-bright">
                {meta.name}
              </h1>
              {meta.officialName !== meta.name && (
                <div className="mt-1.5 font-mono text-[13px] tracking-[0.06em] text-chalk-faint">
                  {meta.officialName}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* tab bar — wraps rather than scrolls; no-data domains are dimmed */}
        <nav className="mt-9">
          <div className="flex flex-wrap gap-x-[30px] border-b border-brass/15">
            <TabButton
              label="Overview"
              active={isOverview}
              enabled
              onClick={() => setTab("overview")}
            />
            {ALL_DOMAINS.map((d) => {
              const enabled = available.includes(d);
              return (
                <TabButton
                  key={d}
                  label={DOMAIN_META[d].label}
                  active={tab === d}
                  enabled={enabled}
                  onClick={enabled ? () => setTab(d) : undefined}
                />
              );
            })}
          </div>
        </nav>

        {/* tab content */}
        <div className="mt-11 min-h-[16rem]">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
            >
              {isOverview && (
                <OverviewTop
                  meta={meta}
                  comparisons={comparisons}
                  regionLabel={regionLabel}
                />
              )}

              {gridMetrics.length > 0 && (
                <section>
                  <div className="eyebrow mb-[18px] tracking-[0.26em] text-chalk-faint">
                    {gridLabel}
                  </div>
                  <DomainPanel metrics={gridMetrics} sources={sources} />
                </section>
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
          <SourcesFooter sources={sources} updated={dossier?.updated ?? null} />
        )}
      </div>
    </main>
  );
}

function TabButton({
  label,
  active,
  enabled,
  onClick,
}: {
  label: string;
  active: boolean;
  enabled: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!enabled}
      aria-current={active ? "page" : undefined}
      className={`-mb-px flex-none border-b-2 px-0.5 pb-4 text-[16px] transition-colors ${
        active
          ? "border-brass font-semibold text-chalk-bright"
          : enabled
            ? "border-transparent font-normal text-chalk-soft hover:text-chalk-bright"
            : "cursor-default border-transparent font-normal text-chalk-mute"
      }`}
    >
      {label}
    </button>
  );
}

function OverviewTop({
  meta,
  comparisons,
  regionLabel,
}: {
  meta: CountryMeta;
  comparisons: Comparison[];
  regionLabel: string | null;
}) {
  return (
    <div
      className={`mb-[54px] ${
        comparisons.length > 0
          ? "lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-12"
          : ""
      }`}
    >
      {/* quick facts */}
      <section className="mb-[54px] lg:mb-0">
        <div className="eyebrow mb-[22px] tracking-[0.26em] text-chalk-faint">Quick facts</div>
        <dl className="grid gap-x-[30px] gap-y-[26px] [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
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
        <Fact
          label="UN member"
          value={meta.unMember == null ? "—" : meta.unMember ? "Yes" : "No"}
        />
        </dl>
      </section>

      {/* how this nation compares */}
      {comparisons.length > 0 && (
        <section>
          <div className="eyebrow mb-[18px] tracking-[0.26em] text-chalk-faint">
            How {meta.name} compares
          </div>
          <div className="rounded-none border border-brass/15 px-[26px]">
            {comparisons.map((c, i) => (
              <ComparisonRow
                key={`${c.domain}-${c.key}`}
                c={c}
                regionLabel={regionLabel}
                last={i === comparisons.length - 1}
              />
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
      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-chalk-faint">
        {label}
      </dt>
      <dd
        className={`mt-2 text-[18px] font-semibold leading-snug ${
          value === "—" ? "text-chalk-mute" : "text-chalk"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

const ordinal = (n: number) => {
  const t = n % 100;
  const s = t >= 11 && t <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `${n}${s}`;
};

function ComparisonRow({
  c,
  regionLabel,
  last,
}: {
  c: Comparison;
  regionLabel: string | null;
  last: boolean;
}) {
  // Fill = how high it ranks worldwide (rank 1 → full bar).
  const fill =
    c.global.total > 1 ? (c.global.total - c.global.rank) / (c.global.total - 1) : 1;
  return (
    <div
      className="py-[22px]"
      style={{
        borderBottom: last ? "1px solid transparent" : "1px solid rgba(216,181,110,0.1)",
      }}
    >
      <div className="mb-[11px] flex items-baseline justify-between gap-3">
        <span className="whitespace-nowrap text-[16px] text-chalk">{c.label}</span>
        <span className="font-display text-[20px] text-chalk-bright">
          {formatMetric(c.value, c.unit)}
        </span>
      </div>
      <div
        className="h-[5px] overflow-hidden rounded-[2px]"
        style={{ background: "rgba(95,119,150,0.22)" }}
      >
        <div
          className="h-full"
          style={{
            width: `${Math.max(3, fill * 100)}%`,
            background: "linear-gradient(90deg,#bf9550,#d8b56e)",
          }}
        />
      </div>
      <div className="mt-[9px] font-mono text-[10px] uppercase tracking-[0.08em] text-chalk-dim">
        {ordinal(c.global.rank)} of {c.global.total} worldwide
        {c.regional && regionLabel && (
          <>
            {" · "}
            {ordinal(c.regional.rank)} of {c.regional.total} in {regionLabel}
          </>
        )}
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
      <div className="mt-[54px] rounded-[8px] border border-brass/15 bg-void-soft/40 px-[34px] py-[26px]">
        <div className="eyebrow tracking-[0.26em] text-chalk-faint">History</div>
        <p className="mt-2 text-[15px] text-chalk-soft">
          The sourced time-journey through {name} is being charted and verified — it will
          arrive complete.
        </p>
      </div>
    );
  }
  return (
    <Link
      href={`/country/${code}/history`}
      className="group mt-[54px] flex items-center justify-between gap-6 rounded-[8px] border border-brass/30 px-[34px] py-[30px] transition-colors hover:border-brass"
      style={{
        background: "linear-gradient(120deg,rgba(191,149,80,0.1),rgba(191,149,80,0.02))",
      }}
    >
      <div className="min-w-0">
        <div className="eyebrow tracking-[0.26em] text-brass">The history journey</div>
        <p className="mt-3 font-display text-[clamp(24px,3vw,34px)] font-[360] leading-tight tracking-[-0.01em] text-parchment">
          {tagline ?? `How ${name} came to be`}
        </p>
        <p className="mt-2 font-serif text-[17px] text-chalk-soft">
          Pilot a cinematic, sourced journey through its eras — moment by moment.
        </p>
      </div>
      <span
        className="grid h-[60px] w-[60px] flex-none place-items-center rounded-full text-[24px] text-[#1a140a] transition-transform group-hover:translate-x-1"
        style={{
          background: "linear-gradient(180deg,#d8b56e,#bf9550)",
          boxShadow: "0 12px 30px -14px rgba(216,181,110,0.8)",
        }}
      >
        →
      </span>
    </Link>
  );
}

function SourcesFooter({
  sources,
  updated,
}: {
  sources: Record<string, DataSource>;
  updated: string | null;
}) {
  return (
    <footer className="mt-16 border-t border-brass/[0.12] pt-8">
      <div className="eyebrow mb-5 tracking-[0.26em] text-chalk-faint">
        Sources &amp; methodology
      </div>
      <ul className="mb-6 flex flex-col gap-[11px]">
        {Object.values(sources).map((s) => (
          <li key={s.id} className="text-[14px] leading-snug text-chalk-soft">
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-reading transition-colors hover:text-brass hover:underline"
            >
              {s.label}
            </a>{" "}
            — {s.publisher} · {s.license} · accessed {s.accessed}
          </li>
        ))}
      </ul>
      {updated && (
        <p className="max-w-[680px] font-serif text-[15px] italic leading-relaxed text-chalk-dim">
          Figures show the latest year with data for each indicator; gaps appear as “—”.
          Disputed and non-UN territories may be partially or wholly absent from these
          datasets. Data last refreshed {updated}.
        </p>
      )}
    </footer>
  );
}
