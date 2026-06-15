"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";

export interface IndexEntry {
  code: string;
  name: string;
  flag: string | null;
  continent: string | null;
  subregion: string | null;
  hasHistory: boolean;
  tagline?: string;
  foundingYear?: string;
}

const CONTINENT_ORDER = [
  "Africa",
  "Asia",
  "Europe",
  "North America",
  "South America",
  "Oceania",
  "Antarctica",
];

export default function AtlasIndex({
  entries,
  featured,
}: {
  entries: IndexEntry[];
  featured: IndexEntry[];
}) {
  const [q, setQ] = useState("");

  const groups = useMemo(() => {
    const query = q.trim().toLowerCase();
    const filtered = entries.filter((e) =>
      query ? e.name.toLowerCase().includes(query) : true
    );
    const byCont = new Map<string, IndexEntry[]>();
    for (const e of filtered) {
      const k = e.continent ?? "Other";
      if (!byCont.has(k)) byCont.set(k, []);
      byCont.get(k)!.push(e);
    }
    return [...byCont.entries()]
      .sort(
        (a, b) =>
          (CONTINENT_ORDER.indexOf(a[0]) + 99) % 100 -
          ((CONTINENT_ORDER.indexOf(b[0]) + 99) % 100)
      )
      .map(([cont, list]) => [cont, list.sort((a, b) => a.name.localeCompare(b.name))] as const);
  }, [entries, q]);

  const total = useMemo(
    () => groups.reduce((n, [, l]) => n + l.length, 0),
    [groups]
  );

  return (
    <div className="mx-auto max-w-6xl px-6 pb-28 pt-12 md:px-10">
      <header className="border-b border-parchment-line pb-10">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm text-ink-soft transition hover:text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="transition-transform group-hover:-translate-x-0.5">
            <path d="M16 10H4m0 0l5 5m-5-5l5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.14em]">The Globe</span>
        </Link>
        <h1 className="mt-6 font-display text-[3rem] font-medium leading-none text-ink md:text-[4rem]">
          The Index
        </h1>
        <p className="mt-3 max-w-xl font-serif text-[1.2rem] leading-relaxed text-ink-soft">
          Every nation on the globe, alphabetised by continent. Published
          archives are marked; the rest are being compiled and verified.
        </p>
      </header>

      {/* Featured archives */}
      {featured.length > 0 && (
        <section className="py-12">
          <div className="eyebrow text-brass-deep">Published archives</div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((e) => (
              <Link
                key={e.code}
                href={`/country/${e.code}`}
                className="group flex flex-col rounded-xl border border-parchment-line bg-parchment-deep/40 p-6 transition hover:border-brass/40 hover:bg-parchment-deep/70"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{e.flag}</span>
                  <span className="font-mono text-[0.7rem] text-brass-deep">{e.foundingYear}</span>
                </div>
                <h3 className="mt-4 font-display text-[1.6rem] leading-none text-ink">
                  {e.name}
                </h3>
                <p className="mt-2 font-serif text-[1.02rem] italic leading-snug text-ink-soft">
                  {e.tagline}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-brass-deep">
                  Explore
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="transition-transform group-hover:translate-x-1">
                    <path d="M4 10h12m0 0l-5-5m5 5l-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Search */}
      <div className="sticky top-0 z-20 -mx-6 bg-parchment/85 px-6 py-4 backdrop-blur md:-mx-10 md:px-10">
        <div className="flex items-center gap-3 rounded-full border border-parchment-line bg-parchment-deep/50 px-5 py-3">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-ink-faint">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search nations…"
            className="w-full bg-transparent text-ink placeholder:text-ink-faint focus:outline-none"
          />
          <span className="font-mono text-[0.7rem] tabular-nums text-ink-faint">{total}</span>
        </div>
      </div>

      {/* Full index */}
      <div className="mt-6 space-y-12">
        {groups.map(([cont, list]) => (
          <section key={cont}>
            <h2 className="eyebrow sticky top-20 mb-4 text-ink-faint">{cont}</h2>
            <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((e) => (
                <Link
                  key={e.code}
                  href={`/country/${e.code}`}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-parchment-deep/60"
                >
                  <span className="text-lg">{e.flag}</span>
                  <span className="flex-1 truncate text-ink-soft transition group-hover:text-ink">
                    {e.name}
                  </span>
                  {e.hasHistory && (
                    <span className="h-1.5 w-1.5 rounded-full bg-brass" title="Archive published" />
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))}
        {total === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-16 text-center font-serif text-lg italic text-ink-faint"
          >
            No nation by that name on the globe.
          </motion.p>
        )}
      </div>
    </div>
  );
}
