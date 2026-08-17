import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { allThemes, formatYear, getTheme, periodFor } from "@/lib/chronology";
import type { Period, ThemeBucket, WorldEvent } from "@/lib/chronology";
import { SITE_NAME, abs, breadcrumbLd, clampText, routes, siteOgImages } from "@/lib/seo";
import type { EventCategory, Source } from "@/lib/types";

/**
 * One theme, one period — "Independence in the 1960s".
 *
 * This is where the full text lives. The parent `/themes/<slug>` route used to
 * render every event it held, which for Politics & Power meant a 7.6 MB
 * document: unreadable on a phone, and a shape no search engine has any reason
 * to rank. Splitting on the corpus's own period buckets fixes both at once —
 * the parent becomes an index, and each slice becomes a page with a subject a
 * person would actually search for.
 *
 * Nothing is lost in the split. Every event in the archive still reaches the
 * HTML in full — summary, era, nation and citations — it just reaches it here.
 *
 * Editorial note: as on the parent route, the generated prose describes only
 * the *shape* of the slice (how many events, how many nations, what span). It
 * makes no historical claim, because a generated sentence has no source.
 */

export function generateStaticParams() {
  // Only pairs that actually hold events — an empty (theme, period) page would
  // be a soft 404 with a canonical tag on it.
  return allThemes().flatMap((theme) =>
    groupByPeriod(theme.events).map((g) => ({ slug: theme.slug, period: g.period.slug })),
  );
}

export const dynamicParams = false;

/**
 * What each tag collects, in the corpus's own terms (the category comments in
 * `lib/types.ts`). These are definitions of the classification, not statements
 * about history.
 */
const THEME_SCOPE: Record<EventCategory, string> = {
  founding: "formation — origins, unifications and the founding of states as each nation's archive records them",
  independence: "independence — declarations, recognitions and transfers of sovereignty",
  war: "war and rupture — wars, invasions, conquests, battles and armed conflict",
  politics: "politics and power — dynasties, constitutions, revolutions and changes of regime",
  religion: "religion — faiths, institutions and religious change",
  culture: "culture and ideas — art, language, science and learning",
  economy: "economy and trade — trade, currency, industry and resources",
  colonization: "colonisation — the establishment, administration and ending of colonial rule",
  migration: "peoples and migration — settlement, movement and displacement",
  disaster: "catastrophe — plague, famine, earthquake and other disasters",
};

/* ── resolution ───────────────────────────────────────────────────────────── */

interface Slice {
  theme: ThemeBucket;
  period: Period;
  events: WorldEvent[];
  /** Position among the theme's own periods, for prev/next. */
  index: number;
  siblings: PeriodGroup[];
}

function getSlice(slug: string, periodSlug: string): Slice | undefined {
  const theme = getTheme(slug);
  if (!theme) return undefined;
  const siblings = groupByPeriod(theme.events);
  const index = siblings.findIndex((g) => g.period.slug === periodSlug);
  if (index === -1) return undefined;
  const { period, events } = siblings[index];
  return { theme, period, events, index, siblings };
}

/* ── generated prose ──────────────────────────────────────────────────────── */

function headline(theme: ThemeBucket, period: Period): string {
  return `${theme.label} in ${lowerPeriod(period.label)}`;
}

function standfirst(slice: Slice): string {
  const { theme, period, events } = slice;
  const first = events[0];
  const last = events[events.length - 1];
  const nations = new Set(events.map((e) => e.code)).size;
  if (events.length === 1) {
    return (
      `One event in the ${SITE_NAME} archive falls in ${lowerPeriod(period.label)}, tagged ` +
      `${THEME_SCOPE[theme.category]}. It keeps the sources it was verified against and ` +
      `links back to the chronicle it came from.`
    );
  }
  const span =
    first.year === last.year
      ? `all of it in ${longYear(first.year)}`
      : `running from ${longYear(first.year)} to ${longYear(last.year)}`;
  return (
    `Every event in the ${SITE_NAME} archive tagged ${THEME_SCOPE[theme.category]}, ` +
    `narrowed to ${lowerPeriod(period.label)} — ${num(events.length)} of them, drawn from ` +
    `${num(nations)} ${nations === 1 ? "nation" : "nations"}, ${span}. Each entry keeps the ` +
    `sources it was verified against and links back to the chronicle it came from.`
  );
}

