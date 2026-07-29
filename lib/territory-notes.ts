// Short, sourced status notes for territories whose extent or governance carries
// a caveat. Rendered in the dossier Overview. Keep these factual and brief.

export interface TerritoryNote {
  text: string;
  source?: { label: string; url: string };
}

export const TERRITORY_NOTES: Record<string, TerritoryNote> = {
  // Western Sahara is presented here as part of Morocco (the Southern Provinces);
  // its final status is the subject of an ongoing UN-led process.
  MAR: {
    text: "Includes the Sahara region — the Southern Provinces — administered by Morocco. Its final status remains the subject of a UN-led political process.",
    source: { label: "UN MINURSO", url: "https://minurso.unmissions.org/" },
  },
};

/**
 * Why a nation's dossier carries no statistical series.
 *
 * Seven codes in the atlas have no domain data at all, and the reasons are not
 * interchangeable — a continent with no government is not the same case as a
 * state recognised by one UN member. Saying "no data" and stopping would imply
 * the gap is an oversight of ours; each of these is a fact about the world's
 * statistical apparatus, and the honest thing is to name it.
 *
 * These are statements about data availability, not about sovereignty. Where
 * status is contested the wording follows the corpus's rule: describe the
 * dispute, do not resolve it.
 */
export const NO_DATA_NOTES: Record<string, string> = {
  ATA:
    "Antarctica has no permanent population and no national government — it is " +
    "administered under the Antarctic Treaty. No statistical agency compiles " +
    "national indicators for it, so there is nothing here to report.",
  ATF:
    "The French Southern and Antarctic Lands have no permanent civilian " +
    "population. They are administered from Réunion as an overseas territory of " +
    "France and are not a separate reporting entity in international datasets.",
  CYN:
    "Northern Cyprus is recognised as a state by Türkiye alone. It is not a " +
    "member of the United Nations or the World Bank, and does not appear as a " +
    "separate entity in the datasets these indicators are drawn from.",
  SOL:
    "Somaliland declared independence in 1991 and has not been recognised by " +
    "the United Nations or any member state. Where its figures are collected at " +
    "all, they are reported within Somalia's.",
  FLK:
    "The Falkland Islands are a British Overseas Territory, administered by the " +
    "United Kingdom; sovereignty is disputed by Argentina. They are not a " +
    "separate reporting entity in World Bank datasets.",
  TWN:
    "Taiwan is not a member of the United Nations, and is excluded from the " +
    "World Bank and UN series that supply most of this dossier. Its own " +
    "statistical agencies publish extensively.",
  VAT:
    "Vatican City has a resident population of a few hundred and does not " +
    "compile the economic and social series these indicators are drawn from.",
};
