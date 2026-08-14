// ── Claim identity — the pure helpers ──────────────────────────────────────
// The Living Record's claim-ID grammar (docs/living-record.md §1, DECISIONS
// D14): TL:<subject>:<measure>:<vintage>, derived only from committed content.
// This module is deliberately data-free and client-safe: the Dossier's proof
// backs, the server surfaces, lib/claims.ts and the validators all derive the
// same IDs from these functions, so identity cannot fork between surfaces.

/** A dossier observation: nation × metric × observed year. */
export function claimId(code: string, metricKey: string, year: number): string {
  return `TL:${code}:${metricKey}:${year}`;
}

/** The dossier page fragment for a claim — hyphens, not colons (CSS/URL life). */
export function claimFragment(metricKey: string, year: number): string {
  return `claim-${metricKey}-${year}`;
}

/** A commodity share — Terralore's own computation against the MCS world total. */
export function shareClaimId(code: string, mineralKey: string, year: number): string {
  return `TL:${code}:${mineralKey}-share:${year}`;
}

/** A published MCS world total. WLD is reserved — it is no nation's ADM0_A3. */
export function worldTotalClaimId(mineralKey: string, year: number): string {
  return `TL:WLD:${mineralKey}-total:${year}`;
}

/** The commodity page fragment for one producer's row. */
export function producerFragment(code: string): string {
  return `claim-${code.toLowerCase()}`;
}

/** "1789" · "52bce" — the event's numeric year as an ID token. */
export function eventYearToken(year: number): string {
  return year < 0 ? `${Math.abs(year)}bce` : String(year);
}

/**
 * Kebab-case an event title into its slug: lowercase, diacritics folded to
 * ASCII, non-alphanumerics collapsed to single hyphens, truncated at a word
 * boundary to ≤48 chars. Deterministic; collision ordinals are assigned by
 * assignEventKeys (they need the nation's whole corpus order).
 */
export function eventSlug(title: string): string {
  let s = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ÆæŒœ]/g, (c) => ({ Æ: "ae", æ: "ae", Œ: "oe", œ: "oe" })[c] ?? c)
    .replace(/[ØøĐđŁłß]/g, (c) => ({ Ø: "o", ø: "o", Đ: "d", đ: "d", Ł: "l", ł: "l", ß: "ss" })[c] ?? c)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (s.length > 48) {
    const cut = s.slice(0, 48);
    const at = cut.lastIndexOf("-");
    s = (at > 24 ? cut.slice(0, at) : cut).replace(/-+$/, "");
  }
  return s || "untitled";
}

export interface EventKey {
  /** "1789:the-bastille-falls" — the measure+vintage half of the claim ID. */
  key: string;
  /** "ev-1789-the-bastille-falls" — the chronicle page fragment. */
  fragment: string;
}

/**
 * Assign every event in a history its key, in corpus order (era order, then
 * event order — the authored order, so the assignment is stable across
 * builds). Two events sharing year and slug take -2, -3… ordinals.
 * Returns one EventKey[] per era, aligned with eras[i].events[j].
 */
export function assignEventKeys(
  eras: { events: { year: number; title: string }[] }[],
): EventKey[][] {
  const seen = new Map<string, number>();
  return eras.map((era) =>
    era.events.map((ev) => {
      const base = `${eventYearToken(ev.year)}:${eventSlug(ev.title)}`;
      const n = (seen.get(base) ?? 0) + 1;
      seen.set(base, n);
      const key = n === 1 ? base : `${base}-${n}`;
      return { key, fragment: `ev-${key.replace(":", "-")}` };
    }),
  );
}

/** The full event claim ID from a nation code and an assigned key. */
export function eventClaimId(code: string, key: EventKey): string {
  return `TL:${code}:event:${key.key}`;
}
