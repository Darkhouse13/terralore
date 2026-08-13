import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCountry, allCodes } from "@/lib/countries";
import { getHistory, hasHistory } from "@/lib/histories";
import JsonLd from "@/components/JsonLd";
import { breadcrumbLd, chronicleDescription, chronicleLd, countryOgImages, mdTwinTypes, routes, SITE_NAME } from "@/lib/seo";
import { meanwhileElsewhere, periodFor, themeSlug } from "@/lib/chronology";
import { metricLinkFor } from "@/lib/annotations";
import type { CountryHistory, Era, Figure, Source, TimelineEvent } from "@/lib/types";
import { CATEGORY_META } from "@/lib/types";

/**
 * The Chronicle — the reading depth.
 *
 * The time-journey at `/history` is the *experience*: cinematic, piloted one
 * moment at a time, and by design it paints a single moment into the DOM. That
 * makes it a beautiful thing to use and a nearly invisible thing to cite — the
 * corpus holds ~600k words of sourced prose and barely 7% of it ever reached
 * the HTML.
 *
 * This route is the other half: the same verified material as a single
 * server-rendered document — every era, every event, every figure, every
 * reference, in the initial response, with no JavaScript required to read it.
 * Humans get a proper long-form read; answer engines get something they can
 * quote and attribute.
 */

