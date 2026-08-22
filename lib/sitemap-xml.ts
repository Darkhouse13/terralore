import type { MetadataRoute } from "next";
import { abs } from "@/lib/seo";
import {
  buildSitemapGroup,
  sitemapGroupPath,
  SITEMAP_GROUP_IDS,
  type SitemapGroupId,
} from "@/lib/sitemaps";

const XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function isoDate(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

export function renderSitemapIndexXml(): string {
  const sitemaps = SITEMAP_GROUP_IDS.map(
    (group) => `  <sitemap><loc>${escapeXml(abs(sitemapGroupPath(group)))}</loc></sitemap>`,
  ).join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    sitemaps,
    "</sitemapindex>",
    "",
  ].join("\n");
}

export function renderUrlSetXml(entries: MetadataRoute.Sitemap): string {
  const urls = entries
    .map((entry) => {
      const fields = [`    <loc>${escapeXml(entry.url)}</loc>`];
      if (entry.lastModified) {
        fields.push(`    <lastmod>${escapeXml(isoDate(entry.lastModified))}</lastmod>`);
      }
      if (entry.changeFrequency) {
        fields.push(`    <changefreq>${entry.changeFrequency}</changefreq>`);
      }
      if (entry.priority !== undefined) {
        fields.push(`    <priority>${entry.priority}</priority>`);
      }
      return ["  <url>", ...fields, "  </url>"].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ].join("\n");
}

export function sitemapIndexResponse(): Response {
  return new Response(renderSitemapIndexXml(), { headers: XML_HEADERS });
}

export function sitemapGroupResponse(group: SitemapGroupId): Response {
  return new Response(renderUrlSetXml(buildSitemapGroup(group)), { headers: XML_HEADERS });
}
