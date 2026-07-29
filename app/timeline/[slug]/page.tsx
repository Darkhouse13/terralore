import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import {
  allPeriods,
  formatYear,
  getPeriod,
  type PeriodBucket,
  type WorldEvent,
} from "@/lib/chronology";
import { abs, breadcrumbLd, routes, SITE_NAME } from "@/lib/seo";
import { CATEGORY_META } from "@/lib/types";

/**
 * One period, every nation.
 *
 * The archive is authored nation by nation, so "what was happening everywhere
 * in the 15th century?" had no page to land on. This route is that page: every
 * event the corpus holds for a stretch of time, in year order, each one still
 * carrying the nation it belongs to and the sources it rests on.
 *
 * Density is the design problem. The 20th century alone holds ~1,600 events, so
 * the page is cut into chapters (decades for a century, centuries for a
 * millennium) with a contents nav at the top, then years, then — inside a year —
 * continents, so a reader scanning for one part of the world can find it without
 * reading the other five. Everything is in the initial HTML regardless: these
 * pages exist to be read and cited without JavaScript.
 */

/** Events listed in the JSON-LD ItemList. The page itself lists all of them. */
const LD_ITEM_CAP = 250;

const CONTINENT_ORDER = [
  "Africa",
  "Asia",
  "Europe",
  "North America",
  "South America",
  "Oceania",
  "Antarctica",
  "Antarctic",
];

export function generateStaticParams() {
  return allPeriods().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const period = getPeriod(slug);
  if (!period) return { title: `Unknown period — ${SITE_NAME}` };

  const path = `/timeline/${period.slug}`;
  const description =
    `${period.events.length.toLocaleString("en-US")} sourced events from ${period.nations} ` +
    `nations, ${spanLabel(period)} — what was happening across the world in ` +
    `${lowerLabel(period.label)}, drawn from the same verified national chronicles.`;

  return {
    title: period.label,
    description,
    keywords: [
      `${stripArticle(period.label)} timeline`,
      `world history ${stripArticle(period.label)}`,
      `what happened in ${lowerLabel(period.label)}`,
      "global chronology",
    ],
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title: `${period.label} — the world, year by year`,
      description,
      url: path,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: `${period.label} — the world, year by year`,
      description,
    },
  };
}

