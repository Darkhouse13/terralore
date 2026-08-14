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

   ≥1024px this is THE BENCH (P4 contract §2): the core is permanently
   extracted as the sticky left rail — clickable era navigation, a basalt
   notch marking the active bed — because a bench doesn't need a pull
   gesture; the beds run in the middle column and the dossier becomes the
   SPECIMEN BENCH. At 1024 the bench drops below the beds (the rail stays);
   from 1280 it stands as the right column (P4 E5). The core-pull remains
   the phone's gesture, armed only below 1024px.

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
  // the header owns the gesture and arms only at the very top of the page).
  // Phone-only: at ≥1024px the core is already on the bench (P4 §2). ──
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [coreOpen, setCoreOpen] = useState(false);
  const dragRef = useRef<{ y0: number; live: boolean }>({ y0: 0, live: false });

  // The bench rail's active bed — the basalt notch (P4 §2).
  const [selEra, setSelEra] = useState(0);
  const pickEra = (i: number) => {
    setSelEra(i);
    document.getElementById(`bed-${eraBeds[i].id}`)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  };

  const coreDown = (e: React.PointerEvent) => {
    if (!hasHistory || window.scrollY > 4) return;
    if (window.matchMedia("(min-width: 64rem)").matches) return;
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

  // The bench grid (P4). A nation without a charted history has no core to
  // extract — its rail column collapses and the bench moves one track left.
  const benchGrid = hasHistory
    ? "lg:mx-auto lg:grid lg:max-w-[1760px] lg:grid-cols-[120px_minmax(0,1fr)] xl:grid-cols-[120px_minmax(0,1fr)_440px]"
    : "lg:mx-auto lg:grid lg:max-w-[1760px] lg:grid-cols-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_440px]";
  const benchMainCol = hasHistory ? "lg:col-start-2" : "lg:col-start-1";
  const benchAsideCol = hasHistory
    ? "lg:col-start-2 lg:row-start-2 xl:col-start-3 xl:[grid-row:1/span_2]"
    : "lg:col-start-1 lg:row-start-2 xl:col-start-2 xl:[grid-row:1/span_2]";

  return (
    // overflow-x-CLIP, not hidden: clip does not mint a scroll container,
    // so the bench rail's position:sticky tracks the viewport.
    <main className="min-h-screen overflow-x-clip bg-bone">
      {/* THE BENCH (P4): the frame, then rules-as-columns — the core rail,
          the cut, and (from 1280) the specimen bench. */}
      <div className={benchGrid}>
        {/* ── the core, already extracted — the bench's left rail ── */}
        {hasHistory && (
          <div className="hidden lg:col-start-1 lg:block lg:border-r-2 lg:border-basalt lg:[grid-row:1/span_3] xl:[grid-row:1/span_2]">
            <div className="sticky top-0 flex h-dvh flex-col">
              <div className="border-b-2 border-basalt px-1.5 py-3 text-center font-mono text-[9px] leading-relaxed tracking-[0.14em] text-umber">
                CORE —
                <br />
                EXTRACTED
              </div>
              {eraBeds.map((era, i) => {
                const w = BED_WALK[i % BED_WALK.length];
                return (
                  <button
                    key={era.id}
                    type="button"
                    onClick={() => pickEra(i)}
                    aria-label={`${era.title} — ${era.period}, ${era.count} events`}
                    aria-current={selEra === i ? "true" : undefined}
                    className="flex min-h-0 items-center justify-center overflow-hidden border-b-2 border-basalt"
                    style={{
                      flex: Math.max(era.count, 6),
                      background: w.bg,
                      borderLeft:
                        selEra === i
                          ? "6px solid var(--color-basalt)"
                          : "6px solid transparent",
                    }}
                  >
                    <span
                      className="max-h-full truncate font-mono text-[9.5px] tracking-[0.14em] uppercase [writing-mode:vertical-rl]"
                      style={{ color: w.sub }}
                    >
                      {era.title} · {era.count}
                    </span>
                  </button>
                );
              })}
              <div className="px-1.5 pt-2.5 pb-3 text-center font-mono text-[8.5px] leading-relaxed tracking-[0.1em] text-umber">
                THICKNESS ∝ EVENTS
              </div>
            </div>
          </div>
        )}

        {/* ── the cut — header + era beds + the atlas' own beds ── */}
        <div className={`${benchMainCol} lg:row-start-1 lg:min-w-0`}>
      {/* ── header — owns the core-pull (phone only) ── */}
      <div
        onPointerDown={coreDown}
        onPointerMove={coreMove}
        onPointerUp={coreUp}
        onPointerCancel={coreUp}
        className={`settle select-none${hasHistory ? " core-grab" : ""}`}
      >
        <div className="mx-auto max-w-5xl px-5 pt-4 lg:mx-0 lg:max-w-none lg:px-9 lg:pt-6 lg:pb-5">
          <Link
            href="/atlas"
            className="inline-block py-1.5 font-mono text-[10px] tracking-[0.16em] text-oxide"
          >
            ← THE SECTION CUT{meta.continent ? ` · ${meta.continent.toUpperCase()}` : ""}
          </Link>
          <div className="mt-1 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display text-[52px] leading-none font-extrabold tracking-tight break-words uppercase md:text-[72px] lg:text-[76px]">
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
            {/* the mini core — the phone's glance at the column; the bench
                rail replaces it at width */}
            {hasHistory && (
              <div
                aria-hidden
                className="mt-1.5 flex w-[30px] flex-none flex-col border-2 border-basalt lg:hidden"
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
            <div className="pt-2.5 pb-3 font-mono text-[10px] text-umber lg:hidden">
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
            id={`bed-${era.id}`}
            href={`/country/${meta.code}/chronicle#${era.id}`}
            prefetch={false}
            className="bed settle pressable block"
            style={{
              background: w.bg,
              ["--settle-delay" as string]: `${Math.min((i + 1) * 60, 420)}ms`,
            }}
          >
            <div className="mx-auto max-w-5xl px-5 py-[14px] lg:mx-0 lg:max-w-none lg:px-9 lg:py-4">
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <div
                    className="font-display text-[17px] font-extrabold tracking-tight uppercase md:text-[19px]"
                    style={{ color: w.title }}
                  >
                    <span>{era.period} · </span>
                    {era.title}
                    {selEra === i && (
                      <span className="hidden font-mono text-[10px] font-normal tracking-[0.08em] lg:inline">
                        {" "}
                        ◄ FROM THE CORE
                      </span>
                    )}
                  </div>
                  <div className="flex-none font-mono text-[10px]" style={{ color: w.sub }}>
                    {era.count} EVENTS
                    <span className="hidden lg:inline"> · READ THE BED →</span>
                  </div>
                </div>
                <div className="lg:mt-2.5 lg:grid lg:grid-cols-2 lg:gap-x-11 lg:gap-y-2">
                  {era.headline.map((e) => (
                    <div
                      key={`${e.yearLabel}-${e.title}`}
                      className="mt-1.5 font-sans text-[14.5px] lg:mt-0"
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
          <div className="mx-auto max-w-5xl px-5 py-4 lg:mx-0 lg:max-w-none lg:px-9">
            <div className="flex items-center justify-between">
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
          <div className="mx-auto max-w-5xl px-5 py-4 lg:mx-0 lg:max-w-none lg:px-9">
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
        <div className="mx-auto max-w-5xl px-5 py-4 lg:mx-0 lg:max-w-none lg:px-9">
          <div className="eyebrow text-umber">Quick facts · atlas reference</div>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
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
          <div className="mx-auto max-w-5xl px-5 py-4 lg:mx-0 lg:max-w-none lg:px-9">
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

      {/* the lateral move — desktop only; the phone reaches Compared from
          the front door (nav law: COMPARED, not junction, outside the
          compare surfaces — deviations E14) */}
      <Link
        href="/compare"
        prefetch={false}
        className="bed pressable hidden lg:block"
      >
        <div className="px-9 py-4 font-mono text-[11px] tracking-[0.1em] text-oxide">
          SET {meta.name.toUpperCase()} BESIDE ANOTHER NATION — COMPARED →
        </div>
      </Link>
        </div>

        {/* ── the specimen bench — the dossier as the bench's right column
            (below the beds at 1024, standing from 1280 — P4 E5) ── */}
        <div className={`${benchAsideCol} lg:min-w-0 xl:border-l-2 xl:border-basalt`}>
      {/* ── the dossier — specimen rows ── */}
      {available.length > 0 && (
        <section className="bed xl:border-t-0">
          <div className="mx-auto max-w-5xl px-5 pt-4 pb-6 lg:mx-0 lg:max-w-none lg:px-9 xl:px-6">
            <div className="flex items-baseline justify-between">
              <div className="min-w-0">
                <div className="eyebrow text-umber lg:hidden">
                  Dossier · press a specimen — it turns over
                </div>
                <div className="hidden lg:block">
                  <div className="font-display text-[20px] font-extrabold tracking-tight uppercase">
                    Specimen bench
                  </div>
                  <div className="mt-1 font-mono text-[9.5px] tracking-[0.1em] text-umber">
                    PRESS A SPECIMEN — IT TURNS OVER
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAllProof((v) => !v)}
                className="pressable py-1 pl-3 font-mono text-[10px] tracking-[0.08em] text-oxide"
              >
                {allProof ? "CLOSE PROOFS ⟲" : "PROOF VIEW ⟲"}
              </button>
            </div>

            <div className="md:columns-2 md:gap-10 xl:columns-1">
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
        </div>

        {/* ── sources + the creed — the cut's own footing ── */}
        <div className={`${benchMainCol} lg:row-start-3 lg:min-w-0 xl:row-start-2`}>
      {Object.keys(sources).length > 0 && (
        <SourcesFooter sources={sources} updated={dossier?.updated ?? null} />
      )}

      <div className="cut-rule" />
      <footer className="mx-auto max-w-5xl px-5 pt-[14px] pb-6 lg:mx-0 lg:max-w-none lg:px-9">
        <div className="flex justify-between font-mono text-[10px] text-umber">
          <div>EVERY CLAIM SOURCED</div>
          <div>ABSENCE ≠ ZERO</div>
          <div>NO SIDES</div>
        </div>
      </footer>
        </div>
      </div>

      {/* ── the extracted core (the phone's pull — the bench rail carries
          the core at width) ── */}
      {hasHistory && (
        <div
          aria-hidden={!coreOpen}
          className="fixed inset-x-0 top-0 z-40 mx-auto flex h-dvh w-full max-w-5xl flex-col bg-basalt lg:hidden"
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
      <div className="mx-auto max-w-5xl px-5 py-5 lg:mx-0 lg:max-w-none lg:px-9 xl:px-6">
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
      <div className="mx-auto max-w-5xl px-5 py-4 lg:mx-0 lg:max-w-none lg:px-9">
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
