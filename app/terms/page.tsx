import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { breadcrumbLd, clampText, CONTENT_LICENSE, routes, SITE_NAME, SOCIAL } from "@/lib/seo";

/**
 * Terms — the conditions of using the site and watching Terralore's videos,
 * stated as plainly as the privacy page states what is stored. It exists
 * because Terralore's videos reach YouTube through YouTube API Services,
 * whose developer policies require the client's terms to bind its audience
 * to the YouTube Terms of Service (deviations E18). No boilerplate: only
 * what is true of this site.
 *
 * Server-rendered, no client JS, mounted-core grammar (a reading surface).
 */

const DESCRIPTION = clampText(
  "The terms of using Terralore: free to read, no accounts, summaries under CC BY 4.0, " +
    "third-party data under its publishers' terms, and Terralore's videos on YouTube " +
    "under the YouTube Terms of Service.",
);

export const metadata: Metadata = {
  title: "Terms — using Terralore and its videos",
  description: DESCRIPTION,
  alternates: { canonical: routes.terms() },
  openGraph: {
    type: "website",
    title: "Terms — using Terralore and its videos",
    description: DESCRIPTION,
    url: routes.terms(),
    siteName: SITE_NAME,
  },
};

const link = "text-oxide underline underline-offset-2";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8 border-t-2 border-basalt pt-5">
      <h2 className="font-display text-[22px] font-extrabold tracking-tight uppercase">{title}</h2>
      <div className="mt-3 max-w-2xl space-y-3 font-sans text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: SITE_NAME, path: routes.home() },
            { name: "Terms", path: routes.terms() },
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
                Terms
              </li>
            </ol>
          </nav>

          <header className="settle relative mt-5 pb-2">
            <h1 className="font-display text-[42px] leading-none font-extrabold tracking-tight uppercase md:text-[56px]">
              Terms
            </h1>
            <p className="mt-3 font-mono text-[11px] text-oxide uppercase">
              Using the site · reusing the record · our videos
            </p>
          </header>

          <Section title="Using the site">
            <p>
              Terralore is free to read. There are no accounts and nothing to sign up for
              except, if you choose, the Ledger letter (see{" "}
              <Link href={routes.privacy()} className={link}>
                privacy
              </Link>
              ). Please do not use the site in ways that harm it or its readers, such as
              overloading it with automated requests.
            </p>
          </Section>

          <Section title="Reusing the record">
            <p>
              Terralore&rsquo;s own summaries of events are released under{" "}
              <a href={CONTENT_LICENSE} rel="license" className={link}>
                CC BY 4.0
              </a>
              : reuse them freely, credit Terralore and link back. Figures and texts we cite
              from other publishers (the World Bank, UNESCO, the USGS, national archives and
              others) stay under their publishers&rsquo; own terms; every one names its
              source where it appears.
            </p>
          </Section>

          <Section title="Accuracy">
            <p>
              Every claim is traceable to a published source, and disputed territories and
              events are described without taking sides. The record can still contain
              errors: it is offered as it is, without warranty, and is not professional,
              legal or financial advice. If you find a mistake, write to
              ledger@terralore.co and we will check it against its source.
            </p>
          </Section>

          <Section title="Our videos on YouTube">
            <p>
              Terralore publishes its own short videos on its YouTube channel,{" "}
              <a href={SOCIAL.youtube} className={link} rel="noopener">
                @terraloreco
              </a>
              , using YouTube API Services. Watching or interacting with those videos means
              using YouTube, and is subject to the{" "}
              <a href="https://www.youtube.com/t/terms" className={link} rel="noopener">
                YouTube Terms of Service
              </a>{" "}
              and the{" "}
              <a href="https://policies.google.com/privacy" className={link} rel="noopener">
                Google Privacy Policy
              </a>
              . What our publishing tool accesses and stores is set out on the{" "}
              <Link href={routes.privacy()} className={link}>
                privacy page
              </Link>
              .
            </p>
          </Section>

          <Section title="Links and changes">
            <p>
              Sources and channels we link to are run by others, under their own terms.
              When these terms change, this page changes with them, dated below.
              Questions: ledger@terralore.co.
            </p>
            <p className="font-mono text-[11px] text-umber uppercase">Last updated 30 September 2026</p>
          </Section>

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
