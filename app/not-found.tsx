import type { Metadata } from "next";
import Link from "next/link";
import { corpusStats } from "@/lib/chronology";
import { routes } from "@/lib/seo";

/**
 * 404, in the interface's voice.
 *
 * Next's default is an unstyled black-on-white line of text, which on a site
 * about charts and archives reads as a page that fell out of a different
 * product. This is also the one page a reader reaches by having gone wrong, so
 * it should do something useful: every route out of here is a real place, and
 * the copy says what the archive actually holds rather than apologising.
 *
 * `noindex` — a 404 already tells a crawler not to index, but saying it twice
 * costs nothing and covers the soft-404 case.
 */
export const metadata: Metadata = {
  title: "Not on the chart",
  description:
    "That page is not part of the Terralore archive. The atlas, the chronology and every nation's chronicle are.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  const stats = corpusStats();

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-depth-6 px-6 py-20 text-chalk">
      <div className="w-full max-w-[38rem]">
        <span aria-hidden className="stratum-rule mb-8 block max-w-[120px]" />

        <p className="eyebrow text-copper">Error 404</p>

        <h1 className="mt-4 font-display text-[clamp(2.4rem,7vw,3.6rem)] font-[400] leading-[1.02] tracking-[-0.015em] text-chalk-hi">
          Not on the chart
        </h1>

        <p className="mt-5 font-serif text-[1.12rem] leading-[1.6] text-chalk-read">
          Nothing is published at this address. The archive holds{" "}
          {stats.events.toLocaleString("en")} sourced events across {stats.nations} nations
          — one of these is a better place to be.
        </p>

        <nav className="mt-10 flex flex-col divide-y divide-depth-2/70 border-y border-depth-2/70">
          {[
            { href: routes.home(), label: "The globe", note: "Spin it, choose a nation" },
            { href: routes.atlas(), label: "The atlas", note: "Every nation, searchable" },
            { href: "/timeline", label: "The chronology", note: "Every event, by period" },
            { href: "/themes", label: "The themes", note: "Every event, by subject" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              prefetch={false}
              className="group flex items-baseline justify-between gap-6 py-4 transition-colors hover:text-copper-bright"
            >
              <span className="text-[1.06rem] text-chalk">{l.label}</span>
              <span className="flex items-baseline gap-3 text-right">
                <span className="hidden text-[0.9rem] text-chalk-3 sm:inline">{l.note}</span>
                <span
                  aria-hidden
                  className="font-mono text-copper transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
