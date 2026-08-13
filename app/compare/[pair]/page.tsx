import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import StrataPattern from "@/components/brand/StrataPattern";
import {
  allComparePages,
  canonicalCompareSlug,
  compareTitle,
  getComparePage,
  type ComparePage,
  type CompareRow,
  type SharedEvent,
} from "@/lib/compare";
import { getCountry } from "@/lib/countries";
import { CATEGORY_META } from "@/lib/types";
import { formatMetric } from "@/lib/format";
import {
  breadcrumbLd,
  compareDescription,
  compareLd,
  mdTwinTypes,
  routes,
  SITE_NAME,
} from "@/lib/seo";

/**
 * One nation pair, side by side — everything assembled from records that
 * already exist elsewhere in the atlas with a source attached (lib/compare).
 *
 * Server-rendered, no client JS, the chronicle discipline applied to data:
 * every figure, every vintage, every gap and every crossed event is in the
 * initial HTML. The proof-flip is CSS-only here (deviations E9): press a
 * row and it turns over to its observation label; PROOF VIEW is a native
 * checkbox. The rules this page carries:
 *
 *   · figures are set beside each other, never graded — no winner, no
 *     best/worst, no rivalry framing, whatever the pair's politics;
 *   · a "—" is an absence in the source data, never a zero;
 *   · every row shows each nation's own observation year — vintages differ;
 *   · zero crossed events is a fact about the two archives, stated plainly.
 *
 * The URL's "-vs-" is search grammar only; display copy says "compared".
 * The reversed slug 308s here (see the redirect below) rather than through
 * hundreds of next.config entries — docs/compare-surface.md records why.
 */