export function generateStaticParams() {
  // Only nations with an authored history have a chronicle to render.
  return allCodes()
    .filter((code) => hasHistory(code))
    .map((code) => ({ code }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const meta = getCountry(code);
  const history = meta ? getHistory(code) : null;
  if (!meta || !history) return { title: `Unknown territory — ${SITE_NAME}` };

  const path = routes.chronicle(code);
  // Short title for the tab + SERP (the layout template appends the site name);
  // the fuller headline goes to OG, where the long form reads better.
  const title = `The Chronicle of ${meta.name}`;
  const ogTitle = `${meta.name} — ${history.tagline}`;
  const description = chronicleDescription(meta, history);

  return {
    title,
    description,
    keywords: [
      `history of ${meta.name}`,
      `${meta.name} timeline`,
      `how ${meta.name} became a country`,
      ...history.eras.map((e) => e.title),
    ],
    alternates: { canonical: path, types: mdTwinTypes(path) },
    openGraph: {
      type: "article",
      title: ogTitle,
      description,
      url: path,
      modifiedTime: history.updated,
      siteName: SITE_NAME,
      images: countryOgImages(code, meta.name),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: countryOgImages(code, meta.name),
    },
  };
}

export default async function ChroniclePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const meta = getCountry(code);
  if (!meta) notFound();

  const history = getHistory(code);
  // Nations without an authored history have no chronicle — the journey route
  // owns the "archive in progress" screen, so send readers there rather than
  // rendering an empty document.
  if (!history) notFound();

  const sourceIndex = new Map(history.sources.map((s, i) => [s.id, i + 1]));
  const eventCount = history.eras.reduce((n, e) => n + e.events.length, 0);
  const allFigures = collectFigures(history);

  const neighbours = meta.borders
    .map((c) => getCountry(c))
    .filter((c): c is NonNullable<typeof c> => Boolean(c) && hasHistory(c!.code))
    .slice(0, 8);

  // The cross-nation reads this nation's own events sit inside. Ranked by how
  // much of its history lands there, so the links lead somewhere dense rather
  // than to a period this nation barely touches.
  const events = history.eras.flatMap((e) => e.events);
  const periods = rankBy(events, (ev) => {
    const p = periodFor(ev.year);
    return [p.slug, p.label];
  }).slice(0, 5);
  const themes = rankBy(events, (ev) => [
    themeSlug(ev.category),
    CATEGORY_META[ev.category]?.label ?? ev.category,
  ]).slice(0, 5);

  return (
    <>
      <JsonLd
        data={[
          chronicleLd(history, meta),
          breadcrumbLd([
            { name: SITE_NAME, path: routes.home() },
            { name: "The Atlas", path: routes.atlas() },
            { name: meta.name, path: routes.dossier(meta.code) },
            { name: "Chronicle", path: routes.chronicle(meta.code) },
          ]),
        ]}
      />

      <main className="min-h-screen bg-bone text-basalt">
        {/* The mounted core (E12): the reading measure never widens — at
            desktop the column mounts left-of-center and the freed margin
            carries the depth rail, with each bed's years riding it while
            that bed passes (sticky, no JS). */}
        <div className="mount relative mx-auto max-w-[46rem] px-5 pb-24 pt-6 md:px-8 md:pt-10 lg:max-w-[55.5rem]">
          <span aria-hidden className="mount-rail" />
          <Breadcrumb meta={meta} />

          <Masthead history={history} meta={meta} eventCount={eventCount} />

          <Contents eras={history.eras} />

          <article>
            {history.eras.map((era, i) => (
              <EraSection
                key={era.id}
                era={era}
                n={i + 1}
                sources={history.sources}
                sourceIndex={sourceIndex}
                code={code}
              />
            ))}
          </article>

          {allFigures.length > 0 && <FigureGallery figures={allFigures} sourceIndex={sourceIndex} />}

          <References sources={history.sources} />

          <ChronicleFooter
            history={history}
            meta={meta}
            neighbours={neighbours}
            periods={periods}
            themes={themes}
          />
        </div>
      </main>
    </>
  );
}

/* ── pieces ───────────────────────────────────────────────────────────────── */

function Breadcrumb({ meta }: { meta: { code: string; name: string } }) {
  return (
    <nav aria-label="Breadcrumb" className="font-mono text-[10px] tracking-[0.16em] uppercase text-oxide">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href="/">Terralore</Link>
        </li>
        <li aria-hidden="true">·</li>
        <li>
          <Link href="/atlas">The section cut</Link>
        </li>
        <li aria-hidden="true">·</li>
        <li>
          <Link href={routes.dossier(meta.code)}>{meta.name}</Link>
        </li>
        <li aria-hidden="true">·</li>
        <li aria-current="page" className="text-umber">
          Chronicle
        </li>
      </ol>
    </nav>
  );
}

function Masthead({
  history,
  meta,
  eventCount,
}: {
  history: CountryHistory;
  meta: NonNullable<ReturnType<typeof getCountry>>;
  eventCount: number;
}) {
  return (
    <header className="relative mt-6 pb-8">
      <span aria-hidden className="mount-tick">
        <span>
          SPECIMEN {meta.code}
          <br />
          THE CHRONICLE
        </span>
      </span>
      <p className="eyebrow text-oxide">
        {meta.subregion ?? meta.region} · {meta.continent}
      </p>

      <h1 className="mt-3 font-display text-[42px] font-extrabold uppercase leading-none tracking-tight md:text-[64px]">
        {meta.name}
      </h1>

      <p className="mt-3 font-sans text-[17px] font-medium leading-snug text-umber md:text-[19px]">
        {history.tagline}
      </p>

      <p className="mt-5 font-sans text-[16px] leading-[1.65]">{history.summary}</p>

      {/* The headline "became a country" moment, pulled out as a standing fact. */}
      <div className="mt-7 border-2 border-basalt bg-sand px-5 py-4">
        <p className="eyebrow text-umber">{history.founding.label}</p>
        <p className="mt-1.5 font-display text-[24px] font-extrabold uppercase leading-tight tracking-tight">
          {history.founding.yearLabel}
        </p>
        <p className="mt-2 font-sans text-[14.5px] leading-[1.6] text-umber">
          {history.founding.detail}
        </p>
      </div>

      {history.quickFacts.length > 0 && (
        <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          {history.quickFacts.map((f) => (
            <div key={f.label}>
              <dt className="eyebrow text-umber">{f.label}</dt>
              <dd className="mt-1 font-sans text-[15px] font-medium">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <p className="mt-7 font-mono text-[10px] uppercase tracking-[0.16em] text-umber">
        {history.eras.length} beds · {eventCount} sourced events ·{" "}
        {history.sources.length} references · last verified{" "}
        <time dateTime={history.updated}>{formatDate(history.updated)}</time>
      </p>

      <div className="mt-6">
        <Link
          href={routes.dossier(meta.code)}
          className="pressable inline-flex items-center gap-2 border-2 border-basalt px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-oxide"
        >
          The data dossier →
        </Link>
      </div>
    </header>
  );
}

function Contents({ eras }: { eras: Era[] }) {
  return (
    <nav aria-label="Chapters" className="relative mt-8 border-t-2 border-basalt pt-4 pb-8">
      <span aria-hidden className="mount-tick">
        <span>CONTENTS</span>
      </span>
      <h2 className="eyebrow text-umber">The beds · down is older</h2>
      <ol className="mt-3">
        {eras.map((era, i) => (
          <li key={era.id} className="border-b-2 border-basalt">
            <a href={`#${era.id}`} className="pressable flex items-baseline gap-3.5 py-2.5">
              <span className="w-6 shrink-0 font-mono text-[11px] text-oxide">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 font-display text-[15px] font-extrabold uppercase leading-snug tracking-tight">
                {era.title}
              </span>
              <span className="flex-none font-mono text-[10px] text-umber">{era.period}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function EraSection({
  era,
  n,
  sources,
  sourceIndex,
  code,
}: {
  era: Era;
  n: number;
  sources: Source[];
  sourceIndex: Map<string, number>;
  code: string;
}) {
  const body = era.body ?? [];
  const events = [...era.events].sort((a, b) => a.year - b.year);

  // The era's dominant category — the pigment its stratum band is laid down in,
  // exactly as the journey's timeline rail computes it. Same corpus, same rule,
  // so a reader who has seen the rail recognises the band here.
  const dominant = (() => {
    const counts = new Map<string, number>();
    for (const ev of events) counts.set(ev.category, (counts.get(ev.category) ?? 0) + 1);
    let tint = "var(--color-copper)";
    let best = 0;
    for (const [cat, c] of counts) {
      if (c > best) {
        best = c;
        tint = CATEGORY_META[cat as keyof typeof CATEGORY_META].tint;
      }
    }
    return tint;
  })();

  return (
    <section id={era.id} className="relative scroll-mt-6 py-11">
      {/* The bed's depth label moves to the margin at desktop and rides the
          rail while the bed passes (E12) — the in-flow eyebrow carries it
          below the mount. */}
      <span aria-hidden className="mount-tick">
        <span>
          Bed {String(n).padStart(2, "0")}
          <br />
          {era.period}
        </span>
      </span>
      {/* Each bed opens on the rule, with the era's dominant pigment set into
          it as a tick — the one place category colour marks the reading page. */}
      <div aria-hidden className="mb-8 flex items-center gap-0">
        <span className="cut-rule w-full" />
        <span className="h-[8px] w-[42px] flex-none" style={{ background: dominant }} />
      </div>
      <p className="eyebrow text-oxide lg:sr-only">
        Bed {String(n).padStart(2, "0")} · {era.period}
      </p>

      <h2 className="mt-3 font-display text-[26px] font-extrabold uppercase leading-[1.02] tracking-tight md:text-[34px]">
        {era.title}
      </h2>

      <p className="mt-3 font-sans text-[16px] font-medium leading-[1.5] text-umber">
        {era.standfirst}
      </p>

      <div className="mt-5">
        {body.map((p, i) => (
          <p
            key={i}
            className={`font-sans text-[16px] leading-[1.7] ${i > 0 ? "mt-[1.1em]" : ""}`}
          >
            {p}
          </p>
        ))}
      </div>

      {era.pullquote && (
        <blockquote className="my-8 border-l-[6px] border-basalt pl-5">
          <p className="font-display text-[19px] font-extrabold leading-[1.3] tracking-tight uppercase">
            “{era.pullquote.text}”
          </p>
          {era.pullquote.attribution && (
            <cite className="mt-2.5 block font-mono text-[10px] uppercase not-italic tracking-[0.16em] text-umber">
              — {era.pullquote.attribution}
            </cite>
          )}
        </blockquote>
      )}

      {events.length > 0 && (
        <div className="mt-9">
          <h3 className="eyebrow text-umber">Turning points</h3>
          <ol className="mt-4 space-y-6">
            {events.map((ev, i) => (
              <EventItem key={`${ev.year}-${i}`} event={ev} sourceIndex={sourceIndex} code={code} />
            ))}
          </ol>
        </div>
      )}

      <MeanwhileElsewhere
        code={code}
        startYear={era.startYear}
        endYear={era.endYear}
        eraTitle={era.title}
      />

      {era.figures && era.figures.length > 0 && (
        <div className="mt-9">
          <h3 className="eyebrow text-umber">Figures of the era</h3>
          <div className="mt-4 space-y-5">
            {era.figures.map((f) => (
              <FigureItem key={f.name} figure={f} sourceIndex={sourceIndex} />
            ))}
          </div>
        </div>
      )}

      {era.sources.length > 0 && (
        <p className="mt-8 font-mono text-[10px] leading-relaxed text-umber">
          <span className="uppercase tracking-[0.16em]">Bed sources: </span>
          {era.sources.map((id, i) => {
            const s = sources.find((x) => x.id === id);
            if (!s) return null;
            return (
              <span key={id}>
                {i > 0 && ", "}
                <a href={`#ref-${id}`} className="text-oxide underline underline-offset-2">
                  {s.label}
                </a>
              </span>
            );
          })}
        </p>
      )}
    </section>
  );
}

/**
 * The stumble-and-stay mechanic: while this era was unfolding here, these
 * things were happening elsewhere. Server-rendered, so it is both a reader's
 * sideways door and a real internal link between 184 chronicles that were
 * previously connected only through the timeline and theme hubs.
 */
function MeanwhileElsewhere({
  code,
  startYear,
  endYear,
  eraTitle,
}: {
  code: string;
  startYear: number;
  endYear: number;
  eraTitle: string;
}) {
  const events = meanwhileElsewhere(code, startYear, endYear, 4);
  if (events.length < 2) return null;

  return (
    <aside className="mt-10 border-t-2 border-basalt pt-5">
      <h4 className="eyebrow text-umber">
        Meanwhile elsewhere
        <span className="sr-only"> — during {eraTitle}</span>
      </h4>
      <ul className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {events.map((e) => {
          const cat = CATEGORY_META[e.category];
          return (
            <li key={`${e.code}-${e.year}-${e.title}`}>
              <Link
                href={`${routes.chronicle(e.code)}`}
                prefetch={false}
                className="group block"
              >
                {/* One line, no wrap: some yearLabels are long ("c. 57 BCE –
                    1st century CE"), and letting them wrap pushed the nation
                    onto a second row and truncated it to nonsense. The year
                    keeps its full width; the nation truncates if it must. */}
                <span className="flex items-baseline gap-2 overflow-hidden font-mono text-[10px] uppercase tracking-[0.1em] text-umber">
                  <span
                    aria-hidden
                    className="h-[7px] w-[7px] flex-none translate-y-[-1px]"
                    style={{ background: cat?.tint }}
                  />
                  <span className="flex-none tabular-nums">{e.yearLabel}</span>
                  <span aria-hidden className="flex-none">·</span>
                  <span className="min-w-0 truncate">{e.nation}</span>
                </span>
                <span className="mt-1 block font-sans text-[14.5px] font-medium leading-snug">
                  {e.title}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function EventItem({
  event,
  sourceIndex,
  code,
}: {
  event: TimelineEvent;
  sourceIndex: Map<string, number>;
  code: string;
}) {
  const cat = CATEGORY_META[event.category];
  // The return leg of the dossier ↔ chronicle link. Only categories with an
  // honest destination get one (lib/annotations): an economic event opens GDP,
  // a war opens military spending. A religion or culture event has no indicator
  // that speaks to it, and inventing a link would be worse than offering none.
  const dataLink = metricLinkFor(code, event.category);
  return (
    <li className="grid grid-cols-[4.6rem_1fr] gap-x-4 sm:grid-cols-[6rem_1fr] sm:gap-x-6">
      <div className="pt-[3px]">
        <span className="block font-mono text-[13px] font-medium tabular-nums text-oxide">
          {event.yearLabel ?? formatYear(event.year)}
        </span>
        {event.yearLabel && event.yearLabel !== String(event.year) && event.year > 0 && (
          <span className="mt-0.5 block font-mono text-[9.5px] tabular-nums text-umber">
            {formatYear(event.year)}
          </span>
        )}
        <span
          className="mt-1.5 block font-mono text-[9.5px] uppercase leading-tight tracking-[0.12em]"
          style={{ color: cat?.ink }}
        >
          {cat?.label ?? event.category}
        </span>
      </div>
      <div className="border-l-2 border-basalt pl-4 sm:pl-6">
        <h4 className="font-sans text-[15.5px] font-bold leading-snug">{event.title}</h4>
        <p className="mt-1.5 font-sans text-[14.5px] leading-[1.62]">{event.summary}</p>
        {dataLink && (
          <Link
            href={dataLink.href}
            prefetch={false}
            className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-oxide"
          >
            <span aria-hidden>↗</span>
            {dataLink.label}
          </Link>
        )}
        {event.sources.length > 0 && (
          <p className="mt-2 font-mono text-[10px] text-umber">
            {event.sources.map((id, i) => {
              const num = sourceIndex.get(id);
              if (!num) return null;
              return (
                <span key={id}>
                  {i > 0 && " "}
                  <a
                    href={`#ref-${id}`}
                    className="px-1 py-0.5 text-oxide"
                    aria-label={`Reference ${num}`}
                  >
                    [{num}]
                  </a>
                </span>
              );
            })}
          </p>
        )}
      </div>
    </li>
  );
}

/**
 * `level` exists because this component is rendered under two different
 * parents: inside an era (below an <h3> "Figures of the era", so <h4> is
 * right) and inside the standalone Pivotal Figures gallery (directly below an
 * <h2>, where <h4> skipped a level). Hardcoding <h4> made the second case fail
 * the heading-order check, which is the whole of the chronicle's accessibility
 * deduction — a screen-reader user navigating by heading level lost a rung.
 */
function FigureItem({
  figure,
  sourceIndex,
  level = 4,
}: {
  figure: Figure;
  sourceIndex: Map<string, number>;
  level?: 3 | 4;
}) {
  const Heading = level === 3 ? "h3" : "h4";
  return (
    <div className="border-l-2 border-basalt pl-4 sm:pl-6">
      <Heading className="font-sans text-[15.5px] font-bold leading-snug">
        {figure.name}
        {figure.life && (
          <span className="ml-2 font-mono text-[10.5px] font-normal text-umber">
            {figure.life}
          </span>
        )}
      </Heading>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-oxide">
        {figure.role}
      </p>
      <p className="mt-2 font-sans text-[14.5px] leading-[1.62]">{figure.blurb}</p>
      {figure.sources && figure.sources.length > 0 && (
        <p className="mt-1.5 font-mono text-[10px] text-umber">
          {figure.sources.map((id, i) => {
            const num = sourceIndex.get(id);
            if (!num) return null;
            return (
              <span key={id}>
                {i > 0 && " "}
                <a href={`#ref-${id}`} className="text-oxide">
                  [{num}]
                </a>
              </span>
            );
          })}
        </p>
      )}
    </div>
  );
}

function FigureGallery({
  figures,
  sourceIndex,
}: {
  figures: Figure[];
  sourceIndex: Map<string, number>;
}) {
  return (
    <section className="relative border-t-2 border-basalt py-10">
      <span aria-hidden className="mount-tick">
        <span>FIGURES</span>
      </span>
      <h2 className="font-display text-[24px] font-extrabold uppercase leading-tight tracking-tight md:text-[30px]">
        Pivotal figures
      </h2>
      <div className="mt-6 space-y-6">
        {figures.map((f) => (
          <FigureItem key={f.name} figure={f} sourceIndex={sourceIndex} level={3} />
        ))}
      </div>
    </section>
  );
}

function References({ sources }: { sources: Source[] }) {
  return (
    <section id="references" className="relative scroll-mt-6 border-t-2 border-basalt py-10">
      <span aria-hidden className="mount-tick">
        <span>REFS 01–{String(sources.length).padStart(2, "0")}</span>
      </span>
      <h2 className="font-display text-[24px] font-extrabold uppercase leading-tight tracking-tight md:text-[30px]">
        References
      </h2>
      <p className="mt-2.5 font-sans text-[14.5px] leading-relaxed text-umber">
        Every claim in this chronicle traces to one of the {sources.length} references below.
      </p>
      <ol className="mt-6 space-y-3.5">
        {sources.map((s, i) => (
          <li
            key={s.id}
            id={`ref-${s.id}`}
            className="scroll-mt-6 grid grid-cols-[2rem_1fr] gap-x-2 text-[0.95rem]"
          >
            <span className="pt-[2px] font-mono text-[11.5px] tabular-nums text-oxide">
              [{i + 1}]
            </span>
            <div>
              <cite className="font-sans not-italic">
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-oxide underline underline-offset-2"
                  >
                    {s.label}
                  </a>
                ) : (
                  s.label
                )}
              </cite>
              {s.publisher && (
                <span className="ml-1.5 font-mono text-[10.5px] text-umber">
                  · {s.publisher}
                </span>
              )}
              <span className="ml-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-umber">
                {s.kind}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ChronicleFooter({
  history,
  meta,
  neighbours,
  periods,
  themes,
}: {
  history: CountryHistory;
  meta: NonNullable<ReturnType<typeof getCountry>>;
  neighbours: NonNullable<ReturnType<typeof getCountry>>[];
  periods: { slug: string; label: string }[];
  themes: { slug: string; label: string }[];
}) {
  return (
    <footer className="border-t-2 border-basalt pt-8">
      <div className="flex flex-wrap gap-3">
        <Link
          href={routes.dossier(meta.code)}
          prefetch={false}
          className="pressable inline-flex items-center gap-2 border-2 border-basalt bg-basalt px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-bone"
        >
          The data dossier →
        </Link>
        <Link
          href={routes.atlas()}
          prefetch={false}
          className="pressable inline-flex items-center gap-2 border-2 border-basalt px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-oxide"
        >
          The section cut
        </Link>
      </div>

      {/* The same events, read across every nation instead of one. */}
      <nav aria-label="Read across nations" className="mt-10">
        <h2 className="eyebrow text-umber">Read across nations</h2>
        <ul className="mt-3.5 flex flex-wrap gap-2.5">
          {periods.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/timeline/${p.slug}`}
                prefetch={false}
                className="pressable inline-flex items-center border-2 border-basalt px-3.5 py-1.5 font-sans text-[13px]"
              >
                {p.label}
              </Link>
            </li>
          ))}
          {themes.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/themes/${t.slug}`}
                prefetch={false}
                className="pressable inline-flex items-center border-2 border-basalt px-3.5 py-1.5 font-sans text-[13px]"
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {neighbours.length > 0 && (
        <nav aria-label="Neighbouring chronicles" className="mt-10">
          <h2 className="eyebrow text-umber">Neighbouring chronicles</h2>
          <ul className="mt-3.5 flex flex-wrap gap-2.5">
            {neighbours.map((nb) => (
              <li key={nb.code}>
                <Link
                  href={routes.chronicle(nb.code)}
                  prefetch={false}
                  className="pressable inline-flex items-center gap-1.5 border-2 border-basalt px-3.5 py-1.5 font-sans text-[13px]"
                >
                  {nb.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <p className="mt-10 font-mono text-[10px] leading-relaxed text-umber">
        The chronicle of {meta.name} · {SITE_NAME} · last verified{" "}
        <time dateTime={history.updated}>{formatDate(history.updated)}</time>. Terralore publishes a
        nation&rsquo;s chapters only once each claim can be traced to a reliable source.
      </p>
    </footer>
  );
}

/* ── helpers ──────────────────────────────────────────────────────────────── */

/** Top-level figures, plus any era figures not already listed there. */
function collectFigures(history: CountryHistory): Figure[] {
  const top = history.figures ?? [];
  const seen = new Set(top.map((f) => f.name));
  const extra: Figure[] = [];
  for (const era of history.eras) {
    for (const f of era.figures ?? []) {
      if (!seen.has(f.name)) {
        seen.add(f.name);
        extra.push(f);
      }
    }
  }
  return [...top, ...extra];
}

function formatYear(y: number): string {
  return y < 0 ? `${Math.abs(y)} BCE` : String(y);
}

/** Group events by a [slug, label] key and return the keys, densest first. */
function rankBy(
  events: TimelineEvent[],
  key: (ev: TimelineEvent) => [string, string],
): { slug: string; label: string }[] {
  const counts = new Map<string, { slug: string; label: string; n: number }>();
  for (const ev of events) {
    const [slug, label] = key(ev);
    const hit = counts.get(slug);
    if (hit) hit.n += 1;
    else counts.set(slug, { slug, label, n: 1 });
  }
  return [...counts.values()].sort((a, b) => b.n - a.n).map(({ slug, label }) => ({ slug, label }));
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
