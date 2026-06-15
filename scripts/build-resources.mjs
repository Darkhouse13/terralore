// Resources & energy domain — World Bank (resource rents + electricity access).
// A first cut from WB; USGS physical mineral production/reserves can enrich later.
// Writes data/domains/resources.json.
import { buildWbDomain, today } from './lib/domain.mjs';

const WB = {
  id: 'wb-wdi',
  label: 'World Development Indicators',
  publisher: 'World Bank',
  url: 'https://data.worldbank.org',
  license: 'CC BY 4.0',
  accessed: today(),
};

const INDICATORS = [
  { key: 'resourceRents',     label: 'Resource rents',     unit: '% of GDP', id: 'NY.GDP.TOTL.RT.ZS' },
  { key: 'oilRents',          label: 'Oil rents',          unit: '% of GDP', id: 'NY.GDP.PETR.RT.ZS' },
  { key: 'mineralRents',      label: 'Mineral rents',      unit: '% of GDP', id: 'NY.GDP.MINR.RT.ZS' },
  { key: 'forestRents',       label: 'Forest rents',       unit: '% of GDP', id: 'NY.GDP.FRST.RT.ZS' },
  { key: 'electricityAccess', label: 'Electricity access', unit: '%',        id: 'EG.ELC.ACCS.ZS' },
];

await buildWbDomain('resources', INDICATORS, WB);
