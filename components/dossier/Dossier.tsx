"use client";

import { useEffect, useMemo, useState } from "react";
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
import { TERRITORY_NOTES } from "@/lib/territory-notes";
import DomainPanel from "./DomainPanel";
import MetricDetail, { type ChartMode } from "./MetricDetail";

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
  const available = useMemo(
    () => (dossier ? ALL_DOMAINS.filter((d) => dossier.sections[d]) : []),
    [dossier],
  );
  const [tab, setTab] = useState<Tab>("overview");
  const sources = dossier?.sources ?? {};
  const isOverview = tab === "overview";

  // ── The shared metric window (one instance, state-owned here so it can drive
  // the URL for shareable deep links) ──────────────────────────────────────
  const metricByKey = useMemo(() => {
    const m = new Map<string, { metric: Metric; domain: DomainKey }>();
    if (dossier) {
      for (const d of available) {
        for (const metric of dossier.sections[d]!.metrics) {
          m.set(metric.key, { metric, domain: d });
        }
      }
    }
    return m;
  }, [dossier, available]);

  const [openMetric, setOpenMetric] = useState<string | null>(null);
  const [lastMetric, setLastMetric] = useState<string | null>(null); // kept for exit anim
  const [compare, setCompare] = useState<string[]>([]);
  const [chartMode, setChartMode] = useState<ChartMode>("value");
  const [mapOpen, setMapOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const openModal = (key: string) => {
    setOpenMetric(key);
    setLastMetric(key);
    setCompare([]);
    setChartMode("value");
    setMapOpen(false);
  };

  // Restore view state from the URL hash on first mount (deep link), then flip
  // `hydrated` so the URL-writer below runs — never clobbering the incoming hash.
  // Must be an effect: URL fragments aren't sent to the server, so SSR can't know.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time external (URL) read */
    const h = window.location.hash;
    if (h.length >= 2) {
      const p = new URLSearchParams(h.slice(1));
      const m = p.get("m");
      const t = p.get("tab") as Tab | null;
      if (t && (t === "overview" || available.includes(t as DomainKey))) setTab(t);
      if (m && metricByKey.has(m)) {
        if (!t) setTab(metricByKey.get(m)!.domain);
        setOpenMetric(m);
        setLastMetric(m);
        const c = p.get("c");
        if (c) setCompare(c.split(",").filter(Boolean));
        if (p.get("v") === "rank") setChartMode("rank");
        if (p.get("map") === "1") setMapOpen(true);
      }
    }
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    // mount-only: dossier/lookup are stable for a given page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // mirror the open window to the URL (clean URL when closed)
  useEffect(() => {
    if (!hydrated) return;
    let hash = "";
    if (openMetric) {
      const p = new URLSearchParams();
      p.set("m", openMetric);
      p.set("tab", tab);
      if (compare.length) p.set("c", compare.join(","));
      if (chartMode === "rank") p.set("v", "rank");
      if (mapOpen) p.set("map", "1");
      hash = "#" + p.toString();
    }
    if (hash !== window.location.hash) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search + hash,
      );
    }
  }, [hydrated, openMetric, tab, compare, chartMode, mapOpen]);

  const openInfo = (openMetric ?? lastMetric)
    ? metricByKey.get((openMetric ?? lastMetric)!) ?? null
    : null;

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
          "radial-gradient(120% 80% at 50% -8%, #0c2e3d 0%, #04161f 46%, #04161f 100%)",
      }}
    >
      <div className="mx-auto max-w-[1340px] px-6 pb-24 pt-9 md:px-10 lg:px-14">
        {/* back to the globe */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 font-mono text-[12px] uppercase tracking-[0.22em] text-chalk-2 transition-colors hover:text-chalk"
        >
          <span className="text-[15px] transition-transform group-hover:-translate-x-0.5">←</span>
          The globe
        </Link>

        {/* header */}
        <header className="mt-8">
          <div className="font-mono text-[12px] uppercase tracking-[0.26em] text-copper sm:ml-[96px]">
            {meta.code}
            {(meta.subregion ?? meta.region) && ` · ${meta.subregion ?? meta.region}`}
            {meta.continent && ` · ${meta.continent}`}
          </div>
          <div className="mt-2 flex items-center gap-[22px]">
            <div className="flex h-[54px] w-[74px] flex-none items-center justify-center text-[34px] leading-none">
              {meta.flag ?? "🏳️"}
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-[clamp(46px,7vw,82px)] font-[350] leading-[0.92] tracking-[-0.02em] text-chalk-hi">
                {meta.name}
              </h1>
              {meta.officialName !== meta.name && (
                <div className="mt-1.5 font-mono text-[13px] tracking-[0.06em] text-chalk-3">
                  {meta.officialName}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* tab bar — wraps rather than scrolls; no-data domains are dimmed */}
        <nav className="mt-9">
          <div className="flex flex-wrap gap-x-[30px] border-b border-copper/15">
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
                  <div className="eyebrow mb-[18px] tracking-[0.26em] text-chalk-3">
                    {gridLabel}
                  </div>
                  <DomainPanel
                    metrics={gridMetrics}
                    sources={sources}
                    onOpenMetric={openModal}
                  />
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

      {/* the shared metric window */}
      {openInfo && (
        <MetricDetail
          open={openMetric != null}
          onClose={() => setOpenMetric(null)}
          metric={openInfo.metric}
          source={sources[openInfo.metric.sourceId]}
          country={{ code: meta.code, name: meta.name, flag: meta.flag }}
          compare={compare}
          onCompareChange={setCompare}
          mode={chartMode}
          onModeChange={setChartMode}
          mapOpen={mapOpen}
          onMapToggle={() => setMapOpen((v) => !v)}
        />
      )}
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
      className={`relative -mb-px flex-none px-0.5 pb-4 text-[16px] transition-colors ${
        active
          ? "font-semibold text-chalk-hi"
          : enabled
            ? "font-normal text-chalk-2 hover:text-chalk-hi"
            : "cursor-default font-normal text-chalk-5"
      }`}
    >
      {label}
      {/* The active tab sits on the stratum rule rather than a plain underline
          — the same banded device that draws the globe's shelf halo and the
          journey's era bands. One signature, everywhere it can carry. */}
      {active && (
        <span
          aria-hidden
          className="stratum-rule absolute inset-x-0 -bottom-[3px]"
        />
      )}
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
  const note = TERRITORY_NOTES[meta.code];
  return (
    <>
      {note && (
        <div className="mb-[40px] rounded-[4px] border border-copper/15 bg-copper/[0.04] px-[18px] py-3.5">
          <div className="eyebrow tracking-[0.26em] text-chalk-3">Territory</div>
          <p className="mt-2 text-[14px] leading-relaxed text-chalk-2">
            {note.text}
            {note.source && (
              <>
                {" · "}
                <a
                  href={note.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-chalk-read underline-offset-2 transition-colors hover:text-copper hover:underline"
                >
                  {note.source.label}
                </a>
              </>
            )}
          </p>
        </div>
      )}
      <div
        className={`mb-[54px] ${
          comparisons.length > 0
            ? "lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-12"
            : ""
        }`}
      >
      {/* quick facts */}
      <section className="mb-[54px] lg:mb-0">
        <div className="eyebrow mb-[22px] tracking-[0.26em] text-chalk-3">Quick facts</div>
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
          <div className="eyebrow mb-[18px] tracking-[0.26em] text-chalk-3">
            How {meta.name} compares
          </div>
          <div className="rounded-none border border-copper/15 px-[26px]">
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
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-chalk-3">
        {label}
      </dt>
      <dd
        className={`mt-2 text-[18px] font-semibold leading-snug ${
          value === "—" ? "text-chalk-5" : "text-chalk"
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
        borderBottom: last ? "1px solid transparent" : "1px solid rgba(227, 154, 103,0.1)",
      }}
    >
      <div className="mb-[11px] flex items-baseline justify-between gap-3">
        <span className="whitespace-nowrap text-[16px] text-chalk">{c.label}</span>
        <span className="font-display text-[20px] text-chalk-hi">
          {formatMetric(c.value, c.unit)}
        </span>
      </div>
      {/* Verdigris, not copper. In this palette copper means "the surveyor's
          hand — you are here" (selection, the playhead, links) and verdigris
          means "the measured". A rank bar is measured data, so it is verdigris;
          using the selection colour here would make every bar look like a
          selected state and leave the palette with no way to say "measured". */}
      <div
        className="h-[5px] overflow-hidden rounded-[2px]"
        style={{ background: "rgba(39,111,128,0.24)" }}
      >
        <div
          className="h-full"
          style={{
            width: `${Math.max(3, fill * 100)}%`,
            background: "linear-gradient(90deg,#2f6e62,#7cc4b3)",
          }}
        />
      </div>
      <div className="mt-[9px] font-mono text-[10px] uppercase tracking-[0.08em] text-chalk-4">
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
      <div className="mt-[54px] rounded-[8px] border border-copper/15 bg-depth-5/40 px-[34px] py-[26px]">
        <div className="eyebrow tracking-[0.26em] text-chalk-3">History</div>
        <p className="mt-2 text-[15px] text-chalk-2">
          The sourced time-journey through {name} is being charted and verified — it will
          arrive complete.
        </p>
      </div>
    );
  }
  return (
    <div className="mt-[54px]">
    <Link
      href={`/country/${code}/history`}
      className="group flex items-center justify-between gap-6 rounded-[8px] border border-copper/30 px-[34px] py-[30px] transition-colors hover:border-copper"
      style={{
        background: "linear-gradient(120deg,rgba(200, 114, 68,0.1),rgba(200, 114, 68,0.02))",
      }}
    >
      <div className="min-w-0">
        <div className="eyebrow tracking-[0.26em] text-copper">The history journey</div>
        <p className="mt-3 font-display text-[clamp(24px,3vw,34px)] font-[360] leading-tight tracking-[-0.01em] text-land-0">
          {tagline ?? `How ${name} came to be`}
        </p>
        <p className="mt-2 font-serif text-[17px] text-chalk-2">
          Pilot a cinematic, sourced journey through its eras — moment by moment.
        </p>
      </div>
      <span
        className="grid h-[60px] w-[60px] flex-none place-items-center rounded-full text-[24px] text-[#04161f] transition-transform group-hover:translate-x-1"
        style={{
          background: "linear-gradient(180deg,#e39a67,#c87244)",
          boxShadow: "0 12px 30px -14px rgba(227, 154, 103,0.8)",
        }}
      >
        →
      </span>
    </Link>

      {/* The reading depth. The journey above is the experience; this is the
          same sourced material as one long-form document — and the version
          search engines and answer engines can actually read. */}
      <Link
        href={`/country/${code}/chronicle`}
        className="group mt-3 flex items-center justify-between gap-4 rounded-[8px] border border-copper/[0.14] px-[34px] py-[18px] transition-colors hover:border-copper/40 hover:bg-copper/[0.04]"
      >
        <span className="min-w-0">
          <span className="eyebrow block tracking-[0.26em] text-chalk-3">
            Prefer to read?
          </span>
          <span className="mt-1.5 block font-serif text-[16px] text-chalk-2">
            The full chronicle of {name} — every era, event and reference on one page.
          </span>
        </span>
        <span className="flex-none font-mono text-[13px] text-copper transition-transform group-hover:translate-x-0.5">
          →
        </span>
      </Link>
    </div>
  );
}

/**
 * The visible data-vintage stamp.
 *
 * A reference site that shows a number without saying how old it is is asking to
 * be trusted on faith. The vintage was previously only mentioned in a sentence of
 * italic prose at the very bottom of the footer, which is the same as not saying
 * it. This puts the originating publishers and the refresh month where a reader
 * meets them: one line, monospace, above the citations it summarises.
 *
 * Publishers are de-duplicated across the "X / World Bank" redistribution pairs —
 * a reader wants to know the data came from SIPRI and ITU, not that the World Bank
 * appears in four source records.
 */
function vintageStamp(
  sources: Record<string, DataSource>,
  updated: string | null,
): string | null {
  const list = Object.values(sources);
  if (!list.length || !updated) return null;

  // "SIPRI / World Bank" → the originator is the first segment. World Bank is kept
  // only when it is a source's sole publisher (i.e. WDI itself).
  const names = new Set<string>();
  for (const s of list) {
    const first = s.publisher.split("/")[0].trim();
    names.add(first === "World Bank" ? "World Bank WDI" : first);
  }

  const vintage = updated.slice(0, 7); // YYYY-MM
  return `Data: ${[...names].join(" · ")} — ${vintage} vintage`;
}

function SourcesFooter({
  sources,
  updated,
}: {
  sources: Record<string, DataSource>;
  updated: string | null;
}) {
  const stamp = vintageStamp(sources, updated);

  return (
    <footer className="mt-16 border-t border-copper/[0.12] pt-8">
      <div className="eyebrow mb-5 tracking-[0.26em] text-chalk-3">
        Sources &amp; methodology
      </div>
      {stamp && (
        <p className="mb-5 font-mono text-[12px] leading-relaxed tracking-[0.04em] text-copper">
          {stamp}
        </p>
      )}
      <ul className="mb-6 flex flex-col gap-[11px]">
        {Object.values(sources).map((s) => (
          <li key={s.id} className="text-[14px] leading-snug text-chalk-2">
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-chalk-read transition-colors hover:text-copper hover:underline"
            >
              {s.label}
            </a>{" "}
            — {s.publisher} · {s.license} · accessed {s.accessed}
          </li>
        ))}
      </ul>
      <p className="max-w-[680px] font-serif text-[15px] italic leading-relaxed text-chalk-4">
        Figures show the latest year with data for each indicator; gaps appear as “—”
        rather than being estimated. Disputed and non-UN territories may be partially or
        wholly absent from these datasets.
      </p>
    </footer>
  );
}
