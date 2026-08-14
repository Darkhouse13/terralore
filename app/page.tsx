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

   The phone overture is the geology's: the DEEPEST bed settles first
   (oldest first, bottom-up), rules cut in as beds lock, the TERRA/LORE
   stamp lands with mass (transform-only — it is the LCP element and must
   be opaque from its first frame), and the oxide zenith dot arrives last.

   ≥1024px this is THE WIDE CUT FACE (P4 contract): masthead 0ms · headline
   60 · the five beds 120–480 (90ms stagger, top-down as the contract cuts
   them) · dig row 570 — all 380ms on the mass curve, last motion done at
   950ms, inside the 1.1s budget. Same once-per-session guard, same
   reduced-motion collapse. Nav label law: the fourth bed is COMPARED at
   every breakpoint — junction vocabulary lives inside the compare surfaces
   only (deviations E14). */

// Phone bed delays, bottom-up. The stamp lands after the beds, the dot last.
const BED_DELAY = [400, 320, 240, 160, 80, 0]; // top bed … bottom bed (ms)
const STAMP_DELAY = 560;
const DOT_DELAY = 940;
// Desktop bed delays, top-down (P4 overture-at-width: 120–480, 90ms stagger).
const BED_DELAY_LG = [120, 210, 300, 390, 480];
const DIG_DELAY_LG = 570;

