import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { allThemes, corpusStats, formatYear } from "@/lib/chronology";
import type { ThemeBucket, WorldEvent } from "@/lib/chronology";
import { abs, breadcrumbLd, routes, SITE_NAME } from "@/lib/seo";

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
    `The Terralore archive read across nations rather than within them: ${num(STATS.events)} sourced ` +
    `events from ${num(STATS.nations)} nations, gathered into ${THEMES.length} thematic collections — ` +
    `independence, war, colonisation, religion, culture, economy, migration, catastrophe, ` +
    `politics and formation.`,
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
  },
  twitter: {
    card: "summary_large_image",
    title: "Themes — the archive read across nations",
    description: `${THEMES.length} thematic collections drawn from ${num(STATS.events)} sourced events across ${num(STATS.nations)} nations.`,
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
                Themes
              </li>
            </ol>
          </nav>

          <Masthead />

          <section aria-labelledby="collections">
            <h2 id="collections" className="sr-only">
              The collections
            </h2>
            <ol className="mt-10 grid gap-px border border-[rgba(138, 74, 40,0.22)] bg-[rgba(138, 74, 40,0.22)] sm:grid-cols-2">
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
    <header className="mt-9 border-b border-[rgba(138, 74, 40,0.22)] pb-10">
      <p className="eyebrow text-copper-deep">The archive, read across nations</p>

      <h1 className="mt-4 font-display text-[clamp(2.9rem,9vw,4.6rem)] font-[380] leading-[0.94] tracking-[-0.015em] text-[#16201e]">
        Themes
      </h1>

      <p className="mt-4 max-w-[46rem] font-serif text-[clamp(1.15rem,3.4vw,1.45rem)] font-[340] italic leading-[1.45] text-[#454f4c]">
        {THEMES.length} tags, {num(STATS.events)} events, {num(STATS.nations)} nations — the
        same record turned ninety degrees.
      </p>

      <div className="mt-7 max-w-[46rem] font-serif text-[1.18rem] leading-[1.66] text-[#16201e]">
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

      <p className="mt-8 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-ink-3">
        {THEMES.length} collections · {num(STATS.events)} sourced events ·{" "}
        {num(STATS.nations)} nations · {num(STATS.sources)} references ·{" "}
        {longYear(STATS.earliest)} – {longYear(STATS.latest)}
      </p>

      <div className="mt-7 flex flex-wrap gap-3">
        <Link
          href="/timeline"
          className="inline-flex items-center gap-2 rounded-full border border-[rgba(138, 74, 40,0.35)] px-5 py-2.5 font-sans text-[0.9rem] text-[#8a4a28] transition-colors hover:bg-[rgba(200, 114, 68,0.1)]"
        >
          Or read it period by period
        </Link>
        <Link
          href={routes.atlas()}
          className="inline-flex items-center gap-2 rounded-full border border-[rgba(138, 74, 40,0.35)] px-5 py-2.5 font-sans text-[0.9rem] text-[#8a4a28] transition-colors hover:bg-[rgba(200, 114, 68,0.1)]"
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
    <li className="relative bg-land-0 transition-colors hover:bg-[rgba(200, 114, 68,0.07)]">
      <article className="h-full px-6 py-7 md:px-7">
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 h-full w-[3px]"
          style={{ background: theme.tint }}
        />

        <p className="eyebrow flex items-center justify-between gap-3 text-ink-3">
          <span style={{ color: theme.tint }}>{String(rank).padStart(2, "0")}</span>
          <span className="tabular-nums">
            {num(theme.events.length)} events · {num(theme.nations)} nations
          </span>
        </p>

        <h3 className="mt-3 font-display text-[1.6rem] font-[420] leading-[1.1] tracking-[-0.005em] text-[#16201e]">
          <Link
            href={`/themes/${theme.slug}`}
            prefetch={false}
            className="transition-colors after:absolute after:inset-0 after:content-[''] hover:text-copper-deep"
          >
            {theme.label}
          </Link>
        </h3>

        <p className="mt-1.5 font-mono text-[0.7rem] tabular-nums text-ink-3">
          {longYear(earliest.year)} – {longYear(latest.year)}
        </p>

        <dl className="mt-5 space-y-3.5 border-t border-[rgba(138, 74, 40,0.22)] pt-4">
          {specimens.map(({ label, event }) => (
            <div key={label}>
              <dt className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink-3">
                {label}
              </dt>
              <dd className="mt-1">
                <span className="font-mono text-[0.76rem] tabular-nums text-copper-deep">
                  {event.yearLabel}
                </span>
                <span className="ml-2 font-serif text-[0.99rem] leading-[1.5] text-[#16201e]">
                  {event.title}
                </span>
                <span className="ml-1.5 font-mono text-[0.66rem] text-ink-3">
                  {event.flag && <span aria-hidden="true">{event.flag} </span>}
                  {event.nation}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-5 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-copper-deep">
          Read all {num(theme.events.length)} →
        </p>
      </article>
    </li>
  );
}

function HubFooter() {
  return (
    <footer className="mt-14 border-t border-[rgba(138, 74, 40,0.22)] pt-9">
      <p className="max-w-[46rem] font-mono text-[0.68rem] leading-relaxed text-ink-3">
        Thematic collections are generated from the same verified history files that
        power every nation&rsquo;s chronicle — an event appears in a collection only
        once each of its claims can be traced to a reliable source. {SITE_NAME} publishes
        the whole corpus, gaps included, rather than the parts that make a tidy story.
      </p>
    </footer>
  );
}
