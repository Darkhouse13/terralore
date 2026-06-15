// Economy domain — World Bank World Development Indicators.
// Writes data/domains/economy.json. Re-run to refresh (WB updates ~annually).
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
  { key: 'gdp',          label: 'GDP',             unit: 'USD',      id: 'NY.GDP.MKTP.CD' },
  { key: 'gdpPerCapita', label: 'GDP per capita',  unit: 'USD',      id: 'NY.GDP.PCAP.CD' },
  { key: 'gdpGrowth',    label: 'GDP growth',      unit: '%',        id: 'NY.GDP.MKTP.KD.ZG' },
  { key: 'inflation',    label: 'Inflation',       unit: '%',        id: 'FP.CPI.TOTL.ZG' },
  { key: 'tradePctGdp',  label: 'Trade openness',  unit: '% of GDP', id: 'NE.TRD.GNFS.ZS' },
];

await buildWbDomain('economy', INDICATORS, WB);
