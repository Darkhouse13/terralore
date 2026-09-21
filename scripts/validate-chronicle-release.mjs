#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { composeChronicleRelease, FINAL_VERSION } from "./lib/chronicle-release.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const first = composeChronicleRelease();
const second = composeChronicleRelease();
let errors = 0;
const fail = (message) => {
  errors++;
  console.error(`  ✗ ${message}`);
};

if (first.stats.countries !== 184) fail(`expected 184 published chronicles, found ${first.stats.countries}`);
if (!first.stats.events) fail("release contains no events");
if (!first.stats.sources) fail("release contains no sources");

const eventIds = new Set(first.events.map((event) => event.claim_id));
const sourceKeys = new Set(first.sources.map((source) => source.source_key));
if (eventIds.size !== first.events.length) fail("duplicate event claim IDs");
if (sourceKeys.size !== first.sources.length) fail("duplicate source keys");
for (const edge of first.eventSources) {
  if (!eventIds.has(edge.claim_id)) fail(`orphan event-source claim ${edge.claim_id}`);
  if (!sourceKeys.has(edge.source_key)) fail(`missing event-source target ${edge.source_key}`);
}

if ([...first.files].some(([name, content]) => second.files.get(name) !== content)) {
  fail("two in-memory builds were not byte-identical");
}

const checksumLines = first.files.get("SHA256SUMS").trim().split("\n");
if (checksumLines.length !== first.files.size - 1) fail("SHA256SUMS does not cover every release file exactly once");
for (const line of checksumLines) {
  const match = line.match(/^([a-f0-9]{64})  (.+)$/);
  if (!match) {
    fail(`malformed checksum line: ${line}`);
    continue;
  }
  const content = first.files.get(match[2]);
  if (content === undefined) {
    fail(`checksum names missing file ${match[2]}`);
    continue;
  }
  const actual = createHash("sha256").update(content).digest("hex");
  if (actual !== match[1]) fail(`checksum mismatch for ${match[2]}`);
}

const datapackage = JSON.parse(first.files.get("datapackage.json"));
if (datapackage.terralore.status !== "draft") fail("unapproved release must remain marked draft");
if (new Set(datapackage.resources.map((resource) => resource.name)).size !== datapackage.resources.length) {
  fail("datapackage resource names are not unique");
}
for (const resource of datapackage.resources) {
  const content = first.files.get(resource.path);
  if (content === undefined) fail(`datapackage names missing resource ${resource.path}`);
  else if (Buffer.byteLength(content) !== resource.bytes) fail(`datapackage byte count drift for ${resource.path}`);
}

const final = composeChronicleRelease({ version: FINAL_VERSION, status: "final" });
const finalPackage = JSON.parse(final.files.get("datapackage.json"));
if (finalPackage.terralore.status !== "final") fail("published release is not marked final");
if (finalPackage.version !== FINAL_VERSION) fail(`published release version is not ${FINAL_VERSION}`);
if (!finalPackage.created) fail("published release has no release date");
if (!finalPackage.contributors?.some((entry) => entry.role === "author")) {
  fail("published release has no author metadata");
}
if (!finalPackage.contributors?.some((entry) => entry.role === "publisher")) {
  fail("published release has no publisher metadata");
}

// A published version is FROZEN (decided 2026-09-22): its bytes are archived on Zenodo under a
// DOI, so it is checked against its own SHA256SUMS — never against the live corpus, which keeps
// growing and is validated above as the next draft. New corpus content reaches a release only
// when the next version is cut deliberately (docs/chronicle-events-release.md §Versioning).
const publishedDir = join(root, "public", "datasets", "chronicle-events", FINAL_VERSION);
if (!existsSync(publishedDir)) {
  fail(`published release directory is missing: ${publishedDir}`);
} else {
  const sumsPath = join(publishedDir, "SHA256SUMS");
  const sums = existsSync(sumsPath) ? readFileSync(sumsPath, "utf8").trim().split("\n") : [];
  if (sums.length === 0) fail(`published release ${FINAL_VERSION} has no SHA256SUMS`);
  const listed = new Set();
  for (const line of sums) {
    const match = line.match(/^([a-f0-9]{64})  (.+)$/);
    if (!match) {
      fail(`published ${FINAL_VERSION}: malformed checksum line: ${line}`);
      continue;
    }
    listed.add(match[2]);
    const path = join(publishedDir, match[2]);
    if (!existsSync(path)) {
      fail(`published ${FINAL_VERSION}: checksum names missing file ${match[2]}`);
    } else if (createHash("sha256").update(readFileSync(path)).digest("hex") !== match[1]) {
      fail(`published ${FINAL_VERSION}: ${match[2]} no longer matches its archived checksum`);
    }
  }
  const unlisted = readdirSync(publishedDir).filter((name) => name !== "SHA256SUMS" && !listed.has(name));
  if (unlisted.length) fail(`published ${FINAL_VERSION}: files outside SHA256SUMS: ${unlisted.join(", ")}`);
}

if (errors) {
  console.error(`\n✗ Chronicle Events release validation failed with ${errors} error(s)`);
  process.exit(1);
}

console.log(
  `✓ Chronicle Events draft: ${first.stats.events.toLocaleString("en")} events, ` +
    `${first.stats.eventSourceLinks.toLocaleString("en")} source links, ` +
    `${first.stats.sources.toLocaleString("en")} source records across ${first.stats.countries} chronicles`,
);
