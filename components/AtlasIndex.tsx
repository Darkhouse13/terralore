"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

/* ── THE SECTION CUT — world navigation ─────────────────────────────────────
   Continents are beds, nations are seams (contract; DESIGN.md §8). The cut
   descends the palette in stratigraphic order — Africa first as the oldest
   inhabited bed, Antarctica last as the one bed with no polity, drawn in the
   absence hatch. SSG + a client filter; no canvas, no globe, no WebGL.

   Search narrows seams inside their beds; a bed with no matches collapses.
   Seam rows keep every fact they carry in the initial HTML. */

export interface IndexEntry {
  code: string;
  name: string;
  continent: string | null;
  subregion: string | null;
  hasHistory: boolean;
  foundingYear?: string;
  unMember?: boolean | null;
}

// The cut, top to bottom. Ground + the proven text pair for that ground
// (DESIGN.md §2). Antarctica is the absence bed: no polity, no pigment.
const BEDS: {
  name: string;
  bg: string;
  title: string;
  sub: string;
  hatch?: boolean;
}[] = [
  { name: "Africa", bg: "var(--color-sand)", title: "var(--color-basalt)", sub: "var(--color-umber)" },
  { name: "Asia", bg: "var(--color-clay)", title: "var(--color-basalt)", sub: "var(--color-basalt)" },
  { name: "Europe", bg: "var(--color-oxide)", title: "var(--color-bone)", sub: "var(--color-bone)" },
  { name: "North America", bg: "var(--color-umber)", title: "var(--color-bone)", sub: "var(--color-sand)" },
  { name: "South America", bg: "var(--color-umber-deep)", title: "var(--color-bone)", sub: "var(--color-sand)" },
  { name: "Oceania", bg: "var(--color-basalt)", title: "var(--color-bone)", sub: "var(--color-clay)" },
  { name: "Antarctica", bg: "var(--color-bone)", title: "var(--color-basalt)", sub: "var(--color-umber)", hatch: true },
];

const slugOf = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

