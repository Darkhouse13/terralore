import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCountry, allCodes, regionPeers } from "@/lib/countries";
import { getDossier, getComparisons } from "@/lib/domains";
import { getHistory } from "@/lib/histories";
import Dossier from "@/components/dossier/Dossier";

export function generateStaticParams() {
  return allCodes().map((code) => ({ code }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const meta = getCountry(code);
  if (!meta) return { title: "Unknown territory — Terralore" };
  return {
    title: `${meta.name} — Terralore`,
    description: `A sourced dossier on ${meta.name}: economy, society, geography, and the long history of how it became a nation.`,
  };
}

export default async function CountryDossierPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const meta = getCountry(code);
  if (!meta) notFound();

  const dossier = getDossier(code);
  const history = getHistory(code);
  const comparisons = getComparisons(code, regionPeers(code));

  return (
    <Dossier
      meta={meta}
      dossier={dossier}
      comparisons={comparisons}
      regionLabel={meta.subregion ?? meta.region}
      hasHistory={!!history}
      historyTagline={history?.tagline ?? null}
    />
  );
}
