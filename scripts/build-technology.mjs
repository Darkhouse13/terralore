// Technology domain — innovation investment (UNESCO UIS), connectivity (ITU) and
// high-tech output, all redistributed through the World Bank Indicators API.
// Each indicator is attributed to its true upstream provider (cf. military/SIPRI).
// Writes data/domains/technology.json.
import { buildWbDomain, today } from './lib/domain.mjs';

// R&D investment + research workforce — UNESCO Institute for Statistics.
const UNESCO = {
  id: 'wb-unesco',
  label: 'R&D statistics (UNESCO UIS, via World Bank WDI)',
  publisher: 'UNESCO Institute for Statistics / World Bank',
  url: 'https://uis.unesco.org',
  license: 'CC BY 4.0',
  accessed: today(),
};

// Connectivity — International Telecommunication Union.
const ITU = {
  id: 'wb-itu',
  label: 'ICT indicators (ITU, via World Bank WDI)',
  publisher: 'ITU / World Bank',
  url: 'https://www.itu.int/en/ITU-D/Statistics',
  license: 'CC BY 4.0',
  accessed: today(),
};

// High-tech trade — World Bank WDI (UN Comtrade via WITS).
const WB = {
  id: 'wb-wdi',
  label: 'World Development Indicators',
  publisher: 'World Bank',
  url: 'https://data.worldbank.org',
  license: 'CC BY 4.0',
  accessed: today(),
};

const INDICATORS = [
  { key: 'rdSpending',     label: 'R&D spending',              unit: '% of GDP',  id: 'GB.XPD.RSDV.GD.ZS', source: UNESCO },
  { key: 'researchers',    label: 'Researchers (per million)', unit: 'per million', id: 'SP.POP.SCIE.RD.P6', source: UNESCO },
  { key: 'internetUsers',  label: 'Internet users',            unit: '%',         id: 'IT.NET.USER.ZS',    source: ITU },
  { key: 'mobileSubs',     label: 'Mobile subscriptions',      unit: 'per 100',   id: 'IT.CEL.SETS.P2',    source: ITU },
  { key: 'highTechExports',label: 'High-tech exports',         unit: '%',         id: 'TX.VAL.TECH.MF.ZS', source: WB },
];

await buildWbDomain('technology', INDICATORS, WB);
