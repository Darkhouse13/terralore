import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { allPeriods, corpusStats, dominantCategory, formatYear, type PeriodBucket } from "@/lib/chronology";
import { CATEGORY_META } from "@/lib/types";
import { abs, breadcrumbLd, routes, SITE_NAME } from "@/lib/seo";

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
  },
  twitter: {
    card: "summary_large_image",
    title: "The Chronology — world history, period by period",
    description: DESCRIPTION,
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
                Chronology
              </li>
            </ol>
          </nav>

          <header className="mt-9 border-b border-[rgba(138, 74, 40,0.22)] pb-10">
            <p className="eyebrow text-copper-deep">The archive, read across nations</p>

            <h1 className="mt-4 max-w-[18ch] font-display text-[clamp(2.9rem,9vw,4.6rem)] font-[380] leading-[0.94] tracking-[-0.015em] text-[#16201e]">
              The world, in order
            </h1>

            <p className="mt-4 max-w-[46rem] font-serif text-[clamp(1.15rem,3.4vw,1.45rem)] font-[340] italic leading-[1.45] text-[#454f4c]">
              Every chronicle in Terralore is written nation by nation. This is the other axis.
            </p>

            <p className="mt-7 max-w-[46rem] font-serif text-[1.18rem] leading-[1.66] text-[#16201e]">
              Pick a period and read what was happening everywhere in it — the same verified
              records, with the same citations, laid side by side across the whole archive. The
              buckets widen as they go back, because the record does too: decades once the
              archive thickens after 1800, centuries for the rest of recorded history, millennia
              before 1000&nbsp;BCE, and a single page for the deep prehistory of our species,
              where the record is measured in hundreds of thousands of years rather than reigns.
            </p>

            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              <Stat label="Sourced events" value={STATS.events.toLocaleString("en-US")} />
              <Stat label="Nations" value={String(STATS.nations)} />
              <Stat label="References" value={STATS.sources.toLocaleString("en-US")} />
              <Stat label="Periods" value={String(periods.length)} />
            </dl>

            <p className="mt-8 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-ink-3">
              Earliest record {yearText(STATS.earliest)} · latest {yearText(STATS.latest)}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={`/timeline/${common.length ? common[common.length - 1].slug : periods[periods.length - 1].slug}`}
                prefetch={false}
                className="inline-flex items-center gap-2 rounded-[3px] bg-[#16201e] px-5 py-2.5 font-sans text-[0.9rem] font-medium text-land-0 transition-colors hover:bg-[#16201e]"
              >
                Start with the present
              </Link>
              <Link
                href={routes.atlas()}
                className="inline-flex items-center gap-2 rounded-[3px] border border-[rgba(138, 74, 40,0.35)] px-5 py-2.5 font-sans text-[0.9rem] text-[#8a4a28] transition-colors hover:bg-[rgba(200, 114, 68,0.1)]"
              >
                Browse the atlas
              </Link>
            </div>
          </header>

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

          <footer className="pt-11">
            <p className="font-mono text-[0.68rem] leading-relaxed text-ink-3">
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
      <dt className="eyebrow text-ink-3">{label}</dt>
      <dd className="mt-1 font-display text-[1.55rem] font-[420] tabular-nums leading-none text-[#16201e]">
        {value}
      </dd>
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
      <span aria-hidden className="stratum-rule mb-7 block max-w-[110px]" />
      <h2 className="font-display text-[clamp(1.7rem,4.5vw,2.2rem)] font-[400] leading-tight text-[#16201e]">
        {title}
      </h2>
      <p className="mt-2.5 max-w-[46rem] font-serif text-[1.02rem] italic leading-relaxed text-[#454f4c]">
        {blurb}
      </p>

      <ol className="mt-7">
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
 * the archive thin out into deep time, and see the 1940s run madder before you
 * read a single label.
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
  const tint = dom?.tint ?? "var(--color-copper)";

  return (
    <li>
      <Link
        href={`/timeline/${period.slug}`}
        prefetch={false}
        className="group relative grid gap-2 py-3.5 pl-[86px] transition-colors hover:bg-[rgba(200,114,68,0.06)] sm:grid-cols-[minmax(0,17rem)_1fr] sm:items-baseline sm:gap-6"
      >
        {/* the stratum: a band of the core, in this period's own pigment */}
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 top-0 w-[70px] overflow-hidden"
        >
          <span
            className="absolute right-0 top-0 h-full transition-[width] duration-200"
            style={{
              width: `${width}%`,
              background: tint,
              opacity: 0.72,
            }}
          />
          {/* the hairline between layers — a bedding plane, not a table rule */}
          <span className="absolute inset-x-0 top-0 h-px bg-[rgba(22,32,30,0.16)]" />
        </span>

        <div>
          <h3 className="font-display text-[1.16rem] font-[440] leading-snug text-[#16201e] transition-colors group-hover:text-copper-deep">
            {period.label}
          </h3>
          <p className="mt-0.5 font-mono text-[0.68rem] tabular-nums text-ink-3">
            {spanLabel(period)}
          </p>
        </div>

        <p className="font-mono text-[0.72rem] tabular-nums text-ink-3">
          <span className="text-copper-deep">{n.toLocaleString("en-US")}</span> events ·{" "}
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
