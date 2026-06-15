// Geography & environment domain — World Bank (land, forest, agriculture,
// emissions, renewable energy; several sourced by WB from FAO/IEA).
// Writes data/domains/geography.json.
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
  { key: 'landArea',     label: 'Land area',          unit: 'km²', id: 'AG.LND.TOTL.K2' },
  { key: 'forestPct',    label: 'Forest area',        unit: '%',   id: 'AG.LND.FRST.ZS' },
  { key: 'agriPct',      label: 'Agricultural land',  unit: '%',   id: 'AG.LND.AGRI.ZS' },
  { key: 'co2PerCapita', label: 'CO₂ per capita (t)', unit: 'ratio', id: 'EN.GHG.CO2.PC.CE.AR5' },
  { key: 'renewablePct', label: 'Renewable energy',   unit: '%',   id: 'EG.FEC.RNEW.ZS' },
];

await buildWbDomain('geography', INDICATORS, WB);
