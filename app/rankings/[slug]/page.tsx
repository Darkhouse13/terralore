import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { allRankings, getRanking, type Ranking } from "@/lib/rankings";
import { DOMAIN_META } from "@/lib/types";
import { formatMetric } from "@/lib/format";
import {
  breadcrumbLd,
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
    alternates: { canonical: path },
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
  const top = r.rows.slice(0, 10);
  const mixed = r.years != null && r.years.min !== r.years.max;
  const unitPhrase = UNIT_PHRASE[r.unit];

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
              <Link href={routes.rankings()} className="transition-colors hover:text-copper-deep">
                Rankings
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-copper-deep">
              {r.label}
            </li>
          </ol>
        </nav>

        <header
          className="mt-9 stratum-top pb-10"
          style={{ "--stratum-tint": "var(--color-verdigris-deep)" } as React.CSSProperties}
        >
          <p className="eyebrow text-verdigris-deep">Rankings · {domainLabel}</p>

          <h1 className="mt-4 max-w-[16ch] font-display text-[clamp(2.6rem,8vw,4.2rem)] font-[380] leading-[0.96] tracking-[-0.015em] text-[#16201e]">
            {r.label}
          </h1>

          <p className="mt-4 max-w-[46rem] font-serif text-[clamp(1.1rem,3.2vw,1.35rem)] font-[340] italic leading-[1.45] text-[#454f4c]">
            {r.definition}
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <Stat
              label={r.isMineral ? "Producers listed" : "Nations ranked"}
              value={String(r.rows.length)}
            />
            <Stat label="Highest" value={formatMetric(r.rows[0]?.value ?? null, r.unit)} />
            <Stat
              label="Lowest"
              value={formatMetric(r.rows.at(-1)?.value ?? null, r.unit)}
            />
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

        {/* ── the ten highest, in the brand grammar ── */}
        <section className="py-2">
          <span
            aria-hidden
            className="stratum-rule mb-7 block max-w-[110px]"
            style={{ "--stratum-tint": "var(--color-verdigris-deep)" } as React.CSSProperties}
          />
          <h2 className="font-display text-[clamp(1.7rem,4.5vw,2.2rem)] font-[400] leading-tight text-[#16201e]">
            The {top.length === 10 ? "ten" : String(top.length)} highest
          </h2>
          <p className="mt-2.5 max-w-[46rem] font-serif text-[1.02rem] italic leading-relaxed text-[#454f4c]">
            Bars are drawn to the highest value in the table. Highest, not best:
            this page orders figures, it does not grade nations.
          </p>

          <ol className="mt-7">
            {top.map((row) => (
              <li
                key={row.code}
                className="grid gap-x-6 gap-y-1 border-t border-[rgba(22,32,30,0.12)] py-3 sm:grid-cols-[minmax(0,15rem)_1fr] sm:items-center"
              >
                <div className="flex items-baseline gap-2.5">
                  <span className="w-[1.6rem] flex-none font-mono text-[0.68rem] tabular-nums text-ink-3">
                    {row.rank}
                  </span>
                  <Link
                    href={`/country/${row.code}#m=${r.key}&tab=${r.domain}`}
                    prefetch={false}
                    className="font-display text-[1.08rem] font-[440] leading-snug text-[#16201e] transition-colors hover:text-copper-deep"
                  >
                    {row.flag && <span className="mr-1.5">{row.flag}</span>}
                    {row.name}
                  </Link>
                </div>
                <div>
                  <TopBar value={row.value} max={top[0].value} />
                  <p className="mt-1.5 font-mono text-[0.72rem] tabular-nums leading-relaxed text-ink-3">
                    {formatMetric(row.value, r.unit)}
                    {row.year != null && <> &nbsp;·&nbsp; observed {row.year}</>}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── the full table ── */}
        <section className="mt-10 py-2">
          <span
            aria-hidden
            className="stratum-rule mb-7 block max-w-[110px]"
            style={{ "--stratum-tint": "var(--color-verdigris-deep)" } as React.CSSProperties}
          />
          <h2 className="font-display text-[clamp(1.7rem,4.5vw,2.2rem)] font-[400] leading-tight text-[#16201e]">
            {r.isMineral ? "Every listed producer" : "Every nation with data"}
          </h2>

          {(unitPhrase || mixed) && (
            <p className="mt-2.5 max-w-[46rem] font-serif text-[1.02rem] italic leading-relaxed text-[#454f4c]">
              {unitPhrase && <>Figures are {unitPhrase}.</>}
              {mixed && (
                <>
                  {unitPhrase && " "}This table mixes vintages: each publisher carries a
                  nation&rsquo;s latest available year, so the observations here run
                  from {r.years!.min} to {r.years!.max} — every row shows its own.
                </>
              )}
            </p>
          )}

          {isWgi(r) && (
            <p className="mt-4 max-w-[46rem] border-l-2 border-[var(--color-verdigris-deep)] pl-4 text-[0.95rem] leading-relaxed text-ink-2">
              These are the Worldwide Governance Indicators&rsquo;{" "}
              <strong>absolute 0–100 scores</strong> — anchored to two hypothetical
              benchmark performers, not percentile ranks — and they aggregate
              perception surveys and expert assessments: model estimates of what is
              perceived, not direct measurements. The ranking order below is computed
              by this atlas from those scores.
            </p>
          )}

          {r.isMineral && (
            <p className="mt-4 max-w-[46rem] border-l-2 border-[var(--color-verdigris-deep)] pl-4 text-[0.95rem] leading-relaxed text-ink-2">
              The USGS names only the producers it lists; a nation absent here is not
              recorded as producing none — any output elsewhere sits inside the
              published world total. For each producer&rsquo;s share of world
              production, and the honest &ldquo;Rest of world&rdquo; remainder,{" "}
              <Link
                href={routes.commodity(r.commoditySlug!)}
                prefetch={false}
                className="font-semibold text-verdigris-deep underline-offset-2 hover:underline"
              >
                see the commodity page
              </Link>
              .
            </p>
          )}

          <ol className="mt-7">
            {r.rows.map((row) => (
              <li
                key={row.code}
                className="grid grid-cols-[2.4rem_minmax(0,1fr)_auto] items-baseline gap-x-3 border-t border-[rgba(22,32,30,0.1)] py-2"
              >
                <span className="font-mono text-[0.68rem] tabular-nums text-ink-3">
                  {row.rank}
                </span>
                <Link
                  href={`/country/${row.code}#m=${r.key}&tab=${r.domain}`}
                  prefetch={false}
                  className="truncate font-sans text-[0.95rem] leading-snug text-[#16201e] transition-colors hover:text-copper-deep"
                >
                  {row.flag && <span className="mr-1.5">{row.flag}</span>}
                  {row.name}
                </Link>
                <span className="text-right font-mono text-[0.78rem] tabular-nums text-ink-2">
                  {formatMetric(row.value, r.unit)}
                  <span className="text-ink-3"> · {row.year ?? "—"}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* ── the gaps, named ── */}
        {r.noData.length > 0 && (
          <section className="mt-10 py-2">
            <span
              aria-hidden
              className="stratum-rule mb-7 block max-w-[110px]"
              style={{ "--stratum-tint": "var(--color-verdigris-deep)" } as React.CSSProperties}
            />
            <h2 className="font-display text-[clamp(1.5rem,4vw,1.9rem)] font-[400] leading-tight text-[#16201e]">
              No data
            </h2>
            <p className="mt-2.5 max-w-[46rem] font-serif text-[1.02rem] italic leading-relaxed text-[#454f4c]">
              {r.noData.length === 1 ? "One nation publishes" : `${r.noData.length} nations publish`}{" "}
              no figure for this indicator in the sources below. Absence is a fact
              about the world&rsquo;s statistical apparatus, not a zero — these
              nations are not ranked.
            </p>
            <ul className="mt-5 max-w-[46rem]">
              {r.noData.map((n) => (
                <li
                  key={n.code}
                  className="border-t border-[rgba(22,32,30,0.1)] py-2.5"
                >
                  <Link
                    href={`/country/${n.code}`}
                    prefetch={false}
                    className="font-sans text-[0.95rem] text-[#16201e] transition-colors hover:text-copper-deep"
                  >
                    {n.flag && <span className="mr-1.5">{n.flag}</span>}
                    {n.name}
                  </Link>
                  {n.note && (
                    <p className="mt-1 font-serif text-[0.88rem] italic leading-relaxed text-ink-2">
                      {n.note}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── the domain's other rankings, for lateral movement ── */}
        <nav aria-label={`${domainLabel} rankings`} className="mt-12">
          <div className="eyebrow mb-4 text-ink-3">More in {domainLabel}</div>
          <ul className="flex flex-wrap gap-2">
            {siblings.map((s) => (
              <li key={s.slug}>
                <Link
                  href={routes.ranking(s.slug)}
                  prefetch={false}
                  aria-current={s.slug === r.slug ? "page" : undefined}
                  className={`inline-block rounded-[3px] border px-3.5 py-1.5 font-sans text-[0.85rem] transition-colors ${
                    s.slug === r.slug
                      ? "border-verdigris-deep bg-verdigris-deep text-land-0"
                      : "border-[rgba(47,110,98,0.35)] text-verdigris-deep hover:bg-[rgba(87,166,149,0.12)]"
                  }`}
                >
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <footer className="mt-14 border-t border-land-2 pt-8">
          <div className="eyebrow mb-4 text-ink-3">
            {r.sources.length === 1 ? "Source" : "Sources"}
          </div>
          {r.sources.map((s) => (
            <p key={s.id} className="text-[0.95rem] leading-relaxed text-ink-2">
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-ink underline-offset-2 transition-colors hover:text-copper-deep hover:underline"
              >
                {s.label}
              </a>{" "}
              — {s.publisher} · {s.license} · accessed {s.accessed}.
            </p>
          ))}
          <p className="mt-4 max-w-[680px] font-serif text-[0.95rem] italic leading-relaxed text-ink-2">
            Table assembled {r.updated} from each nation&rsquo;s latest published
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
      <dt className="eyebrow text-ink-3">{label}</dt>
      <dd className="mt-1 font-display text-[1.55rem] font-[420] tabular-nums leading-none text-[#16201e]">
        {value}
      </dd>
    </div>
  );
}

/**
 * One bar of the top-ten strip, drawn relative to the table's highest value.
 * aria-hidden decoration over text that carries the real figures, house rule.
 * A non-positive value draws no bar at all — a clamped sliver would read as a
 * small positive number, which is a wrong claim about, say, a GDP contraction.
 */
function TopBar({ value, max }: { value: number; max: number }) {
  const width = max > 0 && value > 0 ? Math.max((value / max) * 100, 0.4) : 0;
  return (
    <svg aria-hidden="true" className="block h-[5px] w-full">
      <rect width="100%" height="5" rx="2" fill="rgba(22,32,30,0.08)" />
      {width > 0 && (
        <rect width={`${width}%`} height="5" rx="2" fill="var(--color-verdigris-deep)" />
      )}
    </svg>
  );
}
