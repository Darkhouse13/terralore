import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { allCommodities, commoditiesSource, type Commodity } from "@/lib/commodities";
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
    <main className="min-h-screen bg-bone">
      <div className="mx-auto max-w-4xl px-5 pt-4 pb-16">
        <nav aria-label="Breadcrumb" className="font-mono text-[10px] tracking-[0.16em] uppercase">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="text-oxide">
                ← Terralore
              </Link>
            </li>
            <li aria-hidden="true" className="text-oxide">
              ·
            </li>
            <li aria-current="page" className="text-umber">
              Commodities
            </li>
          </ol>
        </nav>

        <header className="settle mt-3 pb-4">
          <h1 className="max-w-[16ch] font-display text-[42px] leading-none font-extrabold tracking-tight uppercase md:text-[64px]">
            Suppliers
          </h1>
          <p className="mt-3 font-mono text-[11px] text-oxide uppercase">
            The measured earth · {commodities.length} commodities · {producing}{" "}
            producing nations
          </p>
          <p className="mt-2 max-w-2xl font-sans text-[14px] leading-relaxed text-umber">
            Every dossier says what a nation digs. This is the other axis: one mineral,
            every producer.
          </p>

          <p className="mt-4 max-w-2xl font-sans text-[14px] leading-relaxed">
            Ten commodities, from the U.S. Geological Survey&rsquo;s{" "}
            <strong className="font-medium text-basalt">{source.label}</strong> — mine
            production, in tonnes, for {producing}{" "}
            producing nations. Each page lists every producer the USGS names, that
            nation&rsquo;s share of the published world total for {yr} (reported) and{" "}
            {ye}{" "}(estimated), and an honest &ldquo;Rest of world&rdquo; remainder for
            what the list does not cover. Every figure links into its nation&rsquo;s
            dossier, where the same tonnage sits beside the rest of the country&rsquo;s
            record.
          </p>

          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <Stat label="Commodities" value={String(commodities.length)} />
            <Stat label="Producing nations" value={String(producing)} />
            <Stat label="Reported year" value={String(yr)} />
            <Stat label="Estimate year" value={`${ye}`} />
          </dl>
        </header>

        <section className="mt-4">
          <h2 className="font-display text-[22px] font-extrabold tracking-tight uppercase">
            The ten commodities
          </h2>
          <p className="mt-2 max-w-2xl font-sans text-[13.5px] leading-relaxed text-umber">
            The shaded segments are the three largest producers&rsquo; shares of the{" "}
            {ye}{" "}world estimate — how much of each mineral&rsquo;s map is held by three
            capitals.
          </p>

          <ol className="mt-4 border-b-2 border-basalt">
            {commodities.map((c) => (
              <CommodityRow key={c.slug} c={c} />
            ))}
          </ol>
        </section>

        <footer className="mt-10 border-t-2 border-basalt pt-5">
          <div className="eyebrow mb-3 text-umber">Source</div>
          <p className="font-sans text-[13.5px] leading-relaxed">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-oxide underline underline-offset-2"
            >
              {source.label}
            </a>{" "}
            <span className="text-umber">
              — {source.publisher} · {source.license} · accessed {source.accessed}.
            </span>
          </p>
          <p className="mt-4 max-w-2xl font-sans text-xs leading-relaxed text-umber">
            Shares are computed against the published MCS world totals; withheld figures
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
      <dt className="eyebrow text-umber">{label}</dt>
      <dd className="mt-1 font-mono text-[19px] leading-none tabular-nums">{value}</dd>
    </div>
  );
}

// The sediment walk, hub scale: the largest producer is the deepest pigment,
// then upward through the beds — the same order the commodity page's bars use.
const STEP_CLASS = ["bg-basalt", "bg-umber", "bg-oxide"];

/**
 * One commodity of the core. The three stacked blocks are a concentration
 * glance — the top three producers' shares, each drawn on a track that is
 * 100% of the published world total — and are aria-hidden decoration: the
 * counts beside them carry the real figures, house rule.
 */
function CommodityRow({ c }: { c: Commodity }) {
  const top3 = c.producers.filter((p) => p.shareEstimate != null).slice(0, 3);

  return (
    <li className="border-t-2 border-basalt">
      <Link
        href={`/commodities/${c.slug}`}
        prefetch={false}
        className="pressable grid gap-x-6 gap-y-2 py-4 sm:grid-cols-[minmax(0,13rem)_1fr] sm:items-center"
      >
        <div>
          <h3 className="font-display text-[20px] font-extrabold leading-snug tracking-tight uppercase text-basalt">
            {c.name}
          </h3>
          <p className="mt-0.5 font-mono text-[11px] tabular-nums text-umber">
            {formatTonnes(c.world.estimate)} · {c.years.estimate} est.
          </p>
        </div>

        <div>
          <div aria-hidden="true" className="flex flex-col gap-[2px]">
            {top3.map((p, i) => (
              <div
                key={p.code}
                className={`h-[6px] ${STEP_CLASS[i]}`}
                style={{ width: `${Math.max((p.shareEstimate ?? 0) * 100, 0.4)}%` }}
              />
            ))}
          </div>
          <p className="mt-1.5 font-mono text-[11px] tabular-nums leading-relaxed text-umber">
            {top3[0] && (
              <>
                largest producer{" "}
                <span className="text-basalt">{top3[0].name}</span> ·{" "}
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
