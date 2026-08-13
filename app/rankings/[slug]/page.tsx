import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { allRankings, getRanking, type Ranking } from "@/lib/rankings";
import { DOMAIN_META } from "@/lib/types";
import { formatMetric } from "@/lib/format";
import {
  breadcrumbLd,
  mdTwinTypes,
  rankingDescription,
  rankingLd,
  routes,
  SITE_NAME,
} from "@/lib/seo";

/**
 * One indicator, every nation with a published figure — highest to lowest.
 *
 * Server-rendered, no JavaScript: the whole table, every vintage and every
 * gap, is in the initial HTML — the chronicle discipline applied to data.
 * The proof-flip is CSS-only here (deviations E9): press a row and it turns
 * over to its observation label; PROOF VIEW is a native checkbox.
 *
 * The honesty rules this page carries (see lib/rankings.ts, which enforces
 * them at build):
 *
 *   · every row shows its own observation year, and a note above the table
 *     says plainly when years are mixed;
 *   · nations without data are listed apart, never ranked, never zero;
 *   · WGI metrics are described as the absolute 0–100 scores they are;
 *   · the language is highest/lowest — a high military burden or a low tax
 *     share is not a virtue or a vice on this site.
 */

export function generateStaticParams() {
  return allRankings().map((r) => ({ slug: r.slug }));
}

/**
 * How the unit reads in prose above the table. Units whose formatted values
 * are not self-describing (a bare "42.1") get the fuller phrase; `ratio` is
 * deliberately absent — the definition sentence carries its meaning
 * (births per woman, tonnes per person).
 */
const UNIT_PHRASE: Record<string, string> = {
  USD: "current US dollars",
  "%": "percent",
  "% of GDP": "shares of GDP",
  "% gross":
    "gross enrolment ratios — repeaters and over-age pupils can push a figure above 100%",
  years: "years",
  people: "people",
  "km²": "square kilometres",
  tonnes: "tonnes of mine production",
  score: "absolute scores on a 0–100 scale",
  "per 1,000": "per 1,000 people",
  "per 1,000 births": "per 1,000 live births",
  "per 100": "per 100 people",
  "per million": "per million people",
};

const isWgi = (r: Ranking) => r.sources.some((s) => s.id === "wb-wgi");

// The sediment walk: rank 1 is the deepest pigment, then upward through the
// beds; everything below the podium is clay. Decoration over text that
// carries the real figures (house rule).
const barColor = (rank: number) =>
  rank === 1
    ? "var(--color-basalt)"
    : rank === 2
      ? "var(--color-umber)"
      : rank === 3
        ? "var(--color-oxide)"
        : "var(--color-clay)";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const r = getRanking(slug);
  if (!r) return { title: `Unknown ranking — ${SITE_NAME}` };

  const path = routes.ranking(r.slug);
  const description = rankingDescription(r);
  const lower = r.label.toLowerCase();
  return {
    title: `${r.label} by nation — world ranking`,
    description,
    keywords: [
      `${lower} by country`,
      `${lower} ranking`,
      `countries ranked by ${lower}`,
      `highest ${lower}`,
      ...r.sources.map((s) => s.publisher),
    ],
    alternates: { canonical: path, types: mdTwinTypes(path) },
    // The social card comes from this segment's own opengraph-image.tsx.
    openGraph: {
      type: "website",
      title: `${r.label} by nation — world ranking`,
      description,
      url: path,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: `${r.label} by nation — world ranking`,
      description,
    },
  };
}

