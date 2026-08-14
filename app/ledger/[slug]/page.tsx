import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import CaptureBed from "@/components/strata/CaptureBed";
import { allEntries, getEntry, letterSlugs, type LedgerEntry } from "@/lib/ledger";
import { DOMAIN_META, type DomainKey } from "@/lib/types";
import {
  abs,
  breadcrumbLd,
  CONTENT_LICENSE,
  ledgerEntryDescription,
  publisher,
  routes,
  SITE_NAME,
} from "@/lib/seo";

/**
 * One ledger entry — a recorded refresh in full (living-record §3.2): the
 * sealed corpus versions it stands between, the counts per domain, the
 * structural changes (nations entering or leaving a domain's published set),
 * and every source-record movement. The complete claim-by-claim change
 * record is the committed JSON itself, one fetch away; each nation's own
 * changes are read on its dossier's RECORD bed.
 */

export function generateStaticParams() {
  return allEntries().map((e) => ({ slug: e.slug }));
}

const domainLabel = (d: string) =>
  d in DOMAIN_META ? DOMAIN_META[d as DomainKey].label : d.charAt(0).toUpperCase() + d.slice(1);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const e = getEntry(slug);
  if (!e) return { title: `Unknown entry — ${SITE_NAME}` };
  const description = ledgerEntryDescription(e);
  const path = routes.ledgerEntry(slug);
  return {
    title: `Ledger № ${e.slug} — ${e.date}`,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: `Ledger № ${e.slug} — ${e.title}`,
      description,
      url: path,
      siteName: SITE_NAME,
    },
    twitter: { card: "summary_large_image", title: `Ledger № ${e.slug} — ${SITE_NAME}`, description },
  };
}

/** The entry's change record as a Dataset — honest version info, real distribution. */
function entryLd(e: LedgerEntry) {
  const url = abs(routes.ledgerEntry(e.slug));
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${url}#dataset`,
    name: `Terralore corpus change record № ${e.slug}`,
    description: ledgerEntryDescription(e),
    url,
    isAccessibleForFree: true,
    license: CONTENT_LICENSE,
    creator: publisher,
    dateModified: e.date,
    version: e.corpus.after.version,
    distribution: {
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: abs(`/ledger/${e.slug}.json`),
    },
  };
}

