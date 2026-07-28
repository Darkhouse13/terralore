import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCountry, allCodes } from "@/lib/countries";
import { getHistory, hasHistory } from "@/lib/histories";
import JsonLd from "@/components/JsonLd";
import { breadcrumbLd, chronicleLd, routes, SITE_NAME } from "@/lib/seo";
import { periodFor, themeSlug } from "@/lib/chronology";
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
  const description = history.summary;

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

      <main className="paper-grain min-h-screen bg-parchment text-ink">
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
    <nav aria-label="Breadcrumb" className="eyebrow text-ink-faint">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href="/" className="transition-colors hover:text-brass-deep">
            Terralore
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link href="/atlas" className="transition-colors hover:text-brass-deep">
            Atlas
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link
            href={routes.dossier(meta.code)}
            className="transition-colors hover:text-brass-deep"
          >
            {meta.name}
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="text-brass-deep">
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
    <header className="mt-9 border-b border-[rgba(120,90,40,0.22)] pb-10">
      <p className="eyebrow flex items-center gap-2 text-brass-deep">
        {meta.flag && <span className="text-base leading-none">{meta.flag}</span>}
        <span>
          {meta.subregion ?? meta.region} · {meta.continent}
        </span>
      </p>

      <h1 className="mt-4 font-display text-[clamp(2.9rem,9vw,4.6rem)] font-[380] leading-[0.94] tracking-[-0.015em] text-[#221a0e]">
        {meta.name}
      </h1>

      <p className="mt-4 font-serif text-[clamp(1.15rem,3.4vw,1.45rem)] font-[340] italic leading-[1.45] text-[#6a5836]">
        {history.tagline}
      </p>

      <p className="mt-7 font-serif text-[1.18rem] leading-[1.66] text-[#3a2f1d]">
        {history.summary}
      </p>

      {/* The headline "became a country" moment, pulled out as a standing fact. */}
      <div className="mt-8 border-l-2 border-brass/50 bg-[rgba(191,149,80,0.07)] px-5 py-4">
        <p className="eyebrow text-brass-deep">{history.founding.label}</p>
        <p className="mt-1.5 font-display text-[1.7rem] font-[420] leading-tight text-[#221a0e]">
          {history.founding.yearLabel}
        </p>
        <p className="mt-2 font-serif text-[1.02rem] leading-[1.6] text-[#4a3f2c]">
          {history.founding.detail}
        </p>
      </div>

      {history.quickFacts.length > 0 && (
        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          {history.quickFacts.map((f) => (
            <div key={f.label}>
              <dt className="eyebrow text-ink-faint">{f.label}</dt>
              <dd className="mt-1 font-sans text-[0.97rem] font-medium text-[#2c2519]">
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <p className="mt-8 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-ink-faint">
        {history.eras.length} eras · {eventCount} sourced events ·{" "}
        {history.sources.length} references · last verified{" "}
        <time dateTime={history.updated}>{formatDate(history.updated)}</time>
      </p>

      <div className="mt-7 flex flex-wrap gap-3">
        <Link
          href={routes.journey(meta.code)}
          className="inline-flex items-center gap-2 rounded-full bg-[#221a0e] px-5 py-2.5 font-sans text-[0.9rem] font-medium text-parchment transition-colors hover:bg-[#3a2f1d]"
        >
          ▶ Experience the time-journey
        </Link>
        <Link
          href={routes.dossier(meta.code)}
          className="inline-flex items-center gap-2 rounded-full border border-[rgba(120,90,40,0.35)] px-5 py-2.5 font-sans text-[0.9rem] text-[#5c4a28] transition-colors hover:bg-[rgba(191,149,80,0.1)]"
        >
          The data dossier
        </Link>
      </div>
    </header>
  );
}

function Contents({ eras }: { eras: Era[] }) {
  return (
    <nav aria-label="Chapters" className="mt-10 border-b border-[rgba(120,90,40,0.22)] pb-9">
      <h2 className="eyebrow text-ink-faint">Chapters</h2>
      <ol className="mt-4 space-y-2.5">
        {eras.map((era, i) => (
          <li key={era.id} className="flex gap-3.5">
            <span className="mt-[3px] w-6 shrink-0 font-mono text-[0.72rem] text-brass-deep">
              {String(i + 1).padStart(2, "0")}
            </span>
            <a
              href={`#${era.id}`}
              className="group flex-1 border-b border-transparent transition-colors hover:border-[rgba(120,90,40,0.3)]"
            >
              <span className="font-display text-[1.12rem] font-[420] text-[#2c2519] transition-colors group-hover:text-brass-deep">
                {era.title}
              </span>
              <span className="ml-2 font-mono text-[0.7rem] text-ink-faint">{era.period}</span>
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
}: {
  era: Era;
  n: number;
  first: boolean;
  sources: Source[];
  sourceIndex: Map<string, number>;
}) {
  const body = era.body ?? [];
  const events = [...era.events].sort((a, b) => a.year - b.year);

  return (
    <section id={era.id} className="scroll-mt-6 border-b border-[rgba(120,90,40,0.22)] py-11">
      <p className="eyebrow text-brass-deep">
        Chapter {String(n).padStart(2, "0")} · {era.period}
      </p>

      <h2 className="mt-3 font-display text-[clamp(1.9rem,5.5vw,2.7rem)] font-[400] leading-[1.04] tracking-[-0.01em] text-[#221a0e]">
        {era.title}
      </h2>

      <p className="mt-4 font-serif text-[1.18rem] font-[340] italic leading-[1.5] text-[#6a5836]">
        {era.standfirst}
      </p>

      <div className="mt-6">
        {body.map((p, i) => (
          <p
            key={i}
            className={`font-serif text-[1.13rem] leading-[1.7] text-[#3a2f1d] ${
              i > 0 ? "mt-[1.1em]" : ""
            } ${first && i === 0 ? "dropcap" : ""}`}
          >
            {p}
          </p>
        ))}
      </div>

      {era.pullquote && (
        <blockquote className="my-9 border-l-2 border-brass/50 pl-6">
          <p className="font-display text-[1.42rem] font-[380] leading-[1.32] text-[#4a3a1c]">
            “{era.pullquote.text}”
          </p>
          {era.pullquote.attribution && (
            <cite className="mt-2.5 block font-mono text-[0.7rem] uppercase not-italic tracking-[0.16em] text-ink-faint">
              — {era.pullquote.attribution}
            </cite>
          )}
        </blockquote>
      )}

      {events.length > 0 && (
        <div className="mt-9">
          <h3 className="eyebrow text-ink-faint">Turning points</h3>
          <ol className="mt-4 space-y-6">
            {events.map((ev, i) => (
              <EventItem key={`${ev.year}-${i}`} event={ev} sourceIndex={sourceIndex} />
            ))}
          </ol>
        </div>
      )}

      {era.figures && era.figures.length > 0 && (
        <div className="mt-9">
          <h3 className="eyebrow text-ink-faint">Figures of the era</h3>
          <div className="mt-4 space-y-5">
            {era.figures.map((f) => (
              <FigureItem key={f.name} figure={f} sourceIndex={sourceIndex} />
            ))}
          </div>
        </div>
      )}

      {era.sources.length > 0 && (
        <p className="mt-8 font-mono text-[0.68rem] leading-relaxed text-ink-faint">
          <span className="uppercase tracking-[0.16em]">Chapter sources: </span>
          {era.sources.map((id, i) => {
            const s = sources.find((x) => x.id === id);
            if (!s) return null;
            return (
              <span key={id}>
                {i > 0 && ", "}
                <a href={`#ref-${id}`} className="underline decoration-dotted hover:text-brass-deep">
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

function EventItem({
  event,
  sourceIndex,
}: {
  event: TimelineEvent;
  sourceIndex: Map<string, number>;
}) {
  const cat = CATEGORY_META[event.category];
  return (
    <li className="grid grid-cols-[4.6rem_1fr] gap-x-4 sm:grid-cols-[6rem_1fr] sm:gap-x-6">
      <div className="pt-[3px]">
        <span className="block font-mono text-[0.82rem] font-medium tabular-nums text-brass-deep">
          {event.yearLabel ?? formatYear(event.year)}
        </span>
        <span
          className="mt-1.5 block font-mono text-[0.6rem] uppercase leading-tight tracking-[0.12em] text-ink-faint"
          style={{ color: cat?.tint }}
        >
          {cat?.label ?? event.category}
        </span>
      </div>
      <div className="border-l border-[rgba(120,90,40,0.22)] pl-4 sm:pl-6">
        <h4 className="font-display text-[1.14rem] font-[440] leading-snug text-[#221a0e]">
          {event.title}
        </h4>
        <p className="mt-1.5 font-serif text-[1.03rem] leading-[1.62] text-[#3a2f1d]">
          {event.summary}
        </p>
        {event.sources.length > 0 && (
          <p className="mt-2 font-mono text-[0.66rem] text-ink-faint">
            {event.sources.map((id, i) => {
              const num = sourceIndex.get(id);
              if (!num) return null;
              return (
                <span key={id}>
                  {i > 0 && " "}
                  <a
                    href={`#ref-${id}`}
                    className="rounded-sm px-1 py-0.5 text-brass-deep transition-colors hover:bg-[rgba(191,149,80,0.16)]"
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

function FigureItem({
  figure,
  sourceIndex,
}: {
  figure: Figure;
  sourceIndex: Map<string, number>;
}) {
  return (
    <div className="border-l border-[rgba(120,90,40,0.22)] pl-4 sm:pl-6">
      <h4 className="font-display text-[1.12rem] font-[440] leading-snug text-[#221a0e]">
        {figure.name}
        {figure.life && (
          <span className="ml-2 font-mono text-[0.7rem] font-normal text-ink-faint">
            {figure.life}
          </span>
        )}
      </h4>
      <p className="mt-0.5 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-brass-deep">
        {figure.role}
      </p>
      <p className="mt-2 font-serif text-[1.02rem] leading-[1.62] text-[#3a2f1d]">{figure.blurb}</p>
      {figure.sources && figure.sources.length > 0 && (
        <p className="mt-1.5 font-mono text-[0.66rem] text-ink-faint">
          {figure.sources.map((id, i) => {
            const num = sourceIndex.get(id);
            if (!num) return null;
            return (
              <span key={id}>
                {i > 0 && " "}
                <a href={`#ref-${id}`} className="text-brass-deep hover:underline">
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
    <section className="border-b border-[rgba(120,90,40,0.22)] py-11">
      <h2 className="font-display text-[clamp(1.7rem,4.5vw,2.2rem)] font-[400] leading-tight text-[#221a0e]">
        Pivotal figures
      </h2>
      <div className="mt-6 space-y-6">
        {figures.map((f) => (
          <FigureItem key={f.name} figure={f} sourceIndex={sourceIndex} />
        ))}
      </div>
    </section>
  );
}

function References({ sources }: { sources: Source[] }) {
  return (
    <section id="references" className="scroll-mt-6 border-b border-[rgba(120,90,40,0.22)] py-11">
      <h2 className="font-display text-[clamp(1.7rem,4.5vw,2.2rem)] font-[400] leading-tight text-[#221a0e]">
        References
      </h2>
      <p className="mt-2.5 font-serif text-[1.02rem] italic leading-relaxed text-[#6a5836]">
        Every claim in this chronicle traces to one of the {sources.length} references below.
      </p>
      <ol className="mt-6 space-y-3.5">
        {sources.map((s, i) => (
          <li
            key={s.id}
            id={`ref-${s.id}`}
            className="scroll-mt-6 grid grid-cols-[2rem_1fr] gap-x-2 text-[0.95rem]"
          >
            <span className="pt-[2px] font-mono text-[0.74rem] tabular-nums text-brass-deep">
              [{i + 1}]
            </span>
            <div>
              <cite className="font-sans not-italic text-[#2c2519]">
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-[rgba(120,90,40,0.35)] underline-offset-2 transition-colors hover:text-brass-deep"
                  >
                    {s.label}
                  </a>
                ) : (
                  s.label
                )}
              </cite>
              {s.publisher && (
                <span className="ml-1.5 font-mono text-[0.7rem] text-ink-faint">
                  · {s.publisher}
                </span>
              )}
              <span className="ml-1.5 font-mono text-[0.64rem] uppercase tracking-[0.12em] text-ink-faint">
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
          className="inline-flex items-center gap-2 rounded-full bg-[#221a0e] px-5 py-2.5 font-sans text-[0.9rem] font-medium text-parchment transition-colors hover:bg-[#3a2f1d]"
        >
          ▶ Experience {meta.name} as a time-journey
        </Link>
        <Link
          href={routes.atlas()}
          className="inline-flex items-center gap-2 rounded-full border border-[rgba(120,90,40,0.35)] px-5 py-2.5 font-sans text-[0.9rem] text-[#5c4a28] transition-colors hover:bg-[rgba(191,149,80,0.1)]"
        >
          Browse the atlas
        </Link>
      </div>

      {/* The same events, read across every nation instead of one. */}
      <nav aria-label="Read across nations" className="mt-10">
        <h2 className="eyebrow text-ink-faint">Read across nations</h2>
        <ul className="mt-3.5 flex flex-wrap gap-2.5">
          {periods.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/timeline/${p.slug}`}
                className="inline-flex items-center rounded-full border border-[rgba(120,90,40,0.28)] px-3.5 py-1.5 font-sans text-[0.86rem] text-[#4a3f2c] transition-colors hover:bg-[rgba(191,149,80,0.12)]"
              >
                {p.label}
              </Link>
            </li>
          ))}
          {themes.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/themes/${t.slug}`}
                className="inline-flex items-center rounded-full border border-[rgba(120,90,40,0.28)] px-3.5 py-1.5 font-sans text-[0.86rem] text-[#4a3f2c] transition-colors hover:bg-[rgba(191,149,80,0.12)]"
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {neighbours.length > 0 && (
        <nav aria-label="Neighbouring chronicles" className="mt-10">
          <h2 className="eyebrow text-ink-faint">Neighbouring chronicles</h2>
          <ul className="mt-3.5 flex flex-wrap gap-2.5">
            {neighbours.map((nb) => (
              <li key={nb.code}>
                <Link
                  href={routes.chronicle(nb.code)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(120,90,40,0.28)] px-3.5 py-1.5 font-sans text-[0.86rem] text-[#4a3f2c] transition-colors hover:bg-[rgba(191,149,80,0.12)]"
                >
                  {nb.flag && <span aria-hidden="true">{nb.flag}</span>}
                  {nb.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <p className="mt-11 font-mono text-[0.68rem] leading-relaxed text-ink-faint">
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
