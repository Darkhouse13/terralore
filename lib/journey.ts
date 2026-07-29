import type { CountryHistory, Era, TimelineEvent } from "./types";

// A "moment" is a single navigable step in the time-journey. The journey is
// framed by an intro and outro and chaptered by era.
export type Moment =
  | { kind: "intro" }
  | { kind: "era"; eraIndex: number; era: Era }
  | { kind: "event"; eraIndex: number; era: Era; event: TimelineEvent }
  | { kind: "outro" };

export function buildMoments(history: CountryHistory): Moment[] {
  const out: Moment[] = [{ kind: "intro" }];
  history.eras.forEach((era, eraIndex) => {
    out.push({ kind: "era", eraIndex, era });
    [...era.events]
      .sort((a, b) => a.year - b.year)
      .forEach((event) => out.push({ kind: "event", eraIndex, era, event }));
  });
  out.push({ kind: "outro" });
  return out;
}

/** Display year for the big readout. Negative = BCE. */
export function bigYear(y: number): { num: string; suffix: string } {
  return y < 0
    ? { num: String(Math.abs(y)), suffix: "BCE" }
    : { num: String(y), suffix: "CE" };
}

export function momentEraIndex(m: Moment): number {
  if (m.kind === "era" || m.kind === "event") return m.eraIndex;
  if (m.kind === "intro") return -1;
  return Infinity; // outro
}

/**
 * The index of the first moment of the next (or previous) era.
 *
 * Era-jump exists because travelling and navigating are different needs. A
 * 26-moment journey is 25 key presses end to end — right for piloting through
 * time, useless for a reader who wants the fourth chapter. Bound to
 * PageUp/PageDown and [ / ].
 *
 * Going backwards from mid-era lands on the start of the *current* era first
 * (the behaviour of every audio player's "previous track"), which is almost
 * always what is meant.
 */
export function nextEraStart(moments: Moment[], from: number, dir: 1 | -1): number {
  const starts: number[] = [];
  let seen = -1;
  moments.forEach((m, idx) => {
    const e = momentEraIndex(m);
    if (e >= 0 && e !== seen) {
      seen = e;
      starts.push(idx);
    }
  });
  if (!starts.length) return from;

  if (dir === 1) {
    for (const s of starts) if (s > from) return s;
    return moments.length - 1; // past the last era → the outro
  }
  for (let k = starts.length - 1; k >= 0; k--) {
    if (starts[k] < from) return starts[k];
  }
  return 0;
}
