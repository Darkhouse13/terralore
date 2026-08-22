#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { composeChronicleRelease, DRAFT_VERSION } from "./lib/chronicle-release.mjs";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const prefix = `--${name}=`;
  return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? fallback;
};

if (args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: npm run build-chronicle-release -- --out=<directory> [--version=<semver>] [--status=draft|final]

Builds a Chronicle Events package. Publishing inside public/ requires
--status=final and a non-prerelease version.`);
  process.exit(0);
}

const outputArg = option("out", null);
if (!outputArg) {
  console.error("Missing --out=<directory>. Run with --help for usage.");
  process.exit(1);
}

const version = option("version", DRAFT_VERSION);
const status = option("status", "draft");
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(`Invalid semantic version: ${version}`);
  process.exit(1);
}
if (!["draft", "final"].includes(status)) {
  console.error(`Invalid release status: ${status}`);
  process.exit(1);
}

const output = resolve(outputArg);
if (output.split(/[\\/]/).includes("public") && status !== "final") {
  console.error("Refusing to write a draft release inside public/.");
  process.exit(1);
}

const release = composeChronicleRelease({ version, status });
mkdirSync(output, { recursive: true });
for (const [name, content] of release.files) writeFileSync(resolve(output, name), content);

console.log(
  `✓ Chronicle Events ${version}: ${release.stats.events.toLocaleString("en")} events, ` +
    `${release.stats.sources.toLocaleString("en")} sources, ${release.stats.countries} countries → ${output}`,
);
