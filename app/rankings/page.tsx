import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { allRankings, rankingsUpdated, type Ranking } from "@/lib/rankings";
import { DOMAIN_META, type DomainKey } from "@/lib/types";
import { formatMetric } from "@/lib/format";
import {
  breadcrumbLd,
  collectionLd,
  rankingsDescription,
  routes,
  SITE_NAME,
  siteOgImages,
} from "@/lib/seo";

/**
 * The rankings index — every dossier indicator, read across nations.
 *
 * The dossier answers "what is true of this nation?"; each ranking answers
 * the inverse: for one indicator, every nation with a published figure,
 * highest to lowest. Every figure here is the same figure, with the same
 * source, as the card on that nation's dossier — assembled by lib/rankings.ts
 * from the same committed domain files.
 *
 * The language is highest and lowest, never best and worst: a high military
 * burden or a low tax share is not a virtue or a vice on this site.
 */

// Evaluated once at build time — the rankings table is memoised.
const RANKINGS = allRankings();

/** Group into domains, preserving dossier tab order (lib/domains FILES order). */
function byDomain(): [DomainKey, Ranking[]][] {
  const out: [DomainKey, Ranking[]][] = [];
  for (const r of RANKINGS) {
    const last = out.at(-1);
    if (last && last[0] === r.domain) last[1].push(r);
    else out.push([r.domain, [r]]);
  }
  return out;
}

const GROUPS = byDomain();
const NATIONS = new Set(RANKINGS.flatMap((r) => r.rows.map((x) => x.code))).size;
const DESCRIPTION = rankingsDescription(RANKINGS.length, GROUPS.length, NATIONS);

export const metadata: Metadata = {
  title: "Rankings",
  description: DESCRIPTION,
  keywords: [
    "country rankings",
    "nations ranked by indicator",
    "gdp by country",
    "life expectancy by country",
    "sourced world rankings",
  ],
  alternates: { canonical: routes.rankings() },
  openGraph: {
    type: "website",
    title: "Rankings — every indicator, every nation",
    description: DESCRIPTION,
    url: routes.rankings(),
    siteName: SITE_NAME,
    images: siteOgImages(),
  },
  twitter: {
    card: "summary_large_image",
    title: "Rankings — every indicator, every nation",
    description: DESCRIPTION,
    images: siteOgImages(),
  },
};

export default function RankingsPage() {
  const groups = GROUPS;
  const updated = rankingsUpdated();
  const nations = NATIONS;

  return (
    <>
    <JsonLd
      data={[
        collectionLd({
          name: `Rankings — ${SITE_NAME}`,
          description: DESCRIPTION,
          path: routes.rankings(),
          items: RANKINGS.map((r) => ({ name: r.label, path: routes.ranking(r.slug) })),
        }),
        breadcrumbLd([
          { name: SITE_NAME, path: routes.home() },
          { name: "Rankings", path: routes.rankings() },
        ]),
      ]}
    />
    <main className="min-h-screen bg-bone">
      <div className="mount mx-auto max-w-4xl px-5 pt-4 pb-16">
        <span aria-hidden className="mount-rail" />
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
              Rankings
            </li>
          </ol>
        </nav>

        <header className="settle relative mt-3 pb-4">
          <span aria-hidden className="mount-tick">
            <span>
              THE INDEX
              <br />
              {RANKINGS.length} RANKINGS
            </span>
          </span>
          <p className="eyebrow text-umber">The measured, compared</p>

          <h1 className="mt-3 max-w-[16ch] font-display text-[42px] leading-none font-extrabold tracking-tight uppercase md:text-[64px]">
            Rankings
          </h1>

          <p className="mt-3 font-mono text-[11px] text-oxide uppercase">
            {RANKINGS.length} rankings · {groups.length} domains · {nations} nations
          </p>

          <p className="mt-3 max-w-2xl font-sans text-[14px] leading-relaxed text-umber">
            Every indicator in the atlas, read across nations — highest to lowest,
            never best to worst.
          </p>

          <p className="mt-3 max-w-2xl font-sans text-[14px] leading-relaxed text-umber">
            {RANKINGS.length}{" "}rankings across {groups.length}{" "}domains, assembled
            from the same sourced figures as each nation&rsquo;s dossier. Only nations with
            a published figure are ranked — a gap is a gap, never a zero — and because
            these publishers carry each nation&rsquo;s latest available year, a table
            can mix vintages; every row shows the year its figure was observed.
          </p>

          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <Stat label="Rankings" value={String(RANKINGS.length)} />
            <Stat label="Domains" value={String(groups.length)} />
            <Stat label="Nations" value={String(nations)} />
            <Stat label="Latest refresh" value={updated.slice(0, 4)} />
          </dl>

          {/* Domain jump links — 66 rankings should never be blind scroll. */}
          <nav aria-label="Domains" className="mt-5 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px]">
            {groups.map(([domain]) => (
              <a
                key={domain}
                href={`#d-${domain}`}
                className="inline-block py-1.5 text-oxide"
              >
                {DOMAIN_META[domain].label.toUpperCase()} ↓
              </a>
            ))}
          </nav>
        </header>

        {groups.map(([domain, rankings]) => (
          <section key={domain} id={`d-${domain}`} className="relative mt-10 scroll-mt-4">
            <span aria-hidden className="mount-tick">
              <span>{DOMAIN_META[domain].label}</span>
            </span>
            <h2 className="font-display text-[25px] font-extrabold tracking-tight uppercase">
              {DOMAIN_META[domain].label}
            </h2>
            <ol className="mt-4 border-t-2 border-basalt">
              {rankings.map((r) => (
                <RankingRow key={r.slug} r={r} />
              ))}
            </ol>
          </section>
        ))}

        <footer className="mt-14 border-t-2 border-basalt pt-5">
          <p className="font-mono text-[11px] leading-relaxed text-umber">
            Rankings · Terralore. Each ranking names its publisher, license and data
            vintage on its own page; the same figures, with the same sources, sit on
            each nation&rsquo;s dossier. Nations without published data are listed
            beneath each table, never ranked and never counted as zero.
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

/**
 * One ranking of the index. The right column carries both ends of the table —
 * highest and lowest, in the site's neutral grammar — with each observation's
 * own year, because the two ends of a mixed-vintage table are often measured
 * years apart.
 */
function RankingRow({ r }: { r: Ranking }) {
  const top = r.rows[0];
  const bottom = r.rows.at(-1);
  return (
    <li className="border-b-2 border-basalt">
      <Link
        href={routes.ranking(r.slug)}
        prefetch={false}
        className="pressable grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[minmax(0,16rem)_1fr] sm:items-baseline"
      >
        <div>
          <h3 className="font-sans text-[14px] font-medium leading-snug text-basalt">
            {r.label}
          </h3>
          <p className="mt-0.5 font-mono text-[10.5px] tabular-nums text-umber">
            {r.rows.length} {r.isMineral ? "producers listed" : "nations ranked"}
          </p>
        </div>
        <p className="font-mono text-[11px] tabular-nums leading-relaxed text-umber">
          {top && (
            <>
              highest <span className="text-oxide">{top.name}</span> ·{" "}
              {formatMetric(top.value, r.unit)}
              {top.year != null && ` (${top.year})`}
            </>
          )}
          {bottom && bottom !== top && (
            <>
              {" "}&nbsp;·&nbsp; lowest {bottom.name} · {formatMetric(bottom.value, r.unit)}
              {bottom.year != null && ` (${bottom.year})`}
            </>
          )}
        </p>
      </Link>
    </li>
  );
}
