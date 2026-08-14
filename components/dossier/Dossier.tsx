"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type {
  CountryDossier,
  CountryMeta,
  DataSource,
  DomainKey,
  Metric,
} from "@/lib/types";
import { DOMAIN_META } from "@/lib/types";
import { formatPopulation, formatArea, formatMetric } from "@/lib/format";
import { METRIC_DEFS } from "@/lib/metric-defs";
import { NO_DATA_NOTES, TERRITORY_NOTES } from "@/lib/territory-notes";
import dynamic from "next/dynamic";
import ProofFlip from "@/components/strata/ProofFlip";
import ProofBack from "@/components/strata/ProofBack";
import { type ChartMode } from "./MetricDetail";

// The metric window (chart · rank · map) is a reader's second step, never the
// first paint — it loads on demand, keeping the window's chart/map/picker
// code out of the nation page's initial bundle.
const MetricDetail = dynamic(() => import("./MetricDetail"), { ssr: false });
import { annotationsForSeries } from "@/lib/annotations";
import type { EventAnnotation } from "@/lib/annotations";

/* ── The nation page — a section cut through one nation ─────────────────────
   History lies in ERA BEDS (newest at the top, oldest at the bottom — depth
   = time, down is older, always); the data dossier is pinned to the face of
   the cut as SPECIMEN rows, every one flipping to its observation label; the
   header owns the CORE-PULL: drag down to extract the whole history as a
   core sample, tap a band to land in its era on the chronicle.

   The metric window (chart · world rank · map) stays URL-addressed:
   #m=<key>&tab=<domain>&c=<codes>&v=rank&map=1 — the contract rankings and
   commodities pages deep-link against. */

export interface EraBed {
  id: string;
  title: string;
  period: string;
  count: number;
  headline: { yearLabel: string; title: string; refs: number }[];
}

const ALL_DOMAINS = Object.keys(DOMAIN_META) as DomainKey[];

// The bed walk, newest era downward. Ground + proven text pair per DESIGN.md §2.
const BED_WALK = [
  { bg: "var(--color-sand)", title: "var(--color-basalt)", sub: "var(--color-umber)" },
  { bg: "var(--color-clay)", title: "var(--color-basalt)", sub: "var(--color-basalt)" },
  { bg: "var(--color-oxide)", title: "var(--color-bone)", sub: "var(--color-bone)" },
  { bg: "var(--color-umber)", title: "var(--color-bone)", sub: "var(--color-sand)" },
  { bg: "var(--color-umber-deep)", title: "var(--color-bone)", sub: "var(--color-sand)" },
  { bg: "var(--color-basalt)", title: "var(--color-bone)", sub: "var(--color-clay)" },
];

const shortYear = (y: number | null) =>
  y == null ? "—" : "’" + String(y).slice(2).padStart(2, "0");

function coordLine(latlng: [number, number] | null): string | null {
  if (!latlng) return null;
  const [lat, lng] = latlng;
  return `${Math.abs(lat).toFixed(1)}${lat >= 0 ? "N" : "S"} ${Math.abs(lng).toFixed(1)}${lng >= 0 ? "E" : "W"}`;
}

