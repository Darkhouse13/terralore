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

  return (
    <main
      className="min-h-[100dvh] w-full text-chalk"
      style={{
        background:
          "radial-gradient(120% 70% at 50% -10%, #15141d 0%, #0c0b11 44%, #09080d 100%)",
      }}
    >
      <div className="mx-auto max-w-[1340px] px-6 pb-24 pt-9 md:px-10 lg:px-14">
        {/* back */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 font-mono text-[12px] uppercase tracking-[0.22em] text-chalk-soft transition-colors hover:text-chalk"
        >
          <span className="text-[15px] transition-transform group-hover:-translate-x-0.5">←</span>
          The globe
        </Link>

        {/* header */}
        <header className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="font-mono text-[12px] uppercase tracking-[0.26em] text-brass">
                The index
              </div>
              <h1 className="mt-3.5 font-display text-[clamp(42px,6vw,76px)] font-[340] leading-[0.96] tracking-[-0.02em] text-chalk-bright">
                The Atlas
              </h1>
            </div>
            <div className="pb-2 font-mono text-[13px] tracking-[0.04em] text-chalk-faint">
              <span className="text-[18px] text-brass-bright">{filtered.length}</span> of {total} nations
            </div>
          </div>

          {/* search */}
          <div className="mt-[30px] flex items-center gap-3.5 rounded-[4px] border border-brass/20 bg-white/[0.02] px-[22px] py-3.5">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <circle cx="8" cy="8" r="6" stroke="#8c8472" strokeWidth="1.5" />
              <line x1="12.5" y1="12.5" x2="16" y2="16" stroke="#8c8472" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${total} nations by name or code…`}
              className="w-full bg-transparent text-[16px] text-parchment placeholder:text-chalk-dim focus:outline-none"
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
                      ? "border-brass-bright bg-brass-bright font-semibold text-[#1a140a]"
                      : "border-brass/25 text-chalk-soft hover:border-brass/50 hover:text-chalk"
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </header>

        {/* grid */}
        <div className="mt-[30px] grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(330px,1fr))]">
          {filtered.map((e) => {
            const nonUN = e.unMember === false;
            const since = e.foundingYear ?? "—";
            return (
              <Link
                key={e.code}
                href={`/country/${e.code}`}
                className="group flex items-center gap-4 rounded-[6px] border border-brass/12 bg-white/[0.012] px-[18px] py-[15px] transition-colors hover:border-brass/40 hover:bg-brass/[0.05]"
              >
                <span className="grid h-7 w-10 flex-none place-items-center rounded-[3px] border border-brass/20 bg-void-soft text-[15px] leading-none">
                  {e.flag ?? "🏳️"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="truncate font-display text-[19px] text-parchment">{e.name}</span>
                    <span className="flex-none font-mono text-[10px] tracking-[0.1em] text-chalk-dim">
                      {e.code}
                    </span>
                    {nonUN && (
                      <span className="flex-none rounded-[2px] border border-[rgba(143,125,168,0.4)] px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.1em] text-[#8f7da8]">
                        Non-UN
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 font-mono text-[10.5px] tracking-[0.08em] text-chalk-faint">
                    {e.continent ?? "—"}
                    {e.population != null && ` · ${formatPopulation(e.population)}`}
                  </div>
                </div>
                <span
                  className={`flex-none text-right font-display text-[15px] ${
                    since === "—" ? "text-chalk-mute" : "text-chalk-soft"
                  }`}
                >
                  {since}
                </span>
                <span className="flex-none text-[15px] text-chalk-mute transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            );
          })}
        </div>

        {/* empty state */}
        {filtered.length === 0 && (
          <div className="px-5 py-20 text-center">
            <div className="font-display text-[30px] text-chalk-soft">No nations found</div>
            <div className="mt-2.5 font-serif text-[17px] italic text-chalk-dim">
              Try a different name, code, or region.
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
