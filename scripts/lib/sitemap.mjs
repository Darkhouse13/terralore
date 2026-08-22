const LOC_RE = /<loc>([\s\S]*?)<\/loc>/g;

function locations(xml) {
  return [...xml.matchAll(LOC_RE)].map((match) => match[1].trim());
}

/**
 * Resolve a sitemap index into its page URL union.
 *
 * `fetchUrl` lets the local page audit fetch production-absolute child sitemap
 * locations from a local server while preserving the canonical URLs contained
 * in each urlset.
 */
export async function collectSitemapPageUrls(rootUrl, options = {}) {
  const fetchUrl = options.fetchUrl ?? ((url) => url);
  const timeoutMs = options.timeoutMs ?? 30_000;
  const visitedSitemaps = new Set();
  const pageUrls = [];

  async function visit(sitemapUrl, depth = 0) {
    if (visitedSitemaps.has(sitemapUrl)) {
      throw new Error(`sitemap cycle or duplicate reference: ${sitemapUrl}`);
    }
    visitedSitemaps.add(sitemapUrl);

    const target = fetchUrl(sitemapUrl);
    const response = await fetch(target, { signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) throw new Error(`${target} → HTTP ${response.status}`);

    const xml = await response.text();
    const locs = locations(xml);
    if (xml.includes("<sitemapindex")) {
      if (depth > 0) {
        throw new Error(`${target} is a nested sitemap index; sitemap indexes may only reference URL sets`);
      }
      if (!locs.length) throw new Error(`${target} contained an empty sitemap index`);
      for (const child of locs) await visit(child, depth + 1);
      return;
    }

    if (!xml.includes("<urlset")) {
      throw new Error(`${target} is neither a sitemap index nor a URL set`);
    }
    if (!locs.length) throw new Error(`${target} contained no page URLs`);
    pageUrls.push(...locs);
  }

  await visit(rootUrl);
  const unique = [...new Set(pageUrls)];
  if (unique.length !== pageUrls.length) {
    throw new Error(`sitemap union contains ${pageUrls.length - unique.length} duplicate page URL(s)`);
  }
  return unique;
}
