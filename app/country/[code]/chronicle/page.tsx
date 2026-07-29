import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCountry, allCodes } from "@/lib/countries";
import { getHistory, hasHistory } from "@/lib/histories";
import JsonLd from "@/components/JsonLd";
import { breadcrumbLd, chronicleDescription, chronicleLd, routes, SITE_NAME } from "@/lib/seo";
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
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: ogTitle,
      description,
      url: path,
      modifiedTime: history.updated,
      siteName: SITE_NAME,
    },
    twitter: { card: "summary_large_image", title: ogTitle, description },
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

      <main className="paper-grain min-h-screen bg-land-0 text-ink">
        <div className="relative z-[1] mx-auto max-w-[46rem] px-5 pb-24 pt-8 md:px-8 md:pt-12">
          <Breadcrumb meta={meta} />

          <Masthead history={history} meta={meta} eventCount={eventCount} />

          <Contents eras={history.eras} />

          <article>
            {history.eras.map((era, i) => (
              <EraSection
                key={era.id}
                era={era}
                n={i + 1}
                first={i === 0}
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
    <nav aria-label="Breadcrumb" className="eyebrow text-ink-3">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href="/" className="transition-colors hover:text-copper-deep">
            Terralore
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link href="/atlas" className="transition-colors hover:text-copper-deep">
            Atlas
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link
            href={routes.dossier(meta.code)}
            className="transition-colors hover:text-copper-deep"
          >
            {meta.name}
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="text-copper-deep">
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
    <header className="mt-9 border-b border-[rgba(138, 74, 40,0.22)] pb-10">
      <p className="eyebrow flex items-center gap-2 text-copper-deep">
        {meta.flag && <span className="text-base leading-none">{meta.flag}</span>}
        <span>
          {meta.subregion ?? meta.region} · {meta.continent}
        </span>
      </p>

      <h1 className="mt-4 font-display text-[clamp(2.9rem,9vw,4.6rem)] font-[380] leading-[0.94] tracking-[-0.015em] text-[#16201e]">
        {meta.name}
      </h1>

      <p className="mt-4 font-serif text-[clamp(1.15rem,3.4vw,1.45rem)] font-[340] italic leading-[1.45] text-[#454f4c]">
        {history.tagline}
      </p>

      <p className="mt-7 font-serif text-[1.18rem] leading-[1.66] text-[#16201e]">
        {history.summary}
      </p>

      {/* The headline "became a country" moment, pulled out as a standing fact. */}
      <div className="mt-8 border-l-2 border-copper/50 bg-[rgba(200, 114, 68,0.07)] px-5 py-4">
        <p className="eyebrow text-copper-deep">{history.founding.label}</p>
        <p className="mt-1.5 font-display text-[1.7rem] font-[420] leading-tight text-[#16201e]">
          {history.founding.yearLabel}
        </p>
        <p className="mt-2 font-serif text-[1.02rem] leading-[1.6] text-[#454f4c]">
          {history.founding.detail}
        </p>
      </div>

      {history.quickFacts.length > 0 && (
        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          {history.quickFacts.map((f) => (
            <div key={f.label}>
              <dt className="eyebrow text-ink-3">{f.label}</dt>
              <dd className="mt-1 font-sans text-[0.97rem] font-medium text-[#16201e]">
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <p className="mt-8 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-ink-3">
        {history.eras.length} eras · {eventCount} sourced events ·{" "}
        {history.sources.length} references · last verified{" "}
        <time dateTime={history.updated}>{formatDate(history.updated)}</time>
      </p>

      <div className="mt-7 flex flex-wrap gap-3">
        <Link
          href={routes.journey(meta.code)}
          className="inline-flex items-center gap-2 rounded-[3px] bg-[#16201e] px-5 py-2.5 font-sans text-[0.9rem] font-medium text-land-0 transition-colors hover:bg-[#16201e]"
        >
          ▶ Experience the time-journey
        </Link>
        <Link
          href={routes.dossier(meta.code)}
          className="inline-flex items-center gap-2 rounded-[3px] border border-[rgba(138, 74, 40,0.35)] px-5 py-2.5 font-sans text-[0.9rem] text-[#8a4a28] transition-colors hover:bg-[rgba(200, 114, 68,0.1)]"
        >
          The data dossier
        </Link>
      </div>
    </header>
  );
}

function Contents({ eras }: { eras: Era[] }) {
  return (
    <nav aria-label="Chapters" className="mt-10 border-b border-[rgba(138, 74, 40,0.22)] pb-9">
      <h2 className="eyebrow text-ink-3">Chapters</h2>
      <ol className="mt-4 space-y-2.5">
        {eras.map((era, i) => (
          <li key={era.id} className="flex gap-3.5">
            <span className="mt-[3px] w-6 shrink-0 font-mono text-[0.72rem] text-copper-deep">
              {String(i + 1).padStart(2, "0")}
            </span>
            <a
              href={`#${era.id}`}
              className="group flex-1 border-b border-transparent transition-colors hover:border-[rgba(138, 74, 40,0.3)]"
            >
              <span className="font-display text-[1.12rem] font-[420] text-[#16201e] transition-colors group-hover:text-copper-deep">
                {era.title}
              </span>
              <span className="ml-2 font-mono text-[0.7rem] text-ink-3">{era.period}</span>
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
  first,
  sources,
  sourceIndex,
  code,
}: {
  era: Era;
  n: number;
  first: boolean;
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
    <section id={era.id} className="scroll-mt-6 py-11">
      {/* The stratum rule opens each chapter — the signature device, tinted by
          what the era was mostly made of. It replaces an anonymous hairline
          border with something that carries information. */}
      {!first && (
        <span
          aria-hidden
          className="stratum-rule mb-10 block"
          style={{ ["--stratum-tint" as string]: dominant }}
        />
      )}
      <p className="eyebrow text-copper-deep">
        Chapter {String(n).padStart(2, "0")} · {era.period}
      </p>

      <h2 className="mt-3 font-display text-[clamp(1.9rem,5.5vw,2.7rem)] font-[400] leading-[1.04] tracking-[-0.01em] text-[#16201e]">
        {era.title}
      </h2>

      <p className="mt-4 font-serif text-[1.18rem] font-[340] italic leading-[1.5] text-[#454f4c]">
        {era.standfirst}
      </p>

      <div className="mt-6">
        {body.map((p, i) => (
          <p
            key={i}
            className={`font-serif text-[1.13rem] leading-[1.7] text-[#16201e] ${
              i > 0 ? "mt-[1.1em]" : ""
            } ${first && i === 0 ? "dropcap" : ""}`}
          >
            {p}
          </p>
        ))}
      </div>

      {era.pullquote && (
        <blockquote className="my-9 border-l-2 border-copper/50 pl-6">
          <p className="font-display text-[1.42rem] font-[380] leading-[1.32] text-[#8a4a28]">
            “{era.pullquote.text}”
          </p>
          {era.pullquote.attribution && (
            <cite className="mt-2.5 block font-mono text-[0.7rem] uppercase not-italic tracking-[0.16em] text-ink-3">
              — {era.pullquote.attribution}
            </cite>
          )}
        </blockquote>
      )}

      {events.length > 0 && (
        <div className="mt-9">
          <h3 className="eyebrow text-ink-3">Turning points</h3>
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
          <h3 className="eyebrow text-ink-3">Figures of the era</h3>
          <div className="mt-4 space-y-5">
            {era.figures.map((f) => (
              <FigureItem key={f.name} figure={f} sourceIndex={sourceIndex} />
            ))}
          </div>
        </div>
      )}

      {era.sources.length > 0 && (
        <p className="mt-8 font-mono text-[0.68rem] leading-relaxed text-ink-3">
          <span className="uppercase tracking-[0.16em]">Chapter sources: </span>
          {era.sources.map((id, i) => {
            const s = sources.find((x) => x.id === id);
            if (!s) return null;
            return (
              <span key={id}>
                {i > 0 && ", "}
                <a href={`#ref-${id}`} className="underline decoration-dotted hover:text-copper-deep">
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
    <aside className="mt-10 border-t border-[rgba(138,74,40,0.18)] pt-6">
      <h4 className="eyebrow text-ink-3">
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
                <span className="flex items-baseline gap-2 overflow-hidden font-mono text-[0.68rem] uppercase tracking-[0.1em] text-ink-3">
                  <span
                    aria-hidden
                    className="h-[7px] w-[7px] flex-none translate-y-[-1px] rounded-full"
                    style={{ background: cat?.tint }}
                  />
                  <span className="flex-none tabular-nums">{e.yearLabel}</span>
                  <span aria-hidden className="flex-none">·</span>
                  <span className="min-w-0 truncate">
                    {e.flag ? `${e.flag} ` : ""}
                    {e.nation}
                  </span>
                </span>
                <span className="mt-1 block font-display text-[1.02rem] font-[440] leading-snug text-[#16201e] transition-colors group-hover:text-copper-deep">
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
        <span className="block font-mono text-[0.82rem] font-medium tabular-nums text-copper-deep">
          {event.yearLabel ?? formatYear(event.year)}
        </span>
        <span
          className="mt-1.5 block font-mono text-[0.6rem] uppercase leading-tight tracking-[0.12em] text-ink-3"
          style={{ color: cat?.ink }}
        >
          {cat?.label ?? event.category}
        </span>
      </div>
      <div className="border-l border-[rgba(138, 74, 40,0.22)] pl-4 sm:pl-6">
        <h4 className="font-display text-[1.14rem] font-[440] leading-snug text-[#16201e]">
          {event.title}
        </h4>
        <p className="mt-1.5 font-serif text-[1.03rem] leading-[1.62] text-[#16201e]">
          {event.summary}
        </p>
        {dataLink && (
          <Link
            href={dataLink.href}
            prefetch={false}
            className="mt-2 inline-flex items-center gap-1.5 font-mono text-[0.66rem] uppercase tracking-[0.12em] text-ink-3 transition-colors hover:text-copper-deep"
          >
            <span aria-hidden>↗</span>
            {dataLink.label}
          </Link>
        )}
        {event.sources.length > 0 && (
          <p className="mt-2 font-mono text-[0.66rem] text-ink-3">
            {event.sources.map((id, i) => {
              const num = sourceIndex.get(id);
              if (!num) return null;
              return (
                <span key={id}>
                  {i > 0 && " "}
                  <a
                    href={`#ref-${id}`}
                    className="rounded-sm px-1 py-0.5 text-copper-deep transition-colors hover:bg-[rgba(200, 114, 68,0.16)]"
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
    <div className="border-l border-[rgba(138, 74, 40,0.22)] pl-4 sm:pl-6">
      <Heading className="font-display text-[1.12rem] font-[440] leading-snug text-[#16201e]">
        {figure.name}
        {figure.life && (
          <span className="ml-2 font-mono text-[0.7rem] font-normal text-ink-3">
            {figure.life}
          </span>
        )}
      </Heading>
      <p className="mt-0.5 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-copper-deep">
        {figure.role}
      </p>
      <p className="mt-2 font-serif text-[1.02rem] leading-[1.62] text-[#16201e]">{figure.blurb}</p>
      {figure.sources && figure.sources.length > 0 && (
        <p className="mt-1.5 font-mono text-[0.66rem] text-ink-3">
          {figure.sources.map((id, i) => {
            const num = sourceIndex.get(id);
            if (!num) return null;
            return (
              <span key={id}>
                {i > 0 && " "}
                <a href={`#ref-${id}`} className="text-copper-deep hover:underline">
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
    <section className="border-b border-[rgba(138, 74, 40,0.22)] py-11">
      <h2 className="font-display text-[clamp(1.7rem,4.5vw,2.2rem)] font-[400] leading-tight text-[#16201e]">
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
    <section id="references" className="scroll-mt-6 border-b border-[rgba(138, 74, 40,0.22)] py-11">
      <h2 className="font-display text-[clamp(1.7rem,4.5vw,2.2rem)] font-[400] leading-tight text-[#16201e]">
        References
      </h2>
      <p className="mt-2.5 font-serif text-[1.02rem] italic leading-relaxed text-[#454f4c]">
        Every claim in this chronicle traces to one of the {sources.length} references below.
      </p>
      <ol className="mt-6 space-y-3.5">
        {sources.map((s, i) => (
          <li
            key={s.id}
            id={`ref-${s.id}`}
            className="scroll-mt-6 grid grid-cols-[2rem_1fr] gap-x-2 text-[0.95rem]"
          >
            <span className="pt-[2px] font-mono text-[0.74rem] tabular-nums text-copper-deep">
              [{i + 1}]
            </span>
            <div>
              <cite className="font-sans not-italic text-[#16201e]">
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-[rgba(138, 74, 40,0.35)] underline-offset-2 transition-colors hover:text-copper-deep"
                  >
                    {s.label}
                  </a>
                ) : (
                  s.label
                )}
              </cite>
              {s.publisher && (
                <span className="ml-1.5 font-mono text-[0.7rem] text-ink-3">
                  · {s.publisher}
                </span>
              )}
              <span className="ml-1.5 font-mono text-[0.64rem] uppercase tracking-[0.12em] text-ink-3">
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
    <footer className="pt-11">
      <div className="flex flex-wrap gap-3">
        <Link
          href={routes.journey(meta.code)}
          prefetch={false}
          className="inline-flex items-center gap-2 rounded-[3px] bg-[#16201e] px-5 py-2.5 font-sans text-[0.9rem] font-medium text-land-0 transition-colors hover:bg-[#16201e]"
        >
          ▶ Experience {meta.name} as a time-journey
        </Link>
        <Link
          href={routes.atlas()}
          prefetch={false}
          className="inline-flex items-center gap-2 rounded-[3px] border border-[rgba(138, 74, 40,0.35)] px-5 py-2.5 font-sans text-[0.9rem] text-[#8a4a28] transition-colors hover:bg-[rgba(200, 114, 68,0.1)]"
        >
          Browse the atlas
        </Link>
      </div>

      {/* The same events, read across every nation instead of one. */}
      <nav aria-label="Read across nations" className="mt-10">
        <h2 className="eyebrow text-ink-3">Read across nations</h2>
        <ul className="mt-3.5 flex flex-wrap gap-2.5">
          {periods.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/timeline/${p.slug}`}
                prefetch={false}
                className="inline-flex items-center rounded-[3px] border border-[rgba(138, 74, 40,0.28)] px-3.5 py-1.5 font-sans text-[0.86rem] text-[#454f4c] transition-colors hover:bg-[rgba(200, 114, 68,0.12)]"
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
                className="inline-flex items-center rounded-[3px] border border-[rgba(138, 74, 40,0.28)] px-3.5 py-1.5 font-sans text-[0.86rem] text-[#454f4c] transition-colors hover:bg-[rgba(200, 114, 68,0.12)]"
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {neighbours.length > 0 && (
        <nav aria-label="Neighbouring chronicles" className="mt-10">
          <h2 className="eyebrow text-ink-3">Neighbouring chronicles</h2>
          <ul className="mt-3.5 flex flex-wrap gap-2.5">
            {neighbours.map((nb) => (
              <li key={nb.code}>
                <Link
                  href={routes.chronicle(nb.code)}
                  prefetch={false}
                  className="inline-flex items-center gap-1.5 rounded-[3px] border border-[rgba(138, 74, 40,0.28)] px-3.5 py-1.5 font-sans text-[0.86rem] text-[#454f4c] transition-colors hover:bg-[rgba(200, 114, 68,0.12)]"
                >
                  {nb.flag && <span aria-hidden="true">{nb.flag}</span>}
                  {nb.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <p className="mt-11 font-mono text-[0.68rem] leading-relaxed text-ink-3">
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
