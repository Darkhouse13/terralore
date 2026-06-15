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

