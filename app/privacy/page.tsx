import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { breadcrumbLd, clampText, routes, SITE_NAME } from "@/lib/seo";

/**
 * Privacy — the honest account of what the site and the Ledger Letter store
 * about a reader (deviations E16; the letter's data handling is part of the
 * capture contract). Written the way the rest of the record is written:
 * what is collected, where it lives, how it leaves. No boilerplate.
 *
 * Server-rendered, no client JS, mounted-core grammar (a reading surface).
 */

const DESCRIPTION = clampText(
  "What Terralore stores about a reader and what it does not: the site keeps no accounts; " +
    "the Ledger letter keeps an email address on Terralore's own server, double opt-in, " +
    "no tracking pixels, removed on unsubscribe.",
);

export const metadata: Metadata = {
  title: "Privacy — what is stored, and what is not",
  description: DESCRIPTION,
  alternates: { canonical: routes.privacy() },
  openGraph: {
    type: "website",
    title: "Privacy — what is stored, and what is not",
    description: DESCRIPTION,
    url: routes.privacy(),
    siteName: SITE_NAME,
  },
};

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: SITE_NAME, path: routes.home() },
            { name: "Privacy", path: routes.privacy() },
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
                Privacy
              </li>
            </ol>
          </nav>

          <header className="settle relative mt-5 pb-2">
            <h1 className="font-display text-[42px] leading-none font-extrabold tracking-tight uppercase md:text-[56px]">
              Privacy
            </h1>
            <p className="mt-3 font-mono text-[11px] text-oxide uppercase">
              What is stored · where it lives · how it leaves
            </p>
          </header>

          <section className="mt-6 border-t-2 border-basalt pt-5">
            <h2 className="font-display text-[22px] font-extrabold tracking-tight uppercase">
              Reading the site
            </h2>
            <p className="mt-3 max-w-2xl font-sans text-[15px] leading-relaxed">
              Terralore has no accounts, no logins, and sets no cookies of its own. One
              third-party tool runs: Google Analytics, which tells us which pages are
              read. It loads only after you interact with a page (or seven seconds pass),
              and its data reaches us as aggregate page counts, not profiles we build.
            </p>
          </section>

          <section className="mt-8 border-t-2 border-basalt pt-5">
            <h2 className="font-display text-[22px] font-extrabold tracking-tight uppercase">
              The Ledger letter
            </h2>
            <p className="mt-3 max-w-2xl font-sans text-[15px] leading-relaxed">
              Subscribing to{" "}
              <Link href={routes.ledger()} className="text-oxide underline underline-offset-2">
                the Ledger
              </Link>{" "}
              by letter stores exactly this: your email address, the subscription&rsquo;s
              double-opt-in state, and its timestamps. That record lives in a mailing-list
              system Terralore hosts on its own server — no newsletter service, no data
              processor holding the list, no one to sell it to. Delivery itself transits
              our mail provider (Zoho Mail), the same way any email does.
            </p>
            <ul className="mt-4 max-w-2xl space-y-2 font-sans text-[14.5px] leading-relaxed">
              <li>
                <span className="font-mono text-[11px] text-umber uppercase">Double opt-in — </span>
                nothing is sent until you confirm from your own inbox; an unconfirmed
                address is never mailed again.
              </li>
              <li>
                <span className="font-mono text-[11px] text-umber uppercase">No tracking — </span>
                letters carry no tracking pixels and links are direct URLs, not rewritten
                through a click counter. We know what we sent, not what you read.
              </li>
              <li>
                <span className="font-mono text-[11px] text-umber uppercase">One subject — </span>
                the address is used for the Ledger letter and nothing else: one letter per
                recorded refresh, no other mail.
              </li>
              <li>
                <span className="font-mono text-[11px] text-umber uppercase">Leaving — </span>
                every letter carries a one-click unsubscribe, which removes your address
                from the list immediately. The same page offers full erasure of the
                record; or write to ledger@terralore.co and we erase it by hand.
              </li>
            </ul>
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
