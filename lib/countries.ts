import type { CountryMeta, CountryMetaMap } from "./types";
import data from "@/data/countries.json";

export { formatPopulation, formatArea } from "./format";

const countries = data as unknown as CountryMetaMap;

export function getCountry(code: string): CountryMeta | undefined {
  return countries[code];
}

export function allCountries(): CountryMeta[] {
  return Object.values(countries);
}

export function allCodes(): string[] {
  return Object.keys(countries);
}

/** Codes sharing a country's subregion (or region as fallback), including itself. */
export function regionPeers(code: string): string[] {
  const me = countries[code];
  if (!me) return [];
  const key = me.subregion ?? me.region;
  if (!key) return [code];
  return Object.values(countries)
    .filter((c) => (c.subregion ?? c.region) === key)
    .map((c) => c.code);
}

