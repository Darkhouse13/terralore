import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { allPeriods, corpusStats, dominantCategory, formatYear, type PeriodBucket } from "@/lib/chronology";
import { CATEGORY_META } from "@/lib/types";
import { abs, breadcrumbLd, routes, SITE_NAME, siteOgImages } from "@/lib/seo";

/**
 * The Chronology — the corpus read along its other axis.
 *
 * Every event in the archive is authored inside a nation and, until this route,
 * was reachable only from that nation's chronicle. That makes the single most
 * interesting question the archive can answer — "what was happening everywhere
 * in 1492?" — impossible to ask. This hub is the index of periods; each one
 * opens a page that lays the whole world out side by side for that stretch of
 * time.
 *
 * Server-rendered, no JavaScript required: the shape of the corpus is in the
 * initial HTML, and so is every event on the pages it leads to.
 */

// Evaluated once at build time — `corpusStats` reads the memoised flattened
// corpus, so this costs nothing beyond the work the pages already do.
const STATS = corpusStats();

const DESCRIPTION =
  `A cross-nation chronology: ${STATS.events.toLocaleString("en-US")} sourced events from ` +
  `${STATS.nations} national archives, arranged by period so any century reads at once.`;

export const metadata: Metadata = {
  title: "The Chronology",
  description: DESCRIPTION,
  keywords: [
    "world history timeline",
    "global chronology",
    "what happened in history by century",
    "world events by period",
    "sourced history timeline",
  ],
  alternates: { canonical: "/timeline" },
  openGraph: {
    type: "website",
    title: "The Chronology — world history, period by period",
    description: DESCRIPTION,
    url: "/timeline",
    siteName: SITE_NAME,
    images: siteOgImages(),
  },
  twitter: {
    card: "summary_large_image",
    title: "The Chronology — world history, period by period",
    description: DESCRIPTION,
    images: siteOgImages(),
  },
};

