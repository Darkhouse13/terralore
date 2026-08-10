// Health domain — spending, workforce, child survival, immunisation and safe
// water. The World Bank redistributes these SH.* series; the figures themselves
// are compiled by the WHO Global Health Observatory (with UNICEF for the
// immunisation and child-mortality estimates), so that is what we attribute —
// the same rule technology follows for UNESCO and ITU.
//
// Life expectancy deliberately does NOT appear here: it already lives in the
// society domain, and metric keys are globally unique across domains (the
// series-index builder throws on collision). One figure, one home.
//
// Writes data/domains/health.json.
import { buildWbDomain, today } from './lib/domain.mjs';

// Health financing, workforce and service coverage — WHO Global Health
// Observatory, redistributed through the World Bank.
const WHO = {
  id: 'wb-who',
  label: 'Global Health Observatory (WHO, via World Bank WDI)',
  publisher: 'WHO / World Bank',
  url: 'https://www.who.int/data/gho',
  license: 'CC BY 4.0',
  accessed: today(),
};

// Child mortality and immunisation coverage are the UN Inter-agency Group /
// WHO-UNICEF estimates rather than GHO compilations, and are named as such.
const UNICEF_WHO = {
  id: 'wb-unicef-who',
  label: 'Child mortality & immunisation estimates (UN IGME and WHO/UNICEF, via World Bank WDI)',
  publisher: 'UNICEF and WHO / World Bank',
  url: 'https://childmortality.org',
  license: 'CC BY 4.0',
  accessed: today(),
};

const INDICATORS = [
  { key: 'healthSpendPctGdp', label: 'Health spending',      unit: '% of GDP',        id: 'SH.XPD.CHEX.GD.ZS', source: WHO },
  { key: 'physicians',        label: 'Physicians',           unit: 'per 1,000',       id: 'SH.MED.PHYS.ZS',    source: WHO },
  { key: 'underFiveMortality',label: 'Under-5 mortality',    unit: 'per 1,000 births',id: 'SH.DYN.MORT',       source: UNICEF_WHO },
  { key: 'measlesImmunisation',label: 'Measles immunisation',unit: '%',               id: 'SH.IMM.MEAS',       source: UNICEF_WHO },
  { key: 'safeWater',         label: 'Safe drinking water',  unit: '%',               id: 'SH.H2O.SMDW.ZS',    source: WHO },
];

await buildWbDomain('health', INDICATORS, WHO);
