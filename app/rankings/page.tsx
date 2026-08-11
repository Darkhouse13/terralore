import type { Metadata } from "next";
import Link from "next/link";
import { allRankings, rankingsUpdated, type Ranking } from "@/lib/rankings";
import { DOMAIN_META, type DomainKey } from "@/lib/types";
import { formatMetric } from "@/lib/format";
import { routes } from "@/lib/seo";

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

export const metadata: Metadata = {
  title: "Rankings",
  alternates: { canonical: routes.rankings() },
};

export default function RankingsPage() {
  const groups = byDomain();
  const updated = rankingsUpdated();
  const nations = new Set(RANKINGS.flatMap((r) => r.rows.map((x) => x.code))).size;

  return (
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
              Rankings
            </li>
          </ol>
        </nav>

        <header
          className="mt-9 stratum-top pb-10"
          style={{ "--stratum-tint": "var(--color-verdigris-deep)" } as React.CSSProperties}
        >
          <p className="eyebrow text-verdigris-deep">The measured, compared</p>

          <h1 className="mt-4 max-w-[18ch] font-display text-[clamp(2.9rem,9vw,4.6rem)] font-[380] leading-[0.94] tracking-[-0.015em] text-[#16201e]">
            Rankings
          </h1>

          <p className="mt-4 max-w-[46rem] font-serif text-[clamp(1.15rem,3.4vw,1.45rem)] font-[340] italic leading-[1.45] text-[#454f4c]">
            Every indicator in the atlas, read across nations — highest to lowest,
            never best to worst.
          </p>

          <p className="mt-7 max-w-[46rem] font-serif text-[1.18rem] leading-[1.66] text-[#16201e]">
            {RANKINGS.length} rankings across {groups.length} domains, assembled from
            the same sourced figures as each nation&rsquo;s dossier. Only nations with
            a published figure are ranked — a gap is a gap, never a zero — and because
            these publishers carry each nation&rsquo;s latest available year, a table
            can mix vintages; every row shows the year its figure was observed.
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <Stat label="Rankings" value={String(RANKINGS.length)} />
            <Stat label="Domains" value={String(groups.length)} />
            <Stat label="Nations" value={String(nations)} />
            <Stat label="Latest refresh" value={updated.slice(0, 4)} />
          </dl>
        </header>

        {groups.map(([domain, rankings]) => (
          <section key={domain} className="py-6">
            <span
              aria-hidden
              className="stratum-rule mb-6 block max-w-[110px]"
              style={{ "--stratum-tint": "var(--color-verdigris-deep)" } as React.CSSProperties}
            />
            <h2 className="font-display text-[clamp(1.7rem,4.5vw,2.2rem)] font-[400] leading-tight text-[#16201e]">
              {DOMAIN_META[domain].label}
            </h2>
            <ol className="mt-5">
              {rankings.map((r) => (
                <RankingRow key={r.slug} r={r} />
              ))}
            </ol>
          </section>
        ))}

        <footer className="mt-14 border-t border-land-2 pt-8">
          <p className="font-mono text-[0.68rem] leading-relaxed text-ink-3">
            Rankings · Terralore. Each ranking names its publisher, license and data
            vintage on its own page; the same figures, with the same sources, sit on
            each nation&rsquo;s dossier. Nations without published data are listed
            beneath each table, never ranked and never counted as zero.
          </p>
        </footer>
      </div>
    </main>
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
    <li>
      <Link
        href={routes.ranking(r.slug)}
        prefetch={false}
        className="group grid gap-x-6 gap-y-1.5 border-t border-[rgba(22,32,30,0.12)] py-3.5 transition-colors hover:bg-[rgba(87,166,149,0.07)] sm:grid-cols-[minmax(0,15rem)_1fr] sm:items-center"
      >
        <div>
          <h3 className="font-display text-[1.12rem] font-[440] leading-snug text-[#16201e] transition-colors group-hover:text-copper-deep">
            {r.label}
          </h3>
          <p className="mt-0.5 font-mono text-[0.68rem] tabular-nums text-ink-3">
            {r.rows.length} {r.isMineral ? "producers listed" : "nations ranked"}
          </p>
        </div>
        <p className="font-mono text-[0.72rem] tabular-nums leading-relaxed text-ink-3">
          {top && (
            <>
              highest <span className="text-verdigris-deep">{top.name}</span> ·{" "}
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