function describe(slice: Slice): string {
  const { theme, period, events } = slice;
  const first = events[0];
  const last = events[events.length - 1];
  const nations = new Set(events.map((e) => e.code)).size;
  return clampText(
    `${num(events.length)} sourced events tagged ${theme.label.toLowerCase()} in ` +
      `${lowerPeriod(period.label)}, from ${num(nations)} nations — ` +
      `${longYear(first.year)} to ${longYear(last.year)}, each with its references.`,
  );
}

/* ── route ────────────────────────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; period: string }>;
}): Promise<Metadata> {
  const { slug, period } = await params;
  const slice = getSlice(slug, period);
  if (!slice) return { title: `Unknown collection — ${SITE_NAME}` };

  const path = `/themes/${slice.theme.slug}/${slice.period.slug}`;
  const title = headline(slice.theme, slice.period);
  const description = describe(slice);

  return {
    title,
    description,
    keywords: [
      title.toLowerCase(),
      `world history in ${lowerPeriod(slice.period.label)}`,
      `${slice.theme.label.toLowerCase()} timeline`,
      "sourced world history",
    ],
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title: `${title} — ${num(slice.events.length)} sourced events`,
      description,
      url: path,
      siteName: SITE_NAME,
      images: siteOgImages(),
    },
    twitter: { card: "summary_large_image", title, description, images: siteOgImages() },
  };
}

export default async function ThemePeriodPage({
  params,
}: {
  params: Promise<{ slug: string; period: string }>;
}) {
  const { slug, period } = await params;
  const slice = getSlice(slug, period);
  if (!slice) notFound();

  const { theme, events, index, siblings } = slice;
  const path = `/themes/${theme.slug}/${slice.period.slug}`;
  const url = abs(path);
  const title = headline(theme, slice.period);
  const prev = index > 0 ? siblings[index - 1] : null;
  const next = index < siblings.length - 1 ? siblings[index + 1] : null;

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": `${url}#collection`,
            name: `${title} — ${SITE_NAME}`,
            headline: `${title}: ${num(events.length)} sourced events`,
            description: describe(slice),
            url,
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
            inLanguage: "en",
            isAccessibleForFree: true,
            license: "https://creativecommons.org/licenses/by/4.0/",
            author: { "@type": "Organization", name: `${SITE_NAME} Editorial` },
            isPartOf: {
              "@type": "CollectionPage",
              name: theme.label,
              url: abs(`/themes/${theme.slug}`),
            },
            about: { "@type": "Thing", name: theme.label },
            temporalCoverage: `${longYear(events[0].year)}/${longYear(
              events[events.length - 1].year,
            )}`,
            mainEntity: {
              "@type": "ItemList",
              name: title,
              numberOfItems: events.length,
              itemListOrder: "https://schema.org/ItemListOrderAscending",
              itemListElement: events.map((ev, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: `${ev.yearLabel} — ${ev.title} (${ev.nation})`,
                url: abs(routes.chronicle(ev.code)),
              })),
            },
          },
          breadcrumbLd([
            { name: SITE_NAME, path: routes.home() },
            { name: "Themes", path: "/themes" },
            { name: theme.label, path: `/themes/${theme.slug}` },
            { name: slice.period.label, path },
          ]),
        ]}
      />

      <main id="top" className="min-h-screen bg-bone text-basalt">
        <div className="mount mx-auto max-w-[46rem] px-5 pb-24 pt-6 md:px-8 md:pt-10 lg:max-w-[55.5rem]">
          <span aria-hidden className="mount-rail" />
          <nav aria-label="Breadcrumb" className="font-mono text-[10px] tracking-[0.16em] uppercase text-oxide">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" prefetch={false}>
                  ← Terralore
                </Link>
              </li>
              <li aria-hidden="true">·</li>
              <li>
                <Link href="/themes" prefetch={false}>
                  Themes
                </Link>
              </li>
              <li aria-hidden="true">·</li>
              <li>
                <Link href={`/themes/${theme.slug}`} prefetch={false}>
                  {theme.label}
                </Link>
              </li>
              <li aria-hidden="true">·</li>
              <li aria-current="page" className="text-umber">
                {slice.period.label}
              </li>
            </ol>
          </nav>

          <Masthead slice={slice} title={title} />

          <article>
            <ol className="mt-2 space-y-8 border-b-2 border-basalt pb-11">
              {events.map((ev, i) => (
                <EventItem key={`${ev.code}-${ev.year}-${i}`} event={ev} />
              ))}
            </ol>
          </article>

          <SliceFooter slice={slice} prev={prev} next={next} />
        </div>
      </main>
    </>
  );
}

/* ── pieces ───────────────────────────────────────────────────────────────── */

