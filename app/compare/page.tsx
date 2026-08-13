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
  siteOgImages,
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
      images: siteOgImages(),
    },
    twitter: { card: "summary_large_image", title, description, images: siteOgImages() },
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
      <main className="min-h-screen bg-bone">
        <div className="mx-auto max-w-4xl px-5 pt-4 pb-16">
          <nav aria-label="Breadcrumb" className="font-mono text-[10px] tracking-[0.16em] uppercase">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="text-oxide">
                  ← Terralore
                </Link>
              </li>
              <li aria-hidden="true" className="text-oxide">
                ·
              </li>
              <li aria-current="page" className="text-umber">
                Compare
              </li>
            </ol>
          </nav>

          <header className="settle mt-3 pb-4">
            <p className="eyebrow text-umber">Side by side</p>
            <h1 className="mt-3 max-w-[16ch] font-display text-[42px] leading-none font-extrabold tracking-tight uppercase md:text-[64px]">
              Compared
            </h1>
            <p className="mt-3 font-mono text-[11px] text-oxide uppercase">
              {pages.length} pairs · {events.toLocaleString("en")} crossed events
            </p>
            <p className="mt-3 max-w-2xl font-sans text-[14px] leading-relaxed text-umber">
              {pages.length}{" "}
              pairs — every land-border neighbourhood, the G20, and
              a curated set of entangled histories. Each page sets two sourced
              records beside each other: the figures both nations publish, and
              the events each chronicle records of the other. Compared, never
              graded.
            </p>
            <StrataPattern seed="compare" className="mt-5" blocks={28} />

            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Stat label="Pairs" value={String(pages.length)} />
              <Stat label="Crossed events" value={events.toLocaleString("en")} />
              <Stat label="Nations" value={String(new Set(pages.flatMap((p) => [p.a.code, p.b.code])).size)} />
            </dl>
          </header>

          <section className="mt-6">
            <ul className="grid gap-x-8 border-t-2 border-basalt sm:grid-cols-2">
              {pages.map((p) => (
                <li key={p.slug} className="border-b-2 border-basalt">
                  <Link
                    href={routes.comparePair(p.slug)}
                    prefetch={false}
                    className="pressable block py-2.5"
                  >
                    <span className="block font-sans text-[14px] font-medium leading-snug text-basalt">
                      {compareTitle(p)}
                    </span>
                    <span className="mt-0.5 block font-mono text-[10.5px] tabular-nums text-umber">
                      {p.bothCount} shared indicators
                      {p.sharedEvents.length > 0 &&
                        ` · ${p.sharedEvents.length} crossed ${p.sharedEvents.length === 1 ? "event" : "events"}`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <footer className="mt-14 border-t-2 border-basalt pt-5">
            <p className="max-w-2xl font-sans text-[13.5px] leading-relaxed text-umber">
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
      <dt className="eyebrow text-umber">{label}</dt>
      <dd className="mt-1 font-mono text-[19px] leading-none tabular-nums">{value}</dd>
    </div>
  );
}
