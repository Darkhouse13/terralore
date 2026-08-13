import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Mark from "@/components/brand/Mark";
import { organizationLd, websiteLd } from "@/lib/seo";
import { corpusStats } from "@/lib/chronology";
import { allCountries } from "@/lib/countries";
import { allRankings } from "@/lib/rankings";
import { allComparePages } from "@/lib/compare";
import { COMMODITY_META } from "@/lib/commodity-meta";

/* ── The front door — the section face of the whole atlas ───────────────────
   Five beds walking the palette in stratigraphic order (sand → clay → oxide
   → umber → basalt), each a destination; depth = the palette walk. Entirely
   server-rendered: the Overture is pure CSS (bed-settle + rule-draw +
   stamp + dot, ≤1.1s, then total stillness), replayed at most once per
   session via the inline script below — no hydration, no client JS.

   The overture's order is the geology's: the DEEPEST bed settles first
   (oldest first, bottom-up), rules cut in as beds lock, the TERRA/LORE
   stamp lands with mass (transform-only — it is the LCP element and must
   be opaque from its first frame), and the oxide zenith dot arrives last. */

// Bed delays, bottom-up. The stamp lands after the beds, the dot last.
const BED_DELAY = [400, 320, 240, 160, 80, 0]; // top bed … bottom bed (ms)
const STAMP_DELAY = 560;
const DOT_DELAY = 940;

function Bed({
  href,
  bg,
  title,
  titleColor,
  sub,
  subColor,
  count,
  delay,
}: {
  href: string;
  bg: string;
  title: string;
  titleColor: string;
  sub: string;
  subColor: string;
  count: string;
  delay: number;
}) {
  return (
    <>
      <div className="cut-rule rule-draw" style={{ ["--settle-delay" as string]: `${delay + 140}ms` }} />
      <Link
        href={href}
        prefetch={false}
        className="settle-fade pressable block"
        style={{ ["--settle-delay" as string]: `${delay}ms`, background: bg }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-[18px] md:py-6">
          <div>
            <div
              className="font-display text-[25px] leading-none font-extrabold tracking-tight uppercase md:text-[34px]"
              style={{ color: titleColor }}
            >
              {title}
            </div>
            <div className="mt-1 font-mono text-[11px]" style={{ color: subColor }}>
              {sub}
            </div>
          </div>
          <div className="font-mono text-[15px]" style={{ color: titleColor }}>
            {count} ↓
          </div>
        </div>
      </Link>
    </>
  );
}

export default function Home() {
  const stats = corpusStats();
  const nations = allCountries().length;
  const rankings = allRankings().length;
  const pairs = allComparePages().length;
  const events = stats.events.toLocaleString("en-US");

  return (
    <main className="min-h-screen bg-bone">
      <JsonLd data={[websiteLd(), organizationLd()]} />
      {/* The overture plays once per session. This runs during HTML parse —
          before the animations below begin — so a replay visit gets the
          settled state with no flash of motion. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(sessionStorage.getItem("overture"))document.documentElement.classList.add("no-overture");else sessionStorage.setItem("overture","1")}catch(e){}`,
        }}
      />

      {/* ── Masthead: the stamp, the mark, the claim ── */}
      <header className="mx-auto max-w-5xl px-5 pt-7 pb-4 md:pt-12">
        <div className="flex items-end justify-between">
          <h1
            className="stamp-in font-display text-[56px] leading-[0.95] font-extrabold tracking-tight md:text-[96px]"
            style={{ ["--settle-delay" as string]: `${STAMP_DELAY}ms` }}
          >
            TERRA
            <br />
            LORE
          </h1>
          <div
            className="settle dot-cue"
            style={{
              ["--settle-delay" as string]: `${STAMP_DELAY}ms`,
              ["--dot-delay" as string]: `${DOT_DELAY}ms`,
            }}
          >
            <Mark size={72} cut="full" tone="light" className="md:hidden" />
            <Mark size={104} cut="full" tone="light" className="hidden md:block" />
          </div>
        </div>
        <p
          className="settle mt-4 max-w-xl font-sans text-[15px] text-umber md:text-base"
          style={{ ["--settle-delay" as string]: `${STAMP_DELAY + 120}ms` }}
        >
          The reference work of nations, laid down in layers. Every specimen turns over to its
          label.
        </p>
      </header>

      {/* ── The beds, in stratigraphic order ── */}
      <nav aria-label="Sections">
        <Bed
          href="/atlas"
          bg="var(--color-sand)"
          title="Nations"
          titleColor="var(--color-basalt)"
          sub="THE SECTION CUT · A–Z"
          subColor="var(--color-umber)"
          count={String(nations)}
          delay={BED_DELAY[0]}
        />
        <Bed
          href="/timeline"
          bg="var(--color-clay)"
          title="Histories"
          titleColor="var(--color-basalt)"
          sub="EVERY EVENT DATED + SOURCED"
          subColor="var(--color-basalt)"
          count={events}
          delay={BED_DELAY[1]}
        />
        <Bed
          href="/rankings"
          bg="var(--color-oxide)"
          title="Rankings"
          titleColor="var(--color-bone)"
          sub="EVERY INDICATOR, WORLD-WIDE"
          subColor="var(--color-sand)"
          count={String(rankings)}
          delay={BED_DELAY[2]}
        />
        <Bed
          href="/compare"
          bg="var(--color-umber)"
          title="Compared"
          titleColor="var(--color-bone)"
          sub="NATION PAIRS, SIDE BY SIDE — NEVER GRADED"
          subColor="var(--color-sand)"
          count={String(pairs)}
          delay={BED_DELAY[3]}
        />
        <Bed
          href="/commodities"
          bg="var(--color-basalt)"
          title="Suppliers"
          titleColor="var(--color-bone)"
          sub="WHO SUPPLIES THE WORLD — MINERALS"
          subColor="var(--color-clay)"
          count={String(COMMODITY_META.length)}
          delay={BED_DELAY[4]}
        />
      </nav>

      {/* ── Dig + the cross-reads ── */}
      <div className="cut-rule rule-draw" style={{ ["--settle-delay" as string]: `${BED_DELAY[5] + 140}ms` }} />
      <div className="settle-fade" style={{ ["--settle-delay" as string]: `${BED_DELAY[5]}ms` }}>
        <div className="mx-auto max-w-5xl px-5 py-[18px]">
          <Link
            href="/atlas"
            prefetch={false}
            className="pressable flex items-center justify-between border-2 border-basalt px-4 py-[13px]"
          >
            <span className="font-sans text-[15px] text-umber">Dig for a nation…</span>
            <span className="font-mono text-xs text-oxide">DIG</span>
          </Link>
          <div className="mt-3 flex gap-6 font-mono text-[11px]">
            <Link href="/timeline" prefetch={false} className="text-oxide">
              BY PERIOD ↓
            </Link>
            <Link href="/themes" prefetch={false} className="text-oxide">
              BY THEME ↓
            </Link>
          </div>
        </div>
      </div>

      {/* ── The creed ── */}
      <div className="cut-rule" />
      <footer className="mx-auto flex max-w-5xl justify-between px-5 pt-[14px] pb-6 font-mono text-[10px] text-umber">
        <div>EVERY CLAIM SOURCED</div>
        <div>ABSENCE ≠ ZERO</div>
        <div>NO SIDES</div>
      </footer>
    </main>
  );
}
