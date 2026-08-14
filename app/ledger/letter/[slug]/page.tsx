import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import CaptureBed from "@/components/strata/CaptureBed";
import { getEntry, letterBody, letterSlugs } from "@/lib/ledger";
import { breadcrumbLd, ledgerEntryDescription, routes, SITE_NAME } from "@/lib/seo";

/**
 * The letter archive — each sent Ledger Letter as a linkable page under
 * /ledger (deviations E16). The body below IS the email that was sent: the
 * builder's table-and-inline-style HTML embedded verbatim (all styling is
 * inline, so it renders here exactly as it rendered in the inbox), framed by
 * the site's own reading chrome. The plain-text alternative is one link away.
 *
 * Server-rendered, no client JS.
 */

export function generateStaticParams() {
  return letterSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const e = getEntry(slug);
  if (!e) return { title: `Unknown letter — ${SITE_NAME}` };
  const description = `The Ledger by letter, issue № ${e.slug}: ${ledgerEntryDescription(e)}`;
  const path = routes.ledgerLetter(slug);
  return {
    title: `Letter № ${e.slug} — the Ledger digest`,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: `The Ledger — Letter № ${e.slug}`,
      description,
      url: path,
      siteName: SITE_NAME,
    },
  };
}

export default async function LedgerLetterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getEntry(slug);
  const body = letterBody(slug);
  if (!entry || !body) notFound();

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: SITE_NAME, path: routes.home() },
            { name: "The Ledger", path: routes.ledger() },
            { name: `№ ${entry.slug}`, path: routes.ledgerEntry(entry.slug) },
            { name: "The letter", path: routes.ledgerLetter(slug) },
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
              <li>
                <Link href={routes.ledgerEntry(entry.slug)} className="text-oxide">
                  № {entry.slug}
                </Link>
              </li>
              <li aria-hidden="true" className="text-oxide">
                ·
              </li>
              <li aria-current="page" className="text-umber">
                The letter
              </li>
            </ol>
          </nav>

          <header className="settle relative mt-5 pb-2">
            <span aria-hidden className="mount-tick">
              <span>
                LETTER {entry.slug}
                <br />
                {entry.date}
              </span>
            </span>
            <p className="eyebrow text-oxide">The Ledger, by letter · issue № {entry.slug}</p>
            <h1 className="mt-2 font-display text-[34px] leading-[1.02] font-extrabold tracking-tight uppercase md:text-[44px]">
              The letter of record № {entry.slug}
            </h1>
            <p className="mt-3 max-w-2xl font-sans text-[14px] leading-relaxed text-umber">
              The digest below is letter № {entry.slug} exactly as the Ledger&rsquo;s
              subscribers receive it — archived verbatim, with its{" "}
              <a
                href={`/ledger/letter/${entry.slug}.txt`}
                className="font-mono text-[12.5px] text-oxide underline underline-offset-2"
              >
                plain-text alternative
              </a>{" "}
              beside it. The complete change record is{" "}
              <Link
                href={routes.ledgerEntry(entry.slug)}
                className="text-oxide underline underline-offset-2"
              >
                entry № {entry.slug}
              </Link>
              .
            </p>
          </header>

          {/* The email, verbatim: builder-generated rows, every style inline. */}
          <div className="mt-4 border-2 border-basalt bg-bone px-4 py-1 md:px-6">
            <table
              role="presentation"
              cellPadding="0"
              cellSpacing="0"
              style={{ maxWidth: 560, width: "100%", margin: "0 auto", borderCollapse: "collapse" }}
              dangerouslySetInnerHTML={{ __html: body }}
            />
          </div>

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
