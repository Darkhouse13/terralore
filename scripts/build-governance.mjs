// Governance domain — the six Worldwide Governance Indicators, redistributed
// through the World Bank Indicators API. Attributed to the WGI project itself
// (cf. military/SIPRI, technology/UNESCO), because the World Bank is the
// distributor here and the WGI research programme is the producer.
//
// The series live in API database 3, not the default WDI database, under the
// renamed ids below (`GOV_WGI_*.SC`). The pre-2025 ids — `GE.EST` and friends —
// return "Invalid value"; do not reach for them.
//
// What the numbers are, stated exactly because the dossier's claim is only as
// honest as its label: these are the WGI's **absolute 0–100 scores**, not
// percentile ranks. The 2025 methodology revision constructs a hypothetical
// best-case and worst-case performer per dimension, fixes their estimates as 100
// and 0, and maps every country-year linearly between them — so a score is
// comparable across years, and a nation can rise while the rest of the world
// rises with it. They are model estimates aggregated from ~35 perception-based
// survey and expert sources, carrying real margins of error, and the metric
// definitions in lib/metric-defs.ts say so.
//
// Writes data/domains/governance.json.
import { buildWbDomain, today } from './lib/domain.mjs';

const WGI = {
  id: 'wb-wgi',
  label: 'Worldwide Governance Indicators (via World Bank API)',
  publisher: 'Worldwide Governance Indicators / World Bank',
  url: 'https://www.worldbank.org/en/publication/worldwide-governance-indicators',
  license: 'CC BY 4.0',
  accessed: today(),
};

// database 3 — see the header note.
const DB = 3;

const INDICATORS = [
  { key: 'wgiVoice',         label: 'Voice & accountability',  unit: 'score', id: 'GOV_WGI_VA.SC', wbSource: DB },
  { key: 'wgiStability',     label: 'Political stability',     unit: 'score', id: 'GOV_WGI_PV.SC', wbSource: DB },
  { key: 'wgiEffectiveness', label: 'Government effectiveness',unit: 'score', id: 'GOV_WGI_GE.SC', wbSource: DB },
  { key: 'wgiRegQuality',    label: 'Regulatory quality',      unit: 'score', id: 'GOV_WGI_RQ.SC', wbSource: DB },
  { key: 'wgiRuleOfLaw',     label: 'Rule of law',             unit: 'score', id: 'GOV_WGI_RL.SC', wbSource: DB },
  { key: 'wgiCorruption',    label: 'Control of corruption',   unit: 'score', id: 'GOV_WGI_CC.SC', wbSource: DB },
];

await buildWbDomain('governance', INDICATORS, WGI);