function Bed({
  href,
  bg,
  title,
  titleColor,
  sub,
  subColor,
  desc,
  descColor,
  count,
  delay,
  delayLg,
}: {
  href: string;
  bg: string;
  title: string;
  titleColor: string;
  sub: string;
  subColor: string;
  desc: string;
  descColor: string;
  count: string;
  delay: number;
  delayLg: number;
}) {
  return (
    <>
      <div
        className="cut-rule rule-draw"
        style={{
          ["--settle-delay" as string]: `${delay + 140}ms`,
          ["--settle-delay-lg" as string]: `${delayLg}ms`,
        }}
      />
      <Link
        href={href}
        prefetch={false}
        className="settle-fade pressable block"
        style={{
          ["--settle-delay" as string]: `${delay}ms`,
          ["--settle-delay-lg" as string]: `${delayLg}ms`,
          background: bg,
        }}
      >
        {/* The wide cut face (P4): title · reading · count as three columns,
            the bed keeping its full-bleed pigment inside the frame. */}
        <div className="mx-auto max-w-5xl px-5 py-[18px] md:py-6 lg:grid lg:max-w-none lg:grid-cols-[340px_minmax(0,1fr)_200px] lg:items-center lg:gap-8 lg:px-10 lg:py-[22px]">
          <div className="flex items-center justify-between lg:contents">
            <div className="lg:col-start-1 lg:row-start-1">
              <div
                className="font-display text-[25px] leading-none font-extrabold tracking-tight uppercase md:text-[34px]"
                style={{ color: titleColor }}
              >
                {title}
              </div>
              <div className="mt-1 font-mono text-[11px] lg:hidden" style={{ color: subColor }}>
                {sub}
              </div>
            </div>
            <div
              className="font-mono text-[15px] lg:col-start-3 lg:row-start-1 lg:text-right lg:text-[17px]"
              style={{ color: titleColor }}
            >
              {count} <span className="lg:hidden">↓</span>
              <span className="hidden lg:inline">→</span>
            </div>
          </div>
          <div
            className="hidden font-sans text-[15px] lg:col-start-2 lg:row-start-1 lg:block"
            style={{ color: descColor }}
          >
            {desc}{" "}
            <span className="font-mono text-[11px]" style={{ color: subColor }}>
              {sub}
            </span>
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

      {/* ≥1024px the whole face sits in the 1760px frame (P4 E5); at 1920 the
          margins grow and the beds stay full-bleed inside it. */}
      <div className="lg:mx-auto lg:max-w-[1760px]">
        {/* ── The masthead — desktop wayfinding, first motion of the overture ── */}
        <div
          className="settle-fade hidden border-b-2 border-basalt lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-8 lg:px-10 lg:py-3.5"
          style={{ ["--settle-delay-lg" as string]: "0ms" }}
        >
          <div className="flex items-center gap-3.5">
            <Mark size={40} cut="full" tone="light" />
            <div className="font-display text-[21px] font-extrabold tracking-[0.02em]">
              TERRALORE
            </div>
          </div>
          <nav
            aria-label="Surfaces"
            className="flex gap-[26px] font-mono text-[11px] tracking-[0.1em]"
          >
            <Link href="/atlas" prefetch={false} className="py-1 text-umber">
              SECTION CUT
            </Link>
            <Link href="/timeline" prefetch={false} className="py-1 text-umber">
              HISTORIES
            </Link>
            <Link href="/rankings" prefetch={false} className="py-1 text-umber">
              RANKINGS
            </Link>
            <Link href="/compare" prefetch={false} className="py-1 text-umber">
              COMPARED
            </Link>
            <Link href="/commodities" prefetch={false} className="py-1 text-umber">
              SUPPLIERS
            </Link>
          </nav>
          <div className="font-mono text-[10px] tracking-[0.08em] text-umber">
            THE EARTH IN SECTION
          </div>
        </div>

        {/* ── Masthead (phone) / headline (desktop): the stamp, the mark, the claim ── */}
        <header className="mx-auto max-w-5xl px-5 pt-7 pb-4 md:pt-12 lg:max-w-none lg:px-10 lg:pt-11 lg:pb-6">
          <div className="flex items-end justify-between">
            <h1
              className="stamp-in font-display text-[56px] leading-[0.95] font-extrabold tracking-tight md:text-[96px] lg:text-[108px] lg:leading-[0.9] lg:tracking-[-0.02em]"
              style={{
                ["--settle-delay" as string]: `${STAMP_DELAY}ms`,
                ["--settle-delay-lg" as string]: "60ms",
              }}
            >
              TERRA
              <br className="lg:hidden" />
              LORE
            </h1>
            <div
              className="settle dot-cue lg:flex lg:flex-col lg:items-end lg:gap-3.5 lg:pb-2"
              style={{
                ["--settle-delay" as string]: `${STAMP_DELAY}ms`,
                ["--settle-delay-lg" as string]: "60ms",
                ["--dot-delay" as string]: `${DOT_DELAY}ms`,
                ["--dot-delay-lg" as string]: "60ms",
              }}
            >
              <Mark size={72} cut="full" tone="light" className="md:hidden" />
              <Mark size={104} cut="full" tone="light" className="hidden md:block" />
              <div className="hidden font-mono text-[11px] tracking-[0.12em] text-umber lg:block">
                {nations} NATIONS · {events} SOURCED EVENTS · {rankings} RANKINGS
              </div>
            </div>
          </div>
          <p
            className="settle mt-4 max-w-xl font-sans text-[15px] text-umber md:text-base lg:mt-3.5 lg:max-w-2xl lg:text-[19px]"
            style={{
              ["--settle-delay" as string]: `${STAMP_DELAY + 120}ms`,
              ["--settle-delay-lg" as string]: "60ms",
            }}
          >
            The reference work of nations, laid down in layers. Every specimen turns over to
            its label.
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
            desc="Earth in cross-section — continents as beds, nations as seams. Deeper is older ground."
            descColor="var(--color-umber-deep)"
            count={String(nations)}
            delay={BED_DELAY[0]}
            delayLg={BED_DELAY_LG[0]}
          />
          <Bed
            href="/timeline"
            bg="var(--color-clay)"
            title="Histories"
            titleColor="var(--color-basalt)"
            sub="EVERY EVENT DATED + SOURCED"
            subColor="var(--color-basalt)"
            desc="History in beds — depth is time, down is older, always."
            descColor="var(--color-basalt)"
            count={events}
            delay={BED_DELAY[1]}
            delayLg={BED_DELAY_LG[1]}
          />
          <Bed
            href="/rankings"
            bg="var(--color-oxide)"
            title="Rankings"
            titleColor="var(--color-bone)"
            sub="EVERY INDICATOR, WORLD-WIDE"
            subColor="var(--color-bone)"
            desc="Each value with its year and source; the unobserved hold their places as hatched gaps."
            descColor="var(--color-bone)"
            count={String(rankings)}
            delay={BED_DELAY[2]}
            delayLg={BED_DELAY_LG[2]}
          />
          <Bed
            href="/compare"
            bg="var(--color-umber)"
            title="Compared"
            titleColor="var(--color-bone)"
            sub="NATION PAIRS, SIDE BY SIDE — NEVER GRADED"
            subColor="var(--color-sand)"
            desc="Any two published nations set beside each other, and the events where their histories touch."
            descColor="var(--color-sand)"
            count={String(pairs)}
            delay={BED_DELAY[3]}
            delayLg={BED_DELAY_LG[3]}
          />
          <Bed
            href="/commodities"
            bg="var(--color-basalt)"
            title="Suppliers"
            titleColor="var(--color-bone)"
            sub="WHO SUPPLIES THE WORLD — MINERALS"
            subColor="var(--color-clay)"
            desc="Physical production by nation, sourced to the survey that counted it."
            descColor="var(--color-clay)"
            count={String(COMMODITY_META.length)}
            delay={BED_DELAY[4]}
            delayLg={BED_DELAY_LG[4]}
          />
        </nav>

        {/* ── Dig + the cross-reads (phone) / dig + the creed (desktop) ── */}
        <div
          className="cut-rule rule-draw"
          style={{
            ["--settle-delay" as string]: `${BED_DELAY[5] + 140}ms`,
            ["--settle-delay-lg" as string]: `${DIG_DELAY_LG}ms`,
          }}
        />
        <div
          className="settle-fade"
          style={{
            ["--settle-delay" as string]: `${BED_DELAY[5]}ms`,
            ["--settle-delay-lg" as string]: `${DIG_DELAY_LG}ms`,
          }}
        >
          <div className="mx-auto max-w-5xl px-5 py-[18px] lg:grid lg:max-w-none lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center lg:gap-10 lg:px-10 lg:py-5">
            <div>
              <Link
                href="/atlas"
                prefetch={false}
                className="pressable flex items-center justify-between border-2 border-basalt px-4 py-[13px]"
              >
                <span className="font-sans text-[15px] text-umber">Dig for a nation…</span>
                <span className="font-mono text-xs text-oxide">DIG</span>
              </Link>
              <div className="mt-3 flex gap-6 font-mono text-[11px] lg:hidden">
                <Link href="/timeline" prefetch={false} className="text-oxide">
                  BY PERIOD ↓
                </Link>
                <Link href="/themes" prefetch={false} className="text-oxide">
                  BY THEME ↓
                </Link>
              </div>
            </div>
            <div className="hidden justify-between font-mono text-[10px] text-umber lg:flex">
              <div>EVERY CLAIM SOURCED</div>
              <div>ABSENCE ≠ ZERO</div>
              <div>NO SIDES</div>
            </div>
          </div>
        </div>

        {/* ── The creed (phone — the desktop creed rides the dig row) ── */}
        <div className="cut-rule lg:hidden" />
        <footer className="mx-auto max-w-5xl px-5 pt-[14px] pb-6 lg:hidden">
          <div className="flex justify-between font-mono text-[10px] text-umber">
            <div>EVERY CLAIM SOURCED</div>
            <div>ABSENCE ≠ ZERO</div>
            <div>NO SIDES</div>
          </div>
        </footer>
      </div>
    </main>
  );
}