export default function Dossier({
  meta,
  dossier,
  eraBeds,
  eventsTotal,
  founding,
  annotations,
}: {
  meta: CountryMeta;
  dossier: CountryDossier | null;
  eraBeds: EraBed[];
  eventsTotal: number;
  founding: string | null;
  /** This nation's chronicle moments, for annotating metric series. */
  annotations: EventAnnotation[];
}) {
  const available = useMemo(
    () => (dossier ? ALL_DOMAINS.filter((d) => dossier.sections[d]) : []),
    [dossier],
  );
  const sources = dossier?.sources ?? {};
  const hasHistory = eraBeds.length > 0;

  // ── The shared metric window ──────────────────────────────────────────────
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
  const [allProof, setAllProof] = useState(false);

  const openModal = (key: string) => {
    setOpenMetric(key);
    setLastMetric(key);
    setCompare([]);
    setChartMode("value");
    setMapOpen(false);
  };

  // Restore view state from the URL hash on first mount (deep link), then flip
  // `hydrated` so the URL-writer below runs — never clobbering the incoming hash.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time external (URL) read */
    const h = window.location.hash;
    if (h.length >= 2) {
      const p = new URLSearchParams(h.slice(1));
      const m = p.get("m");
      if (m && metricByKey.has(m)) {
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
      p.set("tab", metricByKey.get(openMetric)?.domain ?? "overview");
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
  }, [hydrated, openMetric, compare, chartMode, mapOpen, metricByKey]);

  const openInfo = (openMetric ?? lastMetric)
    ? metricByKey.get((openMetric ?? lastMetric)!) ?? null
    : null;

  // Cross-talk: the chronicle moments inside THIS metric's own series span.
  const openAnnotations = useMemo(() => {
    if (!openInfo?.metric.series?.length || !annotations.length) return [];
    const years = openInfo.metric.series.map((d) => d.year);
    return annotationsForSeries(
      annotations,
      openInfo.domain,
      Math.min(...years),
      Math.max(...years),
    ).map((a) => ({
      year: a.year,
      yearLabel: a.yearLabel,
      title: a.title,
      tint: a.tint,
      href: `/country/${meta.code}/chronicle#${a.eraId}`,
    }));
  }, [openInfo, annotations, meta.code]);

  // ── The core-pull (contract physics: 0.5× resistance, 90px commit, 460ms;
  // the header owns the gesture and arms only at the very top of the page) ──
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [coreOpen, setCoreOpen] = useState(false);
  const dragRef = useRef<{ y0: number; live: boolean }>({ y0: 0, live: false });

  const coreDown = (e: React.PointerEvent) => {
    if (!hasHistory || window.scrollY > 4) return;
    dragRef.current = { y0: e.clientY, live: true };
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDragging(true);
  };
  const coreMove = (e: React.PointerEvent) => {
    if (!dragRef.current.live) return;
    e.preventDefault();
    const dy = Math.max(0, (e.clientY - dragRef.current.y0) * 0.5);
    setPull(Math.min(dy, 300));
  };
  const coreUp = () => {
    if (!dragRef.current.live) return;
    dragRef.current.live = false;
    setCoreOpen(pull > 90);
    setDragging(false);
    setPull(0);
  };

  const domainsLine = [
    coordLine(meta.latlng),
    hasHistory ? `${eventsTotal} EVENTS` : null,
    available.length ? `${available.length} DOMAINS` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const territory = TERRITORY_NOTES[meta.code];

  return (
    <main className="min-h-screen overflow-x-hidden bg-bone">
      {/* ── header — owns the core-pull ── */}
      <div
        onPointerDown={coreDown}
        onPointerMove={coreMove}
        onPointerUp={coreUp}
        onPointerCancel={coreUp}
        className="settle select-none"
        style={hasHistory ? { touchAction: "none", cursor: "grab" } : undefined}
      >
        <div className="mount mx-auto max-w-5xl px-5 pt-4">
          <span aria-hidden className="mount-rail" />
          <span aria-hidden className="mount-tick">
            <span>SPECIMEN {meta.code}</span>
          </span>
          <Link
            href="/atlas"
            className="inline-block py-1.5 font-mono text-[10px] tracking-[0.16em] text-oxide"
          >
            ← THE SECTION CUT{meta.continent ? ` · ${meta.continent.toUpperCase()}` : ""}
          </Link>
          <div className="mt-1 flex items-start justify-between gap-4 lg:max-w-[46rem]">
            <div className="min-w-0">
              <h1 className="font-display text-[52px] leading-none font-extrabold tracking-tight break-words uppercase md:text-[72px]">
                {meta.name}
              </h1>
              {domainsLine && (
                <div className="mt-2 font-mono text-[11px] text-oxide">{domainsLine}</div>
              )}
              {founding && (
                <div className="mt-1 font-mono text-[10px] text-umber">
                  {founding.toUpperCase()}
                </div>
              )}
            </div>
            {/* the mini core — the nation's whole history in one column */}
            {hasHistory && (
              <div
                aria-hidden
                className="mt-1.5 flex w-[30px] flex-none flex-col border-2 border-basalt"
              >
                {eraBeds.map((era, i) => (
                  <div
                    key={era.id}
                    style={{
                      height: Math.max(9, Math.round((era.count / eventsTotal) * 100)),
                      background: BED_WALK[i % BED_WALK.length].bg,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          {hasHistory && (
            <div className="pt-2.5 pb-3 font-mono text-[10px] text-umber">
              ▼ PULL DOWN TO EXTRACT THE CORE
            </div>
          )}
          {!hasHistory && <div className="pb-3" />}
        </div>
      </div>

      {/* ── the era beds — newest first, downward into time ── */}
      {eraBeds.map((era, i) => {
        const w = BED_WALK[i % BED_WALK.length];
        return (
          <Link
            key={era.id}
            href={`/country/${meta.code}/chronicle#${era.id}`}
            prefetch={false}
            className="bed settle pressable block"
            style={{
              background: w.bg,
              ["--settle-delay" as string]: `${Math.min((i + 1) * 60, 420)}ms`,
            }}
          >
            <div className="mount mx-auto max-w-5xl px-5 py-[14px]">
              {/* The mounted core (E12): the era's years move to the margin
                  tick at desktop — the depth scale of the nation's own cut. */}
              <span aria-hidden className="mount-rail" style={{ ["--rail" as string]: w.title }} />
              <span aria-hidden className="mount-tick">
                <span style={{ color: w.sub }}>{era.period}</span>
              </span>
              <div className="lg:max-w-[46rem]">
                <div className="flex items-baseline justify-between gap-3">
                  <div
                    className="font-display text-[17px] font-extrabold tracking-tight uppercase md:text-[19px]"
                    style={{ color: w.title }}
                  >
                    <span className="lg:sr-only">{era.period} · </span>
                    {era.title}
                  </div>
                  <div className="flex-none font-mono text-[10px]" style={{ color: w.sub }}>
                    {era.count} EVENTS
                  </div>
                </div>
                {era.headline.map((e) => (
                  <div
                    key={`${e.yearLabel}-${e.title}`}
                    className="mt-1.5 font-sans text-[14.5px]"
                    style={{ color: w.title }}
                  >
                    {e.yearLabel} · {e.title}{" "}
                    <span className="font-mono text-[9.5px]" style={{ color: w.sub }}>
                      {e.refs} {e.refs === 1 ? "REF" : "REFS"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Link>
        );
      })}

      {/* ── the reading depth ── */}
      {hasHistory ? (
        <Link
          href={`/country/${meta.code}/chronicle`}
          prefetch={false}
          className="bed settle pressable block"
          style={{ ["--settle-delay" as string]: "420ms" }}
        >
          <div className="mount mx-auto max-w-5xl px-5 py-4">
            <span aria-hidden className="mount-rail" />
            <span aria-hidden className="mount-tick">
              <span>THE READING DEPTH</span>
            </span>
            <div className="flex items-center justify-between lg:max-w-[46rem]">
              <div>
                <div className="font-display text-[20px] font-extrabold tracking-tight uppercase">
                  Read the chronicle
                </div>
                <div className="mt-1 font-mono text-[10px] text-umber">
                  EVERY ERA, EVENT AND REFERENCE ON ONE PAGE
                </div>
              </div>
              <div className="font-mono text-[15px] text-oxide">↓</div>
            </div>
          </div>
        </Link>
      ) : (
        <div className="bed">
          <div className="mount mx-auto max-w-5xl px-5 py-4">
            <span aria-hidden className="mount-rail" />
            <div className="eyebrow text-umber">History</div>
            <p className="mt-2 max-w-xl font-sans text-[14.5px] text-umber">
              The sourced chronicle of {meta.name} is being charted and verified — it will
              arrive complete.
            </p>
          </div>
        </div>
      )}

      {/* ── quick facts — the atlas' own reference bed ── */}
      <section className="bed bg-sand">
        <div className="mount mx-auto max-w-5xl px-5 py-4">
          <span aria-hidden className="mount-rail" />
          <span aria-hidden className="mount-tick">
            <span>ATLAS REF</span>
          </span>
          <div className="eyebrow text-umber">Quick facts · atlas reference</div>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4 lg:max-w-[46rem]">
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
        </div>
      </section>

      {territory && (
        <section className="bed">
          <div className="mount mx-auto max-w-5xl px-5 py-4">
            <span aria-hidden className="mount-rail" />
            <div className="eyebrow text-umber">Territory</div>
            <p className="mt-2 max-w-2xl font-sans text-[14px] leading-relaxed">
              {territory.text}
              {territory.source && (
                <>
                  {" · "}
                  <a
                    href={territory.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-oxide underline underline-offset-2"
                  >
                    {territory.source.label}
                  </a>
                </>
              )}
            </p>
          </div>
        </section>
      )}

      {/* ── the dossier — specimen rows ── */}
      {available.length > 0 && (
        <section className="bed">
          {/* Data earns width (E12): the specimen columns fill the mounted
              tray — each column lands near the contract's native 390px. */}
          <div className="mount mx-auto max-w-5xl px-5 pt-4 pb-6">
            <span aria-hidden className="mount-rail" />
            <span aria-hidden className="mount-tick">
              <span>
                DATA · {available.length} {available.length === 1 ? "DOMAIN" : "DOMAINS"}
              </span>
            </span>
            <div className="flex items-baseline justify-between">
              <div className="eyebrow text-umber">
                Dossier · press a specimen — it turns over
              </div>
              <button
                type="button"
                onClick={() => setAllProof((v) => !v)}
                className="pressable py-1 pl-3 font-mono text-[10px] tracking-[0.08em] text-oxide"
              >
                {allProof ? "CLOSE PROOFS ⟲" : "PROOF VIEW ⟲"}
              </button>
            </div>

            <div className="md:columns-2 md:gap-10">
              {available.map((d) => {
                const section = dossier!.sections[d]!;
                return (
                  <div key={d} className="mt-5 break-inside-avoid">
                    <h2 className="font-display text-[15px] font-extrabold tracking-tight uppercase">
                      {DOMAIN_META[d].label}
                    </h2>
                    <div className="mt-1.5">
                      {section.metrics.map((m) => (
                        <SpecimenRow
                          key={m.key}
                          metric={m}
                          source={sources[m.sourceId]}
                          forced={allProof}
                          onChart={m.series && m.series.length > 1 ? () => openModal(m.key) : undefined}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-5 max-w-2xl font-sans text-xs text-umber">
              A hatched gap has no underside — there is nothing to turn over. Absence is
              stated, never zeroed.
            </p>
          </div>
        </section>
      )}

      {available.length === 0 && <NoSeriesState meta={meta} />}

      {/* ── sources ── */}
      {Object.keys(sources).length > 0 && (
        <SourcesFooter sources={sources} updated={dossier?.updated ?? null} />
      )}

      <div className="cut-rule" />
      <footer className="mount mx-auto max-w-5xl px-5 pt-[14px] pb-6">
        <span aria-hidden className="mount-rail" />
        <div className="flex justify-between font-mono text-[10px] text-umber lg:max-w-[46rem]">
          <div>EVERY CLAIM SOURCED</div>
          <div>ABSENCE ≠ ZERO</div>
          <div>NO SIDES</div>
        </div>
      </footer>

      {/* ── the extracted core ── */}
      {hasHistory && (
        <div
          aria-hidden={!coreOpen}
          className="fixed inset-x-0 top-0 z-40 mx-auto flex h-dvh w-full max-w-5xl flex-col bg-basalt"
          style={{
            transform: coreOpen ? "translateY(0)" : `translateY(calc(-100% + ${pull}px))`,
            transition: dragging ? "none" : "transform var(--dur-core) var(--ease-mass)",
          }}
        >
          <div className="flex items-center justify-between px-5 pt-[18px] pb-3">
            <div>
              <div className="font-display text-[22px] font-extrabold tracking-tight text-bone uppercase">
                Core sample — {meta.name}
              </div>
              <div className="mt-1 font-mono text-[10px] text-clay">
                TAP A BAND TO LAND IN ITS ERA
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCoreOpen(false)}
              tabIndex={coreOpen ? 0 : -1}
              className="pressable border-2 border-bone px-3 py-2 font-mono text-[11px] text-bone"
            >
              PUSH BACK ▲
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col">
            {eraBeds.map((era, i) => {
              const w = BED_WALK[i % BED_WALK.length];
              return (
                <Link
                  key={era.id}
                  href={`/country/${meta.code}/chronicle#${era.id}`}
                  prefetch={false}
                  tabIndex={coreOpen ? 0 : -1}
                  className="flex items-center justify-between border-t-2 border-basalt px-5"
                  style={{ flex: Math.max(era.count, 6), background: w.bg }}
                >
                  <span
                    className="font-display text-[15px] font-extrabold tracking-tight uppercase md:text-[16px]"
                    style={{ color: w.title }}
                  >
                    {era.title} · {era.period}
                  </span>
                  <span className="font-mono text-[10px]" style={{ color: w.sub }}>
                    {era.count} EVENTS
                  </span>
                </Link>
              );
            })}
          </div>
          <div className="px-5 pt-3 pb-5 font-mono text-[9px] tracking-[0.12em] text-clay">
            BAND THICKNESS ∝ RECORDED EVENTS · DEPTH = TIME
          </div>
        </div>
      )}

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
          annotations={openAnnotations}
          mode={chartMode}
          onModeChange={setChartMode}
          mapOpen={mapOpen}
          onMapToggle={() => setMapOpen((v) => !v)}
        />
      )}
    </main>
  );
}

/* ── one specimen — the universal proof-flip row ───────────────────────────── */
function SpecimenRow({
  metric,
  source,
  forced,
  onChart,
}: {
  metric: Metric;
  source?: DataSource;
  forced: boolean;
  onChart?: () => void;
}) {
  const observed = metric.value != null;
  if (!observed) {
    return (
      <div className="flex items-center justify-between gap-3 border-b-2 border-basalt py-[9px]">
        <div className="min-w-0 truncate font-sans text-[14.5px] font-medium text-umber">
          {metric.label}
        </div>
        <div className="not-observed flex-none">NOT OBSERVED</div>
      </div>
    );
  }
  const srcId = metric.sourceId.toUpperCase();
  const def = METRIC_DEFS[metric.key];
  return (
    <div className="flex items-stretch border-b-2 border-basalt">
      <ProofFlip
        height={54}
        forced={forced}
        className="min-w-0 flex-1"
        ariaLabel={`${metric.label}: ${formatMetric(metric.value, metric.unit)}, observed ${metric.year ?? "year unknown"}, source ${source?.label ?? metric.sourceId}`}
        front={
          <div className="flex h-full items-center justify-between gap-3">
            <div className="min-w-0 truncate font-sans text-[14.5px] font-medium">
              {metric.label}
            </div>
            <div className="flex flex-none items-center gap-2 font-mono text-[13px]">
              {formatMetric(metric.value, metric.unit)}
              <span className="pill">
                {shortYear(metric.year)} {srcId}
              </span>
            </div>
          </div>
        }
        back={
          <ProofBack
            line={`OBSERVED ${metric.year ?? "—"} · ${srcId}${source ? ` — ${source.publisher}` : ""}`}
            note={def}
            padding="0 8px"
          />
        }
      />
      {onChart && (
        <button
          type="button"
          onClick={onChart}
          aria-label={`${metric.label} — series, world rank and map`}
          className="pressable -my-px ml-2 w-9 flex-none self-center border-2 border-basalt py-1.5 font-mono text-[12px] text-oxide"
        >
          →
        </button>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] tracking-[0.16em] text-umber uppercase">{label}</dt>
      <dd
        className={`mt-1 font-sans text-[15px] leading-snug font-medium ${
          value === "—" ? "text-umber" : "text-basalt"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * The designed empty state for the codes with no statistical series: the
 * reasons are not interchangeable (a continent with no government is not a
 * state recognised by one UN member), so each is named.
 */
function NoSeriesState({ meta }: { meta: CountryMeta }) {
  const note = NO_DATA_NOTES[meta.code];
  return (
    <section className="bed">
      <div className="mount mx-auto max-w-5xl px-5 py-5">
        <span aria-hidden className="mount-rail" />
        <h2 className="max-w-2xl font-display text-[20px] leading-tight font-extrabold tracking-tight uppercase">
          No independent statistical series meets the sourcing bar yet
        </h2>
        <p className="mt-3 max-w-2xl font-sans text-[14.5px] leading-relaxed">
          {note ??
            `No publisher this atlas draws on reports the economic, social or environmental series for ${meta.name} as a separate entity.`}
        </p>
        <p className="mt-3 max-w-2xl font-sans text-[13px] leading-relaxed text-umber">
          Every figure in a Terralore dossier carries the publisher that produced it and the
          year it refers to. Where no such figure exists the gap is recorded rather than
          estimated — an imputed number is indistinguishable from a sourced one once it is
          rendered in the same row, and that would make the whole dossier un-citable. What is
          above — capital, population, area, languages, currency — comes from the atlas&apos;
          own reference dataset. It is a smaller claim, honestly made.
        </p>
      </div>
    </section>
  );
}

/** The visible data-vintage stamp — publishers + refresh month, one mono line. */
function vintageStamp(
  sources: Record<string, DataSource>,
  updated: string | null,
): string | null {
  const list = Object.values(sources);
  if (!list.length || !updated) return null;
  const names = new Set<string>();
  for (const s of list) {
    const first = s.publisher.split("/")[0].trim();
    names.add(first === "World Bank" ? "World Bank WDI" : first);
  }
  const vintage = updated.slice(0, 7); // YYYY-MM
  return `DATA: ${[...names].join(" · ")} — ${vintage} VINTAGE`;
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
    <footer className="bed">
      <div className="mount mx-auto max-w-5xl px-5 py-4">
        <span aria-hidden className="mount-rail" />
        <span aria-hidden className="mount-tick">
          <span>SOURCES</span>
        </span>
        <div className="eyebrow text-umber">Sources &amp; methodology</div>
        {stamp && <p className="mt-2 font-mono text-[11px] text-oxide">{stamp}</p>}
        <ul className="mt-3 flex flex-col gap-2">
          {Object.values(sources).map((s) => (
            <li key={s.id} className="font-sans text-[13.5px] leading-snug">
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-oxide underline underline-offset-2"
              >
                {s.label}
              </a>{" "}
              <span className="text-umber">
                — {s.publisher} · {s.license} · accessed {s.accessed}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-2xl font-sans text-xs leading-relaxed text-umber">
          Figures show the latest year with data for each indicator; gaps appear as hatched
          marks rather than being estimated. Disputed and non-UN territories may be partially
          or wholly absent from these datasets.
        </p>
      </div>
    </footer>
  );
}
