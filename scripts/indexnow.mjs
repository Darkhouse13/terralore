#!/usr/bin/env node
// ── IndexNow submission ─────────────────────────────────────────────────────
// Tells Bing, Yandex, Seznam and Naver that URLs changed, instead of waiting for
// them to re-crawl 1,054 static pages on their own schedule. One endpoint feeds
// every participating engine. (Google does not participate; it uses the sitemap.)
//
// The protocol needs a key file served from the origin root proving control of
// the host — public/<key>.txt, whose entire content is the key. That file is
// committed, so it deploys with the site and cannot drift out of sync.
//
// Usage:
//   node scripts/indexnow.mjs              # submit every sitemap URL
//   node scripts/indexnow.mjs --dry        # print what would be sent
//   node scripts/indexnow.mjs --urls a,b   # submit specific paths
//
// Intended to run once per deploy. It is deliberately NOT wired into `npm run
// build`: a build is not a publish, and pinging engines about URLs that are not
// live yet is how a site teaches them to distrust its pings.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { collectSitemapPageUrls } from "./lib/sitemap.mjs";

const SITE = (process.env.SITE_URL || "https://terralore.co").replace(/\/$/, "");
const HOST = new URL(SITE).host;
const ENDPOINT = "https://api.indexnow.org/IndexNow";
const BATCH = 10_000; // protocol maximum per request

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const urlsFlag = args.indexOf("--urls");

// The key is whatever <hex>.txt sits in public/ — one source of truth, so
// rotating the key is a matter of replacing the file.
function readKey() {
  const dir = join(process.cwd(), "public");
  const file = readdirSync(dir).find((f) => /^[0-9a-f]{8,128}\.txt$/i.test(f));
  if (!file) {
    throw new Error(
      "no IndexNow key file in public/ — expected a <hex>.txt whose content is the key",
    );
  }
  const key = readFileSync(join(dir, file), "utf8").trim();
  if (key !== file.replace(/\.txt$/i, "")) {
    throw new Error(`key file ${file} does not contain its own name — engines will reject it`);
  }
  return { key, keyLocation: `${SITE}/${file}` };
}

async function sitemapUrls() {
  return collectSitemapPageUrls(`${SITE}/sitemap.xml`);
}

const { key, keyLocation } = readKey();

let urlList;
if (urlsFlag !== -1 && args[urlsFlag + 1]) {
  urlList = args[urlsFlag + 1]
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean)
    .map((u) => (u.startsWith("http") ? u : `${SITE}${u.startsWith("/") ? u : `/${u}`}`));
} else {
  urlList = await sitemapUrls();
}

// Engines reject the whole submission if any URL is off-host.
const offHost = urlList.filter((u) => new URL(u).host !== HOST);
if (offHost.length) {
  console.error(`✗ ${offHost.length} URL(s) not on ${HOST}, e.g. ${offHost[0]}`);
  process.exit(1);
}

console.log(`[indexnow] host=${HOST} key=${key.slice(0, 8)}… urls=${urlList.length}`);

if (dry) {
  console.log(`[indexnow] dry run — would submit in ${Math.ceil(urlList.length / BATCH)} batch(es)`);
  for (const u of urlList.slice(0, 5)) console.log(`  ${u}`);
  if (urlList.length > 5) console.log(`  … and ${urlList.length - 5} more`);
  process.exit(0);
}

let failed = 0;
for (let i = 0; i < urlList.length; i += BATCH) {
  const urlList_ = urlList.slice(i, i + BATCH);
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key, keyLocation, urlList: urlList_ }),
    signal: AbortSignal.timeout(60000),
  });
  // 200 accepted · 202 accepted, key validation pending · anything else is a problem.
  if (res.status === 200 || res.status === 202) {
    console.log(`[indexnow] batch ${i / BATCH + 1}: ${urlList_.length} URLs → HTTP ${res.status}`);
  } else {
    failed++;
    console.error(
      `[indexnow] batch ${i / BATCH + 1}: HTTP ${res.status} — ${(await res.text()).slice(0, 200)}`,
    );
  }
}

if (failed) {
  console.error(`\n✗ ${failed} batch(es) rejected`);
  process.exit(1);
}
console.log(`\n✓ ${urlList.length} URLs submitted to IndexNow`);
