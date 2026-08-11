import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import {
  allCommodities,
  commoditiesSource,
  commoditiesUpdated,
  type Commodity,
} from "@/lib/commodities";
import { formatTonnes } from "@/lib/format";
import {
  breadcrumbLd,
  collectionLd,
  commoditiesDescription,
  routes,
  SITE_NAME,
  siteOgImages,
} from "@/lib/seo";

/**
 * The commodities index — the resources domain read across nations.
 *
 * Every tonnage here is authored once, in the USGS Mineral Commodity
 * Summaries, and reaches this page through the same build that feeds each
 * nation's dossier — so a figure on /commodities/copper is always the same
 * figure, with the same source, as the copper card on Chile's resources tab.
 * This hub is the index of the ten commodities; each opens the full producer
 * table with both published years.
 */

function pct(share: number): string {
  const p = share * 100;
  return `${p.toFixed(p >= 10 ? 0 : 1)}%`;
}

// Evaluated once at build time — the commodities table is memoised.
const COMMODITIES = allCommodities();
const PRODUCING = new Set(COMMODITIES.flatMap((c) => c.producers.map((p) => p.code))).size;
const DESCRIPTION = commoditiesDescription(
  COMMODITIES.length,
  PRODUCING,
  COMMODITIES[0].years.estimate,
);

export const metadata: Metadata = {
  title: "Commodities",
  description: DESCRIPTION,
  keywords: [
    "mineral production by country",
    "world mine production",
    "largest mineral producers",
    "USGS Mineral Commodity Summaries",
    "who produces the most copper lithium cobalt",
  ],
  alternates: { canonical: routes.commodities() },
  openGraph: {
    type: "website",
    title: "Commodities — who supplies the world",
    description: DESCRIPTION,
    url: routes.commodities(),
    siteName: SITE_NAME,
    images: siteOgImages(),
  },
  twitter: {
    card: "summary_large_image",
    title: "Commodities — who supplies the world",
    description: DESCRIPTION,
    images: siteOgImages(),
  },
};

