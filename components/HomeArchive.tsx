import Link from "next/link";
import { allPeriods, allThemes, corpusStats } from "@/lib/chronology";
import { getHistory } from "@/lib/histories";
import { getCountry } from "@/lib/countries";
import { routes } from "@/lib/seo";

/**
 * The archive, surfaced — everything below the globe on the landing page.
 *
 * The globe is a beautiful door and a poor navigator: before this section
 * existed the home page was *only* the globe, so the ~600k words underneath it
 * were invisible until a visitor happened to click the right country. This is
 * the reading-room half of the front door — server-rendered, zero JS, the same
 * corpus shown three ways (nations, time, themes) with a flat, fast path into
 * each.
 *
 * Everything here derives from the corpus at build time. Nothing is authored
 * separately, so nothing can drift from the archive it describes.
 */

// Six flagship chronicles, one-ish per continent. Curation, not ranking: each
// is a deep entry whose tagline reads well as an invitation.
const FEATURED = ["EGY", "CHN", "FRA", "MEX", "BRA", "AUS"] as const;

// Doors into the chronology — moments most readers recognise, spanning the
// whole record rather than clustering in the recent past.
const PERIOD_DOORS = [
  { slug: "deep-prehistory", note: "the first footprints" },
  { slug: "4th-millennium-bce", note: "writing, cities, kings" },
  { slug: "5th-century-bce", note: "the classical world" },
  { slug: "7th-century", note: "faiths on the move" },
  { slug: "15th-century", note: "the world connects" },
  { slug: "18th-century", note: "the age of revolutions" },
  { slug: "1940s", note: "the world at war" },
  { slug: "1960s", note: "independence sweeps the map" },
] as const;

