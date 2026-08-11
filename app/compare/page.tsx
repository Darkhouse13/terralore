import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import StrataPattern from "@/components/brand/StrataPattern";
import { allComparePages, compareTitle } from "@/lib/compare";
import {
  breadcrumbLd,
  collectionLd,
  compareHubDescription,
  routes,
  SITE_NAME,
} from "@/lib/seo";

/**
 * The compare hub — every published pair, alphabetically by display title.
 * The pair set is committed data (data/compare-pairs.json): land-border
 * neighbours, G20 pairs, and a curated seed, gated on shared published
 * metrics so a thin page is dropped at build rather than published hollow.
 * See docs/compare-surface.md.
 */

export function generateMetadata(): Metadata {
  const pages = allComparePages();
  const events = pages.reduce((n, p) => n + p.sharedEvents.length, 0);
  const description = compareHubDescription(pages.length, events);
  const title = "Compare — nations side by side";
  return {
    title,
    description,
    alternates: { canonical: routes.compare() },
    openGraph: {
      type: "website",
      title,
      description,
      url: routes.compare(),
      siteName: SITE_NAME,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function CompareHubPage() {
  const pages = [...allComparePages()].sort((x, y) =>
    compareTitle(x).localeCompare(compareTitle(y)),
  );
  const events = pages.reduce((n, p) => n + p.sharedEvents.length, 0);

  return (
    <>
      <JsonLd
        data={[
          collectionLd({
            name: "Compare — nations side by side",
            description: compareHubDescription(pages.length, events),
            path: routes.compare(),
            items: pages.map((p) => ({ name: compareTitle(p), path: routes.comparePair(p.slug) })),
            total: pages.length,
          }),
          breadcrumbLd([
            { name: SITE_NAME, path: routes.home() },
            { name: "Compare", path: routes.compare() },
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
                Compare
              </li>
            </ol>
          </nav>

          <header
            className="mt-9 stratum-top pb-10"
            style={{ "--stratum-tint": "var(--color-verdigris-deep)" } as React.CSSProperties}
          >
            <p className="eyebrow text-verdigris-deep">Side by side</p>
            <h1 className="mt-4 max-w-[16ch] font-display text-[clamp(2.6rem,8vw,4.2rem)] font-[380] leading-[0.96] tracking-[-0.015em] text-[#16201e]">
              Nations, compared
            </h1>
            <p className="mt-4 max-w-[46rem] font-serif text-[clamp(1.1rem,3.2vw,1.35rem)] font-[340] italic leading-[1.45] text-[#454f4c]">
              {pages.length}{" "}
              pairs — every land-border neighbourhood, the G20, and
              a curated set of entangled histories. Each page sets two sourced
              records beside each other: the figures both nations publish, and
              the events each chronicle records of the other. Compared, never
              graded.
            </p>
            <StrataPattern seed="compare" className="mt-7" blocks={28} />

            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Stat label="Pairs" value={String(pages.length)} />
              <Stat label="Crossed events" value={events.toLocaleString("en")} />
              <Stat label="Nations" value={String(new Set(pages.flatMap((p) => [p.a.code, p.b.code])).size)} />
            </dl>
          </header>

          <section className="py-2">
            <ul className="grid gap-x-8 sm:grid-cols-2">
              {pages.map((p) => (
                <li key={p.slug} className="border-t border-[rgba(22,32,30,0.1)] py-2.5">
                  <Link
                    href={routes.comparePair(p.slug)}
                    prefetch={false}
                    className="font-sans text-[0.95rem] leading-snug text-[#16201e] transition-colors hover:text-copper-deep"
                  >
                    {compareTitle(p)}
                  </Link>
                  <p className="mt-0.5 font-mono text-[0.66rem] tabular-nums text-ink-3">
                    {p.bothCount} shared indicators
                    {p.sharedEvents.length > 0 &&
                      ` · ${p.sharedEvents.length} crossed ${p.sharedEvents.length === 1 ? "event" : "events"}`}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <footer className="mt-14 border-t border-land-2 pt-8">
            <p className="max-w-[680px] font-serif text-[0.95rem] italic leading-relaxed text-ink-2">
              The pair set is derived, committed and validated — not generated on
              request: neighbour pairs from the atlas&rsquo;s border data,
              spot-checked against known boundary lists; a thin-content gate
              drops any pair whose two nations share too few published figures
              to compare honestly. Absences on any page render as
              &ldquo;—&rdquo;, never as zero.
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}

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
