#!/usr/bin/env node
import {
  allSitemapEntries,
  buildSitemapGroup,
  sitemapGroupPath,
  SITEMAP_GROUP_IDS,
} from "@/lib/sitemaps";
import { renderSitemapIndexXml, renderUrlSetXml } from "@/lib/sitemap-xml";
import { SITE_URL } from "@/lib/seo";

let errors = 0;
const fail = (message) => {
  errors++;
  console.error(`  ✗ ${message}`);
};

const familyPatterns = {
  core: /^\/(?:$|atlas$|privacy$|integrity$|datasets\/chronicle-events$|ledger(?:\/.*)?$)/,
  "country-dossiers": /^\/country\/[A-Z]{3}$/,
  "country-chronicles": /^\/country\/[A-Z]{3}\/chronicle$/,
  timelines: /^\/timeline(?:\/[^/]+)?$/,
  themes: /^\/themes(?:\/[^/]+(?:\/[^/]+)?)?$/,
  comparisons: /^\/compare(?:\/[a-z]{3}-vs-[a-z]{3})?$/,
  rankings: /^\/rankings(?:\/[^/]+)?$/,
  commodities: /^\/commodities(?:\/[^/]+)?$/,
};

const union = [];
for (const group of SITEMAP_GROUP_IDS) {
  const entries = buildSitemapGroup(group);
  if (!entries.length) fail(`${group} is empty`);

  const xml = renderUrlSetXml(entries);
  const xmlLocs = [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g)];
  if (!xml.includes("<urlset")) fail(`${group} did not render a URL set`);
  if (xmlLocs.length !== entries.length) {
    fail(`${group} XML has ${xmlLocs.length} locs for ${entries.length} entries`);
  }

  for (const entry of entries) {
    let parsed;
    try {
      parsed = new URL(entry.url);
    } catch {
      fail(`${group}: invalid URL ${entry.url}`);
      continue;
    }
    if (parsed.origin !== SITE_URL) fail(`${group}: off-origin URL ${entry.url}`);
    if (!familyPatterns[group].test(parsed.pathname)) {
      fail(`${group}: route escaped its family: ${parsed.pathname}`);
    }
    if (
      parsed.pathname.endsWith(".md") ||
      parsed.pathname.endsWith(".json") ||
      parsed.pathname.includes("/opengraph-image") ||
      parsed.pathname.endsWith("/history")
    ) {
      fail(`${group}: non-canonical or non-search resource in sitemap: ${parsed.pathname}`);
    }
    union.push(entry.url);
  }

  console.log(`  ${group.padEnd(20)} ${String(entries.length).padStart(4)} URLs`);
}

const all = allSitemapEntries().map((entry) => entry.url);
if (all.length !== union.length || all.some((url, index) => url !== union[index])) {
  fail("allSitemapEntries() does not equal the ordered family union");
}

const unique = new Set(union);
if (unique.size !== union.length) fail(`${union.length - unique.size} duplicate URL(s) across families`);

const indexXml = renderSitemapIndexXml();
const indexLocs = [...indexXml.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((match) => match[1]);
const expectedIndexLocs = SITEMAP_GROUP_IDS.map((group) => `${SITE_URL}${sitemapGroupPath(group)}`);
if (JSON.stringify(indexLocs) !== JSON.stringify(expectedIndexLocs)) {
  fail("sitemap index does not contain every family exactly once in registry order");
}

if (errors) {
  console.error(`\n✗ sitemap validation failed with ${errors} error(s)`);
  process.exit(1);
}

console.log(`\n✓ ${union.length} unique canonical URLs across ${SITEMAP_GROUP_IDS.length} sitemaps`);
