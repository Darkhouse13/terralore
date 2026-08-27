import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { allThemes, formatYear, getTheme, periodFor } from "@/lib/chronology";
import type { Period, ThemeBucket, WorldEvent } from "@/lib/chronology";
import { SITE_NAME, abs, breadcrumbLd, clampText, routes, siteOgImages } from "@/lib/seo";
import type { EventCategory } from "@/lib/types";

/**
 * One theme, every nation — the index.
 *
 * This route used to render every event it held. For Politics & Power that was
 * 1,610 events and a 7.6 MB document: not a page a phone can render, and not a
 * shape any search engine has a reason to rank. So the full text moved down one
 * level, to `/themes/<slug>/<period>`, and this page became the map of it.
 *
 * The split runs on the corpus's own period vocabulary. `periodFor()` already
 * buckets at a scale that tracks the archive's density — decades from 1800,
 * centuries before that, millennia before 1000 BCE, one bucket for deep
 * prehistory — so each slice is both a sane page weight and a subject someone
 * would actually look for ("Independence in the 1960s"). Every event still
 * reaches the HTML in full; it reaches it one level down.
 *
 * What stays here: the masthead, the shape statistics, a jump rail, and a
 * preview of the first few events in each period so a section is legible
 * without a click.
 *
 * Editorial note: the standfirsts below describe the *shape* of a collection
 * (how many events, how many nations, what span, what the tag collects). They
 * deliberately make no historical claim. Every claim on this site traces to a
 * source, and a generated summary has none.
 */

export function generateStaticParams() {
  return allThemes().map((t) => ({ slug: t.slug }));
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

/** The standfirst: shape of the collection only. No interpretation. */
function standfirst(theme: ThemeBucket): string {
  const first = theme.events[0];
  const last = theme.events[theme.events.length - 1];
  return (
    `Every event in the ${SITE_NAME} archive tagged ${THEME_SCOPE[theme.category]}. ` +
    `${num(theme.events.length)} of them, drawn from ${num(theme.nations)} nations, running from ` +
    `${longYear(first.year)} to ${longYear(last.year)}. Indexed below by period; each period ` +
    `opens the full text, with the sources every entry was verified against and a link back ` +
    `to the chronicle it came from.`
  );
}

function describe(theme: ThemeBucket): string {
  const first = theme.events[0];
  const last = theme.events[theme.events.length - 1];
  // Kept inside the ~160-char budget search engines actually render. The longer
  // version read well and was truncated mid-clause on every result.
  return clampText(
    `${num(theme.events.length)} sourced events from ${num(theme.nations)} nations tagged ` +
      `${theme.label.toLowerCase()}, ${longYear(first.year)} to ${longYear(last.year)} — ` +
      `each with its references.`,
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const theme = getTheme(slug);
  if (!theme) return { title: `Unknown theme — ${SITE_NAME}` };

  const path = `/themes/${theme.slug}`;
  const title = theme.label;
  const ogTitle = `${theme.label} — ${num(theme.events.length)} sourced events across ${num(theme.nations)} nations`;
  const description = describe(theme);

  return {
    title,
    description,
    keywords: [
      `${theme.label.toLowerCase()} in world history`,
      `history of ${theme.category}`,
      `${theme.category} timeline`,
      "sourced world history",
    ],
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title: ogTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      images: siteOgImages(),
    },
    twitter: { card: "summary_large_image", title: ogTitle, description, images: siteOgImages() },
  };
}

export default async function ThemePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const theme = getTheme(slug);
  if (!theme) notFound();

  const path = `/themes/${theme.slug}`;
  const url = abs(path);
  const groups = groupByPeriod(theme.events);
  const densest = groups.reduce((a, b) => (b.events.length > a.events.length ? b : a));
  const continents = tally(theme.events);
  const others = allThemes().filter((t) => t.slug !== theme.slug);

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": `${url}#collection`,
            name: `${theme.label} — ${SITE_NAME}`,
            headline: `${theme.label}: ${num(theme.events.length)} sourced events across ${num(theme.nations)} nations`,
            description: describe(theme),
            url,
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
            inLanguage: "en",
            isAccessibleForFree: true,
            license: "https://creativecommons.org/licenses/by/4.0/",
            author: { "@type": "Organization", name: `${SITE_NAME} Editorial` },
            isPartOf: {
              "@type": "CollectionPage",
              name: "Themes",
              url: abs("/themes"),
            },
            about: { "@type": "Thing", name: theme.label },
            temporalCoverage: `${longYear(theme.events[0].year)}/${longYear(
              theme.events[theme.events.length - 1].year,
            )}`,
            // The sections, not the 1,600 individual events: the events are all
            // in the HTML already, and a JSON-LD copy of them would double the
            // page weight to say the same thing twice.
            mainEntity: {
              "@type": "ItemList",
              name: `${theme.label} by period`,
              numberOfItems: groups.length,
              itemListOrder: "https://schema.org/ItemListOrderAscending",
              itemListElement: groups.map((g, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: g.period.label,
                url: `${url}/${g.period.slug}`,
                description: `${num(g.events.length)} sourced events.`,
              })),
            },
          },
          breadcrumbLd([
            { name: SITE_NAME, path: routes.home() },
            { name: "Themes", path: "/themes" },
            { name: theme.label, path },
          ]),
        ]}
      />

      <main id="top" className="min-h-screen bg-bone text-basalt">
        <div className="mount mx-auto max-w-[46rem] px-5 pb-24 pt-6 md:px-8 md:pt-10 lg:max-w-[55.5rem]">
          <span aria-hidden className="mount-rail" />
          <Breadcrumb theme={theme} />

          <Masthead theme={theme} densest={densest} continents={continents} />

          <Contents groups={groups} ink={theme.ink} />

          <article>
            {groups.map((g) => (
              <PeriodSection
                key={g.period.slug}
                themeSlug={theme.slug}
                period={g.period}
                events={g.events}
                ink={theme.ink}
              />
            ))}
          </article>

          <ThemeFooter theme={theme} others={others} />
        </div>
      </main>
    </>
  );
}

