import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCountry, allCodes } from "@/lib/countries";
import { getDossier } from "@/lib/domains";
import { DOMAIN_META, type DomainKey } from "@/lib/types";
import { getHistory } from "@/lib/histories";
import { annotationsFor } from "@/lib/annotations-server";
import { changesForNation, describeChange } from "@/lib/ledger";
import { claimFragment } from "@/lib/claim-id";
import Dossier, { type EraBed, type RecordRow } from "@/components/dossier/Dossier";
import JsonLd from "@/components/JsonLd";
import { getRanking } from "@/lib/rankings";
import { breadcrumbLd, dossierDescription, dossierLd, mdTwinTypes, routes, SITE_NAME } from "@/lib/seo";

export function generateStaticParams() {
  return allCodes().map((code) => ({ code }));
}

export const dynamicParams = false;

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
  // The nation's headline world ranks, stated up front: "France GDP rank" is
  // a real query class (macrotrends/countryeconomy own it) and this page holds
  // the answer — so the title and the snippet's first sentence say it.
  const headlineRanks = (["gdp", "population"] as const)
    .map((slug) => {
      const ranking = getRanking(slug);
      const row = ranking?.rows.find((r) => r.code === code);
      if (!row) return null;
      // Acronym labels (GDP) keep their case; word labels read mid-sentence.
      const label =
        ranking!.label === ranking!.label.toUpperCase()
          ? ranking!.label
          : ranking!.label.toLowerCase();
      return `#${row.rank} of ${ranking!.rows.length} in ${label}`;
    })
    .filter((clause): clause is string => clause !== null);
  const rankClause = headlineRanks.length ? `ranked ${headlineRanks.join(", ")} worldwide` : undefined;
  const description = dossierDescription(meta, domainLabels, metricCount, rankClause);
  const path = routes.dossier(code);
  return {
    title: rankClause ? `${meta.name} — GDP rank, population & sourced data` : meta.name,
    description,
    alternates: { canonical: path, types: mdTwinTypes(path) },
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

  // The era beds: NEWEST at the top, oldest at the bottom — depth = time,
  // down is older, always. Headline events per era are the two with the
  // deepest sourcing (ties → earliest): a deterministic editorial pick that
  // needs no new authorship.
  const eraBeds: EraBed[] = (history?.eras ?? [])
    .map((era) => ({
      id: era.id,
      title: era.title,
      period: era.period,
      count: era.events.length,
      headline: [...era.events]
        .sort((a, b) => b.sources.length - a.sources.length || a.year - b.year)
        .slice(0, 2)
        .sort((a, b) => a.year - b.year)
        .map((e) => ({
          yearLabel: e.yearLabel ?? String(Math.abs(e.year)) + (e.year < 0 ? " BCE" : ""),
          title: e.title,
          refs: e.sources.length,
        })),
    }))
    .reverse();

  // THE RECORD (deviations E15): this nation's recent ledger changes, composed
  // server-side (lib/ledger reads with fs) into serializable rows. Capped at
  // eight — the full record lives on the entry and in its committed JSON.
  const record = (() => {
    const rows: RecordRow[] = [];
    let total = 0;
    for (const { entry, changes } of changesForNation(code)) {
      total += changes.length;
      for (const c of changes) {
        if (rows.length >= 8) continue;
        rows.push({
          entry: entry.slug,
          date: entry.date,
          label: c.label,
          text: describeChange(c),
          fragment:
            c.kind !== "retired" && c.after && c.domain !== "commodities"
              ? claimFragment(c.metric, c.after.year)
              : null,
        });
      }
    }
    return { rows, total };
  })();

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
        eraBeds={eraBeds}
        eventsTotal={history ? history.eras.reduce((n, e) => n + e.events.length, 0) : 0}
        founding={history ? `${history.founding.label} · ${history.founding.yearLabel}` : null}
        annotations={annotationsFor(code)}
        record={record}
      />
    </>
  );
}