export default async function PeriodPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const period = getPeriod(slug);
  if (!period) notFound();

  const periods = allPeriods();
  const i = periods.findIndex((p) => p.slug === period.slug);
  const previous = i > 0 ? periods[i - 1] : null;
  const next = i >= 0 && i < periods.length - 1 ? periods[i + 1] : null;

  const chapters = buildChapters(period);
  const continents = continentTally(period.events);
  const path = `/timeline/${period.slug}`;
  const url = abs(path);
  const coverage = temporalCoverage(period);

  const nations = new Map<string, WorldEvent>();
  for (const ev of period.events) if (!nations.has(ev.code)) nations.set(ev.code, ev);

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": `${url}#collection`,
            name: `${period.label} — a world chronology`,
            description:
              `Every sourced event in the Terralore archive for ${lowerLabel(period.label)} ` +
              `(${spanLabel(period)}): ${period.events.length} records from ${period.nations} nations, ` +
              `in year order.`,
            url,
            inLanguage: "en",
            isAccessibleForFree: true,
            license: "https://creativecommons.org/licenses/by/4.0/",
            isPartOf: {
              "@type": "CollectionPage",
              name: `The Chronology — ${SITE_NAME}`,
              url: abs("/timeline"),
            },
            ...(coverage ? { temporalCoverage: coverage } : {}),
            about: [...nations.values()].map((ev) => ({
              "@type": "Country",
              name: ev.nation,
              identifier: ev.code,
              url: abs(routes.chronicle(ev.code)),
            })),
            mainEntity: {
              "@type": "ItemList",
              itemListOrder: "https://schema.org/ItemListOrderAscending",
              numberOfItems: period.events.length,
              // Capped: a complete list would add hundreds of kilobytes of
              // duplicate markup to pages that already carry every event as
              // readable prose.
              itemListElement: period.events.slice(0, LD_ITEM_CAP).map((ev, n) => ({
                "@type": "ListItem",
                position: n + 1,
                name: `${ev.yearLabel} — ${ev.title} (${ev.nation})`,
                url: abs(routes.chronicle(ev.code)),
              })),
            },
          },
          breadcrumbLd([
            { name: SITE_NAME, path: routes.home() },
            { name: "The Chronology", path: "/timeline" },
            { name: period.label, path },
          ]),
        ]}
      />

      <main className="paper-grain min-h-screen bg-land-0 text-ink">
        <div className="relative z-[1] mx-auto max-w-[46rem] px-5 pb-24 pt-8 md:px-8 md:pt-12">
          <nav aria-label="Breadcrumb" className="eyebrow text-ink-3">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" prefetch={false} className="transition-colors hover:text-copper-deep">
                  Terralore
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/timeline" prefetch={false} className="transition-colors hover:text-copper-deep">
                  Chronology
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-copper-deep">
                {stripArticle(period.label)}
              </li>
            </ol>
          </nav>

          <header className="mt-9 border-b border-[rgba(138, 74, 40,0.22)] pb-10">
            <p className="eyebrow text-copper-deep">A world chronology · {spanLabel(period)}</p>

            <h1 className="mt-4 font-display text-[clamp(2.6rem,8vw,4.2rem)] font-[380] leading-[0.96] tracking-[-0.015em] text-[#16201e]">
              {period.label}
            </h1>

            <p className="mt-4 font-serif text-[clamp(1.15rem,3.4vw,1.45rem)] font-[340] italic leading-[1.45] text-[#454f4c]">
              {period.events.length.toLocaleString("en-US")} sourced{" "}
              {period.events.length === 1 ? "event" : "events"}, {period.nations}{" "}
              {period.nations === 1 ? "nation" : "nations"}, in the order they happened.
            </p>

            <p className="mt-7 font-serif text-[1.18rem] leading-[1.66] text-[#16201e]">
              Every record below is drawn from the chronicle of the nation it belongs to, with the
              same citations. Read down for the whole period, or jump to a stretch of it; within
              each year the world is grouped by continent.
            </p>

            {continents.length > 0 && (
              <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                {continents.map((c) => (
                  <div key={c.name}>
                    <dt className="eyebrow text-ink-3">{c.name}</dt>
                    <dd className="mt-1 font-sans text-[0.97rem] font-medium tabular-nums text-[#16201e]">
                      {c.count.toLocaleString("en-US")}{" "}
                      <span className="font-mono text-[0.7rem] font-normal text-ink-3">
                        {c.count === 1 ? "event" : "events"} · {c.nations}{" "}
                        {c.nations === 1 ? "nation" : "nations"}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </header>

          {chapters.length > 1 && <Contents chapters={chapters} />}

          <article>
            {chapters.map((chapter) => (
              <ChapterSection
                key={chapter.anchor}
                chapter={chapter}
                showHeading={chapters.length > 1}
              />
            ))}
          </article>

          <PeriodFooter period={period} previous={previous} next={next} />
        </div>
      </main>
    </>
  );
}

/* ── pieces ───────────────────────────────────────────────────────────────── */

function Contents({ chapters }: { chapters: Chapter[] }) {
  return (
    <nav aria-label="Jump to" className="mt-10 border-b border-[rgba(138, 74, 40,0.22)] pb-9">
      <h2 className="eyebrow text-ink-3">Jump to</h2>
      <ol className="mt-4 flex flex-wrap gap-2.5">
        {chapters.map((c) => (
          <li key={c.anchor}>
            <a
              href={`#${c.anchor}`}
              className="inline-flex items-baseline gap-2 rounded-full border border-[rgba(138, 74, 40,0.28)] px-3.5 py-1.5 transition-colors hover:bg-[rgba(200, 114, 68,0.12)]"
            >
              <span className="font-mono text-[0.78rem] tabular-nums text-[#454f4c]">{c.label}</span>
              <span className="font-mono text-[0.64rem] tabular-nums text-ink-3">
                {c.count.toLocaleString("en-US")}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function ChapterSection({ chapter, showHeading }: { chapter: Chapter; showHeading: boolean }) {
  return (
    <section id={chapter.anchor} className="scroll-mt-6 border-b border-[rgba(138, 74, 40,0.22)] py-11">
      {showHeading && (
        <>
          <p className="eyebrow text-copper-deep">
            {chapter.count.toLocaleString("en-US")} {chapter.count === 1 ? "event" : "events"} ·{" "}
            {chapter.nations} {chapter.nations === 1 ? "nation" : "nations"}
          </p>
          <h2 className="mt-3 font-display text-[clamp(1.9rem,5.5vw,2.6rem)] font-[400] leading-[1.04] tracking-[-0.01em] text-[#16201e]">
            {chapter.label}
          </h2>
        </>
      )}

      <div className={showHeading ? "mt-8 space-y-10" : "space-y-10"}>
        {chapter.years.map((y) => (
          <YearSection key={y.anchor} group={y} />
        ))}
      </div>
    </section>
  );
}

function YearSection({ group }: { group: YearGroup }) {
  return (
    <section id={group.anchor} className="scroll-mt-6">
      <h3 className="flex items-baseline gap-3 font-display text-[1.5rem] font-[440] leading-none tabular-nums tracking-[-0.01em] text-[#16201e]">
        {group.dateTime ? (
          <time dateTime={group.dateTime}>{group.label}</time>
        ) : (
          /* BCE and deep-time years have no valid HTML date string. */
          <span>{group.label}</span>
        )}
        <span className="h-px flex-1 bg-[rgba(138, 74, 40,0.22)]" aria-hidden="true" />
        <span className="font-mono text-[0.64rem] font-normal uppercase tracking-[0.16em] text-ink-3">
          {group.count} {group.count === 1 ? "record" : "records"}
        </span>
      </h3>

      <div className="mt-5 space-y-7">
        {group.continents.map((c) => (
          <div key={c.name}>
            <p className="eyebrow text-ink-3">{c.name}</p>
            <ol className="mt-3.5 space-y-6">
              {c.events.map((ev, n) => (
                <EventItem key={`${ev.code}-${ev.year}-${n}`} event={ev} yearLabel={group.label} />
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}

function EventItem({ event, yearLabel }: { event: WorldEvent; yearLabel: string }) {
  const cat = CATEGORY_META[event.category];

  return (
    <li className="grid grid-cols-[2.6rem_1fr] gap-x-3 sm:grid-cols-[3.4rem_1fr] sm:gap-x-5">
      <div className="pt-[2px]">
        {event.flag && (
          <span className="block text-[1.35rem] leading-none" aria-hidden="true">
            {event.flag}
          </span>
        )}
        <span className="mt-1.5 block font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3">
          {event.code}
        </span>
      </div>

      <div className="border-l border-[rgba(138, 74, 40,0.22)] pl-4 sm:pl-6">
        <p className="font-mono text-[0.66rem] uppercase tracking-[0.12em]">
          <Link
            href={routes.chronicle(event.code)}
            prefetch={false}
            className="text-copper-deep transition-colors hover:underline"
          >
            {event.nation}
          </Link>
          <span className="text-ink-3"> · </span>
          <span style={{ color: cat?.tint }}>{cat?.label ?? event.category}</span>
          {event.yearLabel !== yearLabel && (
            <span className="text-ink-3"> · {event.yearLabel}</span>
          )}
        </p>

        <h4 className="mt-1.5 font-display text-[1.14rem] font-[440] leading-snug text-[#16201e]">
          {event.title}
        </h4>

        <p className="mt-1.5 font-serif text-[1.03rem] leading-[1.62] text-[#16201e]">
          {event.summary}
        </p>

        <p className="mt-2 font-serif text-[0.92rem] italic leading-snug text-[#454f4c]">
          {event.eraTitle}
        </p>

        {event.sources.length > 0 && (
          <p className="mt-2 font-mono text-[0.66rem] leading-relaxed text-ink-3">
            <span className="uppercase tracking-[0.16em]">Sources: </span>
            {event.sources.map((s, n) => (
              <span key={`${s.id}-${n}`}>
                {n > 0 && " · "}
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-dotted underline-offset-2 transition-colors hover:text-copper-deep"
                  >
                    {s.label}
                  </a>
                ) : (
                  <span>{s.label}</span>
                )}
                {s.publisher && <span> ({s.publisher})</span>}
              </span>
            ))}
          </p>
        )}
      </div>
    </li>
  );
}

function PeriodFooter({
  period,
  previous,
  next,
}: {
  period: PeriodBucket;
  previous: PeriodBucket | null;
  next: PeriodBucket | null;
}) {
  return (
    <footer className="pt-11">
      <nav aria-label="Adjacent periods" className="grid gap-4 sm:grid-cols-2">
        {previous ? (
          <Link
            href={`/timeline/${previous.slug}`}
            prefetch={false}
            className="group block rounded-[var(--radius-card)] border border-[rgba(138, 74, 40,0.28)] px-5 py-4 transition-colors hover:bg-[rgba(200, 114, 68,0.1)]"
          >
            <span className="eyebrow text-ink-3">← Earlier</span>
            <span className="mt-1.5 block font-display text-[1.14rem] font-[440] text-[#16201e] transition-colors group-hover:text-copper-deep">
              {previous.label}
            </span>
            <span className="mt-0.5 block font-mono text-[0.68rem] tabular-nums text-ink-3">
              {previous.events.length.toLocaleString("en-US")} events · {spanLabel(previous)}
            </span>
          </Link>
        ) : (
          <span />
        )}

        {next && (
          <Link
            href={`/timeline/${next.slug}`}
            prefetch={false}
            className="group block rounded-[var(--radius-card)] border border-[rgba(138, 74, 40,0.28)] px-5 py-4 text-right transition-colors hover:bg-[rgba(200, 114, 68,0.1)] sm:col-start-2"
          >
            <span className="eyebrow text-ink-3">Later →</span>
            <span className="mt-1.5 block font-display text-[1.14rem] font-[440] text-[#16201e] transition-colors group-hover:text-copper-deep">
              {next.label}
            </span>
            <span className="mt-0.5 block font-mono text-[0.68rem] tabular-nums text-ink-3">
              {next.events.length.toLocaleString("en-US")} events · {spanLabel(next)}
            </span>
          </Link>
        )}
      </nav>

      <div className="mt-9 flex flex-wrap gap-3">
        <Link
          href="/timeline"
          prefetch={false}
          className="inline-flex items-center gap-2 rounded-full bg-[#16201e] px-5 py-2.5 font-sans text-[0.9rem] font-medium text-land-0 transition-colors hover:bg-[#16201e]"
        >
          All periods
        </Link>
        <Link
          href={routes.atlas()}
          prefetch={false}
          className="inline-flex items-center gap-2 rounded-full border border-[rgba(138, 74, 40,0.35)] px-5 py-2.5 font-sans text-[0.9rem] text-[#8a4a28] transition-colors hover:bg-[rgba(200, 114, 68,0.1)]"
        >
          Browse the atlas
        </Link>
      </div>

      <p className="mt-11 font-mono text-[0.68rem] leading-relaxed text-ink-3">
        {period.label} · {SITE_NAME}. Each entry is the same verified record, with the same
        references, as the one on its nation&rsquo;s chronicle — follow a nation&rsquo;s name to read
        its history in full.
      </p>
    </footer>
  );
}

/* ── grouping ─────────────────────────────────────────────────────────────── */

interface ContinentGroup {
  name: string;
  events: WorldEvent[];
}

interface YearGroup {
  year: number;
  label: string;
  /** Valid HTML date string, or null for BCE / deep time. */
  dateTime: string | null;
  anchor: string;
  count: number;
  continents: ContinentGroup[];
}

interface Chapter {
  label: string;
  anchor: string;
  count: number;
  nations: number;
  years: YearGroup[];
}

/**
 * A period is cut into ten chapters — decades inside a century, centuries
 * inside a millennium — so the contents nav is always a scannable row and the
 * 1,600-event 20th century has landing points inside it. Deep prehistory spans
 * millions of years unevenly and stays a single chapter.
 */
function chapterSpan(p: PeriodBucket): number {
  if (p.start === Number.MIN_SAFE_INTEGER) return 0;
  return p.end - p.start + 1 >= 1000 ? 100 : 10;
}

function buildChapters(p: PeriodBucket): Chapter[] {
  const span = chapterSpan(p);
  const byChapter = new Map<number, WorldEvent[]>();

  for (const ev of p.events) {
    const key = span === 0 ? 0 : Math.floor(ev.year / span) * span;
    const bucket = byChapter.get(key);
    if (bucket) bucket.push(ev);
    else byChapter.set(key, [ev]);
  }

  return [...byChapter.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([key, events]) => ({
      label: span === 0 ? p.label : chapterLabel(key, span),
      anchor: span === 0 ? "all" : anchorFor("p", key),
      count: events.length,
      nations: new Set(events.map((e) => e.code)).size,
      years: buildYears(events),
    }));
}

function buildYears(events: WorldEvent[]): YearGroup[] {
  const byYear = new Map<number, WorldEvent[]>();
  for (const ev of events) {
    const bucket = byYear.get(ev.year);
    if (bucket) bucket.push(ev);
    else byYear.set(ev.year, [ev]);
  }

  return [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, list]) => ({
      year,
      label: yearText(year),
      // HTML dates cannot express BCE, so only CE years carry a machine date.
      dateTime: year >= 1 && year <= 9999 ? String(year).padStart(4, "0") : null,
      anchor: anchorFor("y", year),
      count: list.length,
      continents: groupByContinent(list),
    }));
}

/** Within a year, the world is ordered by continent, then by nation. */
function groupByContinent(events: WorldEvent[]): ContinentGroup[] {
  const map = new Map<string, WorldEvent[]>();
  for (const ev of events) {
    const name = ev.continent ?? "Elsewhere";
    const bucket = map.get(name);
    if (bucket) bucket.push(ev);
    else map.set(name, [ev]);
  }

  return [...map.entries()]
    .map(([name, list]) => ({
      name,
      events: list.sort((a, b) => a.nation.localeCompare(b.nation) || a.title.localeCompare(b.title)),
    }))
    .sort((a, b) => continentRank(a.name) - continentRank(b.name) || a.name.localeCompare(b.name));
}

function continentTally(events: WorldEvent[]): { name: string; count: number; nations: number }[] {
  const map = new Map<string, { count: number; codes: Set<string> }>();
  for (const ev of events) {
    const name = ev.continent ?? "Elsewhere";
    let row = map.get(name);
    if (!row) {
      row = { count: 0, codes: new Set() };
      map.set(name, row);
    }
    row.count += 1;
    row.codes.add(ev.code);
  }
  return [...map.entries()]
    .map(([name, row]) => ({ name, count: row.count, nations: row.codes.size }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function continentRank(name: string): number {
  const i = CONTINENT_ORDER.indexOf(name);
  return i === -1 ? CONTINENT_ORDER.length : i;
}

/* ── helpers ──────────────────────────────────────────────────────────────── */

/** Ids must be stable and valid: BCE years become e.g. `y450bce`. */
function anchorFor(prefix: string, year: number): string {
  return year < 0 ? `${prefix}${Math.abs(year)}bce` : `${prefix}${year}`;
}

function chapterLabel(key: number, span: number): string {
  // The decade "0s" straddles a year zero that does not exist; name its real span.
  if (key === 0) return `1–${span - 1}`;
  if (key > 0) return `${key}s`;
  // Chapters run oldest → newest, so a BCE chapter reads from its larger year.
  return `${digits(Math.abs(key))}–${digits(Math.abs(key + span - 1))} BCE`;
}

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
  if (p.start === Number.MIN_SAFE_INTEGER) return `before ${yearText(p.end + 1)}`;
  if (p.start < 0) {
    return `${digits(Math.abs(p.start))}–${digits(p.end === 0 ? 1 : Math.abs(p.end))} BCE`;
  }
  return `${digits(p.start === 0 ? 1 : p.start)}–${digits(p.end)}`;
}

/** ISO-8601 interval, where the years can be expressed at all. */
function temporalCoverage(p: PeriodBucket): string | null {
  if (p.start === Number.MIN_SAFE_INTEGER) return null;
  const iso = (y: number) =>
    y < 0 ? `-${String(Math.abs(y)).padStart(4, "0")}` : String(y).padStart(4, "0");
  return `${iso(p.start)}/${iso(p.end)}`;
}

/** "The 15th century" → "the 15th century" (mid-sentence use). */
function lowerLabel(label: string): string {
  return label.startsWith("The ")
    ? `the ${label.slice(4)}`
    : label.charAt(0).toLowerCase() + label.slice(1);
}

/** "The 15th century" → "15th century" (breadcrumbs, keywords). */
function stripArticle(label: string): string {
  return label.startsWith("The ") ? label.slice(4) : label;
}