export function generateStaticParams() {
  return allComparePages().map((p) => ({ pair: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pair: string }>;
}): Promise<Metadata> {
  const { pair } = await params;
  const page = getComparePage(pair);
  if (!page) return { title: `Unknown comparison — ${SITE_NAME}` };

  const title = compareTitle(page);
  const description = compareDescription(page);
  const path = routes.comparePair(page.slug);
  return {
    title,
    description,
    keywords: [
      `${page.a.name} ${page.b.name} comparison`,
      `${page.a.name} compared to ${page.b.name}`,
      `${page.a.name} and ${page.b.name} history`,
      "sourced country comparison",
    ],
    alternates: { canonical: path, types: mdTwinTypes(path) },
    openGraph: { type: "website", title, description, url: path, siteName: SITE_NAME },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ComparePairPage({
  params,
}: {
  params: Promise<{ pair: string }>;
}) {
  const { pair } = await params;
  const page = getComparePage(pair);
  if (!page) {
    // A valid pair under a non-canonical spelling (reversed order, uppercase)
    // permanently redirects to its one URL; anything else is not a page.
    const m = pair.toLowerCase().match(/^([a-z]{3})-vs-([a-z]{3})$/);
    const canonical = m ? canonicalCompareSlug(m[1], m[2]) : null;
    if (canonical) permanentRedirect(routes.comparePair(canonical));
    notFound();
  }

  const metaA = getCountry(page.a.code)!;
  const metaB = getCountry(page.b.code)!;
  const events = page.sharedEvents;

  return (
    <>
      <JsonLd
        data={[
          compareLd(page, metaA, metaB),
          breadcrumbLd([
            { name: SITE_NAME, path: routes.home() },
            { name: "Compare", path: routes.compare() },
            { name: compareTitle(page), path: routes.comparePair(page.slug) },
          ]),
        ]}
      />
      <main className="min-h-screen bg-bone">
        <div className="mx-auto max-w-4xl px-5 pt-4 pb-16">
          <nav aria-label="Breadcrumb" className="font-mono text-[10px] tracking-[0.16em] uppercase">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href={routes.compare()} className="text-oxide">
                  ← Compared
                </Link>
              </li>
              <li aria-hidden="true" className="text-oxide">
                ·
              </li>
              <li aria-current="page" className="text-umber">
                {page.a.name} and {page.b.name}
              </li>
            </ol>
          </nav>

          <header className="settle mt-3 pb-4">
            <h1 className="max-w-[16ch] font-display text-[42px] leading-none font-extrabold tracking-tight uppercase md:text-[64px]">
              <span className="block">{page.a.name}</span>
              <span className="my-2 block font-mono text-[13px] leading-none font-normal tracking-[0.16em] text-oxide">
                AND
              </span>
              <span className="block">{page.b.name}</span>
            </h1>
            <p className="mt-3 font-mono text-[11px] text-oxide uppercase">
              {page.a.formation.yearLabel} · {page.b.formation.yearLabel}
            </p>
            <p className="mt-2 max-w-2xl font-sans text-[14px] leading-relaxed text-umber">
              Two sourced records set beside each other — the figures each nation
              publishes, and the events each chronicle records of the other.
              Compared, never graded.
            </p>

            <StrataPattern seed={page.slug} className="mt-5" blocks={28} />

            {/* the formation lines — the two archives' anchors */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[page.a, page.b].map((n) => (
                <div key={n.code} className="border-2 border-basalt bg-sand p-4">
                  <Link
                    href={routes.dossier(n.code)}
                    prefetch={false}
                    className="pressable font-display text-[20px] leading-tight font-extrabold tracking-tight text-basalt uppercase"
                  >
                    {n.name}
                  </Link>
                  <p className="mt-1.5 font-sans text-[13.5px] leading-relaxed text-umber">
                    {n.formation.yearLabel} — {n.formation.label}
                  </p>
                  <p className="mt-2 flex flex-wrap gap-x-4 font-mono text-[10px] tracking-[0.08em] uppercase">
                    <Link
                      href={routes.dossier(n.code)}
                      prefetch={false}
                      className="pressable text-umber-deep underline underline-offset-2"
                    >
                      Dossier →
                    </Link>
                    <Link
                      href={routes.chronicle(n.code)}
                      prefetch={false}
                      className="pressable text-umber-deep underline underline-offset-2"
                    >
                      Chronicle →
                    </Link>
                  </p>
                </div>
              ))}
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              <Stat label="Shared indicators" value={String(page.bothCount)} />
              <Stat label="Domains" value={String(page.domains.length)} />
              <Stat label="Crossed events" value={String(events.length)} />
              <Stat label="Data through" value={page.updated} small />
            </dl>
          </header>

          {/* ── the data, domain by domain ── */}
          <section className="mt-8 border-t-2 border-basalt pt-5">
            <h2 className="font-display text-[25px] font-extrabold tracking-tight uppercase">
              The figures, side by side
            </h2>

            <input type="checkbox" id="proofview" className="proof-toggle sr-only" />
            <div>
              <div className="mt-2.5 flex items-baseline justify-between gap-4">
                <p className="max-w-2xl font-sans text-[13.5px] leading-relaxed text-umber">
                  Each figure is the same observation, with the same source, as on the
                  two dossiers. Every value shows the year it was observed — vintages
                  differ by indicator and nation. A &ldquo;—&rdquo; is an absence in
                  the source data, never a zero. Metric names link to the world
                  ranking; values open the figure on its own dossier.
                </p>
                <label
                  htmlFor="proofview"
                  className="pressable flex-none py-1 pl-3 font-mono text-[10px] tracking-[0.08em] text-oxide select-none"
                >
                  <span className="proof-off">PROOF VIEW ⟲</span>
                  <span className="proof-on">CLOSE PROOFS ⟲</span>
                </label>
              </div>

              {page.domains.map((d) => (
                <div key={d.domain} className="mt-8">
                  <div className="flex items-baseline justify-between gap-4 border-b-2 border-basalt pb-2">
                    <h3 className="font-display text-[20px] font-extrabold tracking-tight uppercase">
                      {d.label}
                    </h3>
                    <div className="grid w-[11rem] flex-none grid-cols-2 gap-x-3 text-right font-mono text-[10px] tracking-[0.08em] text-umber uppercase sm:w-[15rem]">
                      <span>
                        <span aria-hidden className="mr-1.5 inline-block h-[8px] w-[8px] bg-basalt" />
                        {page.a.code}
                      </span>
                      <span>
                        <span aria-hidden className="mr-1.5 inline-block h-[8px] w-[8px] bg-clay" />
                        {page.b.code}
                      </span>
                    </div>
                  </div>
                  <ul>
                    {d.rows.map((row) => (
                      <MetricRow key={row.key} page={page} row={row} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* ── the entangled histories ── */}
          <section className="bed mt-12 bg-sand px-4 pt-5 pb-6 sm:px-5">
            <h2 className="font-display text-[25px] font-extrabold tracking-tight uppercase">
              Entangled histories
            </h2>
            {events.length > 0 ? (
              <>
                <p className="mt-2.5 max-w-2xl font-sans text-[13.5px] leading-relaxed text-umber">
                  {events.length === 1 ? "One event" : `${events.length} events`}{" "}
                  in which either nation&rsquo;s sourced chronicle names the other —
                  including under earlier names of the same state. Each is the
                  same record, with the same sources, as on its own chronicle;
                  nothing here was written for this page.
                </p>
                <ol className="mt-5">
                  {events.map((ev, i) => (
                    <EventRow key={`${ev.from}-${ev.year}-${i}`} ev={ev} />
                  ))}
                </ol>
              </>
            ) : (
              <p className="mt-2.5 max-w-2xl font-sans text-[13.5px] leading-relaxed text-umber">
                Neither nation&rsquo;s sourced chronicle names the other — across{" "}
                both archives, no recorded event crosses between them. That is a
                fact about the two records as they stand, not a gap filled here:
                this page reports what the archives hold, and holds nothing they
                do not.
              </p>
            )}
          </section>

          <footer className="mt-14 border-t-2 border-basalt pt-5">
            <div className="eyebrow mb-3 text-umber">Provenance</div>
            <p className="max-w-2xl font-sans text-[13.5px] leading-relaxed text-umber">
              Assembled {page.updated}{" "}
              entirely from records that exist elsewhere in this atlas with a
              source attached. Every figure&rsquo;s
              publisher, licence and access date is on the two dossiers —{" "}
              <Link
                href={routes.dossier(page.a.code)}
                prefetch={false}
                className="font-medium text-oxide underline underline-offset-2"
              >
                {page.a.name}
              </Link>{" "}
              and{" "}
              <Link
                href={routes.dossier(page.b.code)}
                prefetch={false}
                className="font-medium text-oxide underline underline-offset-2"
              >
                {page.b.name}
              </Link>
              ; every event&rsquo;s references are cited beside it above and
              resolve on the two chronicles. Gaps render as absences, never as
              zeros.
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}

/* ── pieces ───────────────────────────────────────────────────────────────── */

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <dt className="eyebrow text-umber">{label}</dt>
      <dd
        className={`mt-1 font-mono leading-none tabular-nums ${
          small ? "text-[13px]" : "text-[19px]"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * One metric, one specimen: front face carries the label (linked to its
 * world ranking), both nations' figures with their own vintage pills, and
 * the paired bars; press turns it over to the observation label. A "—" is
 * an absence — the absent side draws no bar and no pill.
 */
function MetricRow({ page, row }: { page: ComparePage; row: CompareRow }) {
  const max = Math.max(row.a.value ?? 0, row.b.value ?? 0);
  const w = (v: number | null) => (v != null && v > 0 && max > 0 ? Math.max((v / max) * 100, 0.6) : 0);
  const wa = w(row.a.value);
  const wb = w(row.b.value);
  return (
    <li
      className="border-b-2 border-basalt"
      style={{ contentVisibility: "auto", containIntrinsicBlockSize: "88px" }}
    >
      <div className="flip-scene flip-press">
        <div className="flip-card h-[86px]">
          <div className="flip-face pt-[10px]">
            <div className="flex items-start justify-between gap-3">
              <Link
                href={routes.ranking(row.rankingSlug)}
                prefetch={false}
                className="min-w-0 truncate font-sans text-[13.5px] font-medium leading-snug text-basalt"
              >
                {row.label}
              </Link>
              <div className="grid w-[11rem] flex-none grid-cols-2 gap-x-3 text-right sm:w-[15rem]">
                <Cell code={page.a.code} row={row} cell={row.a} />
                <Cell code={page.b.code} row={row} cell={row.b} />
              </div>
            </div>
            {(wa > 0 || wb > 0) && (
              <div aria-hidden className="mt-[6px] flex flex-col gap-[2px]">
                {wa > 0 && <div className="h-[8px] bg-basalt" style={{ width: `${wa}%` }} />}
                {wb > 0 && <div className="h-[8px] bg-clay" style={{ width: `${wb}%` }} />}
              </div>
            )}
            <span className="sr-only">
              Observed {row.a.year ?? "—"} / {row.b.year ?? "—"} · figures compared,
              never graded
            </span>
          </div>
          <div aria-hidden className="flip-face flip-back">
            <div className="flex h-full flex-col justify-center gap-[3px] px-3">
              <div className="font-mono text-[10.5px] tracking-[0.08em] uppercase">
                OBSERVED {page.a.code} {row.a.year ?? "—"} / {page.b.code}{" "}
                {row.b.year ?? "—"} · SOURCED ON BOTH DOSSIERS
              </div>
              <div className="font-sans text-[11.5px] text-clay">
                figures compared, never graded
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

function Cell({ code, row, cell }: { code: string; row: CompareRow; cell: { value: number | null; year: number | null } }) {
  if (cell.value == null) {
    return <span className="font-mono text-[12px] tabular-nums text-umber">—</span>;
  }
  return (
    <Link
      href={`/country/${code}#m=${row.key}&tab=${row.domain}`}
      prefetch={false}
      className="min-w-0 font-mono text-[12px] leading-tight tabular-nums text-basalt"
    >
      {formatMetric(cell.value, row.unit)}
      <span className="mt-[3px] block">
        <span className="pill">{cell.year ?? "—"}</span>
      </span>
    </Link>
  );
}

function EventRow({ ev }: { ev: SharedEvent }) {
  return (
    <li className="grid gap-x-6 gap-y-1 border-t-2 border-basalt py-4 sm:grid-cols-[6.5rem_minmax(0,1fr)]">
      <div className="font-mono text-[12px] leading-relaxed font-medium tabular-nums text-umber-deep">
        {ev.yearLabel}
      </div>
      <div className="min-w-0">
        <h3 className="font-sans text-[15px] font-semibold leading-snug text-basalt">
          {ev.title}
        </h3>
        <p className="mt-1.5 max-w-2xl font-sans text-[13.5px] leading-relaxed text-umber">
          {ev.summary}
        </p>
        <p className="mt-2 font-mono text-[10.5px] leading-relaxed text-umber uppercase">
          {CATEGORY_META[ev.category]?.label ?? ev.category}
          {" · from "}
          <Link
            href={routes.chronicle(ev.from)}
            prefetch={false}
            className="text-umber-deep underline underline-offset-2"
          >
            the {ev.fromName} chronicle
          </Link>
          {" · "}
          {ev.eraTitle}
          {ev.sources.length > 0 && (
            <>
              {" · REFS "}
              {ev.sources.length}
              {" — "}
              {ev.sources.map((s, i) => (
                <span key={s.id}>
                  {i > 0 && ", "}
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-umber-deep underline underline-offset-2"
                    >
                      {s.label}
                    </a>
                  ) : (
                    s.label
                  )}
                </span>
              ))}
            </>
          )}
        </p>
      </div>
    </li>
  );
}