function Masthead({ slice, title }: { slice: Slice; title: string }) {
  const { theme, period, events } = slice;
  const first = events[0];
  const last = events[events.length - 1];
  const nations = new Set(events.map((e) => e.code)).size;
  const continents = tally(events);

  return (
    <header className="settle relative mt-6 pb-10">
      <span aria-hidden className="mount-tick">
        <span>{period.label}</span>
      </span>
      {/* The theme's pigment, set as a square block into the opening rule —
          the same device as the chronicle's era openers. */}
      <div aria-hidden className="mb-7 flex items-center gap-0">
        <span className="cut-rule w-full" />
        <span className="h-[8px] w-[42px] flex-none" style={{ background: theme.tint }} />
      </div>
      <p className="eyebrow flex items-center gap-2.5 text-umber">
        <span
          aria-hidden="true"
          className="inline-block h-2.5 w-2.5"
          style={{ background: theme.tint }}
        />
        <Link href={`/themes/${theme.slug}`} prefetch={false} className="text-oxide">
          {theme.label}
        </Link>
        <span aria-hidden="true">·</span>
        <Link href={`/timeline/${period.slug}`} prefetch={false} className="text-oxide">
          {period.label}
        </Link>
      </p>

      <h1 className="mt-3 font-display text-[42px] font-extrabold uppercase leading-none tracking-tight md:text-[64px]">
        {title}
      </h1>

      <p className="mt-5 font-sans text-[15px] leading-[1.6] text-umber">
        {standfirst(slice)}
      </p>

      <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        <div>
          <dt className="eyebrow text-umber">Events</dt>
          <dd className="mt-1 font-mono text-[19px] leading-none tabular-nums">
            {num(events.length)}
          </dd>
        </div>
        <div>
          <dt className="eyebrow text-umber">Nations</dt>
          <dd className="mt-1 font-mono text-[19px] leading-none tabular-nums">
            {num(nations)}
          </dd>
        </div>
        <div>
          <dt className="eyebrow text-umber">Earliest</dt>
          <dd className="mt-1 font-mono text-[15px] leading-none tabular-nums">
            {longYear(first.year)}
          </dd>
        </div>
        <div>
          <dt className="eyebrow text-umber">Latest</dt>
          <dd className="mt-1 font-mono text-[15px] leading-none tabular-nums">
            {longYear(last.year)}
          </dd>
        </div>
      </dl>

      {continents.length > 1 && (
        <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          {continents.map(([name, n]) => (
            <div key={name}>
              <dt className="eyebrow text-umber">{name}</dt>
              <dd className="mt-1 font-mono text-[14px] tabular-nums">{num(n)}</dd>
            </div>
          ))}
        </dl>
      )}

      <p className="mt-7 font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-umber">
        Every entry below is the same record, with the same sources, as the one on
        its nation&rsquo;s chronicle.
      </p>
    </header>
  );
}

