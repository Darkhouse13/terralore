// ── Claim-level snapshot of the data corpus, from any git state ────────────
//
// The recorder's eyes (docs/living-record.md §3.1). Extracts the data-side
// claim set — dossier observations, commodity world totals and producer
// tonnages, and every source record — from either the working tree or any
// git ref, so two corpus states can be diffed claim by claim with no
// side-car bookkeeping (D14: content-derived identity is what makes this
// possible).
//
// Reads the RAW committed JSON shapes (stable since the domain pipeline
// began), not lib/*.ts — an old ref's data must be readable even if the
// TypeScript modules around it have moved on.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** Read a repo file from the working tree (`ref` null) or from a git ref. */
function readAt(root, ref, path) {
  if (!ref) {
    const abs = join(root, path);
    return existsSync(abs) ? readFileSync(abs, "utf8") : null;
  }
  try {
    return execFileSync("git", ["show", `${ref}:${path}`], {
      cwd: root,
      maxBuffer: 64 * 1024 * 1024,
      encoding: "utf8",
    });
  } catch {
    return null; // file did not exist at that ref
  }
}

function listDomainFiles(root, ref) {
  if (!ref) {
    const dir = join(root, "data", "domains");
    return readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => `data/domains/${f}`);
  }
  try {
    return execFileSync("git", ["ls-tree", "--name-only", ref, "data/domains/"], {
      cwd: root,
      encoding: "utf8",
    })
      .split("\n")
      .filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
}

/**
 * Snapshot: {
 *   observations: Map<claimId, { code, domain, metric, label, unit, value, year, sourceId }>,
 *   sources:      Map<"domain/sourceId", { domain, ...record }>,
 *   worldTotals:  Map<claimId, { key, year, value }>,
 *   tonnages:     Map<claimId, { code, key, year, value }>,   // commodity table, both years
 *   updated:      { [domain]: "YYYY-MM-DD", commodities: "…" },
 * }
 */
export function snapshotClaims(root, ref = null) {
  const observations = new Map();
  const sources = new Map();
  const worldTotals = new Map();
  const tonnages = new Map();
  const updated = {};

  for (const path of listDomainFiles(root, ref)) {
    const raw = readAt(root, ref, path);
    if (!raw) continue;
    const file = JSON.parse(raw);
    updated[file.domain] = file.updated;
    for (const [sid, s] of Object.entries(file.sources ?? {})) {
      sources.set(`${file.domain}/${sid}`, { domain: file.domain, ...s });
    }
    for (const [code, entry] of Object.entries(file.data ?? {})) {
      for (const m of entry.metrics ?? []) {
        if (m.value == null || m.year == null) continue; // absence has no identity
        observations.set(`TL:${code}:${m.key}:${m.year}`, {
          code,
          domain: file.domain,
          metric: m.key,
          label: m.label,
          unit: m.unit,
          value: m.value,
          year: m.year,
          sourceId: m.sourceId,
        });
      }
    }
  }

  const rawC = readAt(root, ref, "data/commodities.json");
  if (rawC) {
    const c = JSON.parse(rawC);
    updated.commodities = c.updated;
    for (const rc of c.commodities ?? []) {
      const { reported: yr, estimate: ye } = rc.years;
      worldTotals.set(`TL:WLD:${rc.key}-total:${yr}`, { key: rc.key, year: yr, value: rc.world.reported });
      worldTotals.set(`TL:WLD:${rc.key}-total:${ye}`, { key: rc.key, year: ye, value: rc.world.estimate });
      for (const p of rc.producers ?? []) {
        for (const [year, value] of [
          [yr, p.reported],
          [ye, p.estimate],
        ]) {
          if (value == null) continue; // withheld/nil — an absence
          tonnages.set(`TL:${p.code}:${rc.key}:${year}`, { code: p.code, key: rc.key, year, value });
        }
      }
    }
  }

  return { observations, sources, worldTotals, tonnages, updated };
}
