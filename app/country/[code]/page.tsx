import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCountry, allCodes, regionPeers } from "@/lib/countries";
import { getDossier, getComparisons } from "@/lib/domains";
import { DOMAIN_META, type DomainKey } from "@/lib/types";
import { getHistory } from "@/lib/histories";
import { annotationsFor } from "@/lib/annotations-server";
import Dossier from "@/components/dossier/Dossier";
import JsonLd from "@/components/JsonLd";
import { breadcrumbLd, dossierDescription, dossierLd, routes, SITE_NAME } from "@/lib/seo";

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
  if (!meta) return { title: "Unknown territory" };
  // Built from what this nation actually has, not from a fixed sentence: the
  // eight Overview-only codes should not advertise six domains of data they do
  // not carry, and a description that is true of every page is useful on none.
  const d = getDossier(code);
  const domainLabels = d
    ? (Object.keys(d.sections) as DomainKey[]).map((k) => DOMAIN_META[k].label)
    : [];
  const metricCount = d
    ? Object.values(d.sections).reduce((n, sec) => n + (sec?.metrics.length ?? 0), 0)
    : 0;
  const description = dossierDescription(meta, domainLabels, metricCount);
  const path = routes.dossier(code);
  return {
    title: meta.name,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "profile",
      title: `${meta.name} — a sourced dossier`,
      description,
      url: path,
      siteName: SITE_NAME,
    },
    twitter: { card: "summary_large_image", title: `${meta.name} — ${SITE_NAME}`, description },
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
    <>
      <JsonLd
        data={[
          dossierLd(meta, Object.values(dossier?.sources ?? {}), dossier?.updated ?? null),
          breadcrumbLd([
            { name: SITE_NAME, path: routes.home() },
            { name: "The Atlas", path: routes.atlas() },
            { name: meta.name, path: routes.dossier(meta.code) },
          ]),
        ]}
      />
      <Dossier
        meta={meta}
        dossier={dossier}
        comparisons={comparisons}
        regionLabel={meta.subregion ?? meta.region}
        hasHistory={!!history}
        historyTagline={history?.tagline ?? null}
        annotations={annotationsFor(code)}
      />
    </>
  );
}
