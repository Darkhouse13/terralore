import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { allEntries } from "@/lib/ledger";
import { breadcrumbLd, ledgerDescription, routes, SITE_NAME } from "@/lib/seo";

/**
 * The Ledger — the world-level record of recorded refreshes (the Living
 * Record's Layer 3, docs/living-record.md §3.2). One entry per recorded
 * refresh: what moved, in which domains, across how many nations. The
 * corpus's own history, published — a photograph become a record.
 *
 * Server-rendered, no client JS, mounted-core grammar (a reading surface).
 */

export async function generateMetadata(): Promise<Metadata> {
  const entries = allEntries();
  const description = ledgerDescription(entries.length, entries[0]?.date ?? null);
  return {
    title: "The Ledger — the corpus change record",
    description,
    alternates: { canonical: routes.ledger() },
    openGraph: {
      type: "website",
      title: "The Ledger — the corpus change record",
      description,
      url: routes.ledger(),
      siteName: SITE_NAME,
    },
  };
}

export default function LedgerPage() {
  const entries = allEntries();

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: SITE_NAME, path: routes.home() },
            { name: "The Ledger", path: routes.ledger() },
          ]),
        ]}
      />
      <main className="min-h-screen bg-bone text-basalt">
        <div className="mount relative mx-auto max-w-[46rem] px-5 pt-4 pb-20 md:px-8 md:pt-8">
          <span aria-hidden className="mount-rail" />
          <nav aria-label="Breadcrumb" className="font-mono text-[10px] tracking-[0.16em] uppercase">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="text-oxide">
                  Terralore
                </Link>
              </li>
              <li aria-hidden="true" className="text-oxide">
                ·
              </li>
              <li aria-current="page" className="text-umber">
                The Ledger
              </li>
            </ol>
          </nav>

          <header className="settle relative mt-5 pb-2">
            <span aria-hidden className="mount-tick">
              <span>
                THE RECORD
                <br />
                {entries.length} {entries.length === 1 ? "ENTRY" : "ENTRIES"}
              </span>
            </span>
            <h1 className="font-display text-[42px] leading-none font-extrabold tracking-tight uppercase md:text-[64px]">
              The ledger
            </h1>
            <p className="mt-3 font-mono text-[11px] text-oxide uppercase">
              Every recorded refresh of the corpus · nothing moves silently
            </p>
            <p className="mt-4 max-w-2xl font-sans text-[15px] leading-relaxed">
              The dossiers show the world as the publishers last observed it; this page is
              the record of how that picture has moved. Each entry is one deliberate,
              recorded refresh: new observations as publishers advance their vintages,
              upstream revisions to figures already published, and series that stop being
              published — an absence appearing is a recorded fact here, never a silent
              disappearance. Every change resolves to its claim ID, and every entry names
              the sealed corpus versions it stands between (see{" "}
              <Link href={routes.integrity()} className="text-oxide underline underline-offset-2">
                the seal
              </Link>
              ).
            </p>
          </header>

          <section className="mt-6">
            <ol className="border-t-2 border-basalt">
              {entries.map((e) => (
                <li key={e.slug} className="border-b-2 border-basalt">
                  <Link
                    href={routes.ledgerEntry(e.slug)}
                    prefetch={false}
                    className="pressable block py-4"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <div className="min-w-0 font-mono text-[12.5px] uppercase">
                        <span className="text-oxide">№ {e.slug}</span>{" "}
                        <span className="text-umber">{e.date}</span>
                      </div>
                      <div className="font-mono text-[10.5px] text-umber">
                        {e.domains.length} {e.domains.length === 1 ? "DOMAIN" : "DOMAINS"} ·{" "}
                        {e.counts.nations} NATIONS
                      </div>
                    </div>
                    <div className="mt-1.5 font-sans text-[15px] font-medium">{e.title}</div>
                    <div className="mt-1 font-mono text-[11px] text-umber">
                      {e.counts.new.toLocaleString("en")} new ·{" "}
                      {e.counts.revised.toLocaleString("en")} revised ·{" "}
                      {e.counts.retired.toLocaleString("en")} retired ·{" "}
                      {e.counts.sourceChanges} source {e.counts.sourceChanges === 1 ? "change" : "changes"}
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
            {entries.length === 0 && (
              <p className="mt-4 font-sans text-[14px] text-umber">
                No recorded refresh yet — the first entry arrives with the first recorded
                data refresh.
              </p>
            )}
          </section>

          <p className="mt-8 max-w-2xl font-sans text-[13px] leading-relaxed text-umber">
            A recorded refresh is a deliberate act, not an automation: the data is
            re-pulled from its publishers, the diff is read, and the entry is published
            with the refresh itself. Between entries the corpus does not change — the
            seal proves it.
          </p>

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
