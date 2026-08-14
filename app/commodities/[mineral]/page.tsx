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
import { producerFragment, shareClaimId } from "@/lib/claim-id";
import {
  breadcrumbLd,
  commodityDescription,
  commodityLd,
  mdTwinTypes,
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
 * chronicle and the chronology. The proof-flip is CSS-only (deviations E9):
 * press a row and it turns over to its observation label; PROOF VIEW is a
 * native checkbox.
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
    alternates: { canonical: path, types: mdTwinTypes(path) },
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

// The sediment walk: the largest producer is the deepest pigment, then upward
// through the beds; everything below the podium is clay. Decoration over text
// that carries the real figures (house rule).
const barColor = (rank: number) =>
  rank === 1
    ? "var(--color-basalt)"
    : rank === 2
      ? "var(--color-umber)"
      : rank === 3
        ? "var(--color-oxide)"
        : "var(--color-clay)";

// The hatch of the Rest of world band: real, published tonnage that is not
// attributable to a single nation on this page.
const REST_HATCH =
  "repeating-linear-gradient(45deg, var(--color-absent) 0 3px, var(--color-bone) 3px 7px)";

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
  const idx = COMMODITY_META.findIndex((m) => m.slug === c.slug) + 1;
  const total = COMMODITY_META.length;

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
    <main className="min-h-screen bg-bone">
      <div className="mount mx-auto max-w-4xl px-5 pt-4 pb-16">
        <span aria-hidden className="mount-rail" />
        <nav aria-label="Breadcrumb" className="font-mono text-[10px] tracking-[0.16em] uppercase">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/commodities" className="text-oxide">
                ← Suppliers
              </Link>
            </li>
            <li aria-hidden="true" className="text-oxide">
              ·
            </li>
            <li aria-current="page" className="text-oxide">
              {c.name}
            </li>
            <li aria-hidden="true" className="text-oxide">
              ·
            </li>
            <li className="text-umber">
              {idx}/{total}
            </li>
          </ol>
        </nav>

        <header className="settle relative mt-3 pb-4">
          <span aria-hidden className="mount-tick">
            <span>
              COMMODITY
              <br />
              OBSERVED {yr} · {ye} EST
            </span>
          </span>
          <h1 className="max-w-[16ch] font-display text-[42px] leading-none font-extrabold tracking-tight uppercase md:text-[64px]">
            {c.name}
          </h1>
          <p className="mt-3 font-mono text-[11px] text-oxide uppercase">
            Who supplies the world · tonnes of mine production · observed {yr} · {ye}{" "}
            est.
          </p>
          <p className="mt-2 max-w-2xl font-sans text-[14px] leading-relaxed text-umber">
            {METRIC_DEFS[c.key]}
          </p>

          <p className="mt-4 max-w-2xl font-sans text-[14px] leading-relaxed">
            Figures are <strong className="text-basalt">mine production</strong>{" "}— the
            MCS statistics row
            &ldquo;{c.detail}&rdquo; — as published by the U.S. Geological Survey in the{" "}
            {source.label}. They measure what left mines in each calendar year: not
            reserves in the ground, and not refined or smelted output, which for several
            of these commodities is concentrated in different hands. {ye} is the USGS
            estimate; {yr} is the reported figure.
          </p>

          <dl
            id="claim-world"
            className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4"
          >
            <Stat label={`World total · ${ye} est.`} value={formatTonnes(c.world.estimate)} />
            <Stat label={`World total · ${yr}`} value={formatTonnes(c.world.reported)} />
            <Stat label="Producers listed" value={String(producing)} />
            <Stat label={`Top three · ${ye} est.`} value={pct(c.topThreeShare)} />
          </dl>

          {top3.length === 3 && (
            <p className="mt-5 max-w-2xl font-sans text-[13.5px] leading-relaxed text-umber">
              The three largest producers — {top3[0].name}, {top3[1].name} and{" "}
              {top3[2].name} — account for {pct(c.topThreeShare)} of the {ye} world
              estimate of {formatTonnes(c.world.estimate)}.
            </p>
          )}
        </header>

        {/* ── The share table: every listed producer, both years, one residual ── */}
        <section className="mt-4">
          <h2 className="font-display text-[22px] font-extrabold tracking-tight uppercase">
            Share of world production
          </h2>
          <p className="mt-2 max-w-2xl font-sans text-[13.5px] leading-relaxed text-umber">
            Each bar is that nation&rsquo;s share of the published world total for the{" "}
            {ye} estimate. Shares are computed against the world total itself, never
            against the sum of the producers listed.
          </p>

          <input type="checkbox" id="proofview" className="proof-toggle sr-only" />
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <p className="font-sans text-[13px] text-umber">
                Press a row — the specimen turns over to its label. The track is 100% of
                the world total: a quarter-width bar is a quarter of the world.
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
              {c.producers.map((p, i) => (
                <ProducerRow key={p.code} p={p} c={c} rank={i + 1} />
              ))}
            </ol>

            <RestOfWorldRow c={c} />

            {withheld.length > 0 && (
              <p className="mt-6 max-w-2xl font-sans text-[13.5px] leading-relaxed text-umber">
                {withheld.map((p) => p.name).join(", ")}:{" "}
                {withheld.length === 1 ? "its" : "their"}{" "}figure is withheld by the
                USGS (&ldquo;W&rdquo;) to avoid disclosing company proprietary data. A
                withheld figure is an absence in this table, never a zero; where the USGS
                folds withheld production into its world total, that tonnage sits inside
                Rest of world here.
              </p>
            )}
          </div>
        </section>

        {/* ── all ten, for lateral movement ── */}
        <nav aria-label="All commodities" className="mt-10">
          <div className="eyebrow mb-3 text-umber">The ten commodities</div>
          <ul className="flex flex-wrap gap-2">
            {COMMODITY_META.map((m) => (
              <li key={m.slug}>
                <Link
                  href={`/commodities/${m.slug}`}
                  prefetch={false}
                  aria-current={m.slug === c.slug ? "page" : undefined}
                  className={`pressable inline-block border-2 border-basalt px-3.5 py-1.5 font-sans text-[13px] ${
                    m.slug === c.slug ? "bg-basalt text-bone" : "text-basalt"
                  }`}
                >
                  {m.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

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
      <dt className="eyebrow text-umber">{label}</dt>
      <dd className="mt-1 font-mono text-[19px] leading-none tabular-nums">{value}</dd>
    </div>
  );
}

/**
 * One producer's share, drawn to an absolute scale: the sand track is 100% of
 * the published world total, so a 24% bar reads as a quarter of the world at a
 * glance and the ten pages stay comparable with each other. The bar is
 * aria-hidden decoration; every figure it encodes sits beside it as text.
 * A withheld estimate renders the absence chip and no bar — an absence has
 * no length.
 */
function ShareBar({
  share,
  fill,
  border = false,
}: {
  share: number | null;
  fill: string;
  border?: boolean;
}) {
  const width = share == null ? 0 : Math.max(share * 100, 0.4);
  return (
    <div aria-hidden="true" className="mt-[6px] h-[14px] bg-sand">
      {share != null && (
        <div
          className={`h-full${border ? " border-2 border-basalt" : ""}`}
          style={{ width: `${width}%`, background: fill }}
        />
      )}
    </div>
  );
}

function Figures({ p, c }: { p: ProducerShare; c: Commodity }) {
  const cell = (value: number | null, share: number | null, held: boolean) =>
    held ? "withheld (W)" : value == null ? "—" : `${formatTonnes(value)} · ${pct(share)}`;
  return (
    <p className="mt-[3px] font-mono text-[11px] tabular-nums leading-relaxed text-umber">
      {c.years.reported}: {cell(p.reported, p.shareReported, p.reportedWithheld)}
      <span aria-hidden="true"> &nbsp;·&nbsp; </span>
      {c.years.estimate} est.: {cell(p.estimate, p.shareEstimate, p.estimateWithheld)}
    </p>
  );
}

function ProducerRow({ p, c, rank }: { p: ProducerShare; c: Commodity; rank: number }) {
  const source = commoditiesSource();
  // The row's claim fragment; the estimate-year share claim is the one the
  // bar draws, so its ID is the one engraved on the reverse.
  const claim =
    !p.estimateWithheld && p.shareEstimate != null
      ? shareClaimId(p.code, c.key, c.years.estimate)
      : null;
  return (
    <li
      id={producerFragment(p.code)}
      className="border-b-2 border-basalt"
      style={{ contentVisibility: "auto", containIntrinsicBlockSize: "70px" }}
    >
      <div className="flip-scene flip-press">
        <div className="flip-card min-h-[68px]">
          <div className="flip-face pt-[9px]">
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0 truncate font-mono text-[12.5px] uppercase">
                <span className="text-oxide">{String(rank).padStart(2, "0")}</span>{" "}
                <Link
                  href={`/country/${p.code}#m=${c.key}&tab=resources`}
                  prefetch={false}
                  className="text-basalt"
                >
                  {p.name}
                </Link>
              </div>
              {p.estimateWithheld && (
                <span className="not-observed flex-none text-[9.5px]">WITHHELD (W)</span>
              )}
            </div>
            <Figures p={p} c={c} />
            {!p.estimateWithheld && (
              <ShareBar share={p.shareEstimate} fill={barColor(rank)} />
            )}
            <span className="sr-only">
              Observed {c.years.estimate} est. · {source.publisher}
            </span>
          </div>
          <div aria-hidden className="flip-face flip-back">
            <div className="flex h-full flex-col justify-center gap-[3px] px-3 py-1.5">
              <div className="font-mono text-[10.5px] tracking-[0.08em] uppercase">
                OBSERVED {c.years.estimate} EST · {source.id.toUpperCase()} —{" "}
                {source.publisher}
              </div>
              <div className="font-sans text-[11.5px] text-clay">
                mine production, not reserves · share of the published world total
                {claim && (
                  <span className="font-mono text-[9px] tracking-[0.06em] text-sand select-text">
                    {" "}
                    · {claim}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
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
 * not attributable to a single nation on this page. It does not flip: the
 * label belongs to observations of named producers.
 */
function RestOfWorldRow({ c }: { c: Commodity }) {
  return (
    <div className="border-b-2 border-basalt py-[9px]">
      <p className="font-mono text-[12.5px] uppercase text-umber">Rest of world</p>
      <p className="mt-[3px] font-mono text-[11px] tabular-nums leading-relaxed text-umber">
        {c.years.reported}: {restCell(c.restOfWorld.reported, c.restOfWorld.shareReported)}
        <span aria-hidden="true"> &nbsp;·&nbsp; </span>
        {c.years.estimate} est.:{" "}
        {restCell(c.restOfWorld.estimate, c.restOfWorld.shareEstimate)}
      </p>
      <ShareBar share={c.restOfWorld.shareEstimate} fill={REST_HATCH} border />
    </div>
  );
}
