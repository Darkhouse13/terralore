import type { CountryHistory } from "../types";
import { france } from "./france";
import egypt from "./data/egypt.json";
import japan from "./data/japan.json";
import mexico from "./data/mexico.json";
import germany from "./data/germany.json";
import usa from "./data/usa.json";
import china from "./data/china.json";
import india from "./data/india.json";
import italy from "./data/italy.json";
import spain from "./data/spain.json";
import uk from "./data/uk.json";
import russia from "./data/russia.json";
import brazil from "./data/brazil.json";
import greece from "./data/greece.json";
import turkey from "./data/turkey.json";
import iran from "./data/iran.json";
import southkorea from "./data/southkorea.json";
import nigeria from "./data/nigeria.json";
import australia from "./data/australia.json";
import canada from "./data/canada.json";
import argentina from "./data/argentina.json";
import indonesia from "./data/indonesia.json";
import vietnam from "./data/vietnam.json";
import saudiarabia from "./data/saudiarabia.json";
import palestine from "./data/palestine.json";
import ethiopia from "./data/ethiopia.json";
import southafrica from "./data/southafrica.json";
import poland from "./data/poland.json";
import netherlands from "./data/netherlands.json";
import ghana from "./data/ghana.json";
import kenya from "./data/kenya.json";
import morocco from "./data/morocco.json";
import westernsahara from "./data/westernsahara.json";
import algeria from "./data/algeria.json";
import tunisia from "./data/tunisia.json";
import libya from "./data/libya.json";
import sudan from "./data/sudan.json";
import southsudan from "./data/southsudan.json";
import mali from "./data/mali.json";
import senegal from "./data/senegal.json";
import mauritania from "./data/mauritania.json";
import niger from "./data/niger.json";
import chad from "./data/chad.json";
import gambia from "./data/gambia.json";
import ivorycoast from "./data/ivorycoast.json";
import burkinafaso from "./data/burkinafaso.json";
import benin from "./data/benin.json";
import togo from "./data/togo.json";
import guinea from "./data/guinea.json";
import guineabissau from "./data/guineabissau.json";
import sierraleone from "./data/sierraleone.json";
import liberia from "./data/liberia.json";
import cameroon from "./data/cameroon.json";
import centralafricanrepublic from "./data/centralafricanrepublic.json";
import gabon from "./data/gabon.json";
import congo from "./data/congo.json";
import drcongo from "./data/drcongo.json";
import equatorialguinea from "./data/equatorialguinea.json";
import angola from "./data/angola.json";
import zambia from "./data/zambia.json";
import zimbabwe from "./data/zimbabwe.json";
import malawi from "./data/malawi.json";
import mozambique from "./data/mozambique.json";
import madagascar from "./data/madagascar.json";
import namibia from "./data/namibia.json";
import botswana from "./data/botswana.json";
import lesotho from "./data/lesotho.json";
import eswatini from "./data/eswatini.json";
import rwanda from "./data/rwanda.json";
import burundi from "./data/burundi.json";
import uganda from "./data/uganda.json";
import tanzania from "./data/tanzania.json";
import somalia from "./data/somalia.json";
import somaliland from "./data/somaliland.json";
import eritrea from "./data/eritrea.json";
import djibouti from "./data/djibouti.json";
import capeverde from "./data/capeverde.json";
import comoros from "./data/comoros.json";
import mauritius from "./data/mauritius.json";
import saotome from "./data/saotome.json";
import seychelles from "./data/seychelles.json";
import portugal from "./data/portugal.json";
import ireland from "./data/ireland.json";
import belgium from "./data/belgium.json";
import luxembourg from "./data/luxembourg.json";
import switzerland from "./data/switzerland.json";
import austria from "./data/austria.json";
import denmark from "./data/denmark.json";
import norway from "./data/norway.json";
import sweden from "./data/sweden.json";
import finland from "./data/finland.json";
import iceland from "./data/iceland.json";
import estonia from "./data/estonia.json";
import latvia from "./data/latvia.json";
import lithuania from "./data/lithuania.json";
import belarus from "./data/belarus.json";
import ukraine from "./data/ukraine.json";
import moldova from "./data/moldova.json";
import romania from "./data/romania.json";
import bulgaria from "./data/bulgaria.json";
import hungary from "./data/hungary.json";
import czechia from "./data/czechia.json";
import slovakia from "./data/slovakia.json";
import slovenia from "./data/slovenia.json";
import croatia from "./data/croatia.json";
import bosnia from "./data/bosnia.json";
import serbia from "./data/serbia.json";
import montenegro from "./data/montenegro.json";
import northmacedonia from "./data/northmacedonia.json";
import albania from "./data/albania.json";
import cyprus from "./data/cyprus.json";
import kosovo from "./data/kosovo.json";
import malta from "./data/malta.json";
import andorra from "./data/andorra.json";
import monaco from "./data/monaco.json";
import liechtenstein from "./data/liechtenstein.json";
import sanmarino from "./data/sanmarino.json";
import vatican from "./data/vatican.json";

