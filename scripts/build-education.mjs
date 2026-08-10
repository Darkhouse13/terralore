// Education domain — literacy, public spending and enrolment at all three
// levels. Every series here is compiled by the UNESCO Institute for Statistics
// and redistributed by the World Bank, so the attribution reuses the same
// `wb-unesco` source shape the technology domain already uses for R&D.
//
// Two honest gaps to expect, both left as "—" rather than imputed:
//   * Adult literacy is sparse for high-income countries, which largely stopped
//     running literacy surveys once near-universal rates made them uninformative.
//   * Gross enrolment ratios divide total enrolment by the official school-age
//     population, so repeaters and over-age or under-age pupils can push a value
//     above 100%. That is the indicator working as defined, not an error.
//
// One value is refused rather than reported: Somalia's education-spending share
// arrives as 8×10⁻⁶ % of GDP, six orders of magnitude below any other country,
// which is a denomination error upstream and not a fact about Somali schools.
// The `floor` below discards it — see applyFloor in scripts/lib/domain.mjs.
//
// Writes data/domains/education.json.
import { buildWbDomain, today } from './lib/domain.mjs';

const UNESCO = {
  id: 'wb-unesco',
  label: 'Education statistics (UNESCO UIS, via World Bank WDI)',
  publisher: 'UNESCO Institute for Statistics / World Bank',
  url: 'https://uis.unesco.org',
  license: 'CC BY 4.0',
  accessed: today(),
};

const INDICATORS = [
  { key: 'literacyRate',    label: 'Adult literacy',      unit: '%',        id: 'SE.ADT.LITR.ZS' },
  { key: 'eduSpendPctGdp',  label: 'Education spending',  unit: '% of GDP', id: 'SE.XPD.TOTL.GD.ZS', floor: 0.05 },
  { key: 'primaryEnrolment',label: 'Primary enrolment',   unit: '% gross',  id: 'SE.PRM.ENRR' },
  { key: 'secondaryEnrolment',label: 'Secondary enrolment',unit: '% gross', id: 'SE.SEC.ENRR' },
  { key: 'tertiaryEnrolment',label: 'Tertiary enrolment', unit: '% gross',  id: 'SE.TER.ENRR' },
];

await buildWbDomain('education', INDICATORS, UNESCO);
