import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { COMMODITY_META } from "@/lib/commodity-meta";
import {
  commoditiesSource,
  commoditiesUpdated,
  getCommodity,
  type Commodity,
  type ProducerShare,
} from "@/lib/commodities";
import { formatTonnes } from "@/lib/format";
import { METRIC_DEFS } from "@/lib/metric-defs";
import {
  breadcrumbLd,
  commodityDescription,
  commodityLd,
  routes,
  SITE_NAME,
} from "@/lib/seo";

/**
 * One commodity, every producer.
 *
 * The dossier answers "what does this nation dig?"; this page answers the
 * inverse — "who supplies the world?" — for one of the ten USGS commodities.
 * Every share on it is computed against the **published MCS world total**
 * (lib/commodities.ts throws if that identity breaks), and what the listed
 * producers do not cover is shown as one honest "Rest of world" band rather
 * than being silently absorbed into the largest producer's margin.
 *
 * Server-rendered, no JavaScript: the whole table — both years, shares,
 * withheld flags — is in the initial HTML, the same discipline as the
 * chronicle and the chronology.
 */

export function generateStaticParams() {
  return COMMODITY_META.map((c) => ({ mineral: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mineral: string }>;
}): Promise<Metadata> {
  const { mineral } = await params;
  const c = getCommodity(mineral);
  if (!c) return { title: `Unknown commodity — ${SITE_NAME}` };

  const path = routes.commodity(c.slug);
  const description = commodityDescription(c);
  const lower = c.name.toLowerCase();
  return {
    title: `${c.name} — who supplies the world`,
    description,
    keywords: [
      `${lower} production by country`,
      `world ${lower} mine production`,
      `largest ${lower} producers`,
      `${lower} production ${c.years.estimate}`,
      "USGS Mineral Commodity Summaries",
    ],
    alternates: { canonical: path },
    // The social card comes from this segment's own opengraph-image.tsx.
    openGraph: {
      type: "website",
      title: `${c.name} — who supplies the world`,
      description,
      url: path,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: `${c.name} — who supplies the world`,
      description,
    },
  };
}

/** "23.9%", "1.4%", "0.04%" — precision follows magnitude, never padding. */
function pct(share: number | null): string {
  if (share == null) return "—";
  const p = share * 100;
  return `${p.toFixed(p >= 10 ? 0 : p >= 1 ? 1 : 2)}%`;
}

export default async function CommodityPage({
  params,
}: {
  params: Promise<{ mineral: string }>;
}) {
  const { mineral } = await params;
  const c = getCommodity(mineral);
  if (!c) notFound();

  const source = commoditiesSource();
  const { reported: yr, estimate: ye } = c.years;
  const top3 = c.producers.filter((p) => p.estimate != null).slice(0, 3);
  const withheld = c.producers.filter((p) => p.reportedWithheld || p.estimateWithheld);
  const producing = c.producers.filter((p) => p.reported != null || p.estimate != null).length;

  return (
    <>
    <JsonLd
      data={[
        commodityLd(c, source, commoditiesUpdated()),
        breadcrumbLd([
          { name: SITE_NAME, path: routes.home() },
          { name: "Commodities", path: routes.commodities() },
          { name: c.name, path: routes.commodity(c.slug) },
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
              <Link href="/commodities" className="transition-colors hover:text-copper-deep">
                Commodities
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-copper-deep">
              {c.name}
            </li>
          </ol>
        </nav>

        <header
          className="mt-9 stratum-top pb-10"
          style={{ "--stratum-tint": "var(--color-verdigris-deep)" } as React.CSSProperties}
        >
          <p className="eyebrow text-verdigris-deep">Who supplies the world</p>

          <h1 className="mt-4 max-w-[18ch] font-display text-[clamp(2.9rem,9vw,4.6rem)] font-[380] leading-[0.94] tracking-[-0.015em] text-[#16201e]">
            {c.name}
          </h1>

          <p className="mt-4 max-w-[46rem] font-serif text-[clamp(1.1rem,3.2vw,1.35rem)] font-[340] italic leading-[1.45] text-[#454f4c]">
            {METRIC_DEFS[c.key]}
          </p>

          <p className="mt-6 max-w-[46rem] font-serif text-[1.12rem] leading-[1.66] text-[#16201e]">
            Figures are <strong>mine production</strong>{" "}— the MCS statistics row
            &ldquo;{c.detail}&rdquo; — as published by the U.S. Geological Survey in the{" "}
            {source.label}. They measure what left mines in each calendar year: not
            reserves in the ground, and not refined or smelted output, which for several
            of these commodities is concentrated in different hands. {ye} is the USGS
            estimate; {yr} is the reported figure.
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <Stat label={`World total · ${ye} est.`} value={formatTonnes(c.world.estimate)} />
            <Stat label={`World total · ${yr}`} value={formatTonnes(c.world.reported)} />
            <Stat label="Producers listed" value={String(producing)} />
            <Stat label={`Top three · ${ye} est.`} value={pct(c.topThreeShare)} />
          </dl>

          {top3.length === 3 && (
            <p className="mt-7 max-w-[46rem] font-serif text-[1.02rem] leading-relaxed text-[#454f4c]">
              The three largest producers — {top3[0].name}, {top3[1].name} and{" "}
              {top3[2].name} — account for {pct(c.topThreeShare)} of the {ye} world
              estimate of {formatTonnes(c.world.estimate)}.
            </p>
          )}
        </header>

        {/* ── The share table: every listed producer, both years, one residual ── */}
        <section className="py-2">
          <span
            aria-hidden
            className="stratum-rule mb-7 block max-w-[110px]"
            style={{ "--stratum-tint": "var(--color-verdigris-deep)" } as React.CSSProperties}
          />
          <h2 className="font-display text-[clamp(1.7rem,4.5vw,2.2rem)] font-[400] leading-tight text-[#16201e]">
            Share of world production
          </h2>
          <p className="mt-2.5 max-w-[46rem] font-serif text-[1.02rem] italic leading-relaxed text-[#454f4c]">
            Each bar is that nation&rsquo;s share of the published world total for the{" "}
            {ye} estimate. Shares are computed against the world total itself, never
            against the sum of the producers listed.
          </p>

          {/* the hatch used by the rest-of-world band */}
          <svg aria-hidden="true" width="0" height="0" className="absolute">
            <defs>
              <pattern
                id="row-hatch"
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-verdigris-deep)" strokeWidth="1.6" opacity="0.5" />
              </pattern>
            </defs>
          </svg>

          <ol className="mt-7">
            {c.producers.map((p, i) => (
              <ProducerRow key={p.code} p={p} c={c} rank={i + 1} />
            ))}
          </ol>

          <RestOfWorldRow c={c} />

          {withheld.length > 0 && (
            <p className="mt-6 max-w-[46rem] text-[0.92rem] leading-relaxed text-ink-2">
              {withheld.map((p) => p.name).join(", ")}:{" "}
              {withheld.length === 1 ? "its" : "their"}{" "}figure is withheld by the
              USGS (&ldquo;W&rdquo;) to avoid disclosing company proprietary data. A
              withheld figure is an absence in this table, never a zero; where the USGS
              folds withheld production into its world total, that tonnage sits inside
              Rest of world here.
            </p>
          )}
        </section>

        {/* ── all ten, for lateral movement ── */}
        <nav aria-label="All commodities" className="mt-12">
          <div className="eyebrow mb-4 text-ink-3">The ten commodities</div>
          <ul className="flex flex-wrap gap-2">
            {COMMODITY_META.map((m) => (
              <li key={m.slug}>
                <Link
                  href={`/commodities/${m.slug}`}
                  prefetch={false}
                  aria-current={m.slug === c.slug ? "page" : undefined}
                  className={`inline-block rounded-[3px] border px-3.5 py-1.5 font-sans text-[0.85rem] transition-colors ${
                    m.slug === c.slug
                      ? "border-verdigris-deep bg-verdigris-deep text-land-0"
                      : "border-[rgba(47,110,98,0.35)] text-verdigris-deep hover:bg-[rgba(87,166,149,0.12)]"
                  }`}
                >
                  {m.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <footer className="mt-14 border-t border-land-2 pt-8">
          <div className="eyebrow mb-4 text-ink-3">Source</div>
          <p className="text-[0.95rem] leading-relaxed text-ink-2">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-ink underline-offset-2 transition-colors hover:text-copper-deep hover:underline"
            >
              {source.label}
            </a>{" "}
            — {source.publisher} · {source.license} · accessed {source.accessed}.
          </p>
          <p className="mt-4 max-w-[680px] font-serif text-[0.95rem] italic leading-relaxed text-ink-2">
            Rest of world is the difference between the published world total and the
            producers listed: the MCS &ldquo;Other countries&rdquo; aggregate, withheld
            figures, and production this atlas does not file under a separate entity.
            Gaps appear as &ldquo;—&rdquo; rather than being estimated. The same
            tonnages appear on each nation&rsquo;s dossier, resources tab.
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
 * One producer's share, drawn to an absolute scale: the track is 100% of the
 * published world total, so a 24% bar reads as a quarter of the world at a
 * glance and the ten pages stay comparable with each other. The bar is
 * aria-hidden decoration; every figure it encodes sits beside it as text.
 */
function ShareBar({ share, rest = false }: { share: number | null; rest?: boolean }) {
  const width = share == null ? 0 : Math.max(share * 100, 0.4);
  return (
    <svg aria-hidden="true" className="block h-[5px] w-full">
      <rect width="100%" height="5" rx="2" fill="rgba(22,32,30,0.08)" />
      {share != null && (
        <rect
          width={`${width}%`}
          height="5"
          rx="2"
          fill={rest ? "url(#row-hatch)" : "var(--color-verdigris-deep)"}
        />
      )}
    </svg>
  );
}

function Figures({ p, c }: { p: ProducerShare; c: Commodity }) {
  const cell = (value: number | null, share: number | null, held: boolean) =>
    held ? "withheld (W)" : value == null ? "—" : `${formatTonnes(value)} · ${pct(share)}`;
  return (
    <p className="mt-1.5 font-mono text-[0.72rem] tabular-nums leading-relaxed text-ink-3">
      {c.years.reported}: {cell(p.reported, p.shareReported, p.reportedWithheld)}
      <span aria-hidden="true"> &nbsp;·&nbsp; </span>
      {c.years.estimate} est.: {cell(p.estimate, p.shareEstimate, p.estimateWithheld)}
    </p>
  );
}

function ProducerRow({ p, c, rank }: { p: ProducerShare; c: Commodity; rank: number }) {
  return (
    <li className="grid gap-x-6 gap-y-1 border-t border-[rgba(22,32,30,0.12)] py-3.5 sm:grid-cols-[minmax(0,15rem)_1fr] sm:items-center">
      <div className="flex items-baseline gap-2.5">
        <span className="w-[1.6rem] flex-none font-mono text-[0.68rem] tabular-nums text-ink-3">
          {rank}
        </span>
        <Link
          href={`/country/${p.code}#m=${c.key}&tab=resources`}
          prefetch={false}
          className="font-display text-[1.08rem] font-[440] leading-snug text-[#16201e] transition-colors hover:text-copper-deep"
        >
          {p.flag && <span className="mr-1.5">{p.flag}</span>}
          {p.name}
        </Link>
      </div>
      <div>
        <ShareBar share={p.shareEstimate} />
        <Figures p={p} c={c} />
      </div>
    </li>
  );
}

/**
 * A residual figure. When the listed producers sum to the world total within
 * its printed rounding, the residual is not a real zero — it is smaller than
 * the table's precision, and printing "0 t" would claim more than the data
 * does (lithium's reported year, where the USGS excludes the withheld US
 * output from its world total, is exactly this case).
 */
function restCell(value: number, share: number): string {
  if (value <= 0) return "below the table's rounding";
  return `${formatTonnes(value)} · ${pct(share)}`;
}

/**
 * The residual, as its own row rather than a footnote: world total minus the
 * listed producers. Hatched, not solid — it is real, published tonnage, but
 * not attributable to a single nation on this page.
 */
function RestOfWorldRow({ c }: { c: Commodity }) {
  return (
    <div className="grid gap-x-6 gap-y-1 border-t border-[rgba(22,32,30,0.12)] py-3.5 sm:grid-cols-[minmax(0,15rem)_1fr] sm:items-center">
      <div className="flex items-baseline gap-2.5">
        <span className="w-[1.6rem] flex-none" aria-hidden="true" />
        <span className="font-display text-[1.08rem] font-[440] italic leading-snug text-ink-2">
          Rest of world
        </span>
      </div>
      <div>
        <ShareBar share={c.restOfWorld.shareEstimate} rest />
        <p className="mt-1.5 font-mono text-[0.72rem] tabular-nums leading-relaxed text-ink-3">
          {c.years.reported}: {restCell(c.restOfWorld.reported, c.restOfWorld.shareReported)}
          <span aria-hidden="true"> &nbsp;·&nbsp; </span>
          {c.years.estimate} est.:{" "}
          {restCell(c.restOfWorld.estimate, c.restOfWorld.shareEstimate)}
        </p>
      </div>
    </div>
  );
}
