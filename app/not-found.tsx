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
    <main className="grid min-h-[100dvh] place-items-center bg-bone px-6 py-20">
      <div className="w-full max-w-[38rem]">
        <p className="eyebrow text-oxide">Error 404 · Not observed</p>

        <h1 className="mt-3 font-display text-[42px] font-extrabold uppercase leading-none tracking-tight md:text-[56px]">
          Not on the chart
        </h1>

        <div className="not-observed mt-5 inline-block">NOTHING IS PUBLISHED AT THIS ADDRESS</div>

        <p className="mt-4 font-sans text-[15px] leading-[1.6] text-umber">
          The archive holds {stats.events.toLocaleString("en")} sourced events across{" "}
          {stats.nations} nations — one of these is a better place to be.
        </p>

        <nav className="mt-8 flex flex-col border-t-2 border-basalt">
          {[
            { href: routes.home(), label: "The front door", note: "The whole atlas in section" },
            { href: routes.atlas(), label: "The section cut", note: "Every nation, searchable" },
            { href: "/timeline", label: "The chronology", note: "Every event, by period" },
            { href: "/themes", label: "The themes", note: "Every event, by subject" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              prefetch={false}
              className="pressable flex items-baseline justify-between gap-6 border-b-2 border-basalt py-3.5"
            >
              <span className="font-sans text-[15px] font-medium">{l.label}</span>
              <span className="flex items-baseline gap-3 text-right">
                <span className="hidden font-sans text-[13px] text-umber sm:inline">{l.note}</span>
                <span aria-hidden className="font-mono text-oxide">→</span>
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
