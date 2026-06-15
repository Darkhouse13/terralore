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