export default function HomeArchive() {
  const stats = corpusStats();
  const periods = allPeriods();
  const themes = allThemes();

  const featured = FEATURED.map((code) => {
    const meta = getCountry(code);
    const history = getHistory(code);
    if (!meta || !history) return null;
    const events = history.eras.reduce((n, e) => n + e.events.length, 0);
    return { meta, history, events };
  }).filter((f): f is NonNullable<typeof f> => f !== null);

  const doors = PERIOD_DOORS.map((d) => {
    const p = periods.find((x) => x.slug === d.slug);
    return p ? { ...d, label: p.label, events: p.events.length, nations: p.nations } : null;
  }).filter((d): d is NonNullable<typeof d> => d !== null);

  return (
    <section id="archive" className="paper-grain scroll-mt-0 bg-land-0 text-ink">
      {/* The seam where the deep meets the shore — the one place on the site
          the two grounds actually touch, so the signature belongs here more
          than anywhere. A gradient hairline said "divider"; the stratum band
          says "you are crossing into another layer". */}
      <div aria-hidden className="mx-auto max-w-[72rem] px-5 md:px-8">
        <span className="stratum-rule block max-w-[110px]" />
      </div>

      <div className="relative z-[1] mx-auto max-w-[72rem] px-5 py-16 md:px-8 md:py-24">
        {/* ── the credo ─────────────────────────────────────────────────── */}
        <header className="max-w-[46rem]">
          <p className="eyebrow text-copper-deep">The archive</p>
          <h2 className="mt-4 font-display text-[clamp(2rem,5.5vw,3.4rem)] font-[380] leading-[1.02] tracking-[-0.015em] text-[#16201e]">
            {stats.events.toLocaleString("en")} sourced events.
            <br />
            {stats.nations} nations. One record.
          </h2>
          <p className="mt-6 font-serif text-[1.18rem] leading-[1.66] text-[#16201e]">
            Terralore publishes a nation&rsquo;s history only once each claim can be traced to a
            reliable source — encyclopedias, national archives and museums, intergovernmental
            bodies, academic work. Where a fact is contested, the archive shows the competing
            positions; where the record is silent, it says so. From the Laetoli footprints,
            3.6&nbsp;million years ago, to this year.
          </p>
        </header>

        {/* ── nations ───────────────────────────────────────────────────── */}
        <div className="mt-16 md:mt-20">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="font-display text-[clamp(1.5rem,3.5vw,2rem)] font-[400] text-[#16201e]">
              Begin with a nation
            </h3>
            <Link
              href={routes.atlas()}
              className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-copper-deep transition-colors hover:text-[#16201e]"
            >
              All {stats.nations} nations →
            </Link>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map(({ meta, history, events }) => (
              <Link
                key={meta.code}
                href={routes.chronicle(meta.code)}
                prefetch={false}
                className="group rounded-[3px] border border-[rgba(138,74,40,0.25)] bg-[rgba(255,252,244,0.5)] p-6 transition-colors hover:border-copper hover:bg-[rgba(200, 114, 68,0.07)]"
              >
                <p className="eyebrow flex items-center gap-2 text-ink-3">
                  {meta.flag && <span className="text-sm leading-none">{meta.flag}</span>}
                  <span>{meta.continent}</span>
                </p>
                <h4 className="mt-3 font-display text-[1.55rem] font-[420] leading-tight text-[#16201e] transition-colors group-hover:text-copper-deep">
                  {meta.name}
                </h4>
                <p className="mt-2.5 font-serif text-[0.98rem] italic leading-[1.5] text-[#454f4c]">
                  {history.tagline}
                </p>
                <p className="mt-4 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-ink-3">
                  {history.eras.length} eras · {events} sourced events
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* ── time ──────────────────────────────────────────────────────── */}
        <div className="mt-16 md:mt-20">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="font-display text-[clamp(1.5rem,3.5vw,2rem)] font-[400] text-[#16201e]">
              Or with a moment in time
            </h3>
            <Link
              href="/timeline"
              className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-copper-deep transition-colors hover:text-[#16201e]"
            >
              The full chronology →
            </Link>
          </div>
          <p className="mt-3 max-w-[46rem] font-serif text-[1.02rem] italic leading-relaxed text-[#454f4c]">
            Every chronicle is written nation by nation. The chronology is the other axis — what
            was happening everywhere at once.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {doors.map((d) => (
              <Link
                key={d.slug}
                href={`/timeline/${d.slug}`}
                prefetch={false}
                className="group rounded-[3px] border border-[rgba(138,74,40,0.25)] px-5 py-4 transition-colors hover:border-copper hover:bg-[rgba(200, 114, 68,0.07)]"
              >
                <p className="font-display text-[1.12rem] font-[420] text-[#16201e] transition-colors group-hover:text-copper-deep">
                  {d.label}
                </p>
                <p className="mt-1 font-serif text-[0.88rem] italic text-[#454f4c]">{d.note}</p>
                <p className="mt-2.5 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink-3">
                  {d.events} events · {d.nations} nations
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* ── themes ────────────────────────────────────────────────────── */}
        <div className="mt-16 md:mt-20">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="font-display text-[clamp(1.5rem,3.5vw,2rem)] font-[400] text-[#16201e]">
              Or follow a thread
            </h3>
            <Link
              href="/themes"
              className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-copper-deep transition-colors hover:text-[#16201e]"
            >
              All themes →
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap gap-2.5">
            {themes.map((t) => (
              <Link
                key={t.slug}
                href={`/themes/${t.slug}`}
                prefetch={false}
                className="group inline-flex items-baseline gap-2.5 rounded-[3px] border border-[rgba(138,74,40,0.25)] px-4 py-2.5 transition-colors hover:border-copper hover:bg-[rgba(200, 114, 68,0.07)]"
              >
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 self-center rounded-full"
                  style={{ background: t.tint }}
                />
                <span className="font-sans text-[0.95rem] font-medium text-[#16201e]">
                  {t.label}
                </span>
                <span className="font-mono text-[0.66rem] tabular-nums text-ink-3">
                  {t.events.length.toLocaleString("en")}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── footer ────────────────────────────────────────────────────── */}
        <footer className="mt-20 border-t border-[rgba(138, 74, 40,0.22)] pt-10 md:mt-24">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div className="max-w-md">
              <p className="font-display text-[1.3rem] font-[420] text-[#16201e]">Terralore</p>
              <p className="mt-2.5 font-serif text-[0.98rem] italic leading-relaxed text-[#454f4c]">
                An atlas of how nations came to be. Every claim traceable to a source; every gap
                acknowledged rather than filled in.
              </p>
            </div>
            <nav aria-label="Site" className="flex gap-12">
              <div>
                <p className="eyebrow text-ink-3">Explore</p>
                <ul className="mt-3 space-y-2 font-sans text-[0.95rem] text-[#454f4c]">
                  <li>
                    <Link href={routes.atlas()} className="transition-colors hover:text-copper-deep">
                      The Atlas
                    </Link>
                  </li>
                  <li>
                    <Link href="/timeline" className="transition-colors hover:text-copper-deep">
                      Chronology
                    </Link>
                  </li>
                  <li>
                    <Link href="/themes" className="transition-colors hover:text-copper-deep">
                      Themes
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="eyebrow text-ink-3">The record</p>
                <ul className="mt-3 space-y-2 font-sans text-[0.95rem] text-[#454f4c]">
                  <li>{stats.sources.toLocaleString("en")} references</li>
                  <li>{stats.events.toLocaleString("en")} sourced events</li>
                  <li>{stats.nations} nations</li>
                </ul>
              </div>
            </nav>
          </div>
        </footer>
      </div>
    </section>
  );
}