export default function ChronologyPage() {
  const periods = allPeriods();
  // The 20th century holds ~36% of the corpus on its own; a linear bar would
  // flatten every other period to an invisible sliver. The bar is square-root
  // scaled so the shape stays legible, and the true count sits beside it.
  const busiest = Math.max(...periods.map((p) => p.events.length));

  // Split on `start`, not `end`: the 1st-century-BCE bucket runs to year 0, so
  // an `end < 0` test would file it under the common era.
  const ancient = periods.filter((p) => p.start < 0);
  const common = periods.filter((p) => p.start >= 0);

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": `${abs("/timeline")}#collection`,
            name: `The Chronology — ${SITE_NAME}`,
            description: DESCRIPTION,
            url: abs("/timeline"),
            inLanguage: "en",
            isAccessibleForFree: true,
            isPartOf: { "@type": "WebSite", name: SITE_NAME, url: abs(routes.home()) },
            mainEntity: {
              "@type": "ItemList",
              itemListOrder: "https://schema.org/ItemListOrderAscending",
              numberOfItems: periods.length,
              itemListElement: periods.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: p.label,
                url: abs(`/timeline/${p.slug}`),
              })),
            },
          },
          breadcrumbLd([
            { name: SITE_NAME, path: routes.home() },
            { name: "The Chronology", path: "/timeline" },
          ]),
        ]}
      />

      <main className="min-h-screen bg-bone text-basalt">
        <div className="mx-auto max-w-[62rem] px-5 pb-24 pt-6 md:px-8 md:pt-10">
          <nav aria-label="Breadcrumb" className="font-mono text-[10px] tracking-[0.16em] uppercase text-oxide">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/">← Terralore</Link>
              </li>
              <li aria-hidden="true">·</li>
              <li aria-current="page" className="text-umber">
                Chronology
              </li>
            </ol>
          </nav>

          <header className="settle mt-6 pb-10">
            <p className="eyebrow text-umber">The archive, read across nations</p>

            <h1 className="mt-3 font-display text-[42px] font-extrabold uppercase leading-none tracking-tight md:text-[64px]">
              The world, in order
            </h1>

            <p className="mt-3 max-w-[46rem] font-sans text-[17px] font-medium leading-snug text-umber md:text-[19px]">
              Every chronicle in Terralore is written nation by nation. This is the other axis.
            </p>

            <p className="mt-5 max-w-[46rem] font-sans text-[16px] leading-[1.65]">
              Pick a period and read what was happening everywhere in it — the same verified
              records, with the same citations, laid side by side across the whole archive. The
              buckets widen as they go back, because the record does too: decades once the
              archive thickens after 1800, centuries for the rest of recorded history, millennia
              before 1000&nbsp;BCE, and a single page for the deep prehistory of our species,
              where the record is measured in hundreds of thousands of years rather than reigns.
            </p>

            <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              <Stat label="Sourced events" value={STATS.events.toLocaleString("en-US")} />
              <Stat label="Nations" value={String(STATS.nations)} />
              <Stat label="References" value={STATS.sources.toLocaleString("en-US")} />
              <Stat label="Periods" value={String(periods.length)} />
            </dl>

            <p className="mt-7 font-mono text-[10px] uppercase tracking-[0.16em] text-umber">
              Earliest record {yearText(STATS.earliest)} · latest {yearText(STATS.latest)}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/timeline/${common.length ? common[common.length - 1].slug : periods[periods.length - 1].slug}`}
                prefetch={false}
                className="pressable inline-flex items-center gap-2 border-2 border-basalt bg-basalt px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-bone"
              >
                Start with the present
              </Link>
              <Link
                href={routes.atlas()}
                className="pressable inline-flex items-center gap-2 border-2 border-basalt px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-oxide"
              >
                Browse the atlas
              </Link>
            </div>
          </header>

          <p className="font-sans text-[13px] leading-relaxed text-umber">
            Bands are drawn to the busiest period, square-root scaled so sparse ages stay
            visible; each band takes the pigment of its period&rsquo;s dominant category. The
            true count sits beside every band.
          </p>

          <PeriodList
            title="Deep time and the ancient world"
            blurb="Sparse by nature — what survives from before the common era survives in stone, sediment and a handful of chronicles."
            periods={ancient}
            busiest={busiest}
            total={STATS.events}
          />

          <PeriodList
            title="The common era"
            blurb="The record thickens as it approaches the present: written archives, then printing, then states that document themselves."
            periods={common}
            busiest={busiest}
            total={STATS.events}
          />

          <footer className="border-t-2 border-basalt pt-8">
            <p className="font-mono text-[10px] leading-relaxed text-umber">
              The Chronology · {SITE_NAME}. Every event on these pages is the same record, with the
              same citations, as the one on its nation&rsquo;s chronicle — nothing here is
              synthesised across borders.
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

function PeriodList({
  title,
  blurb,
  periods,
  busiest,
  total,
}: {
  title: string;
  blurb: string;
  periods: PeriodBucket[];
  busiest: number;
  total: number;
}) {
  if (periods.length === 0) return null;

  return (
    <section className="py-11">
      <div aria-hidden className="cut-rule mb-7" />
      <h2 className="font-display text-[22px] font-extrabold uppercase leading-tight tracking-tight md:text-[26px]">
        {title}
      </h2>
      <p className="mt-2.5 max-w-[46rem] font-sans text-[14.5px] leading-relaxed text-umber">
        {blurb}
      </p>

      <ol className="mt-7 border-t-2 border-basalt">
        {periods.map((p) => (
          <PeriodRow key={p.slug} period={p} busiest={busiest} total={total} />
        ))}
      </ol>
    </section>
  );
}

/**
 * One stratum of the core.
 *
 * This page is the one place in the product that is *about* depth in time, and
 * it used to render as a list of horizontal bar-chart rows — a perfectly good
 * data table that said nothing about the subject. Each period is now a band in
 * a single continuous column: its **width** carries how much of the record
 * falls there, its **pigment** carries what the period was mostly made of. Read
 * top to bottom, the column is a core sample of recorded history — you can see
 * the archive thin out into deep time, and see the 1940s run to war pigment
 * before you read a single label.
 *
 * The text, the link and the counts are unchanged, so nothing an engine or a
 * screen reader consumes moved: the band is `aria-hidden` decoration layered
 * over a normal list item.
 */
function PeriodRow({
  period,
  busiest,
  total,
}: {
  period: PeriodBucket;
  busiest: number;
  total: number;
}) {
  const n = period.events.length;
  const share = (n / total) * 100;
  // Square-root scaled: the densest period holds hundreds of events and the
  // sparsest holds a handful, so a linear scale would render most of recorded
  // history as an invisible hairline.
  const width = Math.max(6, Math.sqrt(n / busiest) * 100);
  const dom = dominantCategory(period.events);
  const tint = dom?.tint ?? "var(--color-clay)";

  return (
    <li className="border-b-2 border-basalt">
      <Link
        href={`/timeline/${period.slug}`}
        prefetch={false}
        className="pressable grid grid-cols-[70px_1fr] items-center gap-x-4 gap-y-1 py-3.5 sm:grid-cols-[70px_minmax(0,17rem)_1fr] sm:gap-x-6"
      >
        {/* the stratum: a solid band of the core, in this period's own pigment */}
        <span aria-hidden="true" className="row-span-2 block self-center overflow-hidden sm:row-span-1">
          <span
            className="block h-[14px]"
            style={{
              width: `${width}%`,
              background: tint,
            }}
          />
        </span>

        <div>
          <h3 className="font-display text-[16px] font-extrabold uppercase leading-snug tracking-tight text-basalt">
            {period.label}
          </h3>
          <p className="mt-0.5 font-mono text-[10px] tabular-nums text-umber">
            {spanLabel(period)}
          </p>
        </div>

        <p className="font-mono text-[11px] tabular-nums text-umber sm:text-right">
          <span className="text-oxide">{n.toLocaleString("en-US")}</span> events ·{" "}
          {period.nations} {period.nations === 1 ? "nation" : "nations"} ·{" "}
          {share >= 1 ? share.toFixed(0) : share.toFixed(1)}%
          {dom && (
            <>
              {" · mostly "}
              <span style={{ color: CATEGORY_META[dom.category].ink }}>
                {CATEGORY_META[dom.category].label}
              </span>
            </>
          )}
        </p>
      </Link>
    </li>
  );
}

/* ── helpers ──────────────────────────────────────────────────────────────── */

/**
 * `formatYear` is the corpus formatter, but deep time reaches 3.6 million years
 * and reads as a wall of digits without grouping. Group only above 10,000 so
 * ordinary years stay "1492", never "1,492".
 */
function yearText(y: number): string {
  return Math.abs(y) >= 10000
    ? `${Math.abs(y).toLocaleString("en-US")}${y < 0 ? " BCE" : ""}`
    : formatYear(y);
}

function digits(n: number): string {
  return n >= 10000 ? n.toLocaleString("en-US") : String(n);
}

/**
 * The period's year range. Two edges to respect: deep prehistory has no
 * meaningful lower bound, and the century buckets straddle a year zero the
 * calendar does not have (1st century BCE ends at 0, 1st century CE starts at 0).
 */
function spanLabel(p: PeriodBucket): string {
  if (p.start === Number.MIN_SAFE_INTEGER) return `Before ${yearText(p.end + 1)}`;
  if (p.start < 0) {
    return `${digits(Math.abs(p.start))}–${digits(p.end === 0 ? 1 : Math.abs(p.end))} BCE`;
  }
  return `${digits(p.start === 0 ? 1 : p.start)}–${digits(p.end)}`;
}
