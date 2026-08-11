// Node module-customization hooks that let build/validation scripts import the
// repo's OWN TypeScript modules (lib/rankings.ts, lib/histories, lib/seo.ts…)
// instead of re-deriving their logic in .mjs and drifting. Three gaps between
// node's native type-stripping and this codebase, all closed here:
//
//   1. the "@/" path alias (tsconfig `paths`) — node knows nothing of it;
//      resolved against the repo root.
//   2. extensionless and directory imports ("./domains", "./format") — the
//      bundler resolves these to .ts/.tsx/index.ts; node's ESM loader does
//      not, so failed resolutions retry with those candidates.
//   3. attribute-less JSON imports (`import x from "@/data/foo.json"`) — the
//      compiled app allows them; node's ESM loader demands `with {type:"json"}`.
//      The load hook serves .json as a synthesized ES module instead.
//
// Usage: node --import ./scripts/lib/ts-alias-loader.mjs <script>
//
// Scope, stated: type-stripping handles erasable TypeScript only (types,
// interfaces, generics) — which is all this repo's lib uses. No enums, no
// JSX in anything the geo scripts import (lib/og.tsx stays out of reach).
import { registerHooks } from "node:module";
import { readFileSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function tryCandidates(specifier, context, nextResolve) {
  const candidates = [specifier, `${specifier}.ts`, `${specifier}.tsx`, `${specifier}/index.ts`];
  let lastErr;
  for (const c of candidates) {
    try {
      return nextResolve(c, context);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return tryCandidates(pathToFileURL(join(root, specifier.slice(2))).href, context, nextResolve);
    }
    if (specifier.startsWith("./") || specifier.startsWith("../")) {
      return tryCandidates(specifier, context, nextResolve);
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith(".json")) {
      const source = `export default ${readFileSync(fileURLToPath(url), "utf8")};`;
      return { format: "module", source, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