// Authored, verified histories. Add a module per nation and register it here.
// JSON entries are validated by scripts/validate-histories.mjs.
const H = (x: unknown) => x as CountryHistory;

const registry: Record<string, CountryHistory> = {
  FRA: france,
  EGY: H(egypt),
  JPN: H(japan),
  MEX: H(mexico),
  DEU: H(germany),
  USA: H(usa),
  CHN: H(china),
  IND: H(india),
  ITA: H(italy),
  ESP: H(spain),
  GBR: H(uk),
  RUS: H(russia),
  BRA: H(brazil),
  GRC: H(greece),
  TUR: H(turkey),
  IRN: H(iran),
  KOR: H(southkorea),
  NGA: H(nigeria),
  AUS: H(australia),
  CAN: H(canada),
  ARG: H(argentina),
  IDN: H(indonesia),
  VNM: H(vietnam),
  SAU: H(saudiarabia),
  PSE: H(palestine),
  ETH: H(ethiopia),
  ZAF: H(southafrica),
  POL: H(poland),
  NLD: H(netherlands),
  GHA: H(ghana),
  KEN: H(kenya),
  MAR: H(morocco),
  SAH: H(westernsahara),
  DZA: H(algeria),
  TUN: H(tunisia),
  LBY: H(libya),
  SDN: H(sudan),
  SDS: H(southsudan),
  MLI: H(mali),
  SEN: H(senegal),
  MRT: H(mauritania),
  NER: H(niger),
  TCD: H(chad),
  GMB: H(gambia),
  CIV: H(ivorycoast),
  BFA: H(burkinafaso),
  BEN: H(benin),
  TGO: H(togo),
  GIN: H(guinea),
  GNB: H(guineabissau),
  SLE: H(sierraleone),
  LBR: H(liberia),
  CMR: H(cameroon),
  CAF: H(centralafricanrepublic),
  GAB: H(gabon),
  COG: H(congo),
  COD: H(drcongo),
  GNQ: H(equatorialguinea),
  AGO: H(angola),
  ZMB: H(zambia),
  ZWE: H(zimbabwe),
  MWI: H(malawi),
  MOZ: H(mozambique),
  MDG: H(madagascar),
  NAM: H(namibia),
  BWA: H(botswana),
  LSO: H(lesotho),
  SWZ: H(eswatini),
  RWA: H(rwanda),
  BDI: H(burundi),
  UGA: H(uganda),
  TZA: H(tanzania),
  SOM: H(somalia),
  SOL: H(somaliland),
  ERI: H(eritrea),
  DJI: H(djibouti),
  CPV: H(capeverde),
  COM: H(comoros),
  MUS: H(mauritius),
  STP: H(saotome),
  SYC: H(seychelles),
  PRT: H(portugal),
  IRL: H(ireland),
  BEL: H(belgium),
  LUX: H(luxembourg),
  CHE: H(switzerland),
  AUT: H(austria),
  DNK: H(denmark),
  NOR: H(norway),
  SWE: H(sweden),
  FIN: H(finland),
  ISL: H(iceland),
  EST: H(estonia),
  LVA: H(latvia),
  LTU: H(lithuania),
  BLR: H(belarus),
  UKR: H(ukraine),
  MDA: H(moldova),
  ROU: H(romania),
  BGR: H(bulgaria),
  HUN: H(hungary),
  CZE: H(czechia),
  SVK: H(slovakia),
  SVN: H(slovenia),
  HRV: H(croatia),
  BIH: H(bosnia),
  SRB: H(serbia),
  MNE: H(montenegro),
  MKD: H(northmacedonia),
  ALB: H(albania),
  CYP: H(cyprus),
  KOS: H(kosovo),
  MLT: H(malta),
  AND: H(andorra),
  MCO: H(monaco),
  LIE: H(liechtenstein),
  SMR: H(sanmarino),
  VAT: H(vatican),
};

export function getHistory(code: string): CountryHistory | undefined {
  return registry[code];
}

export function hasHistory(code: string): boolean {
  return code in registry;
}

export function publishedCodes(): string[] {
  return Object.keys(registry);
}

export function allHistories(): CountryHistory[] {
  return Object.values(registry);
}
