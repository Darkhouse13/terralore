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
 * initial HTML. The rules this page carries:
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
      <main className="paper-grain min-h-screen bg-land-0 text-ink">
        <div className="relative z-[1] mx-auto max-w-[62rem] px-5 pb-24 pt-8 md:px-8 md:pt-12">
          <nav aria-label="Breadcrumb" className="eyebrow text-ink-3">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="transition-colors hover:text-copper-deep">
                  Terralore
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={routes.compare()} className="transition-colors hover:text-copper-deep">
                  Compare
                </Link>
              </li>
              <li aria-current="page" className="text-copper-deep">
                {page.a.name} and {page.b.name}
              </li>
            </ol>
          </nav>

          <header
            className="mt-9 stratum-top pb-10"
            style={{ "--stratum-tint": "var(--color-verdigris-deep)" } as React.CSSProperties}
          >
            <p className="eyebrow text-verdigris-deep">Side by side</p>
            <h1 className="mt-4 max-w-[18ch] font-display text-[clamp(2.4rem,7.5vw,4rem)] font-[380] leading-[0.98] tracking-[-0.015em] text-[#16201e]">
              {page.a.name} and {page.b.name} compared
            </h1>
            <p className="mt-4 max-w-[46rem] font-serif text-[clamp(1.05rem,3vw,1.3rem)] font-[340] italic leading-[1.45] text-[#454f4c]">
              Two sourced records set beside each other — the figures each nation
              publishes, and the events each chronicle records of the other.
              Compared, never graded.
            </p>

            <StrataPattern seed={page.slug} className="mt-7" blocks={28} />

            {/* the formation lines — the two archives' anchors */}
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {[page.a, page.b].map((n) => (
                <div key={n.code} className="border-l-2 border-[rgba(47,110,98,0.35)] pl-4">
                  <Link
                    href={routes.dossier(n.code)}
                    prefetch={false}
                    className="font-display text-[1.25rem] font-[440] leading-snug text-[#16201e] transition-colors hover:text-copper-deep"
                  >
                    {n.flag && <span className="mr-1.5">{n.flag}</span>}
                    {n.name}
                  </Link>
                  <p className="mt-1.5 font-serif text-[0.95rem] italic leading-relaxed text-ink-2">
                    {n.formation.yearLabel} — {n.formation.label}
                  </p>
                  <p className="mt-2 flex flex-wrap gap-x-4 font-mono text-[0.72rem] text-ink-3">
                    <Link
                      href={routes.dossier(n.code)}
                      prefetch={false}
                      className="transition-colors hover:text-copper-deep"
                    >
                      Dossier →
                    </Link>
                    <Link
                      href={routes.chronicle(n.code)}
                      prefetch={false}
                      className="transition-colors hover:text-copper-deep"
                    >
                      Chronicle →
                    </Link>
                  </p>
                </div>
              ))}
            </div>

            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              <Stat label="Shared indicators" value={String(page.bothCount)} />
              <Stat label="Domains" value={String(page.domains.length)} />
              <Stat label="Crossed events" value={String(events.length)} />
              <Stat label="Data through" value={page.updated} small />
            </dl>
          </header>

          {/* ── the data, domain by domain ── */}
          <section className="py-2">
            <span
              aria-hidden
              className="stratum-rule mb-7 block max-w-[110px]"
              style={{ "--stratum-tint": "var(--color-verdigris-deep)" } as React.CSSProperties}
            />
            <h2 className="font-display text-[clamp(1.7rem,4.5vw,2.2rem)] font-[400] leading-tight text-[#16201e]">
              The figures, side by side
            </h2>
            <p className="mt-2.5 max-w-[46rem] font-serif text-[1.02rem] italic leading-relaxed text-[#454f4c]">
              Each figure is the same observation, with the same source, as on the
              two dossiers. Every value shows the year it was observed — vintages
              differ by indicator and nation. A &ldquo;—&rdquo; is an absence in
              the source data, never a zero. Metric names link to the world
              ranking; values open the figure on its own dossier.
            </p>

            {page.domains.map((d) => (
              <div key={d.domain} className="mt-9">
                <div className="flex items-baseline justify-between gap-4 border-b-2 border-[rgba(22,32,30,0.35)] pb-2">
                  <h3 className="font-display text-[1.15rem] font-[440] text-[#16201e]">{d.label}</h3>
                  <div className="grid w-[13rem] grid-cols-2 gap-x-4 text-right font-mono text-[0.66rem] uppercase tracking-[0.08em] text-ink-3 sm:w-[17rem]">
                    <span className="truncate">
                      {page.a.flag && <span className="mr-1">{page.a.flag}</span>}
                      {page.a.code}
                    </span>
                    <span className="truncate">
                      {page.b.flag && <span className="mr-1">{page.b.flag}</span>}
                      {page.b.code}
                    </span>
                  </div>
                </div>
                <ul>
                  {d.rows.map((row) => (
                    <li
                      key={row.key}
                      className="grid grid-cols-[minmax(0,1fr)_13rem] items-center gap-x-4 border-t border-[rgba(22,32,30,0.1)] py-2.5 sm:grid-cols-[minmax(0,1fr)_17rem]"
                    >
                      <div className="min-w-0">
                        <Link
                          href={routes.ranking(row.rankingSlug)}
                          prefetch={false}
                          className="font-sans text-[0.92rem] leading-snug text-[#16201e] transition-colors hover:text-copper-deep"
                        >
                          {row.label}
                        </Link>
                        <PairBars a={row} />
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 text-right">
                        <Cell code={page.a.code} row={row} cell={row.a} />
                        <Cell code={page.b.code} row={row} cell={row.b} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          {/* ── the entangled histories ── */}
          <section className="mt-12 py-2">
            <span
              aria-hidden
              className="stratum-rule mb-7 block max-w-[110px]"
              style={{ "--stratum-tint": "var(--color-copper)" } as React.CSSProperties}
            />
            <h2 className="font-display text-[clamp(1.7rem,4.5vw,2.2rem)] font-[400] leading-tight text-[#16201e]">
              Entangled histories
            </h2>
            {events.length > 0 ? (
              <>
                <p className="mt-2.5 max-w-[46rem] font-serif text-[1.02rem] italic leading-relaxed text-[#454f4c]">
                  {events.length === 1 ? "One event" : `${events.length} events`}{" "}
                  in which either nation&rsquo;s sourced chronicle names the other —
                  including under earlier names of the same state. Each is the
                  same record, with the same sources, as on its own chronicle;
                  nothing here was written for this page.
                </p>
                <ol className="mt-7">
                  {events.map((ev, i) => (
                    <EventRow key={`${ev.from}-${ev.year}-${i}`} ev={ev} />
                  ))}
                </ol>
              </>
            ) : (
              <p className="mt-2.5 max-w-[46rem] font-serif text-[1.02rem] italic leading-relaxed text-[#454f4c]">
                Neither nation&rsquo;s sourced chronicle names the other — across{" "}
                both archives, no recorded event crosses between them. That is a
                fact about the two records as they stand, not a gap filled here:
                this page reports what the archives hold, and holds nothing they
                do not.
              </p>
            )}
          </section>

          <footer className="mt-14 border-t border-land-2 pt-8">
            <div className="eyebrow mb-4 text-ink-3">Provenance</div>
            <p className="max-w-[680px] font-serif text-[0.95rem] italic leading-relaxed text-ink-2">
              Assembled {page.updated}{" "}
              entirely from records that exist elsewhere in this atlas with a
              source attached. Every figure&rsquo;s
              publisher, licence and access date is on the two dossiers —{" "}
              <Link
                href={routes.dossier(page.a.code)}
                prefetch={false}
                className="font-semibold text-ink underline-offset-2 transition-colors hover:text-copper-deep hover:underline"
              >
                {page.a.name}
              </Link>{" "}
              and{" "}
              <Link
                href={routes.dossier(page.b.code)}
                prefetch={false}
                className="font-semibold text-ink underline-offset-2 transition-colors hover:text-copper-deep hover:underline"
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
      <dt className="eyebrow text-ink-3">{label}</dt>
      <dd
        className={`mt-1 font-display font-[420] tabular-nums leading-none text-[#16201e] ${
          small ? "text-[1.05rem]" : "text-[1.55rem]"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function Cell({ code, row, cell }: { code: string; row: CompareRow; cell: { value: number | null; year: number | null } }) {
  if (cell.value == null) {
    return <span className="font-mono text-[0.8rem] tabular-nums text-ink-3">—</span>;
  }
  return (
    <Link
      href={`/country/${code}#m=${row.key}&tab=${row.domain}`}
      prefetch={false}
      className="font-mono text-[0.8rem] tabular-nums text-ink-2 transition-colors hover:text-copper-deep"
    >
      {formatMetric(cell.value, row.unit)}
      <span className="block text-[0.64rem] leading-tight text-ink-3">{cell.year ?? "—"}</span>
    </Link>
  );
}

/**
 * The one bespoke visual: two bars, each nation's value against the larger of
 * the two magnitudes. Decoration over text that carries the real figures
 * (aria-hidden, house rule); both bars are verdigris — the measured — told
 * apart by weight, not by a hue that would rank them. A non-positive value
 * draws no bar: a clamped sliver would read as a small positive number.
 */
function PairBars({ a: row }: { a: CompareRow }) {
  const max = Math.max(row.a.value ?? 0, row.b.value ?? 0);
  if (max <= 0) return null;
  const w = (v: number | null) => (v != null && v > 0 ? Math.max((v / max) * 100, 0.6) : 0);
  const wa = w(row.a.value);
  const wb = w(row.b.value);
  if (wa === 0 && wb === 0) return null;
  return (
    <svg aria-hidden="true" className="mt-1.5 block h-[9px] w-full max-w-[16rem]">
      {wa > 0 && <rect width={`${wa}%`} height="3.5" rx="1.5" fill="var(--color-verdigris-deep)" />}
      {wb > 0 && (
        <rect y="5.5" width={`${wb}%`} height="3.5" rx="1.5" fill="var(--color-verdigris-deep)" opacity="0.42" />
      )}
    </svg>
  );
}

function EventRow({ ev }: { ev: SharedEvent }) {
  const tint = CATEGORY_META[ev.category]?.tint ?? "var(--color-copper)";
  const ink = CATEGORY_META[ev.category]?.ink ?? "var(--color-copper-deep)";
  return (
    <li className="grid gap-x-6 gap-y-1 border-t border-[rgba(22,32,30,0.12)] py-4 sm:grid-cols-[6.5rem_minmax(0,1fr)]">
      <div className="font-mono text-[0.78rem] tabular-nums leading-relaxed text-ink-3">
        {ev.yearLabel}
      </div>
      <div className="min-w-0">
        <h3 className="font-display text-[1.08rem] font-[440] leading-snug text-[#16201e]">
          <span
            aria-hidden
            className="mr-2 inline-block h-[9px] w-[9px] rounded-[2px] align-baseline"
            style={{ background: tint }}
          />
          {ev.title}
        </h3>
        <p className="mt-1.5 max-w-[44rem] font-serif text-[0.95rem] leading-relaxed text-ink-2">
          {ev.summary}
        </p>
        <p className="mt-2 font-mono text-[0.68rem] leading-relaxed text-ink-3">
          <span style={{ color: ink }}>{CATEGORY_META[ev.category]?.label ?? ev.category}</span>
          {" · from "}
          <Link
            href={routes.chronicle(ev.from)}
            prefetch={false}
            className="transition-colors hover:text-copper-deep"
          >
            the {ev.fromName} chronicle
          </Link>
          {" · "}
          {ev.eraTitle}
          {ev.sources.length > 0 && (
            <>
              {" · "}
              {ev.sources.map((s, i) => (
                <span key={s.id}>
                  {i > 0 && ", "}
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline-offset-2 transition-colors hover:text-copper-deep hover:underline"
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
