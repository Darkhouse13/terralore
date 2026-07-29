// ── The corpus-reading half of the cross-talk (server/build only) ───────────
// See lib/annotations.ts for why this file exists: that module is imported by
// the client-side Dossier, and this function imports `lib/histories` — the
// registry that statically pulls in all 183 history JSON files (~5.8 MB).
// Keeping it in the shared module bundled the whole corpus into every dossier
// visitor's browser. Import this ONLY from server components and build code.

import { getHistory } from "./histories";
import { CATEGORY_META } from "./types";
import type { EventAnnotation } from "./annotations";

/**
 * Every event for a nation that could annotate a series, tagged for filtering.
 *
 * Returns the whole set rather than pre-filtering by domain: the caller knows
 * the series' actual year span, which is the filter that matters, and computing
 * it once per page beats once per metric window.
 */
export function annotationsFor(code: string): EventAnnotation[] {
  const history = getHistory(code);
  if (!history) return [];

  const out: EventAnnotation[] = [];
  for (const era of history.eras) {
    for (const ev of era.events) {
      const cat = CATEGORY_META[ev.category];
      if (!cat) continue;
      out.push({
        year: ev.year,
        yearLabel: ev.yearLabel ?? String(ev.year),
        title: ev.title,
        category: ev.category,
        categoryLabel: cat.label,
        tint: cat.tint,
        eraId: era.id,
      });
    }
  }
  return out.sort((a, b) => a.year - b.year);
}
