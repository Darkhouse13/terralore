// Minimal World Bank Indicators API client (v2). No API key required.
// Docs: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
//
// One request pulls a single indicator for every country across a date range;
// we group by ISO3, keep the latest non-null value as the headline, and retain
// a trailing series for sparklines. Codes are mapped to our canonical ADM0_A3.
import { canonicalFromWb } from './codes.mjs';

const BASE = 'https://api.worldbank.org/v2';

// The World Bank API intermittently 400s under rapid `country/all` requests.
// Retry a few times with a short backoff before giving up.
async function getJson(url, attempt = 1) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!Array.isArray(json) || json.length < 2) {
      // World Bank returns a `[{message:[…]}]` envelope on error.
      throw new Error('unexpected payload');
    }
    return json;
  } catch (e) {
    if (attempt >= 4) throw new Error(`${url} → ${e.message}`);
    await new Promise((r) => setTimeout(r, 500 * attempt));
    return getJson(url, attempt + 1);
  }
}

/**
 * Fetch one indicator for all countries.
 * @returns Map<canonicalCode, { value:number, year:number, series:{year,value}[] }>
 */
export async function fetchIndicator(indicator, { start = 2000, end = 2025 } = {}) {
  const out = new Map();
  let page = 1;
  let pages = 1;

  do {
    const url = `${BASE}/country/all/indicator/${indicator}?format=json&per_page=20000&date=${start}:${end}&page=${page}`;
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