export default function AtlasIndex({ entries }: { entries: IndexEntry[] }) {
  const [q, setQ] = useState("");
  const total = entries.length;

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return entries
      .filter(
        (e) =>
          !query ||
          e.name.toLowerCase().includes(query) ||
          e.code.toLowerCase().includes(query),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [entries, q]);

  const beds = useMemo(() => {
    const by = new Map<string, IndexEntry[]>();
    for (const e of filtered) {
      const k = e.continent ?? "Other";
      const list = by.get(k);
      if (list) list.push(e);
      else by.set(k, [e]);
    }
    return BEDS.map((bed) => ({ ...bed, items: by.get(bed.name) ?? [] })).filter(
      (bed) => bed.items.length > 0,
    );
  }, [filtered]);

  return (
    <main className="min-h-screen bg-bone">
      {/* ≥1024px the cut face sits in the 1760px frame (P4 E5); the section
          cut is the one surface that uses width honestly — a wider face
          shows more seams per row, never taller rows. */}
      <div className="lg:mx-auto lg:max-w-[1760px]">
      <div className="mx-auto max-w-5xl px-5 pt-6 pb-5 lg:max-w-none lg:px-10 lg:pt-8">
        <Link
          href="/"
          className="settle inline-block py-1.5 font-mono text-[10px] tracking-[0.16em] text-oxide"
        >
          ← TERRALORE
        </Link>
        <h1 className="settle mt-2 font-display text-[42px] leading-none font-extrabold tracking-tight uppercase md:text-[64px] lg:text-[52px]">
          The section cut
        </h1>
        <p className="settle mt-2 hidden max-w-2xl font-sans text-[15px] text-umber lg:block">
          You are standing in the quarry — the whole wall at once, continents as beds,
          nations as seams. Deeper is older ground.
        </p>
        <div
          className="settle mt-2 font-mono text-[11px] text-oxide"
          style={{ ["--settle-delay" as string]: "60ms" }}
        >
          {total} NATIONS · {beds.length} BEDS · A–Z WITHIN EACH
        </div>

        {/* dig */}
        <div
          className="settle mt-5 flex items-center justify-between border-2 border-basalt px-4 py-[11px] lg:max-w-[46rem]"
          style={{ ["--settle-delay" as string]: "120ms" }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Dig for a nation — name or code…`}
            aria-label="Search nations"
            className="w-full bg-transparent font-sans text-[15px] text-basalt placeholder:text-umber"
          />
          <span className="font-mono text-xs text-oxide">{filtered.length}</span>
        </div>

        {/* bed jump links */}
        <nav
          aria-label="Continents"
          className="settle mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px]"
          style={{ ["--settle-delay" as string]: "180ms" }}
        >
          {beds.map((b) => (
            <a
              key={b.name}
              href={`#c-${slugOf(b.name)}`}
              className="inline-block py-1.5 text-oxide"
            >
              {b.name.toUpperCase()} ↓
            </a>
          ))}
        </nav>
      </div>

      {/* the cut — at width, RULES AS COLUMNS (P4 §4): a depth column, the
          bed's name column, and the seam flow, joined by vertical 2px rules */}
      {beds.map((bed, bi) => (
        <section
          key={bed.name}
          id={`c-${slugOf(bed.name)}`}
          aria-labelledby={`h-${slugOf(bed.name)}`}
          className="bed settle scroll-mt-2 lg:grid lg:grid-cols-[64px_260px_minmax(0,1fr)] lg:items-stretch"
          style={{
            background: bed.hatch
              ? "repeating-linear-gradient(45deg, var(--color-absent) 0 3px, var(--color-bone) 3px 10px)"
              : bed.bg,
            ["--settle-delay" as string]: `${Math.min(bi * 60 + 200, 560)}ms`,
          }}
        >
          {/* the depth scale — apparatus, desktop only */}
          <div
            aria-hidden
            className="hidden items-center justify-center border-r-2 border-basalt py-2.5 font-mono text-[10px] tracking-[0.18em] [writing-mode:vertical-rl] lg:flex"
            style={{ color: bed.sub }}
          >
            {bi === 0
              ? "0 — SHALLOW"
              : bi === beds.length - 1
                ? `${bi} — DEEPEST`
                : String(bi)}
          </div>
          <div className="mx-auto max-w-5xl px-5 py-4 lg:contents">
            <div className="flex items-baseline justify-between lg:flex-col lg:items-start lg:justify-center lg:gap-1 lg:px-6 lg:py-5">
              <h2
                id={`h-${slugOf(bed.name)}`}
                className="font-display text-[17px] font-extrabold tracking-tight uppercase md:text-[19px] lg:text-[26px]"
                style={{ color: bed.title }}
              >
                {bed.name}
              </h2>
              <div className="font-mono text-[10px]" style={{ color: bed.sub }}>
                {bed.items.length} {bed.items.length === 1 ? "SEAM" : "SEAMS"}
              </div>
            </div>

            {/* A wider cut face shows more seams per row — true to the
                metaphor; stretching row height would not be. */}
            <div className="mt-2 grid grid-cols-1 gap-x-8 md:grid-cols-2 lg:mt-0 lg:flex lg:flex-wrap lg:content-center lg:items-baseline lg:gap-x-[22px] lg:gap-y-1.5 lg:px-6 lg:py-[18px]">
              {bed.items.map((e) => (
                <Link
                  key={e.code}
                  href={`/country/${e.code}`}
                  prefetch={false}
                  className="seam-row pressable flex items-baseline justify-between gap-3 py-[7px] lg:justify-start lg:gap-2 lg:py-0 lg:whitespace-nowrap"
                  style={{ ["--seam-rule" as string]: bed.title }}
                >
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span
                      className="truncate font-sans text-[14.5px] font-medium"
                      style={{ color: bed.title }}
                    >
                      {e.name}
                    </span>
                    {e.unMember === false && (
                      <span
                        className="flex-none font-mono text-[8.5px] tracking-[0.1em]"
                        style={{ color: bed.sub }}
                      >
                        NON-UN
                      </span>
                    )}
                  </span>
                  {/* Some founding labels run long ("24 September 1973 (declared);
                      recognised 10 September 1974") — the seam truncates them
                      rather than widening the cut; the wide flow carries the
                      code alone. */}
                  <span
                    className="max-w-[50%] flex-none truncate text-right font-mono text-[10px] lg:max-w-none lg:text-[9px]"
                    style={{ color: bed.sub }}
                    title={e.foundingYear}
                  >
                    {e.code}
                    <span className="lg:hidden">
                      {e.foundingYear ? ` · ${e.foundingYear}` : ""}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}

      {filtered.length === 0 && (
        <div className="bed px-5 py-16 text-center">
          <div className="font-display text-[25px] font-extrabold uppercase">Nothing dug up</div>
          <div className="mt-2 font-sans text-[14px] text-umber">
            Try a different name or three-letter code.
          </div>
        </div>
      )}

      <div className="cut-rule" />
      <footer className="mx-auto flex max-w-5xl justify-between px-5 pt-[14px] pb-6 font-mono text-[10px] text-umber lg:max-w-none lg:px-10">
        <div>EVERY CLAIM SOURCED</div>
        <div>ABSENCE ≠ ZERO</div>
        <div>NO SIDES</div>
      </footer>
      </div>
    </main>
  );
}
