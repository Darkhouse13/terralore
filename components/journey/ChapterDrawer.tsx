"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Era, Source } from "@/lib/types";

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  const picked = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
  return picked.map((p) => p[0]?.toUpperCase()).join("").slice(0, 2);
}

// The Meridian "archive page" — a warm parchment sheet that slides in from the
// left over the darkened stage, carrying the full sourced prose on demand.
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
  const body = era?.body ?? [];
  const firstCap = body[0]?.charAt(0) ?? "";
  const firstRest = body[0]?.slice(1) ?? "";

  return (
    <AnimatePresence>
      {era && (
        <div className="fixed inset-0 z-40">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            onClick={onClose}
            className="absolute inset-0 bg-[rgba(7,6,10,0.55)] backdrop-blur-[3px]"
          />
          <motion.aside
            initial={{ x: "-102%" }}
            animate={{ x: 0 }}
            exit={{ x: "-102%" }}
            transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.6 }}
            className="absolute inset-y-0 left-0 flex w-[min(620px,90vw)] flex-col overflow-y-auto shadow-[40px_0_90px_-30px_rgba(0,0,0,0.7)]"
            style={{ background: "linear-gradient(160deg,#f7f0e1,#efe4cf)" }}
          >
            <div className="relative px-7 py-12 md:px-14">
              {/* header */}
              <div className="flex items-start justify-between gap-5">
                <div className="font-mono text-[12px] uppercase tracking-[0.22em] text-[#a07b32]">
                  Chapter {String(n).padStart(2, "0")} · {era.period}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close chapter"
                  className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border border-[rgba(120,90,40,0.35)] text-[#7a5e2e] transition-colors hover:border-[#7a5e2e] hover:bg-[rgba(120,90,40,0.08)]"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
              </div>

              <h2 className="mt-[18px] font-display text-[clamp(38px,6vw,58px)] font-[380] leading-none tracking-[-0.01em] text-[#221a0e]">
                {era.title}
              </h2>
              <p className="mt-[22px] font-serif text-[21px] font-[340] italic leading-[1.5] text-[#6a5836]">
                {era.standfirst}
              </p>

              <hr className="my-[30px] border-0 border-t border-[rgba(120,90,40,0.2)]" />

              {/* body with drop-cap first paragraph */}
              {body[0] && (
                <p className="font-serif text-[18px] font-[340] leading-[1.68] text-[#3a2f1d]">
                  <span className="float-left mr-3.5 mt-[7px] font-display text-[74px] font-[400] leading-[0.74] text-brass">
                    {firstCap}
                  </span>
                  {firstRest}
                </p>
              )}
              {body.slice(1).map((p, i) => (
                <p
                  key={i}
                  className="mt-[18px] font-serif text-[18px] font-[340] leading-[1.68] text-[#3a2f1d]"
                >
                  {p}
                </p>
              ))}

              {era.pullquote && (
                <figure className="my-9 border-l-2 border-brass/60 pl-6">
                  <blockquote className="font-display text-[1.5rem] font-medium leading-snug text-[#221a0e]">
                    “{era.pullquote.text}”
                  </blockquote>
                  {era.pullquote.attribution && (
                    <figcaption className="mt-3 font-mono text-[0.72rem] uppercase tracking-[0.1em] text-[#8a7142]">
                      {era.pullquote.attribution}
                    </figcaption>
                  )}
                </figure>
              )}

              {/* figures of the age */}
              {era.figures && era.figures.length > 0 && (
                <>
                  <div className="mb-[18px] mt-[42px] border-t border-[rgba(120,90,40,0.2)] pt-6 font-mono text-[11px] uppercase tracking-[0.26em] text-[#a07b32]">
                    Figures of the age
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {era.figures.map((f) => (
                      <div key={f.name} className="flex gap-4">
                        <div
                          className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full border border-[rgba(120,90,40,0.3)] font-display text-[22px] text-[#7a5e2e]"
                          style={{
                            background:
                              "repeating-linear-gradient(45deg,#e3d4b6,#e3d4b6 4px,#dccba8 4px,#dccba8 8px)",
                          }}
                        >
                          {initials(f.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold leading-tight text-[#221a0e]">{f.name}</div>
                          <div className="mt-0.5 font-mono text-[11px] text-[#8a7142]">
                            {f.role}
                            {f.life ? ` · ${f.life}` : ""}
                          </div>
                          {f.blurb && (
                            <p className="mt-1.5 text-[0.9rem] leading-relaxed text-[#5a4a2c]">
                              {f.blurb}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* sources */}
              {used.length > 0 && (
                <div className="mt-[30px] flex flex-wrap items-center gap-3 border-t border-[rgba(120,90,40,0.2)] pt-6">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#a07b32]">
                    Sources
                  </span>
                  {used.map((s) =>
                    s.url ? (
                      <a
                        key={s.id}
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-[4px] border border-[rgba(120,90,40,0.35)] px-3 py-1.5 font-mono text-[11px] text-[#5a4a2c] transition-colors hover:border-[#7a5e2e]"
                      >
                        {s.label}
                      </a>
                    ) : (
                      <span
                        key={s.id}
                        className="rounded-[4px] border border-[rgba(120,90,40,0.35)] px-3 py-1.5 font-mono text-[11px] text-[#5a4a2c]"
                      >
                        {s.label}
                      </span>
                    ),
                  )}
                </div>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