/* ── pieces ───────────────────────────────────────────────────────────────── */

function Breadcrumb({ theme }: { theme: ThemeBucket }) {
  return (
    <nav aria-label="Breadcrumb" className="font-mono text-[10px] tracking-[0.16em] uppercase text-oxide">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href="/">← Terralore</Link>
        </li>
        <li aria-hidden="true">·</li>
        <li>
          <Link href="/themes">Themes</Link>
        </li>
        <li aria-hidden="true">·</li>
        <li aria-current="page" className="text-umber">
          {theme.label}
        </li>
      </ol>
    </nav>
  );
}

function Masthead({
  theme,
  densest,
  continents,
}: {
  theme: ThemeBucket;
  densest: PeriodGroup;
  continents: [string, number][];
}) {
  const first = theme.events[0];
  const last = theme.events[theme.events.length - 1];

  return (
    <header className="settle relative mt-6 pb-10">
      <span aria-hidden className="mount-tick">
        <span>
          THE ARCHIVE
          <br />
          {num(theme.events.length)} EVENTS
        </span>
      </span>
      {/* The signature, in this theme's own pigment. Ten theme pages used to be
          identical but for their words; a reader arriving on "War & Rupture"
          should see its pigment before reading it — set as a square block into
          the opening rule, the same device as the chronicle's era openers. */}
      <div aria-hidden className="mb-7 flex items-center gap-0">
        <span className="cut-rule w-full" />
        <span className="h-[8px] w-[42px] flex-none" style={{ background: theme.tint }} />
      </div>
      <p className="eyebrow flex items-center gap-2.5" style={{ color: theme.ink }}>
        <span
          aria-hidden="true"
          className="inline-block h-2.5 w-2.5"
          style={{ background: theme.tint }}
        />
        <span>A thematic collection</span>
      </p>

      <h1 className="mt-3 font-display text-[42px] font-extrabold uppercase leading-none tracking-tight md:text-[64px]">
        {theme.label}
      </h1>

      <p className="mt-5 font-sans text-[15px] leading-[1.6] text-umber">
        {standfirst(theme)}
      </p>

      <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        <div>
          <dt className="eyebrow text-umber">Events</dt>
          <dd className="mt-1 font-mono text-[19px] leading-none tabular-nums">
            {num(theme.events.length)}
          </dd>
        </div>
        <div>
          <dt className="eyebrow text-umber">Nations</dt>
          <dd className="mt-1 font-mono text-[19px] leading-none tabular-nums">
            {num(theme.nations)}
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

      <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        <div className="col-span-2 sm:col-span-3">
          <dt className="eyebrow text-umber">Densest period</dt>
          <dd className="mt-1 font-sans text-[15px] font-medium">
            <a href={`#p-${densest.period.slug}`} className="text-oxide">
              {densest.period.label}
            </a>
            <span className="ml-2 font-mono text-[11px] tabular-nums text-umber">
              {num(densest.events.length)} events
            </span>
          </dd>
        </div>
        {continents.map(([name, n]) => (
          <div key={name}>
            <dt className="eyebrow text-umber">{name}</dt>
            <dd className="mt-1 font-mono text-[14px] tabular-nums">{num(n)}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-7 font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-umber">
        Each period below opens a page holding those events in full — summary, era
        and citations. Every entry is the same record, with the same sources, as the
        one on its nation&rsquo;s chronicle.
      </p>
    </header>
  );
}

function Contents({ groups, ink }: { groups: PeriodGroup[]; ink: string }) {
  return (
    <nav aria-label="Periods" className="mt-10 pb-6">
      <h2 className="eyebrow text-umber">Jump to a period</h2>
      <ol className="mt-4 flex flex-wrap gap-x-2 gap-y-2">
        {groups.map((g) => (
          <li key={g.period.slug}>
            <a
              href={`#p-${g.period.slug}`}
              className="pressable inline-flex items-baseline gap-1.5 border-2 border-basalt px-3 py-1.5"
            >
              <span className="font-sans text-[13px] text-basalt">{g.period.label}</span>
              <span
                className="font-mono text-[10px] tabular-nums"
                style={{ color: ink }}
              >
                {num(g.events.length)}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** How many events a period shows before it hands off to its own page. */
const PREVIEW = 8;

/**
 * Index rows are deliberately plainer than the chronicle's event rows: one
 * column ratio at every width, no responsive variants. Class text is paid for
 * twice — once in the HTML, once again in the RSC flight payload — and at ~320
 * rows on the largest theme the two `sm:` variants alone measured 13 KB. The
 * full-detail rows on `[period]` keep them; an index row does not need them.
 * (Hoisting the strings is for legibility, not bytes — it changes no output.)
 */
const ROW = "grid grid-cols-[4.6rem_1fr] gap-x-4";
const ROW_BODY = "border-l-2 border-basalt pl-4";
const ROW_TITLE = "font-sans text-[15px] font-bold leading-snug";
const ROW_NATION = "ml-2 font-mono text-[10px] text-umber";

/**
 * A period, as an index entry: the counts, a link to the page that holds the
 * full text, and enough of the actual events that the section says something
 * on its own. Titles only here — summaries, eras and citations live on the
 * period's own page, which is the whole reason this one is a readable weight.
 */
function PeriodSection({
  themeSlug,
  period,
  events,
  ink,
}: {
  themeSlug: string;
  period: Period;
  events: WorldEvent[];
  ink: string;
}) {
  const nations = new Set(events.map((e) => e.code)).size;
  const preview = events.slice(0, PREVIEW);
  const rest = events.length - preview.length;
  const href = `/themes/${themeSlug}/${period.slug}`;

  return (
    <section id={`p-${period.slug}`} className="relative scroll-mt-6 border-t-2 border-basalt py-9">
      <span aria-hidden className="mount-tick">
        <span>{period.label}</span>
      </span>
      <p className="eyebrow" style={{ color: ink }}>
        {num(events.length)} {events.length === 1 ? "event" : "events"} · {num(nations)}{" "}
        {nations === 1 ? "nation" : "nations"}
      </p>

      <h2 className="mt-2.5 font-display text-[24px] font-extrabold uppercase leading-tight tracking-tight md:text-[30px]">
        <Link href={href} prefetch={false} className="text-basalt">
          {period.label}
        </Link>
      </h2>

      {/* The chronology uses the same period slugs, so every heading here has a
          companion page holding *all* themes for that stretch of time. */}
      <p className="mt-1.5">
        <Link
          href={`/timeline/${period.slug}`}
          prefetch={false}
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-oxide"
        >
          Every theme in {lowerPeriod(period.label)} →
        </Link>
      </p>

      <ol className="mt-5 space-y-2.5">
        {preview.map((ev, i) => (
          <li key={`${ev.code}-${ev.year}-${i}`} className={ROW}>
            {/* sr-only separator: the margin-spaced title/nation spans otherwise
                jam in textContent extraction ("Revolution of 1930Brazil"). */}
            <YearStamp year={ev.year} label={ev.yearLabel} />
            <p className={ROW_BODY}>
              <span className={ROW_TITLE}>{ev.title}</span>
              <span className="sr-only"> · </span>
              <span className={ROW_NATION}>
                {ev.nation}
              </span>
            </p>
          </li>
        ))}
      </ol>

      <p className="mt-5 flex flex-wrap items-baseline gap-x-3">
        <Link
          href={href}
          prefetch={false}
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-oxide"
        >
          All {num(events.length)} events in {lowerPeriod(period.label)} →
        </Link>
        {rest > 0 && (
          <span className="font-mono text-[10px] text-umber">
            {num(rest)} more not shown here
          </span>
        )}
      </p>
    </section>
  );
}

/**
 * `<time datetime>` only accepts a positive four-digit-or-longer year, so BCE
 * and year-zero stamps render as plain text rather than as an invalid machine
 * date.
 */
function YearStamp({ year, label }: { year: number; label: string }) {
  const cls = "block pt-[2px] font-mono text-[12px] font-medium tabular-nums text-oxide";
  if (year < 1) return <span className={cls}>{label}</span>;
  return (
    <time dateTime={String(year).padStart(4, "0")} className={cls}>
      {label}
    </time>
  );
}

function ThemeFooter({ theme, others }: { theme: ThemeBucket; others: ThemeBucket[] }) {
  return (
    <footer className="border-t-2 border-basalt pt-8">
      <div className="flex flex-wrap gap-3">
        <Link
          href="/themes"
          className="pressable inline-flex items-center gap-2 border-2 border-basalt bg-basalt px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-bone"
        >
          All {others.length + 1} themes
        </Link>
        <Link
          href="/timeline"
          className="pressable inline-flex items-center gap-2 border-2 border-basalt px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-oxide"
        >
          The chronology, period by period
        </Link>
        <Link
          href={routes.atlas()}
          className="pressable inline-flex items-center gap-2 border-2 border-basalt px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-oxide"
        >
          Browse the atlas by nation
        </Link>
      </div>

      <nav aria-label="Other themes" className="mt-10">
        <h2 className="eyebrow text-umber">Other collections</h2>
        <ul className="mt-3.5 flex flex-wrap gap-2.5">
          {others.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/themes/${t.slug}`}
                prefetch={false}
                className="pressable inline-flex items-center gap-2 border-2 border-basalt px-3.5 py-1.5 font-sans text-[13px] text-basalt"
              >
                <span
                  aria-hidden="true"
                  className="inline-block h-1.5 w-1.5"
                  style={{ background: t.tint }}
                />
                {t.label}
                <span className="font-mono text-[10px] tabular-nums text-umber">
                  {num(t.events.length)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <p className="mt-10 font-mono text-[10px] leading-relaxed text-umber">
        {theme.label} · {SITE_NAME} · {num(theme.events.length)} events from {num(theme.nations)}{" "}
        nations. Collections are derived from the same verified history files as every
        nation&rsquo;s chronicle; an event is published only once each of its claims can
        be traced to a reliable source.
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
