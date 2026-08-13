import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { allThemes, corpusStats, formatYear } from "@/lib/chronology";
import type { ThemeBucket, WorldEvent } from "@/lib/chronology";
import { abs, breadcrumbLd, routes, SITE_NAME, siteOgImages } from "@/lib/seo";

/**
 * The thematic hub.
 *
 * Every event in the corpus carries one of ten category tags, and until now
 * that tag did exactly one thing: tint a tick on one nation's timeline. Read
 * the other way — down the tag rather than across the nation — the same tags
 * are the archive's only cross-national index. This page is the front door to
 * those collections; each one is a real, complete set, not a curated sample.
 *
 * Server-rendered in full: the counts, the spans and the specimen events are
 * all in the initial HTML, because a hub that needs JavaScript to say what it
 * holds is a hub nothing can cite.
 */

const THEMES = allThemes();
const STATS = corpusStats();

/** Counts grouped, so "4,471 events" can never be misread as a year. */
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

export const metadata: Metadata = {
  title: "Themes",
  description:
    `The archive read across nations rather than within them: ${num(STATS.events)} sourced events ` +
    `from ${num(STATS.nations)} nations in ${THEMES.length} thematic collections.`,
  keywords: [
    "world history by theme",
    "history of independence movements",
    "colonial history timeline",
    "comparative national history",
    ...THEMES.map((t) => `${t.label.toLowerCase()} in world history`),
  ],
  alternates: { canonical: "/themes" },
  openGraph: {
    type: "website",
    title: "Themes — the archive read across nations",
    description: `${THEMES.length} thematic collections drawn from ${num(STATS.events)} sourced events across ${num(STATS.nations)} nations.`,
    url: "/themes",
    siteName: SITE_NAME,
    images: siteOgImages(),
  },
  twitter: {
    card: "summary_large_image",
    title: "Themes — the archive read across nations",
    description: `${THEMES.length} thematic collections drawn from ${num(STATS.events)} sourced events across ${num(STATS.nations)} nations.`,
    images: siteOgImages(),
  },
};

export default function ThemesHubPage() {
  const url = abs("/themes");

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": `${url}#collection`,
            name: `${SITE_NAME} — the archive by theme`,
            description: metadata.description as string,
            url,
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
            inLanguage: "en",
            isAccessibleForFree: true,
            license: "https://creativecommons.org/licenses/by/4.0/",
            isPartOf: { "@type": "WebSite", name: SITE_NAME, url: abs(routes.home()) },
            mainEntity: {
              "@type": "ItemList",
              name: "Thematic collections",
              numberOfItems: THEMES.length,
              itemListOrder: "https://schema.org/ItemListOrderDescending",
              itemListElement: THEMES.map((t, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: t.label,
                url: abs(`/themes/${t.slug}`),
                description: `${num(t.events.length)} sourced events from ${num(t.nations)} nations.`,
              })),
            },
          },
          breadcrumbLd([
            { name: SITE_NAME, path: routes.home() },
            { name: "Themes", path: "/themes" },
          ]),
        ]}
      />

      <main className="min-h-screen bg-bone text-basalt">
        <div className="mount mx-auto max-w-[62rem] px-5 pb-24 pt-6 md:px-8 md:pt-10">
          <span aria-hidden className="mount-rail" />
          <nav aria-label="Breadcrumb" className="font-mono text-[10px] tracking-[0.16em] uppercase text-oxide">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/">← Terralore</Link>
              </li>
              <li aria-hidden="true">·</li>
              <li aria-current="page" className="text-umber">
                Themes
              </li>
            </ol>
          </nav>

          <Masthead />

          <section aria-labelledby="collections">
            <h2 id="collections" className="sr-only">
              The collections
            </h2>
            <ol className="mt-10 grid gap-5 border-t-2 border-basalt pt-8 sm:grid-cols-2">
              {THEMES.map((theme, i) => (
                <ThemeCard key={theme.slug} theme={theme} rank={i + 1} />
              ))}
            </ol>
          </section>

          <HubFooter />
        </div>
      </main>
    </>
  );
}

/* ── pieces ───────────────────────────────────────────────────────────────── */

