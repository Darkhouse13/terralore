#!/usr/bin/env node
import { createReadStream } from "node:fs";
import { resolve4, resolve6, reverse } from "node:dns/promises";
import { createInterface } from "node:readline";

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

if (args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: npm run audit:googlebot -- <access-log.jsonl|-> [options]

Options:
  --host <hostname>  Request host to include (default: terralore.co)
  --verify-dns       Verify crawler IPs with reverse and forward DNS
  --json             Emit machine-readable JSON

The report contains aggregates only; it never prints raw log records or IPs.`);
  process.exit(0);
}

const positional = [];
for (let index = 0; index < args.length; index++) {
  if (args[index] === "--host") {
    index++;
    continue;
  }
  if (args[index] === "--verify-dns" || args[index] === "--json") continue;
  positional.push(args[index]);
}
const inputPath = positional[0];
if (!inputPath) {
  console.error("Missing access log path. Run with --help for usage.");
  process.exit(1);
}

const expectedHost = valueAfter("--host", "terralore.co").toLowerCase();
const shouldVerifyDns = args.includes("--verify-dns");
const asJson = args.includes("--json");

function field(record, ...names) {
  for (const name of names) {
    if (record[name] !== undefined && record[name] !== null) return record[name];
  }
  return undefined;
}

function requestUserAgent(record) {
  return String(
    field(record, "request_User-Agent", "RequestUserAgent", "request_user_agent") ??
      record.requestHeaders?.["User-Agent"] ??
      record.requestHeaders?.["user-agent"] ??
      "",
  );
}

function requestHost(record) {
  return String(field(record, "RequestHost", "requestHost", "request_host") ?? "")
    .split(":")[0]
    .toLowerCase();
}

function requestPath(record) {
  const raw = String(field(record, "RequestPath", "requestPath", "request_path") ?? "/");
  try {
    return new URL(raw, "https://terralore.co").pathname;
  } catch {
    return raw.split("?")[0] || "/";
  }
}

function pageFamily(path) {
  if (path === "/sitemap.xml" || path.startsWith("/sitemaps/")) return "sitemaps";
  if (
    path.startsWith("/_next/") ||
    path.includes("/opengraph-image") ||
    path === "/favicon.ico" ||
    /\.(?:avif|css|gif|ico|jpe?g|js|json|map|md|png|svg|webp|woff2?)$/i.test(path)
  ) {
    return "assets";
  }
  if (/^\/country\/[^/]+\/history\/?$/.test(path)) return "retired-history";
  if (/^\/country\/[^/]+\/chronicle\/?$/.test(path)) return "country-chronicles";
  if (/^\/country\/[^/]+\/?$/.test(path)) return "country-dossiers";
  if (path === "/timeline" || path.startsWith("/timeline/")) return "timelines";
  if (path === "/themes" || path.startsWith("/themes/")) return "themes";
  if (path === "/compare" || path.startsWith("/compare/")) return "comparisons";
  if (path === "/rankings" || path.startsWith("/rankings/")) return "rankings";
  if (path === "/commodities" || path.startsWith("/commodities/")) return "commodities";
  if (["/", "/atlas", "/privacy", "/integrity", "/ledger"].includes(path) || path.startsWith("/ledger/")) {
    return "core";
  }
  return "other";
}

function statusClass(value) {
  const status = Number(value);
  if (!Number.isInteger(status) || status < 100 || status > 599) return "unknown";
  return `${Math.floor(status / 100)}xx`;
}

function increment(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function sortedObject(map) {
  return Object.fromEntries([...map].sort(([a], [b]) => a.localeCompare(b)));
}

async function verifyGoogleIp(ip) {
  if (!ip) return false;
  try {
    const hostnames = await reverse(ip);
    for (const hostname of hostnames) {
      const normalized = hostname.toLowerCase().replace(/\.$/, "");
      if (!normalized.endsWith(".googlebot.com") && !normalized.endsWith(".google.com")) continue;
      const resolved = new Set([
        ...(await resolve4(normalized).catch(() => [])),
        ...(await resolve6(normalized).catch(() => [])),
      ]);
      if (resolved.has(ip)) return true;
    }
  } catch {
    return false;
  }
  return false;
}

const input = inputPath === "-" ? process.stdin : createReadStream(inputPath, { encoding: "utf8" });
const lines = createInterface({ input, crlfDelay: Infinity });
const families = new Map();
const statuses = new Map();
const dates = new Map();
const paths = new Map();
const ips = new Set();
let parsedLines = 0;
let invalidLines = 0;
let matchedRequests = 0;

for await (const line of lines) {
  if (!line.trim()) continue;
  let record;
  try {
    record = JSON.parse(line);
    parsedLines++;
  } catch {
    invalidLines++;
    continue;
  }

  if (requestHost(record) !== expectedHost || !/googlebot/i.test(requestUserAgent(record))) continue;

  matchedRequests++;
  const path = requestPath(record);
  increment(families, pageFamily(path));
  increment(statuses, statusClass(field(record, "DownstreamStatus", "OriginStatus", "downstream_status")));
  increment(paths, path);

  const timestamp = String(field(record, "StartUTC", "time", "timestamp") ?? "");
  const date = timestamp.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (date) increment(dates, date);

  const ip = String(field(record, "ClientHost", "clientHost", "client_host") ?? "").replace(/^\[|\]$/g, "");
  if (ip) ips.add(ip);
}

let verifiedIpCount;
if (shouldVerifyDns) {
  const results = await Promise.all([...ips].map((ip) => verifyGoogleIp(ip)));
  verifiedIpCount = results.filter(Boolean).length;
}

const topPaths = [...paths]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .slice(0, 20)
  .map(([path, requests]) => ({ path, requests }));

const report = {
  host: expectedHost,
  parsedLines,
  invalidLines,
  googlebotRequests: matchedRequests,
  uniqueClaimedGooglebotIps: ips.size,
  ...(shouldVerifyDns
    ? { verifiedGoogleIps: verifiedIpCount, unverifiedClaimedGooglebotIps: ips.size - verifiedIpCount }
    : {}),
  byDate: sortedObject(dates),
  byFamily: sortedObject(families),
  byStatus: sortedObject(statuses),
  topPaths,
};

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Googlebot access summary for ${expectedHost}`);
  console.log(`  matched requests: ${matchedRequests}`);
  console.log(`  parsed / invalid lines: ${parsedLines} / ${invalidLines}`);
  console.log(`  claimed crawler IPs: ${ips.size}`);
  if (shouldVerifyDns) console.log(`  DNS-verified Google IPs: ${verifiedIpCount} / ${ips.size}`);
  console.log(`  by status: ${JSON.stringify(report.byStatus)}`);
  console.log(`  by family: ${JSON.stringify(report.byFamily)}`);
  console.log(`  by date: ${JSON.stringify(report.byDate)}`);
  if (topPaths.length) {
    console.log("  top paths:");
    for (const item of topPaths) console.log(`    ${String(item.requests).padStart(6)}  ${item.path}`);
  }
}
