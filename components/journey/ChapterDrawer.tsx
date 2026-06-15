"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Era, Source } from "@/lib/types";

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  const picked = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
  return picked.map((p) => p[0]?.toUpperCase()).join("").slice(0, 2);
}

export default function ChapterDrawer({
  era,
  n,
  sources,
  onClose,
}: {
  era: Era | null;
  n: number;
  sources: Source[];
  onClose: () => void;
}) {
  const used = era ? sources.filter((s) => era.sources.includes(s.id)) : [];
  return (
    <AnimatePresence>
      {era && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
            className="paper-grain fixed inset-y-0 right-0 z-50 w-full max-w-2xl overflow-y-auto bg-parchment shadow-[var(--shadow-float)]"
          >
            <div className="relative z-10 px-7 py-10 md:px-12">
              <div className="flex items-start justify-between">
                <div>
                  <div className="eyebrow text-brass-deep">
                    Chapter {String(n).padStart(2, "0")} · {era.period}
                  </div>
                  <h2 className="mt-2 font-display text-[2.4rem] font-medium leading-[1.02] text-ink">
                    {era.title}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close chapter"
                  className="ml-4 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-parchment-line text-ink-soft transition hover:border-brass/50 hover:text-ink"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
              </div>

              <p className="mt-5 max-w-xl font-serif text-[1.3rem] italic leading-snug text-ink-soft">
                {era.standfirst}
              </p>

              <div className="prose-history dropcap mt-7">
                {era.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>

              {era.pullquote && (
                <figure className="my-9 border-l-2 border-brass/60 pl-6">
                  <blockquote className="font-display text-[1.5rem] font-medium leading-snug text-ink">
                    “{era.pullquote.text}”
                  </blockquote>
                  {era.pullquote.attribution && (
                    <figcaption className="mt-3 font-mono text-[0.72rem] uppercase tracking-[0.1em] text-ink-faint">
                      {era.pullquote.attribution}
                    </figcaption>
                  )}
                </figure>
              )}

              {era.figures && era.figures.length > 0 && (
                <div className="mt-10 border-t border-parchment-line pt-8">
                  <div className="eyebrow text-ink-faint">Figures of the age</div>
                  <div className="mt-5 grid gap-6 sm:grid-cols-2">
                    {era.figures.map((f) => (
                      <div key={f.name} className="flex gap-4">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-brass/40 bg-parchment-deep font-display text-ink-soft">
                          {initials(f.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-sans font-semibold leading-tight text-ink">{f.name}</div>
                          <div className="font-mono text-[0.64rem] uppercase tracking-[0.1em] text-ink-faint">
                            {f.role}
                            {f.life ? ` · ${f.life}` : ""}
                          </div>
                          <p className="mt-1.5 text-[0.9rem] leading-relaxed text-ink-soft">{f.blurb}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {used.length > 0 && (
                <div className="mt-10 border-t border-parchment-line pt-6">
                  <div className="eyebrow text-ink-faint">Sources for this chapter</div>
                  <ul className="mt-4 space-y-2">
                    {used.map((s) => (
                      <li key={s.id} className="text-[0.86rem] leading-snug text-ink-soft">
                        {s.url ? (
                          <a href={s.url} target="_blank" rel="noreferrer" className="text-ink underline decoration-brass/40 underline-offset-2 hover:decoration-brass">
                            {s.label}
                          </a>
                        ) : (
                          <span className="text-ink">{s.label}</span>
                        )}
                        {s.publisher && <span className="text-ink-faint"> — {s.publisher}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