function EventItem({ event }: { event: WorldEvent }) {
  return (
    <li className="grid grid-cols-[4.6rem_1fr] gap-x-4 sm:grid-cols-[6rem_1fr] sm:gap-x-6">
      <div className="pt-[3px]">
        <YearStamp year={event.year} label={event.yearLabel} />
        {event.continent && (
          <span className="mt-1.5 block font-mono text-[9.5px] uppercase leading-tight tracking-[0.12em] text-umber">
            {event.continent}
          </span>
        )}
      </div>

      <div className="border-l-2 border-basalt pl-4 sm:pl-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em]">
          <Link
            href={routes.chronicle(event.code)}
            prefetch={false}
            className="text-oxide"
          >
            {event.nation}
          </Link>
        </p>

        <h2 className="mt-1.5 font-sans text-[15.5px] font-bold leading-snug">
          {event.title}
        </h2>

        <p className="mt-1.5 font-sans text-[14.5px] leading-[1.62]">
          {event.summary}
        </p>

        <p className="mt-2 font-mono text-[10px] leading-relaxed text-umber">
          <span className="uppercase tracking-[0.12em]">Era: </span>
          {event.eraTitle}
        </p>

        {event.sources.length > 0 && <SourceLine sources={event.sources} />}
      </div>
    </li>
  );
}

/**
 * `<time datetime>` only accepts a positive four-digit-or-longer year, so BCE
 * and year-zero stamps render as plain text rather than as an invalid machine
 * date.
 */
function YearStamp({ year, label }: { year: number; label: string }) {
  const cls = "block font-mono text-[13px] font-medium tabular-nums text-oxide";
  if (year < 1) return <span className={cls}>{label}</span>;
  return (
    <time dateTime={String(year).padStart(4, "0")} className={cls}>
      {label}
    </time>
  );
}

function SourceLine({ sources }: { sources: Source[] }) {
  return (
    <p className="mt-2 font-mono text-[10px] leading-relaxed text-umber">
      <span className="uppercase tracking-[0.12em]">Sources: </span>
      {sources.map((s, i) => (
        <span key={`${s.id}-${i}`}>
          {i > 0 && ", "}
          {s.url ? (
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-oxide underline underline-offset-2"
            >
              {s.label}
            </a>
          ) : (
            <span>{s.label}</span>
          )}
          {s.publisher && <span> · {s.publisher}</span>}
        </span>
      ))}
    </p>
  );
}

