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
