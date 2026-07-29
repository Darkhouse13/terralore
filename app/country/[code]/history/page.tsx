import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCountry, allCodes, formatPopulation, formatArea } from "@/lib/countries";
import { getHistory } from "@/lib/histories";
import TimeJourney from "@/components/journey/TimeJourney";
import JsonLd from "@/components/JsonLd";
import { breadcrumbLd, chronicleLd, journeyDescription, routes, SITE_NAME } from "@/lib/seo";

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
  const history = getHistory(code);
  const path = routes.journey(code);

  // Nations still being charted render a thin "archive in progress" screen —
  // real for a visitor, but nothing worth putting in an index.
  if (!history) {
    return {
      title: `${meta.name} — archive in progress`,
      description: `The sourced history of ${meta.name} is being charted and verified for the Terralore archive.`,
      alternates: { canonical: path },
      robots: { index: false, follow: true },
    };
  }

  const title = `${meta.name} — the time-journey`;
  // Deliberately not the chronicle's line. The two routes are two presentations
  // of one entity, and emitting `history.summary` on both made 184 pairs of
  // pages duplicates of each other in the index.
  const description = journeyDescription(meta, history);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: `${meta.name} — ${history.tagline}`,
      description,
      url: path,
      modifiedTime: history.updated,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: `${meta.name} — ${history.tagline}`,
      description,
    },
  };
}

export default async function CountryHistoryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const meta = getCountry(code);
  if (!meta) notFound();

  const history = getHistory(code);

  if (!history) return <StubScreen meta={meta} />;

  const neighbours = meta.borders
    .map((c) => getCountry(c))
    .filter(Boolean)
    .slice(0, 6)
    .map((nb) => ({ code: nb!.code, name: nb!.name, flag: nb!.flag }));

  return (
    <>
      <JsonLd
        data={[
          // The journey paints one moment at a time, so its DOM carries little
          // text. We still describe the underlying work here, but the Article
          // node keeps its canonical @id and url on the chronicle — the two
          // routes are two presentations of one entity, and this is what tells
          // an engine to consolidate them onto the readable one.
          chronicleLd(history, meta),
          breadcrumbLd([
            { name: SITE_NAME, path: routes.home() },
            { name: "The Atlas", path: routes.atlas() },
            { name: meta.name, path: routes.dossier(meta.code) },
            { name: "Time-journey", path: routes.journey(meta.code) },
          ]),
        ]}
      />
      <TimeJourney history={history} meta={meta} neighbours={neighbours} />
    </>
  );
}

function StubScreen({
  meta,
}: {
  meta: NonNullable<ReturnType<typeof getCountry>>;
}) {
  return (
    <main
      className="relative grid h-[100dvh] w-full place-items-center overflow-hidden bg-depth-6 px-6 text-chalk"
      style={{
        background:
          "radial-gradient(125% 100% at 50% -10%, #0c2e3d 0%, #04161f 42%, #04161f 100%)",
      }}
    >
      <Link
        href={`/country/${meta.code}`}
        className="group absolute left-5 top-5 flex items-center gap-2 text-chalk-2 transition hover:text-chalk md:left-9 md:top-6"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="transition-transform group-hover:-translate-x-0.5">
          <path d="M16 10H4m0 0l5 5m-5-5l5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="font-mono text-[0.66rem] uppercase tracking-[0.16em]">Dossier</span>
      </Link>

      <div className="max-w-xl text-center">
        <div className="eyebrow flex items-center justify-center gap-2 text-copper">
          <span className="text-base leading-none">{meta.flag}</span>
          <span>{meta.subregion ?? meta.region} · {meta.continent}</span>
        </div>
        <h1 className="mt-5 font-display text-[3.4rem] font-medium leading-[0.96] text-chalk md:text-[5rem]">
          {meta.name}
        </h1>
        <p className="mt-4 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-copper-bright">
          Archive in progress
        </p>
        <p className="mx-auto mt-5 max-w-lg font-serif text-[1.15rem] leading-relaxed text-chalk-2">
          {`The time-journey through ${meta.name} is being charted and verified. Terralore publishes a nation's chapters only once each claim can be traced to a reliable source — so this one will arrive complete rather than quickly.`}
        </p>

        <dl className="mx-auto mt-9 inline-flex flex-wrap items-center justify-center gap-x-9 gap-y-4">
          <Fact label="Capital" value={meta.capital[0] ?? "—"} />
          <Fact label="Population" value={formatPopulation(meta.population)} />
          <Fact label="Area" value={formatArea(meta.area)} />
          <Fact label="Languages" value={meta.languages.slice(0, 2).join(", ") || "—"} />
        </dl>

        <Link
          href={`/country/${meta.code}`}
          className="group mx-auto mt-11 flex w-fit items-center gap-2 rounded-full border border-copper/30 px-5 py-2.5 text-sm text-copper-bright transition hover:bg-copper/10"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M16 10H4m0 0l5 5m-5-5l5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to the dossier
        </Link>
      </div>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <dt className="eyebrow text-chalk-3">{label}</dt>
      <dd className="mt-1 font-sans text-[0.98rem] font-medium text-chalk">{value}</dd>
    </div>
  );
}