export default async function LedgerEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const e = getEntry(slug);
  if (!e) notFound();

  const vintageRows = Object.keys(e.vintages.after)
    .sort()
    .map((k) => ({ k, before: e.vintages.before[k] ?? "—", after: e.vintages.after[k] }));

  return (
    <>
      <JsonLd
        data={[
          entryLd(e),
          breadcrumbLd([
            { name: SITE_NAME, path: routes.home() },
            { name: "The Ledger", path: routes.ledger() },
            { name: `№ ${e.slug}`, path: routes.ledgerEntry(e.slug) },
          ]),
        ]}
      />
      <main className="min-h-screen bg-bone text-basalt">
        <div className="mount relative mx-auto max-w-[46rem] px-5 pt-4 pb-20 md:px-8 md:pt-8">
          <span aria-hidden className="mount-rail" />
          <nav aria-label="Breadcrumb" className="font-mono text-[10px] tracking-[0.16em] uppercase">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href={routes.ledger()} className="text-oxide">
                  ← The Ledger
                </Link>
              </li>
              <li aria-hidden="true" className="text-oxide">
                ·
              </li>
              <li aria-current="page" className="text-umber">
                № {e.slug}
              </li>
            </ol>
          </nav>

          <header className="settle relative mt-5 pb-2">
            <span aria-hidden className="mount-tick">
              <span>
                ENTRY {e.slug}
                <br />
                {e.date}
              </span>
            </span>
            <p className="eyebrow text-oxide">
              Recorded refresh · {e.date}
            </p>
            <h1 className="mt-2 font-display text-[34px] leading-[1.02] font-extrabold tracking-tight uppercase md:text-[48px]">
              {e.title}
            </h1>
            {e.summary && (
              <p className="mt-4 max-w-2xl font-sans text-[15px] leading-relaxed">{e.summary}</p>
            )}
          </header>

          <section className="mt-4 border-t-2 border-basalt pt-4">
            <h2 className="eyebrow text-umber">Between two sealed corpus versions</h2>
            <p className="mt-2 font-mono text-[12px] leading-relaxed">
              {e.corpus.before ? (
                <>
                  <a
                    href={`/integrity/${e.corpus.before.version}.json`}
                    className="text-oxide underline underline-offset-2"
                  >
                    {e.corpus.before.version}
                  </a>{" "}
                  <span className="text-umber">({e.corpus.before.root.slice(0, 16)}…)</span>
                </>
              ) : (
                <span className="text-umber">unsealed state</span>
              )}
              {" → "}
              <a
                href={`/integrity/${e.corpus.after.version}.json`}
                className="text-oxide underline underline-offset-2"
              >
                {e.corpus.after.version}
              </a>
            </p>
          </section>

          <section className="mt-6">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-5">
              <Stat label="New observations" value={e.counts.new} />
              <Stat label="Upstream revisions" value={e.counts.revised} />
              <Stat label="Retired" value={e.counts.retired} />
              <Stat label="Source changes" value={e.counts.sourceChanges} />
              <Stat label="Nations touched" value={e.counts.nations} />
            </dl>
          </section>

          <section className="mt-8 border-t-2 border-basalt pt-5">
            <h2 className="font-display text-[22px] font-extrabold tracking-tight uppercase">
              By domain
            </h2>
            <p className="mt-2 max-w-2xl font-sans text-[13.5px] leading-relaxed text-umber">
              Counts of recorded changes, with each domain&rsquo;s data vintage as it
              stood before and after the refresh. A domain absent here did not move.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse font-mono text-[11.5px]">
                <thead>
                  <tr className="border-b-2 border-basalt text-left text-[10px] tracking-[0.1em] text-umber uppercase">
                    <th className="py-2 pr-3 font-normal">Domain</th>
                    <th className="py-2 pr-3 text-right font-normal">New</th>
                    <th className="py-2 pr-3 text-right font-normal">Revised</th>
                    <th className="py-2 pr-3 text-right font-normal">Retired</th>
                    <th className="py-2 font-normal">Vintage</th>
                  </tr>
                </thead>
                <tbody>
                  {e.domains.map((d) => {
                    const c = e.changes.filter((x) => x.domain === d);
                    const v = vintageRows.find((x) => x.k === d);
                    return (
                      <tr key={d} className="border-b-2 border-basalt">
                        <td className="py-2 pr-3">{domainLabel(d)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">
                          {c.filter((x) => x.kind === "new").length}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums">
                          {c.filter((x) => x.kind === "revised").length}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums">
                          {c.filter((x) => x.kind === "retired").length}
                        </td>
                        <td className="py-2 text-umber">
                          {v && v.before !== v.after ? `${v.before} → ${v.after}` : (v?.after ?? "—")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {Object.keys(e.structural).length > 0 && (
            <section className="mt-8 border-t-2 border-basalt pt-5">
              <h2 className="font-display text-[22px] font-extrabold tracking-tight uppercase">
                Structural changes
              </h2>
              <p className="mt-2 max-w-2xl font-sans text-[13.5px] leading-relaxed text-umber">
                Nations whose published set changed in a domain — a nation appearing
                gained its first observation there; a nation leaving now publishes none.
                An absence appearing is a recorded fact, not a silent gap.
              </p>
              <ul className="mt-3 space-y-2">
                {Object.entries(e.structural).map(([d, s]) => (
                  <li key={d} className="font-mono text-[11.5px]">
                    <span className="text-umber uppercase">{domainLabel(d)}:</span>{" "}
                    {s.gained.length > 0 && <>now published for {s.gained.join(", ")}</>}
                    {s.gained.length > 0 && s.lost.length > 0 && "; "}
                    {s.lost.length > 0 && <>no longer published for {s.lost.join(", ")}</>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {e.sourceChanges.length > 0 && (
            <section className="mt-8 border-t-2 border-basalt pt-5">
              <h2 className="font-display text-[22px] font-extrabold tracking-tight uppercase">
                Source records
              </h2>
              <ul className="mt-3 space-y-2">
                {e.sourceChanges.map((s, i) => (
                  <li key={i} className="font-sans text-[13.5px] leading-relaxed">
                    <span className="font-mono text-[11px] text-umber uppercase">
                      {domainLabel(s.domain)} · {s.sourceId}
                    </span>{" "}
                    {s.kind === "added" && "— source record added"}
                    {s.kind === "removed" && "— source record no longer referenced"}
                    {s.kind === "changed" && (
                      <>
                        — {s.field}: {String(s.before)} → {String(s.after)}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {e.notes.length > 0 && (
            <section className="mt-8 border-t-2 border-basalt pt-5">
              <h2 className="font-display text-[22px] font-extrabold tracking-tight uppercase">
                Noted in the record
              </h2>
              <ul className="mt-3 max-w-2xl space-y-2">
                {e.notes.map((note, i) => (
                  <li key={i} className="font-sans text-[14px] leading-relaxed">
                    {note}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-8 border-t-2 border-basalt pt-5">
            <h2 className="eyebrow text-umber">The complete change record</h2>
            <p className="mt-2 max-w-2xl font-sans text-[14px] leading-relaxed">
              Every one of the {e.changes.length.toLocaleString("en")} recorded changes —
              claim IDs, prior and new values, origins — is the committed record itself:{" "}
              <a
                href={`/ledger/${e.slug}.json`}
                className="font-mono text-[12.5px] text-oxide underline underline-offset-2"
              >
                /ledger/{e.slug}.json
              </a>
              . Each nation&rsquo;s own changes are read on its dossier, under THE RECORD.
            </p>
            {letterSlugs().includes(e.slug) && (
              <p className="mt-3 font-mono text-[11px] uppercase">
                <Link
                  href={routes.ledgerLetter(e.slug)}
                  prefetch={false}
                  className="text-oxide"
                >
                  Issued as the Ledger Letter — read № {e.slug} →
                </Link>
              </p>
            )}
          </section>

          <CaptureBed />

          <footer className="mt-10 flex justify-between font-mono text-[10px] text-umber">
            <div>EVERY CLAIM SOURCED</div>
            <div>ABSENCE ≠ ZERO</div>
            <div>NO SIDES</div>
          </footer>
        </div>
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="eyebrow text-umber">{label}</dt>
      <dd className="mt-1 font-mono text-[19px] leading-none tabular-nums">
        {value.toLocaleString("en")}
      </dd>
    </div>
  );
}
