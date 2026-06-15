import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCountry, allCodes, formatPopulation, formatArea } from "@/lib/countries";
import { getHistory } from "@/lib/histories";
import TimeJourney from "@/components/journey/TimeJourney";

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
  const history = getHistory(code);
  return {
    title: `${meta.name} — ${history ? history.tagline : "Terralore"}`,
    description:
      history?.summary ??
      `The history of ${meta.name}, in the Terralore archive.`,
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

  return <TimeJourney history={history} meta={meta} neighbours={neighbours} />;
}

function StubScreen({
  meta,
}: {
  meta: NonNullable<ReturnType<typeof getCountry>>;
}) {
  return (
    <main
      className="relative grid h-[100dvh] w-full place-items-center overflow-hidden bg-void px-6 text-chalk"
      style={{
        background:
          "radial-gradient(120% 100% at 50% 0%, #14110b 0%, #0a0a0c 55%, #07070a 100%)",
      }}
    >
      <Link
        href={`/country/${meta.code}`}
        className="group absolute left-5 top-5 flex items-center gap-2 text-chalk-soft transition hover:text-chalk md:left-9 md:top-6"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="transition-transform group-hover:-translate-x-0.5">
          <path d="M16 10H4m0 0l5 5m-5-5l5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="font-mono text-[0.66rem] uppercase tracking-[0.16em]">Dossier</span>
      </Link>

      <div className="max-w-xl text-center">
        <div className="eyebrow flex items-center justify-center gap-2 text-brass">
          <span className="text-base leading-none">{meta.flag}</span>
          <span>{meta.subregion ?? meta.region} · {meta.continent}</span>
        </div>
        <h1 className="mt-5 font-display text-[3.4rem] font-medium leading-[0.96] text-chalk md:text-[5rem]">
          {meta.name}
        </h1>
        <p className="mt-4 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-brass-bright">
          Archive in progress
        </p>
        <p className="mx-auto mt-5 max-w-lg font-serif text-[1.15rem] leading-relaxed text-chalk-soft">
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
          className="group mx-auto mt-11 flex w-fit items-center gap-2 rounded-full border border-brass/30 px-5 py-2.5 text-sm text-brass-bright transition hover:bg-brass/10"
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
      <dt className="eyebrow text-chalk-faint">{label}</dt>
      <dd className="mt-1 font-sans text-[0.98rem] font-medium text-chalk">{value}</dd>
    </div>
  );
}
