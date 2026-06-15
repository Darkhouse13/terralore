// Military domain — military expenditure & personnel. The World Bank distributes
// these series sourced from SIPRI; we attribute SIPRI accordingly.
// Writes data/domains/military.json.
import { buildWbDomain, today } from './lib/domain.mjs';

const SIPRI = {
  id: 'wb-sipri',
  label: 'Military Expenditure Database (via World Development Indicators)',
  publisher: 'SIPRI / World Bank',
  url: 'https://www.sipri.org/databases/milex',
  license: 'CC BY 4.0',
  accessed: today(),
};

const INDICATORS = [
  { key: 'milExpPctGdp', label: 'Military burden',  unit: '% of GDP', id: 'MS.MIL.XPND.GD.ZS' },
  { key: 'milExpUsd',    label: 'Defense spending', unit: 'USD',      id: 'MS.MIL.XPND.CD' },
  { key: 'armedForces',  label: 'Armed forces',     unit: 'people',   id: 'MS.MIL.TOTL.P1' },
];

await buildWbDomain('military', INDICATORS, SIPRI);
