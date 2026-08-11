// The ten USGS commodities as a routing/display constant, client-safe on
// purpose: MetricCard links a dossier's production card to its /commodities
// page, and importing lib/commodities.ts there would pull the whole data file
// into the client chunk. Keys match the resources-domain metric keys (the
// `prod*` family built by scripts/build-minerals.mjs); slugs are the
// /commodities/[mineral] route segments.

export interface CommodityMeta {
  /** Metric key in the resources domain and in data/commodities.json. */
  key: string;
  /** URL segment under /commodities/. */
  slug: string;
  /** Display name. */
  name: string;
}

export const COMMODITY_META: CommodityMeta[] = [
  { key: "prodCopper", slug: "copper", name: "Copper" },
  { key: "prodIronOre", slug: "iron-ore", name: "Iron ore" },
  { key: "prodGold", slug: "gold", name: "Gold" },
  { key: "prodLithium", slug: "lithium", name: "Lithium" },
  { key: "prodCobalt", slug: "cobalt", name: "Cobalt" },
  { key: "prodNickel", slug: "nickel", name: "Nickel" },
  { key: "prodRareEarths", slug: "rare-earths", name: "Rare earths" },
  { key: "prodBauxite", slug: "bauxite", name: "Bauxite" },
  { key: "prodZinc", slug: "zinc", name: "Zinc" },
  { key: "prodPhosphate", slug: "phosphate", name: "Phosphate rock" },
];

export const commodityBySlug = new Map(COMMODITY_META.map((c) => [c.slug, c]));
export const commodityByMetricKey = new Map(COMMODITY_META.map((c) => [c.key, c]));
