// ── Access layer for the Ledger (docs/living-record.md §3) ─────────────────
// Entries are committed JSON in public/ledger/<NNNN>.json — fetchable raw at
// /ledger/<NNNN>.json, sealed by the integrity manifest, append-only. Read
// with fs (server-only): entry files are discovered, not imported, so a new
// entry needs no registry edit.
//
// The change-language helpers live here too, because the rule is
// validator-enforced editorial law (project-state §5 / living-record §3.1):
// neutral verbs only, and bounded scales report change in POINTS, never in
// percent of themselves.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { formatMetric } from "./format";

export interface LedgerChange {
  kind: "new" | "revised" | "retired";
  domain: string;
  nation: string;
  metric: string;
  label: string;
  unit: string;
  id: string;
  supersedes?: string;
  before?: { value: number; year: number };
  after?: { value: number; year: number };
  now?: { id: string; value: number; year: number };
  origin: "upstream" | "terralore";
}

export interface SourceChange {
  domain: string;
  sourceId: string;
  kind: "added" | "changed" | "removed";
  field?: string;
  before?: unknown;
  after?: unknown;
}

export interface LedgerEntry {
  entry: number;
  slug: string;
  date: string;
  title: string;
  summary: string;
  kind: string;
  corpus: {
    before: { version: string; root: string } | null;
    after: { version: string };
  };
  domains: string[];
  counts: { new: number; revised: number; retired: number; sourceChanges: number; nations: number };
  vintages: { before: Record<string, string>; after: Record<string, string> };
  structural: Record<string, { gained: string[]; lost: string[] }>;
  notes: string[];
  sourceChanges: SourceChange[];
  changes: LedgerChange[];
}

let cache: LedgerEntry[] | null = null;

/** Every ledger entry, newest first. */
export function allEntries(): LedgerEntry[] {
  if (cache) return cache;
  const dir = join(process.cwd(), "public", "ledger");
  if (!existsSync(dir)) return (cache = []);
  cache = readdirSync(dir)
    .filter((f) => /^\d{4}\.json$/.test(f))
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as LedgerEntry)
    .sort((a, b) => b.entry - a.entry);
  return cache;
}

export function getEntry(slug: string): LedgerEntry | undefined {
  return allEntries().find((e) => e.slug === slug);
}

/** Slugs of entries whose Ledger Letter has been built (the letter archive). */
export function letterSlugs(): string[] {
  const dir = join(process.cwd(), "public", "ledger", "letter");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /^\d{4}\.html$/.test(f))
    .map((f) => f.replace(/\.html$/, ""))
    .sort()
    .reverse();
}

/** The letter's archived email body (the rows between the builder's markers). */
export function letterBody(slug: string): string | null {
  const file = join(process.cwd(), "public", "ledger", "letter", `${slug}.html`);
  if (!existsSync(file)) return null;
  const html = readFileSync(file, "utf8");
  const m = html.match(/<!--LETTER-BODY-START-->([\s\S]*)<!--LETTER-BODY-END-->/);
  return m ? m[1] : null;
}

/** The latest recorded changes touching one nation, newest entry first. */
export function changesForNation(code: string): { entry: LedgerEntry; changes: LedgerChange[] }[] {
  const out: { entry: LedgerEntry; changes: LedgerChange[] }[] = [];
  for (const entry of allEntries()) {
    const changes = entry.changes.filter((c) => c.nation === code);
    if (changes.length) out.push({ entry, changes });
  }
  return out;
}

/** Bounded scales report change in points (house rule); nothing else shows a Δ. */
const POINT_UNITS = new Set(["%", "% of GDP", "% gross", "score", "per 1,000", "per 1,000 births"]);

/**
 * One change as a neutral sentence fragment. Verbs are publication verbs —
 * published, revised, withdrawn — never valuation verbs; the validator bans
 * the latter corpus-wide on ledger surfaces.
 */
export function describeChange(c: LedgerChange): string {
  const v = (x: { value: number } | undefined) => (x ? formatMetric(x.value, c.unit) : "—");
  if (c.kind === "new") {
    if (c.before && c.after) {
      return `${c.after.year} observation published (${v(c.after)}), superseding ${c.before.year} (${v(c.before)})`;
    }
    return `first published observation: ${v(c.after)} (${c.after?.year})`;
  }
  if (c.kind === "revised") {
    const by =
      POINT_UNITS.has(c.unit) && c.before && c.after
        ? ` — ${(c.after.value - c.before.value >= 0 ? "+" : "") + (c.after.value - c.before.value).toFixed(2)} points`
        : "";
    const who = c.origin === "terralore" ? "corrected by Terralore" : "revised by the publisher";
    return `${c.after?.year} value ${who}: ${v(c.before)} → ${v(c.after)}${by}`;
  }
  // retired
  if (c.now) {
    return `${c.before?.year} observation withdrawn by the publisher; the ${c.now.year} observation (${formatMetric(c.now.value, c.unit)}) stands`;
  }
  return `no longer published; last held ${v(c.before)} (${c.before?.year})`;
}