export default function CommoditiesPage() {
  const commodities = COMMODITIES;
  const source = commoditiesSource();
  const producing = PRODUCING;
  const ye = commodities[0].years.estimate;
  const yr = commodities[0].years.reported;

  return (
    <>
    <JsonLd
      data={[
        collectionLd({
          name: `Commodities — ${SITE_NAME}`,
          description: DESCRIPTION,
          path: routes.commodities(),
          items: commodities.map((c) => ({ name: c.name, path: routes.commodity(c.slug) })),
        }),
        breadcrumbLd([
          { name: SITE_NAME, path: routes.home() },
          { name: "Commodities", path: routes.commodities() },
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
            <li aria-current="page" className="text-copper-deep">
              Commodities
            </li>
          </ol>
        </nav>

        <header
          className="mt-9 stratum-top pb-10"
          style={{ "--stratum-tint": "var(--color-verdigris-deep)" } as React.CSSProperties}
        >
          <p className="eyebrow text-verdigris-deep">The measured earth</p>

          <h1 className="mt-4 max-w-[18ch] font-display text-[clamp(2.9rem,9vw,4.6rem)] font-[380] leading-[0.94] tracking-[-0.015em] text-[#16201e]">
            Who supplies the world
          </h1>

          <p className="mt-4 max-w-[46rem] font-serif text-[clamp(1.15rem,3.4vw,1.45rem)] font-[340] italic leading-[1.45] text-[#454f4c]">
            Every dossier says what a nation digs. This is the other axis: one mineral,
            every producer.
          </p>

          <p className="mt-7 max-w-[46rem] font-serif text-[1.18rem] leading-[1.66] text-[#16201e]">
            Ten commodities, from the U.S. Geological Survey&rsquo;s{" "}
            <em>{source.label}</em> — mine production, in tonnes, for {producing}{" "}
            producing nations. Each page lists every producer the USGS names, that
            nation&rsquo;s share of the published world total for {yr} (reported) and{" "}
            {ye}{" "}(estimated), and an honest &ldquo;Rest of world&rdquo; remainder for
            what the list does not cover. Every figure links into its nation&rsquo;s
            dossier, where the same tonnage sits beside the rest of the country&rsquo;s
            record.
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <Stat label="Commodities" value={String(commodities.length)} />
            <Stat label="Producing nations" value={String(producing)} />
            <Stat label="Reported year" value={String(yr)} />
            <Stat label="Estimate year" value={`${ye}`} />
          </dl>
        </header>

        <section className="py-2">
          <span
            aria-hidden
            className="stratum-rule mb-7 block max-w-[110px]"
            style={{ "--stratum-tint": "var(--color-verdigris-deep)" } as React.CSSProperties}
          />
          <h2 className="font-display text-[clamp(1.7rem,4.5vw,2.2rem)] font-[400] leading-tight text-[#16201e]">
            The ten commodities
          </h2>
          <p className="mt-2.5 max-w-[46rem] font-serif text-[1.02rem] italic leading-relaxed text-[#454f4c]">
            The shaded segments are the three largest producers&rsquo; shares of the{" "}
            {ye}{" "}world estimate — how much of each mineral&rsquo;s map is held by three
            capitals.
          </p>

          <ol className="mt-7">
            {commodities.map((c) => (
              <CommodityRow key={c.slug} c={c} />
            ))}
          </ol>
        </section>

        <footer className="mt-14 border-t border-land-2 pt-8">
          <p className="font-mono text-[0.68rem] leading-relaxed text-ink-3">
            Commodities · Terralore. Source:{" "}
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-2 transition-colors hover:text-copper-deep hover:underline"
            >
              {source.label}
            </a>
            , {source.publisher} · {source.license} · accessed {source.accessed}. Shares
            are computed against the published MCS world totals; withheld figures
            (&ldquo;W&rdquo;) and unlisted producers appear inside each page&rsquo;s
            Rest of world, never as zeros.
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
 * One commodity of the core. The bar is a concentration glance — the top three
 * producers' shares as three verdigris steps on a track that is 100% of the
 * published world total — and is aria-hidden decoration: the counts beside it
 * carry the real figures, house rule.
 */
function CommodityRow({ c }: { c: Commodity }) {
  const top3 = c.producers.filter((p) => p.shareEstimate != null).slice(0, 3);
  const steps = ["var(--color-verdigris-deep)", "var(--color-verdigris)", "var(--color-verdigris-bright)"];
  let x = 0;
  const segments = top3.map((p, i) => {
    const seg = { x, w: (p.shareEstimate ?? 0) * 100, fill: steps[i] };
    x += seg.w + 0.35; // a hairline surface gap between fills
    return seg;
  });

  return (
    <li>
      <Link
        href={`/commodities/${c.slug}`}
        prefetch={false}
        className="group grid gap-x-6 gap-y-2 border-t border-[rgba(22,32,30,0.12)] py-4 transition-colors hover:bg-[rgba(87,166,149,0.07)] sm:grid-cols-[minmax(0,13rem)_1fr] sm:items-center"
      >
        <div>
          <h3 className="font-display text-[1.2rem] font-[440] leading-snug text-[#16201e] transition-colors group-hover:text-copper-deep">
            {c.name}
          </h3>
          <p className="mt-0.5 font-mono text-[0.68rem] tabular-nums text-ink-3">
            {formatTonnes(c.world.estimate)} · {c.years.estimate} est.
          </p>
        </div>

        <div>
          <svg aria-hidden="true" className="block h-[7px] w-full">
            <rect width="100%" height="7" rx="2" fill="rgba(22,32,30,0.08)" />
            {segments.map((s, i) => (
              <rect key={i} x={`${s.x}%`} width={`${Math.max(s.w, 0.4)}%`} height="7" rx="2" fill={s.fill} />
            ))}
          </svg>
          <p className="mt-1.5 font-mono text-[0.72rem] tabular-nums leading-relaxed text-ink-3">
            {top3[0] && (
              <>
                largest producer{" "}
                <span className="text-verdigris-deep">{top3[0].name}</span> ·{" "}
                {pct(top3[0].shareEstimate!)}
              </>
            )}
            {" · "}top three {pct(c.topThreeShare)} ·{" "}
            {c.producers.filter((p) => p.reported != null || p.estimate != null).length}{" "}
            producers listed
          </p>
        </div>
      </Link>
    </li>
  );
}
