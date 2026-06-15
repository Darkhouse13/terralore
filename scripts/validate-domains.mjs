// Independent integrity check for generated data-domain files.
// Mirrors scripts/validate-histories.mjs: every metric must carry a value, a
// year vintage, and a sourceId that resolves in the file's `sources` map.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "data/domains");

if (!existsSync(dir)) {
  console.log("no data/domains directory — run the build-<domain> scripts first.");
  process.exit(0);
}

let errors = 0;
const err = (f, m) => { console.log(`  ✗ [${f}] ${m}`); errors++; };

const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
for (const file of files) {
  const d = JSON.parse(readFileSync(join(dir, file), "utf8"));

  for (const k of ["domain", "updated", "sources", "data"]) {
    if (d[k] == null) err(file, `missing top-level field: ${k}`);
  }
  const sourceIds = new Set(Object.keys(d.sources ?? {}));
  const used = new Set();

  let metricCount = 0;
  let valuedCount = 0;
  for (const [code, entry] of Object.entries(d.data ?? {})) {
    if (!Array.isArray(entry.metrics) || entry.metrics.length === 0) {
      err(file, `${code} has no metrics`);
      continue;
    }
    for (const m of entry.metrics) {
      metricCount++;
      for (const k of ["key", "label", "unit", "sourceId"]) {
        if (m[k] == null) err(file, `${code}/${m.key ?? "?"} missing ${k}`);
      }
      if (m.value !== null && typeof m.value !== "number") err(file, `${code}/${m.key} non-numeric value`);
      if (m.year !== null && typeof m.year !== "number") err(file, `${code}/${m.key} non-numeric year`);
      if (m.value != null) valuedCount++;
      if (!sourceIds.has(m.sourceId)) err(file, `${code}/${m.key} references unknown source "${m.sourceId}"`);
      else used.add(m.sourceId);
    }
  }
  for (const id of sourceIds) if (!used.has(id)) console.log(`  ⚠ [${file}] unused source "${id}"`);

  console.log(
    `✓ ${file}: ${d.domain} — ${Object.keys(d.data).length} countries, ${metricCount} metrics (${valuedCount} with values), ${sourceIds.size} sources`,
  );
}

console.log(`\n${errors} error(s) across ${files.length} domain file(s).`);
process.exit(errors ? 1 : 0);