function Masthead() {
  return (
    <header className="settle relative mt-6 pb-10">
      <span aria-hidden className="mount-tick">
        <span>
          THE ARCHIVE
          <br />
          {THEMES.length} COLLECTIONS
        </span>
      </span>
      <p className="eyebrow text-umber">The archive, read across nations</p>

      <h1 className="mt-3 font-display text-[42px] font-extrabold uppercase leading-none tracking-tight md:text-[64px]">
        Themes
      </h1>

      <p className="mt-3 max-w-[46rem] font-sans text-[17px] font-medium leading-snug text-umber md:text-[19px]">
        {THEMES.length} tags, {num(STATS.events)} events, {num(STATS.nations)} nations — the
        same record turned ninety degrees.
      </p>

      <div className="mt-5 max-w-[46rem] font-sans text-[16px] leading-[1.65]">
        <p>
          Every event in the archive carries one thematic tag. Inside a nation&rsquo;s
          chronicle that tag does one small thing — it tints a single point on the
          timeline. Gathered across every nation at once, the same tags become
          collections: each page below holds every event the corpus records under
          that heading, in order, with the sources it was verified against and a
          link back to the chronicle it came from.
        </p>
        <p className="mt-[1.1em]">
          Nothing here is rewritten or re-interpreted for the collection. An event
          reads the same on its theme page as it does on its nation&rsquo;s own.
        </p>
      </div>

      <p className="mt-7 font-mono text-[10px] uppercase tracking-[0.16em] text-umber">
        {THEMES.length} collections · {num(STATS.events)} sourced events ·{" "}
        {num(STATS.nations)} nations · {num(STATS.sources)} references ·{" "}
        {longYear(STATS.earliest)} – {longYear(STATS.latest)}
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/timeline"
          className="pressable inline-flex items-center gap-2 border-2 border-basalt px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-oxide"
        >
          Or read it period by period
        </Link>
        <Link
          href={routes.atlas()}
          className="pressable inline-flex items-center gap-2 border-2 border-basalt px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-oxide"
        >
          Browse the atlas by nation
        </Link>
      </div>
    </header>
  );
}

function ThemeCard({ theme, rank }: { theme: ThemeBucket; rank: number }) {
  const earliest = theme.events[0];
  const latest = theme.events[theme.events.length - 1];
  // Two specimens make a card concrete: the oldest thing under the tag and the
  // newest. When a theme holds a single event they are the same record — show
  // it once rather than twice.
  const specimens: { label: string; event: WorldEvent }[] =
    earliest === latest
      ? [{ label: "The only entry", event: earliest }]
      : [
          { label: "Earliest", event: earliest },
          { label: "Most recent", event: latest },
        ];

  return (
    <li className="pressable relative border-2 border-basalt bg-bone">
      <article className="h-full px-6 py-6 md:px-7">
        {/* the collection's pigment, set as a square block at the head of the card */}
        <span
          aria-hidden="true"
          className="block h-[8px] w-[42px]"
          style={{ background: theme.tint }}
        />

        <p className="eyebrow mt-4 flex items-center justify-between gap-3 text-umber">
          <span style={{ color: theme.ink }}>{String(rank).padStart(2, "0")}</span>
          <span className="tabular-nums">
            {num(theme.events.length)} events · {num(theme.nations)} nations
          </span>
        </p>

        <h3 className="mt-3 font-display text-[22px] font-extrabold uppercase leading-tight tracking-tight">
          <Link
            href={`/themes/${theme.slug}`}
            prefetch={false}
            className="text-basalt after:absolute after:inset-0 after:content-['']"
          >
            {theme.label}
          </Link>
        </h3>

        <p className="mt-1.5 font-mono text-[10px] tabular-nums text-umber">
          {longYear(earliest.year)} – {longYear(latest.year)}
        </p>

        <dl className="mt-5 space-y-3.5 border-t-2 border-basalt pt-4">
          {specimens.map(({ label, event }) => (
            <div key={label}>
              <dt className="eyebrow text-umber">{label}</dt>
              <dd className="mt-1">
                <span className="font-mono text-[11px] tabular-nums text-oxide">
                  {event.yearLabel}
                </span>
                <span className="ml-2 font-sans text-[14.5px] leading-[1.5]">
                  {event.title}
                </span>
                <span className="ml-1.5 font-mono text-[10px] text-umber">
                  {event.nation}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-oxide">
          Read all {num(theme.events.length)} →
        </p>
      </article>
    </li>
  );
}

function HubFooter() {
  return (
    <footer className="mt-14 border-t-2 border-basalt pt-8">
      <p className="max-w-[46rem] font-mono text-[10px] leading-relaxed text-umber">
        Thematic collections are generated from the same verified history files that
        power every nation&rsquo;s chronicle — an event appears in a collection only
        once each of its claims can be traced to a reliable source. {SITE_NAME} publishes
        the whole corpus, gaps included, rather than the parts that make a tidy story.
      </p>
    </footer>
  );
}
