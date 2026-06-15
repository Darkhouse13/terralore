// Society & demographics domain — World Bank World Development Indicators.
// Writes data/domains/society.json. Re-run to refresh.
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
  { key: 'population',     label: 'Population',       unit: 'people', id: 'SP.POP.TOTL' },
  { key: 'lifeExpectancy', label: 'Life expectancy',  unit: 'years',  id: 'SP.DYN.LE00.IN' },
  { key: 'urbanPct',       label: 'Urban population', unit: '%',      id: 'SP.URB.TOTL.IN.ZS' },
  { key: 'fertility',      label: 'Fertility rate',   unit: 'ratio',  id: 'SP.DYN.TFRT.IN' },
  { key: 'literacy',       label: 'Literacy rate',    unit: '%',      id: 'SE.ADT.LITR.ZS' },
];

await buildWbDomain('society', INDICATORS, WB);
