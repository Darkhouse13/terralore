import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCountry, allCodes } from "@/lib/countries";
import { getDossier } from "@/lib/domains";
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
  if (!meta) return { title: "Unknown territory — Terra Historica" };
  return {
    title: `${meta.name} — Terra Historica`,
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

  return (
    <Dossier
      meta={meta}
      dossier={dossier}
      hasHistory={!!history}
      historyTagline={history?.tagline ?? null}
    />
  );
}
