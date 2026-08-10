// Minimal World Bank Indicators API client (v2). No API key required.
// Docs: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
//
// One request pulls a single indicator for every country across a date range;
// we group by ISO3, keep the latest non-null value as the headline, and retain
// a trailing series for sparklines. Codes are mapped to our canonical ADM0_A3.
import { canonicalFromWb } from './codes.mjs';

const BASE = 'https://api.worldbank.org/v2';

// The World Bank API is intermittently unavailable under rapid `country/all`
// requests: its WAF answers a share of them with a 502 HTML error page, and a
// connection can hang open instead of failing. Both are transient — the same URL
// succeeds on a later attempt — so retry generously, with a hard per-request
// timeout so a hung socket costs seconds rather than stalling the whole build.
const ATTEMPTS = 10;
const REQUEST_TIMEOUT_MS = 30000;

async function getJson(url, attempt = 1) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!Array.isArray(json) || json.length < 2) {
      // World Bank returns a `[{message:[…]}]` envelope on error.
      throw new Error('unexpected payload');
    }
    return json;
  } catch (e) {
    if (attempt >= ATTEMPTS) throw new Error(`${url} → ${e.message}`);
    await new Promise((r) => setTimeout(r, Math.min(500 * attempt, 4000)));
    return getJson(url, attempt + 1);
  }
}

/**
 * Fetch one indicator for all countries.
 *
 * `wbSource` pins the API's database id. Most indicators live in the default
 * database (2, World Development Indicators) and the API resolves them without
 * help; series held elsewhere — the Worldwide Governance Indicators are database
 * 3 — are named explicitly so the request cannot be answered from the wrong one.
 *
 * @returns Map<canonicalCode, { value:number, year:number, series:{year,value}[] }>
 */
export async function fetchIndicator(indicator, { start = 2000, end = 2025, wbSource } = {}) {
  const out = new Map();
  const source = wbSource ? `&source=${wbSource}` : '';
  let page = 1;
  let pages = 1;

  do {
    const url = `${BASE}/country/all/indicator/${indicator}?format=json&per_page=20000&date=${start}:${end}&page=${page}${source}`;
    const [meta, rows] = await getJson(url);
    pages = meta?.pages ?? 1;

    for (const r of rows ?? []) {
      const iso3 = r.countryiso3code;
      if (!iso3) continue; // aggregate rows (e.g. regions) omit the ISO3 code
      const value = r.value == null ? null : Number(r.value);
      const year = Number(r.date);
      if (value == null || Number.isNaN(value) || Number.isNaN(year)) continue;

      const code = canonicalFromWb(iso3);
      let e = out.get(code);
      if (!e) {
        e = { value: null, year: null, series: [] };
        out.set(code, e);
      }
      e.series.push({ year, value });
    }
    page++;
  } while (page <= pages);

  // Finalise: sort each series ascending and take the latest point as headline.
  for (const e of out.values()) {
    e.series.sort((a, b) => a.year - b.year);
    const last = e.series[e.series.length - 1];
    e.value = last.value;
    e.year = last.year;
  }
  return out;
}
