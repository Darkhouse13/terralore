// Canonical country-code reconciliation for Terralore.
//
// Canonical code = Natural Earth ADM0_A3 (ISO_A3 is "-99" for France, Norway…).
// Everything in the app keys on this: the globe geojson, data/countries.json,
// every history, and every data-domain file. External datasets use ISO 3166-1
// alpha-3, which equals ADM0_A3 for nearly all states — the maps below capture
// the handful that differ.

// ADM0_A3 (Natural Earth) -> mledoze cca3, where they differ. Used by build-data.mjs.
// `null` = no mledoze record (the polygon contributes geometry only).
export const codeAlias = { KOS: 'UNK', SDS: 'SSD', KAS: null, CYN: null, SOL: null };

// Natural Earth polygon relabeling (build-data.mjs). Both the "Israel" (ISR) and
// "Palestine" (PSX) polygons are presented as Palestine (PSE); ISR is geometry only.
// The Western Sahara polygon (SAH) renders as part of Morocco (MAR), geometry only.
export const REMAP = { ISR: 'PSE', PSX: 'PSE', SAH: 'MAR' };

// World Bank ISO3 -> canonical ADM0_A3, where they differ. The World Bank uses
// ISO 3166-1 alpha-3; our canonical differs for:
//   XKX (Kosovo)        -> KOS
//   SSD (South Sudan)   -> SDS  (Natural Earth's ADM0_A3)
// (Western Sahara, ESH, is treated as part of Morocco and is not a separate entity.)
export const wbToCanonical = { XKX: 'KOS', SSD: 'SDS' };

/** Map a World Bank ISO3 code to our canonical ADM0_A3 code. */
export function canonicalFromWb(iso3) {
  return wbToCanonical[iso3] ?? iso3;
}
