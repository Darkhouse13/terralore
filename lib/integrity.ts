// ── Server-side access to the Seal (docs/living-record.md §2) ──────────────
// Reads the committed corpus manifest with node fs rather than an import:
// the manifest hashes ~1,500 files and must never ride into a client chunk.
// Server components and route handlers only.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export interface IntegrityManifest {
  version: string;
  sealed: string;
  root: string;
  rootConstruction: string;
  previous: { version: string; root: string } | null;
  counts: { files: number };
  vintages: Record<string, string>;
  files: Record<string, string>;
}

const PUB = () => join(process.cwd(), "public");

let cache: IntegrityManifest | null = null;

/** The current seal — public/integrity.json, committed. */
export function currentManifest(): IntegrityManifest {
  if (!cache) {
    cache = JSON.parse(readFileSync(join(PUB(), "integrity.json"), "utf8")) as IntegrityManifest;
  }
  return cache;
}

/** Every archived seal, newest first — the append-only record itself. */
export function archivedSeals(): { version: string; sealed: string; root: string }[] {
  const dir = join(PUB(), "integrity");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const m = JSON.parse(readFileSync(join(dir, f), "utf8")) as IntegrityManifest;
      return { version: m.version, sealed: m.sealed, root: m.root };
    })
    .sort((a, b) => (a.sealed < b.sealed ? 1 : -1));
}
