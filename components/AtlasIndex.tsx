"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatPopulation } from "@/lib/format";

export interface IndexEntry {
  code: string;
  name: string;
  flag: string | null;
  continent: string | null;
  subregion: string | null;
  hasHistory: boolean;
  foundingYear?: string;
  population?: number | null;
  unMember?: boolean | null;
}

const REGIONS = ["All", "Europe", "Asia", "Africa", "Americas", "Oceania"];

function inRegion(e: IndexEntry, r: string): boolean {
  if (r === "All") return true;
  if (r === "Americas") return (e.continent ?? "").includes("America");
  return e.continent === r;
}

export default function AtlasIndex({ entries }: { entries: IndexEntry[] }) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("All");
  const total = entries.length;

  const regions = useMemo(
    () => REGIONS.filter((r) => r === "All" || entries.some((e) => inRegion(e, r))),
    [entries],
  );


  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return entries
      .filter((e) => inRegion(e, region))
      .filter(
        (e) =>
          !query ||
          e.name.toLowerCase().includes(query) ||
          e.code.toLowerCase().includes(query),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [entries, q, region]);

  // Continent groups, in a fixed order so the page's outline is stable across
  // builds (and so Africa does not move because a nation was added).
  const groups = useMemo(() => {
    const order = [
      "Africa",
      "Asia",
      "Europe",
      "North America",
      "South America",
      "Oceania",
      "Antarctica",
    ];
    const by = new Map<string, IndexEntry[]>();
    for (const e of filtered) {
      const k = e.continent ?? "Other";
      const list = by.get(k);
      if (list) list.push(e);
      else by.set(k, [e]);
    }
    return [...by.entries()]
      .sort((a, b) => {
        const ia = order.indexOf(a[0]);
        const ib = order.indexOf(b[0]);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a[0].localeCompare(b[0]);
      })
      .map(([name, items]) => ({
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        items,
      }));
  }, [filtered]);

  return (
    <main
      className="min-h-[100dvh] w-full text-chalk"
      style={{
        background:
          "radial-gradient(120% 70% at 50% -10%, #0c2e3d 0%, #04161f 44%, #04161f 100%)",
      }}
    >
      <div className="mx-auto max-w-[1340px] px-6 pb-24 pt-9 md:px-10 lg:px-14">
        {/* back */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 font-mono text-[12px] uppercase tracking-[0.22em] text-chalk-2 transition-colors hover:text-chalk"
        >
          <span className="text-[15px] transition-transform group-hover:-translate-x-0.5">←</span>
          The globe
        </Link>

        {/* header */}
        <header className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="font-mono text-[12px] uppercase tracking-[0.26em] text-copper">
                The index
              </div>
              <h1 className="mt-3.5 font-display text-[clamp(42px,6vw,76px)] font-[340] leading-[0.96] tracking-[-0.02em] text-chalk-hi">
                The Atlas
              </h1>
            </div>
            <div className="pb-2 font-mono text-[13px] tracking-[0.04em] text-chalk-3">
              <span className="text-[18px] text-copper-bright">{filtered.length}</span> of {total} nations
            </div>
          </div>

          {/* The other two ways in: the corpus read across nations rather than
              one at a time. */}
          <nav aria-label="Browse the archive" className="mt-6 flex flex-wrap gap-2.5">
            <Link
              href="/timeline"
              className="inline-flex items-center gap-2 rounded-[4px] border border-copper/25 px-4 py-2 font-mono text-[12px] uppercase tracking-[0.16em] text-chalk-2 transition-colors hover:border-copper hover:text-chalk"
            >
              Chronology <span className="text-copper-bright">by period</span>
            </Link>
            <Link
              href="/themes"
              className="inline-flex items-center gap-2 rounded-[4px] border border-copper/25 px-4 py-2 font-mono text-[12px] uppercase tracking-[0.16em] text-chalk-2 transition-colors hover:border-copper hover:text-chalk"
            >
              Themes <span className="text-copper-bright">by subject</span>
            </Link>
          </nav>

          {/* search */}
          <div className="mt-[30px] flex items-center gap-3.5 rounded-[4px] border border-copper/20 bg-white/[0.02] px-[22px] py-3.5">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <circle cx="8" cy="8" r="6" stroke="#8497a0" strokeWidth="1.5" />
              <line x1="12.5" y1="12.5" x2="16" y2="16" stroke="#8497a0" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${total} nations by name or code…`}
              className="w-full bg-transparent text-[16px] text-land-0 placeholder:text-chalk-4 focus:outline-none"
            />
          </div>

          {/* region facets */}
          <div className="mt-[18px] flex flex-wrap gap-2.5">
            {regions.map((r) => {
              const active = r === region;
              return (
                <button
                  key={r}
                  onClick={() => setRegion(r)}
                  className={`whitespace-nowrap rounded-[4px] border px-3.5 py-1.5 text-[13px] transition-colors ${
                    active
                      ? "border-copper-bright bg-copper-bright font-semibold text-[#04161f]"
                      : "border-copper/25 text-chalk-2 hover:border-copper/50 hover:text-chalk"
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </header>

        {/* ── Grouped by continent ────────────────────────────────────────
            Previously one flat wall of 186 identical cards. Grouping does two
            jobs at once: it gives a reader somewhere to land, and it gives the
            HTML a real outline — each continent is an <h2> with its own count,
            so an engine answering "which nations are in Africa" finds a heading
            and a list rather than 186 undifferentiated links. The grouping is
            server-rendered like everything else; the filter narrows within it. */}
        {groups.map((g) => (
          <section key={g.name} className="mt-11 first:mt-8" aria-labelledby={`c-${g.slug}`}>
            <div className="flex items-baseline gap-4">
              <h2
                id={`c-${g.slug}`}
                className="font-display text-[22px] font-[420] text-chalk-hi"
              >
                {g.name}
              </h2>
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-chalk-4">
                {g.items.length} {g.items.length === 1 ? "nation" : "nations"}
              </span>
              <span aria-hidden className="stratum-rule ml-auto max-w-[90px] flex-1" />
            </div>

            <div className="mt-4 grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(330px,1fr))]">
              {g.items.map((e) => {
                const nonUN = e.unMember === false;
                const since = e.foundingYear ?? "—";
                return (
                  <Link
                    key={e.code}
                    href={`/country/${e.code}`}
                    prefetch={false}
                    className="group flex items-center gap-4 rounded-[3px] border border-copper/12 bg-white/[0.012] px-[18px] py-[15px] transition-colors hover:border-copper/40 hover:bg-copper/[0.05]"
                  >
                    <span className="grid h-7 w-10 flex-none place-items-center text-[15px] leading-none">
                      {e.flag ?? "🏳️"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2.5">
                        <span className="truncate font-display text-[19px] text-land-0">
                          {e.name}
                        </span>
                        <span className="flex-none font-mono text-[10px] tracking-[0.1em] text-chalk-4">
                          {e.code}
                        </span>
                        {nonUN && (
                          <span className="flex-none rounded-[2px] border border-[rgba(113,126,177,0.45)] px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.1em] text-[#717eb1]">
                            Non-UN
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-baseline justify-between gap-3 font-mono text-[10.5px] tracking-[0.08em]">
                        {/* Both sides truncate. A handful of nations carry long
                            founding strings ("24 September 1973 (declared);
                            recognised 10 September 1974") which, left
                            unshrinkable, ran clean out of the card. */}
                        <span className="min-w-0 flex-1 truncate text-chalk-3">
                          {e.subregion ?? e.continent ?? "—"}
                          {e.population != null && ` · ${formatPopulation(e.population)}`}
                        </span>
                        <span
                          title={since === "—" ? undefined : since}
                          className={`min-w-0 max-w-[55%] flex-none truncate text-right ${
                            since === "—" ? "text-chalk-5" : "text-chalk-2"
                          }`}
                        >
                          {since}
                        </span>
                      </div>
                    </div>
                    <span className="flex-none text-[15px] text-chalk-5 transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        {/* empty state */}
        {filtered.length === 0 && (
          <div className="px-5 py-20 text-center">
            <div className="font-display text-[30px] text-chalk-2">No nations found</div>
            <div className="mt-2.5 font-serif text-[17px] italic text-chalk-4">
              Try a different name, code, or region.
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