export default async function RankingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const r = getRanking(slug);
  if (!r) notFound();

  const domainLabel = DOMAIN_META[r.domain].label;
  const siblings = allRankings().filter((x) => x.domain === r.domain);
  const idx = allRankings().findIndex((x) => x.slug === r.slug) + 1;
  const total = allRankings().length;
  const mixed = r.years != null && r.years.min !== r.years.max;
  const unitPhrase = UNIT_PHRASE[r.unit];
  const max = r.rows[0]?.value ?? 0;
  const srcLine = r.sources
    .map((s) => `${s.id.toUpperCase()} — ${s.publisher}`)
    .join(" · ");

  return (
    <>
      <JsonLd
        data={[
          rankingLd(r),
          breadcrumbLd([
            { name: SITE_NAME, path: routes.home() },
            { name: "Rankings", path: routes.rankings() },
            { name: r.label, path: routes.ranking(r.slug) },
          ]),
        ]}
      />
      <main className="min-h-screen bg-bone">
        <div className="mx-auto max-w-4xl px-5 pt-4 pb-16">
          <nav aria-label="Breadcrumb" className="font-mono text-[10px] tracking-[0.16em] uppercase">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href={routes.rankings()} className="text-oxide">
                  ← Rankings
                </Link>
              </li>
              <li aria-hidden="true" className="text-oxide">
                ·
              </li>
              <li className="text-oxide">{domainLabel}</li>
              <li aria-hidden="true" className="text-oxide">
                ·
              </li>
              <li aria-current="page" className="text-umber">
                {idx}/{total}
              </li>
            </ol>
          </nav>

          <header className="settle mt-3 pb-4">
            <h1 className="max-w-[16ch] font-display text-[42px] leading-none font-extrabold tracking-tight uppercase md:text-[64px]">
              {r.label}
            </h1>
            <p className="mt-3 font-mono text-[11px] text-oxide uppercase">
              {unitPhrase ?? r.unit}
              {r.years != null &&
                ` · OBSERVED ${mixed ? `${r.years.min}–${r.years.max}` : r.years.min}`}
            </p>
            <p className="mt-2 max-w-2xl font-sans text-[14px] leading-relaxed text-umber">
              {r.definition}
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              <Stat
                label={r.isMineral ? "Producers listed" : "Nations ranked"}
                value={String(r.rows.length)}
              />
              <Stat label="Highest" value={formatMetric(r.rows[0]?.value ?? null, r.unit)} />
              <Stat label="Lowest" value={formatMetric(r.rows.at(-1)?.value ?? null, r.unit)} />
              <Stat
                label="Observed"
                value={
                  r.years == null
                    ? "—"
                    : mixed
                      ? `${r.years.min}–${r.years.max}`
                      : String(r.years.min)
                }
              />
            </dl>
          </header>

          {mixed && (
            <p className="mb-4 max-w-2xl border-l-[6px] border-basalt pl-4 font-sans text-[13.5px] leading-relaxed text-umber">
              This table mixes vintages: each publisher carries a nation&rsquo;s latest
              available year, so the observations here run from {r.years!.min}{" "}to{" "}
              {r.years!.max}{" "}— every row shows its own.
            </p>
          )}

          {isWgi(r) && (
            <p className="mb-4 max-w-2xl border-l-[6px] border-basalt pl-4 font-sans text-[13.5px] leading-relaxed text-umber">
              These are the Worldwide Governance Indicators&rsquo;{" "}
              <strong className="text-basalt">absolute 0–100 scores</strong> — anchored to
              two hypothetical benchmark performers, not percentile ranks — and they
              aggregate perception surveys and expert assessments: model estimates of what
              is perceived, not direct measurements. The ranking order below is computed by
              this atlas from those scores.
            </p>
          )}

          {r.isMineral && (
            <p className="mb-4 max-w-2xl border-l-[6px] border-basalt pl-4 font-sans text-[13.5px] leading-relaxed text-umber">
              The USGS names only the producers it lists; a nation absent here is not
              recorded as producing none — any output elsewhere sits inside the published
              world total. For each producer&rsquo;s share of world production, and the
              honest &ldquo;Rest of world&rdquo; remainder,{" "}
              <Link
                href={routes.commodity(r.commoditySlug!)}
                prefetch={false}
                className="font-medium text-oxide underline underline-offset-2"
              >
                see the commodity page
              </Link>
              .
            </p>
          )}

          {/* ── the table: every row a specimen ── */}
          <input type="checkbox" id="proofview" className="proof-toggle peer sr-only" />
          <div>
            <div className="flex items-baseline justify-between">
              <p className="font-sans text-[13px] text-umber">
                Press a row — the specimen turns over to its label. Bars are drawn to the
                highest value. Highest, not best: this page orders figures, it does not
                grade nations.
              </p>
              <label
                htmlFor="proofview"
                className="pressable flex-none py-1 pl-3 font-mono text-[10px] tracking-[0.08em] text-oxide select-none"
              >
                <span className="proof-off">PROOF VIEW ⟲</span>
                <span className="proof-on">CLOSE PROOFS ⟲</span>
              </label>
            </div>

            <ol className="mt-3 border-t-2 border-basalt">
              {r.rows.map((row) => {
                const width =
                  max > 0 && row.value > 0 ? Math.max((row.value / max) * 100, 0.4) : 0;
                return (
                  <li key={row.code} className="border-b-2 border-basalt">
                    <div className="flip-scene flip-press">
                      <div className="flip-card h-[62px]">
                        <div className="flip-face pt-[11px]">
                          <div className="flex items-baseline justify-between gap-3 font-mono text-[12.5px]">
                            <div className="min-w-0 truncate uppercase">
                              <span className="text-oxide">
                                {String(row.rank).padStart(2, "0")}
                              </span>{" "}
                              <Link
                                href={`/country/${row.code}#m=${r.key}&tab=${r.domain}`}
                                prefetch={false}
                                className="text-basalt"
                              >
                                {row.name}
                              </Link>
                            </div>
                            <div className="flex-none">
                              {formatMetric(row.value, r.unit)}{" "}
                              <span className="pill">{row.year ?? "—"}</span>
                            </div>
                          </div>
                          {width > 0 && (
                            <div
                              aria-hidden
                              className="mt-[7px] h-[14px]"
                              style={{ width: `${width}%`, background: barColor(row.rank) }}
                            />
                          )}
                          <span className="sr-only">
                            Observed {row.year ?? "year unknown"} ·{" "}
                            {r.sources.map((s) => s.publisher).join(", ")}
                          </span>
                        </div>
                        <div aria-hidden className="flip-face flip-back">
                          <div className="flex h-full flex-col justify-center gap-[3px] px-3">
                            <div className="font-mono text-[10.5px] tracking-[0.08em] uppercase">
                              OBSERVED {row.year ?? "—"} · {srcLine}
                            </div>
                            <div className="font-sans text-[11.5px] text-clay">
                              rank {row.rank} of {r.rows.length}{" "}
                              {r.isMineral ? "listed producers" : "ranked nations"} · highest,
                              not best
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* ── the gaps, named — a gap has no underside ── */}
          {r.noData.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-[20px] font-extrabold tracking-tight uppercase">
                Not observed
              </h2>
              <p className="mt-2 max-w-2xl font-sans text-[13.5px] leading-relaxed text-umber">
                {r.noData.length === 1
                  ? "One nation publishes"
                  : `${r.noData.length} nations publish`}{" "}
                no figure for this indicator in the sources below. Absence is a fact about
                the world&rsquo;s statistical apparatus, not a zero — these nations hold
                their place as hatched gaps, and a gap has no underside to turn over.
              </p>
              <ul className="mt-4 max-w-2xl border-t-2 border-basalt">
                {r.noData.map((n) => (
                  <li key={n.code} className="border-b-2 border-basalt py-2.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <Link
                        href={`/country/${n.code}`}
                        prefetch={false}
                        className="min-w-0 truncate font-mono text-[12.5px] text-basalt uppercase"
                      >
                        {n.name}
                      </Link>
                      <span className="not-observed flex-none text-[9.5px]">NOT OBSERVED</span>
                    </div>
                    {n.note && (
                      <p className="mt-1 font-sans text-[12.5px] leading-relaxed text-umber">
                        {n.note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── the domain's other rankings, for lateral movement ── */}
          <nav aria-label={`${domainLabel} rankings`} className="mt-10">
            <div className="eyebrow mb-3 text-umber">More in {domainLabel}</div>
            <ul className="flex flex-wrap gap-2">
              {siblings.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={routes.ranking(s.slug)}
                    prefetch={false}
                    aria-current={s.slug === r.slug ? "page" : undefined}
                    className={`pressable inline-block border-2 border-basalt px-3.5 py-1.5 font-sans text-[13px] ${
                      s.slug === r.slug ? "bg-basalt text-bone" : "text-basalt"
                    }`}
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <footer className="mt-10 border-t-2 border-basalt pt-5">
            <div className="eyebrow mb-3 text-umber">
              {r.sources.length === 1 ? "Source" : "Sources"}
            </div>
            {r.sources.map((s) => (
              <p key={s.id} className="font-sans text-[13.5px] leading-relaxed">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-oxide underline underline-offset-2"
                >
                  {s.label}
                </a>{" "}
                <span className="text-umber">
                  — {s.publisher} · {s.license} · accessed {s.accessed}.
                </span>
              </p>
            ))}
            <p className="mt-4 max-w-2xl font-sans text-xs leading-relaxed text-umber">
              Table assembled {r.updated}{" "}from each nation&rsquo;s latest published
              observation. The same figure, with the same source, sits on each
              nation&rsquo;s dossier
              {r.aliasKeys.length > 0 && (
                <>
                  {" "}— in its {domainLabel} tab and, identically, in its{" "}
                  {r.aliasKeys.map((a) => DOMAIN_META[a.domain].label).join(" and ")}{" "}
                  tab
                </>
              )}
              . Gaps render as absences, never as zeros.
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}

/* ── pieces ───────────────────────────────────────────────────────────────── */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow text-umber">{label}</dt>
      <dd className="mt-1 font-mono text-[19px] leading-none tabular-nums">{value}</dd>
    </div>
  );
}
