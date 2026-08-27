import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { corpusStats } from "@/lib/chronology";
import { breadcrumbLd, clampText, routes, SITE_NAME } from "@/lib/seo";

/**
 * Who makes this, how, and what to do when it is wrong.
 *
 * The trust argument of this site is per-claim sourcing plus the seal and the
 * ledger — but a record also needs a human who answers for it. This page names
 * the editor, states the method in the corpus's own terms, and publishes the
 * corrections policy. Nothing here is marketing: every statement about the
 * pipeline is one the validators actually enforce.
 *
 * Server-rendered, no client JS, mounted-core grammar (a reading surface).
 */

const DESCRIPTION = clampText(
  "Who makes Terralore, how every claim is sourced and validated, and how to " +
    "report an error. One editor, named; a corrections policy with a public " +
    "ledger; no silent edits.",
);

export const metadata: Metadata = {
  title: "About — who makes this, and how",
  description: DESCRIPTION,
  alternates: { canonical: routes.about() },
  openGraph: {
    type: "website",
    title: "About — who makes this, and how",
    description: DESCRIPTION,
    url: routes.about(),
    siteName: SITE_NAME,
  },
};

export default function AboutPage() {
  const stats = corpusStats();

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: SITE_NAME, path: routes.home() },
            { name: "About", path: routes.about() },
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
                About
              </li>
            </ol>
          </nav>

          <header className="settle relative mt-5 pb-2">
            <span aria-hidden className="mount-tick">
              <span>
                THE MAKERS
                <br />
                ONE EDITOR
              </span>
            </span>
            <h1 className="font-display text-[42px] leading-none font-extrabold tracking-tight uppercase md:text-[64px]">
              About
            </h1>
            <p className="mt-3 font-mono text-[11px] text-oxide uppercase">
              {stats.events.toLocaleString("en")} sourced events · {stats.nations} nations ·{" "}
              {stats.sources.toLocaleString("en")} references
            </p>
            <p className="mt-4 max-w-2xl font-sans text-[15px] leading-relaxed">
              Terralore is an encyclopedia of nations: each nation&rsquo;s history as a
              sourced chronicle, and its present as a dossier of figures that keep their
              provenance. The rule that governs everything here is small and absolute —{" "}
              <em>only verified claims, each traceable to a reliable source</em>. What
              cannot be sourced is not written; what is not observed renders as an
              absence, never as a zero.
            </p>
          </header>

          <section className="mt-6 border-t-2 border-basalt pt-5">
            <h2 className="font-display text-[22px] font-extrabold tracking-tight uppercase">
              Who makes this
            </h2>
            <p className="mt-3 max-w-2xl font-sans text-[14.5px] leading-relaxed">
              Terralore is researched, written and maintained by{" "}
              <a
                href="https://github.com/Darkhouse13"
                target="_blank"
                rel="noopener noreferrer"
                className="text-oxide underline underline-offset-2"
              >
                Hamza Bentaieb
              </a>
              , its founding editor. There is no larger staff behind the byline — and
              that is stated here plainly because the site&rsquo;s trust argument was
              never &ldquo;trust the author.&rdquo; It is that every claim carries its
              source, every corpus state is{" "}
              <Link href={routes.integrity()} className="text-oxide underline underline-offset-2">
                sealed
              </Link>
              , and every change is{" "}
              <Link href={routes.ledger()} className="text-oxide underline underline-offset-2">
                recorded
              </Link>
              . The citation is the credential; the editor is who answers for it.
            </p>
          </section>

          <section className="mt-8 border-t-2 border-basalt pt-5">
            <h2 className="font-display text-[22px] font-extrabold tracking-tight uppercase">
              The method
            </h2>
            <p className="mt-3 max-w-2xl font-sans text-[14.5px] leading-relaxed">
              Histories cite reference works and institutions — Encyclopaedia
              Britannica, UNESCO, national archives and museums, academic references —
              and every event names its sources beside it. Data dossiers are baked from
              the publishing institutions themselves: the World Bank, WHO, UNESCO
              Institute for Statistics, ITU, SIPRI, the UN IGME estimates and the USGS
              Mineral Commodity Summaries, each figure keeping its publisher, its
              observation year and its licence. Validators enforce what the prose
              promises: an event whose source id does not resolve, a figure whose
              source is missing, a fragment that does not match the rendered page —
              each fails the build, not the reader.
            </p>
            <p className="mt-3 max-w-2xl font-sans text-[14.5px] leading-relaxed">
              On disputes the site takes no side: contested territories are surfaced
              with the data that exists and its caveats, and the histories hold to the
              same neutral, primary-sourced treatment. Nothing is imputed; gaps are
              shown honestly.
            </p>
          </section>

          <section className="mt-8 border-t-2 border-basalt pt-5">
            <h2 className="font-display text-[22px] font-extrabold tracking-tight uppercase">
              Corrections
            </h2>
            <p className="mt-3 max-w-2xl font-sans text-[14.5px] leading-relaxed">
              If something here is wrong, write to{" "}
              <a
                href="mailto:ledger@terralore.co"
                className="text-oxide underline underline-offset-2"
              >
                ledger@terralore.co
              </a>{" "}
              with the page and the claim. A confirmed error is corrected in the
              corpus, and the correction is not silent: the change lands in{" "}
              <Link href={routes.ledger()} className="text-oxide underline underline-offset-2">
                the ledger
              </Link>{" "}
              as a recorded revision, and the corpus is re-
              <Link href={routes.integrity()} className="text-oxide underline underline-offset-2">
                sealed
              </Link>{" "}
              under a new version with the old one archived append-only. The full
              pipeline — authored files, validators, seals — is public in{" "}
              <a
                href="https://github.com/Darkhouse13/terralore"
                target="_blank"
                rel="noopener noreferrer"
                className="text-oxide underline underline-offset-2"
              >
                the repository
              </a>
              , where every past manifest is committed.
            </p>
          </section>

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