function SliceFooter({
  slice,
  prev,
  next,
}: {
  slice: Slice;
  prev: PeriodGroup | null;
  next: PeriodGroup | null;
}) {
  const { theme, period, siblings } = slice;

  return (
    <footer className="pt-11">
      {(prev || next) && (
        <nav
          aria-label="Adjacent periods"
          className="grid gap-4 pb-9 sm:grid-cols-2"
        >
          {prev ? (
            <Link
              href={`/themes/${theme.slug}/${prev.period.slug}`}
              prefetch={false}
              className="pressable block border-2 border-basalt px-5 py-4"
            >
              <span className="eyebrow text-umber">← Earlier</span>
              <span className="mt-1.5 block font-display text-[15px] font-extrabold uppercase tracking-tight text-basalt">
                {theme.label} in {lowerPeriod(prev.period.label)}
              </span>
              <span className="mt-0.5 block font-mono text-[10px] tabular-nums text-umber">
                {num(prev.events.length)} events
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              href={`/themes/${theme.slug}/${next.period.slug}`}
              prefetch={false}
              className="pressable block border-2 border-basalt px-5 py-4 sm:text-right"
            >
              <span className="eyebrow text-umber">Later →</span>
              <span className="mt-1.5 block font-display text-[15px] font-extrabold uppercase tracking-tight text-basalt">
                {theme.label} in {lowerPeriod(next.period.label)}
              </span>
              <span className="mt-0.5 block font-mono text-[10px] tabular-nums text-umber">
                {num(next.events.length)} events
              </span>
            </Link>
          )}
        </nav>
      )}

      <div className="mt-9 flex flex-wrap gap-3">
        <Link
          href={`/themes/${theme.slug}`}
          prefetch={false}
          className="pressable inline-flex items-center gap-2 border-2 border-basalt bg-basalt px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-bone"
        >
          All {num(theme.events.length)} {theme.label} events
        </Link>
        <Link
          href={`/timeline/${period.slug}`}
          prefetch={false}
          className="pressable inline-flex items-center gap-2 border-2 border-basalt px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-oxide"
        >
          Every theme in {lowerPeriod(period.label)}
        </Link>
      </div>

      <nav aria-label="Other periods in this theme" className="mt-10">
        <h2 className="eyebrow text-umber">{theme.label}, period by period</h2>
        <ul className="mt-3.5 flex flex-wrap gap-x-2 gap-y-2">
          {siblings.map((g) => {
            const here = g.period.slug === period.slug;
            return (
              <li key={g.period.slug}>
                <Link
                  href={`/themes/${theme.slug}/${g.period.slug}`}
                  prefetch={false}
                  aria-current={here ? "page" : undefined}
                  className={`pressable inline-flex items-baseline gap-1.5 border-2 border-basalt px-3 py-1.5 ${
                    here ? "bg-basalt text-bone" : "text-basalt"
                  }`}
                >
                  <span className="font-sans text-[13px]">{g.period.label}</span>
                  <span
                    className="font-mono text-[10px] tabular-nums"
                    style={here ? undefined : { color: theme.ink }}
                  >
                    {num(g.events.length)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <p className="mt-10 font-mono text-[10px] leading-relaxed text-umber">
        {theme.label} · {period.label} · {SITE_NAME}. Collections are derived from the
        same verified history files as every nation&rsquo;s chronicle; an event is
        published only once each of its claims can be traced to a reliable source.
      </p>
    </footer>
  );
}

/* ── helpers ──────────────────────────────────────────────────────────────── */

interface PeriodGroup {
  period: Period;
  events: WorldEvent[];
}

/**
 * Events arrive sorted oldest → newest, so consecutive runs are already the
 * period groups — no map, no re-sort, order preserved exactly as the corpus
 * has it.
 */
function groupByPeriod(events: WorldEvent[]): PeriodGroup[] {
  const out: PeriodGroup[] = [];
  for (const ev of events) {
    const period = periodFor(ev.year);
    const last = out[out.length - 1];
    if (last && last.period.slug === period.slug) last.events.push(ev);
    else out.push({ period, events: [ev] });
  }
  return out;
}

/** Event counts by continent, largest first. */
function tally(events: WorldEvent[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const ev of events) {
    const key = ev.continent ?? "Unattributed";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/** "The 1960s" → "the 1960s", so it can sit mid-sentence and mid-headline. */
function lowerPeriod(label: string): string {
  return label.startsWith("The ") ? `the ${label.slice(4)}` : label.charAt(0).toLowerCase() + label.slice(1);
}

/** Counts grouped, so "1,610 events" can never be misread as a year. */
function num(n: number): string {
  return n.toLocaleString("en-GB");
}

/**
 * `formatYear` verbatim, except that years long enough to be unreadable get
 * thousands separators — "3,600,000 BCE" rather than "3600000 BCE". Ordinary
 * four-digit years are left alone, as convention wants them.
 */
function longYear(y: number): string {
  const s = formatYear(y);
  return Math.abs(y) >= 10000 ? s.replace(/\d+/, (d) => Number(d).toLocaleString("en-GB")) : s;
}
