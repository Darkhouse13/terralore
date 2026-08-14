import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { allRankings, getRanking, type Ranking } from "@/lib/rankings";
import { DOMAIN_META } from "@/lib/types";
import { formatMetric } from "@/lib/format";
import {
  breadcrumbLd,
  mdTwinTypes,
  rankingDescription,
  rankingLd,
  routes,
  SITE_NAME,
} from "@/lib/seo";

/**
 * One indicator, every nation with a published figure — highest to lowest.
 *
 * Server-rendered, no JavaScript: the whole table, every vintage and every
 * gap, is in the initial HTML — the chronicle discipline applied to data.
 * The proof-flip is CSS-only here (deviations E9): press a row and it turns
 * over to its observation label; PROOF VIEW is a native checkbox.
 *
 * The honesty rules this page carries (see lib/rankings.ts, which enforces
 * them at build):
 *
 *   · every row shows its own observation year, and a note above the table
 *     says plainly when years are mixed;
 *   · nations without data are listed apart, never ranked, never zero;
 *   · WGI metrics are described as the absolute 0–100 scores they are;
 *   · the language is highest/lowest — a high military burden or a low tax
 *     share is not a virtue or a vice on this site.
 */

export function generateStaticParams() {
  return allRankings().map((r) => ({ slug: r.slug }));
}

/**
 * How the unit reads in prose above the table. Units whose formatted values
 * are not self-describing (a bare "42.1") get the fuller phrase; `ratio` is
 * deliberately absent — the definition sentence carries its meaning
 * (births per woman, tonnes per person).
 */
const UNIT_PHRASE: Record<string, string> = {
  USD: "current US dollars",
  "%": "percent",
  "% of GDP": "shares of GDP",
  "% gross":
    "gross enrolment ratios — repeaters and over-age pupils can push a figure above 100%",
  years: "years",
  people: "people",
  "km²": "square kilometres",
  tonnes: "tonnes of mine production",
  score: "absolute scores on a 0–100 scale",
  "per 1,000": "per 1,000 people",
  "per 1,000 births": "per 1,000 live births",
  "per 100": "per 100 people",
  "per million": "per million people",
};

const isWgi = (r: Ranking) => r.sources.some((s) => s.id === "wb-wgi");

// The sediment walk: rank 1 is the deepest pigment, then upward through the
// beds; everything below the podium is clay. Decoration over text that
// carries the real figures (house rule).
const barColor = (rank: number) =>
  rank === 1
    ? "var(--color-basalt)"
    : rank === 2
      ? "var(--color-umber)"
      : rank === 3
        ? "var(--color-oxide)"
        : "var(--color-clay)";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const r = getRanking(slug);
  if (!r) return { title: `Unknown ranking — ${SITE_NAME}` };

  const path = routes.ranking(r.slug);
  const description = rankingDescription(r);
  const lower = r.label.toLowerCase();
  return {
    title: `${r.label} by nation — world ranking`,
    description,
    keywords: [
      `${lower} by country`,
      `${lower} ranking`,
      `countries ranked by ${lower}`,
      `highest ${lower}`,
      ...r.sources.map((s) => s.publisher),
    ],
    alternates: { canonical: path, types: mdTwinTypes(path) },
    // The social card comes from this segment's own opengraph-image.tsx.
    openGraph: {
      type: "website",
      title: `${r.label} by nation — world ranking`,
      description,
      url: path,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: `${r.label} by nation — world ranking`,
      description,
    },
  };
}

export default async function RankingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const r = getRanking(slug);
  if (!r) notFound();

  const domainLabel = DOMAIN_META[r.domain].label;
  const siblings = allRankings().filter((x) => x.domain === r.domain);
  const idx = allRankings().findIndex((x) => x.slug === r.slug) + 1;
  const total = allRankings().length;
  const mixed = r.years != null && r.years.min !== r.years.max;
  const unitPhrase = UNIT_PHRASE[r.unit];
  const max = r.rows[0]?.value ?? 0;
  const srcLine = r.sources
    .map((s) => `${s.id.toUpperCase()} — ${s.publisher}`)
    .join(" · ");

  return (
    <>
      <JsonLd
        data={[
          rankingLd(r),
          breadcrumbLd([
            { name: SITE_NAME, path: routes.home() },
            { name: "Rankings", path: routes.rankings() },
            { name: r.label, path: routes.ranking(r.slug) },
          ]),
        ]}
      />
      <main className="min-h-screen bg-bone">
        {/* ≥1024px: THE WALL + THE READOUT LEDGE (P4 §3) inside the 1760px
            frame. Two columns at 1024, three from 1280 with the ledge as the
            sticky right rail (P4 E5). */}
        <div className="mx-auto max-w-4xl px-5 pt-4 pb-16 lg:max-w-[1760px] lg:px-10">
          <nav aria-label="Breadcrumb" className="font-mono text-[10px] tracking-[0.16em] uppercase">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href={routes.rankings()} className="text-oxide">
                  ← Rankings
                </Link>
              </li>
              <li aria-hidden="true" className="text-oxide">
                ·
              </li>
              <li className="text-oxide">{domainLabel}</li>
              <li aria-hidden="true" className="text-oxide">
                ·
              </li>
              <li aria-current="page" className="text-umber">
                {idx}/{total}
              </li>
            </ol>
          </nav>

          <header className="settle relative mt-3 pb-4 lg:grid lg:grid-cols-[460px_minmax(0,1fr)] lg:items-end lg:gap-11 xl:grid-cols-[460px_minmax(0,1fr)_300px]">
            <div>
              <h1 className="max-w-[16ch] font-display text-[42px] leading-none font-extrabold tracking-tight uppercase md:text-[64px] lg:text-[56px]">
                {r.label}
              </h1>
              <p className="mt-3 font-mono text-[11px] text-oxide uppercase">
                {unitPhrase ?? r.unit}
                {r.years != null &&
                  ` · OBSERVED ${mixed ? `${r.years.min}–${r.years.max}` : r.years.min}`}
              </p>
              <p className="mt-2 max-w-2xl font-sans text-[14px] leading-relaxed text-umber">
                {r.definition}
              </p>

              <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                <Stat
                  label={r.isMineral ? "Producers listed" : "Nations ranked"}
                  value={String(r.rows.length)}
                />
                <Stat label="Highest" value={formatMetric(r.rows[0]?.value ?? null, r.unit)} />
                <Stat label="Lowest" value={formatMetric(r.rows.at(-1)?.value ?? null, r.unit)} />
                <Stat
                  label="Observed"
                  value={
                    r.years == null
                      ? "—"
                      : mixed
                        ? `${r.years.min}–${r.years.max}`
                        : String(r.years.min)
                  }
                />
              </dl>
            </div>

            {/* the whole distribution as one strip — the wall below is its
                full text (P4). Desktop apparatus; the caption carries the
                observation window and the source ids, per the chart law. */}
            <Strip r={r} />

            <p className="hidden pb-1.5 font-sans text-[12.5px] leading-normal text-umber xl:block">
              Press any row — its specimen turns over on the readout ledge. No bests, no
              worsts: observations, ranked.
            </p>
          </header>

          {mixed && (
            <p className="mb-4 max-w-2xl border-l-[6px] border-basalt pl-4 font-sans text-[13.5px] leading-relaxed text-umber">
              This table mixes vintages: each publisher carries a nation&rsquo;s latest
              available year, so the observations here run from {r.years!.min}{" "}to{" "}
              {r.years!.max}{" "}— every row shows its own.
            </p>
          )}

          {isWgi(r) && (
            <p className="mb-4 max-w-2xl border-l-[6px] border-basalt pl-4 font-sans text-[13.5px] leading-relaxed text-umber">
              These are the Worldwide Governance Indicators&rsquo;{" "}
              <strong className="text-basalt">absolute 0–100 scores</strong> — anchored to
              two hypothetical benchmark performers, not percentile ranks — and they
              aggregate perception surveys and expert assessments: model estimates of what
              is perceived, not direct measurements. The ranking order below is computed by
              this atlas from those scores.
            </p>
          )}

          {r.isMineral && (
            <p className="mb-4 max-w-2xl border-l-[6px] border-basalt pl-4 font-sans text-[13.5px] leading-relaxed text-umber">
              The USGS names only the producers it lists; a nation absent here is not
              recorded as producing none — any output elsewhere sits inside the published
              world total. For each producer&rsquo;s share of world production, and the
              honest &ldquo;Rest of world&rdquo; remainder,{" "}
              <Link
                href={routes.commodity(r.commoditySlug!)}
                prefetch={false}
                className="font-medium text-oxide underline underline-offset-2"
              >
                see the commodity page
              </Link>
              .
            </p>
          )}

          {/* ── the table: every row a specimen. At width, THE WALL — rows in
              honest columns joined by the 2px rule — with THE READOUT LEDGE
              beside it: the press lands the specimen on the ledge instead of
              tearing the wall (its island is inline and vanilla, E13's
              precedent; without JavaScript the wall stands alone and rows
              keep their CSS flip). ── */}
          <div id="wallscope">
            <input type="checkbox" id="proofview" className="proof-toggle peer sr-only" />
            <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start xl:gap-x-7">
              <aside
                id="ledge"
                aria-label="The readout ledge"
                className="ledge-root lg:mb-5 lg:max-w-[420px] xl:sticky xl:top-5 xl:col-start-2 xl:row-start-1 xl:mb-0 xl:max-w-none"
              >
                <div className="font-mono text-[10px] tracking-[0.16em] text-umber">
                  THE READOUT LEDGE
                </div>
                <div className="mt-2.5 [perspective:900px]">
                  <div data-ledge-card className="flip-card h-[190px]">
                    <div className="flip-face flex flex-col justify-center gap-2 border-2 border-basalt p-[18px]">
                      <div className="font-display text-[18px] font-extrabold tracking-tight uppercase">
                        No specimen on the ledge
                      </div>
                      <div className="font-sans text-[13px] leading-normal text-umber">
                        Press any row on the wall. Its specimen lands here and turns over
                        to its label — year and source.
                      </div>
                    </div>
                    <div className="flip-face flip-back flex flex-col justify-center gap-[7px] p-[18px]">
                      <div className="font-mono text-[10px] tracking-[0.14em] text-clay">
                        RANK <span data-l-rank /> · SPECIMEN
                      </div>
                      <div
                        data-l-name
                        className="font-display text-[22px] leading-tight font-extrabold tracking-tight uppercase"
                      />
                      <div className="font-mono text-[15px]">
                        <span data-l-value />{" "}
                        <span className="text-[10px] text-clay">
                          OBSERVED <span data-l-year />
                        </span>
                      </div>
                      <div className="font-mono text-[10px] tracking-[0.06em] uppercase">
                        {srcLine}
                      </div>
                      <a
                        data-l-link
                        href="#"
                        className="font-sans text-[11.5px] underline underline-offset-2"
                        style={{ color: "var(--color-clay)" }}
                      >
                        Open the dossier →
                      </a>
                    </div>
                  </div>
                </div>
                <div aria-live="polite" data-l-announce className="sr-only" />
                <p className="mt-3.5 font-sans text-[12px] leading-relaxed text-umber">
                  The strip above the wall is the whole distribution — the wall below is
                  its full text. Nothing is truncated to a &ldquo;top 10&rdquo;.
                </p>
              </aside>

              <div className="xl:col-start-1 xl:row-start-1">
                <div className="flex items-baseline justify-between">
                  <p className="font-sans text-[13px] text-umber">
                    Press a row — the specimen turns over to its label. Bars are drawn to
                    the highest value. Highest, not best: this page orders figures, it
                    does not grade nations.
                  </p>
                  <label
                    htmlFor="proofview"
                    className="pressable flex-none py-1 pl-3 font-mono text-[10px] tracking-[0.08em] text-oxide select-none"
                  >
                    <span className="proof-off">PROOF VIEW ⟲</span>
                    <span className="proof-on">CLOSE PROOFS ⟲</span>
                  </label>
                </div>

                <ol id="wall" className="wall mt-3 border-t-2 border-basalt">
                  {r.rows.map((row) => {
                    const width =
                      max > 0 && row.value > 0 ? Math.max((row.value / max) * 100, 0.4) : 0;
                    // Decade rows render un-contained on the phone (the
                    // containment shifts a bar by a pixel) — the shipped
                    // phone rendering is the contract here.
                    const isDecade = row.rank % 10 === 1;
                    return (
                      <li
                        key={row.code}
                        data-wall-row
                        data-rank={String(row.rank).padStart(2, "0")}
                        data-name={row.name}
                        data-value={formatMetric(row.value, r.unit)}
                        data-year={row.year ?? "—"}
                        className={`${isDecade ? "" : "cv-row "}relative border-b-2 border-basalt lg:border-b-0`}
                      >
                        <div className="flip-scene flip-press">
                          <div className="flip-card h-[62px] lg:h-[40px]">
                            <div className="flip-face pt-[11px] lg:flex lg:items-center lg:pt-0">
                              <div className="flex items-baseline justify-between gap-3 font-mono text-[12.5px] lg:flex-1 lg:justify-start">
                                <div className="min-w-0 truncate uppercase">
                                  <span className="text-oxide">
                                    {String(row.rank).padStart(2, "0")}
                                  </span>{" "}
                                  <Link
                                    href={`/country/${row.code}#m=${r.key}&tab=${r.domain}`}
                                    prefetch={false}
                                    className="text-basalt"
                                  >
                                    {row.name}
                                  </Link>
                                </div>
                                <span
                                  aria-hidden
                                  className="hidden lg:block lg:min-w-3 lg:flex-1 lg:self-center lg:border-b-2 lg:border-dotted lg:border-absent"
                                />
                                <div className="flex-none">
                                  {formatMetric(row.value, r.unit)}{" "}
                                  <span className="pill">{row.year ?? "—"}</span>
                                </div>
                              </div>
                              {width > 0 && (
                                <div
                                  aria-hidden
                                  className="mt-[7px] h-[14px] lg:hidden"
                                  style={{ width: `${width}%`, background: barColor(row.rank) }}
                                />
                              )}
                              <span className="sr-only">
                                Observed {row.year ?? "year unknown"} ·{" "}
                                {r.sources.map((s) => s.publisher).join(", ")}
                              </span>
                            </div>
                            <div aria-hidden className="flip-face flip-back">
                              <div className="flex h-full flex-col justify-center gap-[3px] px-3 lg:gap-[2px]">
                                <div className="font-mono text-[10.5px] tracking-[0.08em] uppercase lg:truncate">
                                  OBSERVED {row.year ?? "—"} · {srcLine}
                                </div>
                                <div className="font-sans text-[11.5px] text-clay lg:truncate">
                                  rank {row.rank} of {r.rows.length}{" "}
                                  {r.isMineral ? "listed producers" : "ranked nations"} ·
                                  highest, not best
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </div>

          {/* ── the gaps, named — a gap has no underside ── */}
          {r.noData.length > 0 && (
            <section className="relative mt-8">
              <h2 className="font-display text-[20px] font-extrabold tracking-tight uppercase">
                Not observed
              </h2>
              <p className="mt-2 max-w-2xl font-sans text-[13.5px] leading-relaxed text-umber">
                {r.noData.length === 1
                  ? "One nation publishes"
                  : `${r.noData.length} nations publish`}{" "}
                no figure for this indicator in the sources below. Absence is a fact about
                the world&rsquo;s statistical apparatus, not a zero — these nations hold
                their place as hatched gaps, and a gap has no underside to turn over.
              </p>
              <ul className="mt-4 max-w-2xl border-t-2 border-basalt">
                {r.noData.map((n) => (
                  <li key={n.code} className="border-b-2 border-basalt py-2.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <Link
                        href={`/country/${n.code}`}
                        prefetch={false}
                        className="min-w-0 truncate font-mono text-[12.5px] text-basalt uppercase"
                      >
                        {n.name}
                      </Link>
                      <span className="not-observed flex-none text-[9.5px]">NOT OBSERVED</span>
                    </div>
                    {n.note && (
                      <p className="mt-1 font-sans text-[12.5px] leading-relaxed text-umber">
                        {n.note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── the domain's other rankings, for lateral movement ── */}
          <nav aria-label={`${domainLabel} rankings`} className="mt-10">
            <div className="eyebrow mb-3 text-umber">More in {domainLabel}</div>
            <ul className="flex flex-wrap gap-2">
              {siblings.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={routes.ranking(s.slug)}
                    prefetch={false}
                    aria-current={s.slug === r.slug ? "page" : undefined}
                    className={`pressable inline-block border-2 border-basalt px-3.5 py-1.5 font-sans text-[13px] ${
                      s.slug === r.slug ? "bg-basalt text-bone" : "text-basalt"
                    }`}
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <footer className="relative mt-10 border-t-2 border-basalt pt-5">
            <div className="eyebrow mb-3 text-umber">
              {r.sources.length === 1 ? "Source" : "Sources"}
            </div>
            {r.sources.map((s) => (
              <p key={s.id} className="font-sans text-[13.5px] leading-relaxed">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-oxide underline underline-offset-2"
                >
                  {s.label}
                </a>{" "}
                <span className="text-umber">
                  — {s.publisher} · {s.license} · accessed {s.accessed}.
                </span>
              </p>
            ))}
            <p className="mt-4 max-w-2xl font-sans text-xs leading-relaxed text-umber">
              Table assembled {r.updated}{" "}from each nation&rsquo;s latest published
              observation. The same figure, with the same source, sits on each
              nation&rsquo;s dossier
              {r.aliasKeys.length > 0 && (
                <>
                  {" "}— in its {domainLabel} tab and, identically, in its{" "}
                  {r.aliasKeys.map((a) => DOMAIN_META[a.domain].label).join(" and ")}{" "}
                  tab
                </>
              )}
              . Gaps render as absences, never as zeros.
            </p>
          </footer>
        </div>

        {/* the ledge island — vanilla, inline, this page only (the compare
            tray's precedent). Without it the wall is complete. */}
        <script dangerouslySetInnerHTML={{ __html: LEDGE_ISLAND }} />
      </main>
    </>
  );
}

/**
 * The whole distribution as one strip (P4): a bar per sampled rank, drawn to
 * the highest value, with the unobserved as hatched marks at the end. Desktop
 * apparatus for the wall header; the caption carries counts and the axis.
 */
function Strip({ r }: { r: Ranking }) {
  const max = r.rows[0]?.value ?? 0;
  if (!(max > 0)) return <div className="hidden lg:block" />;
  const step = Math.max(1, Math.ceil(r.rows.length / 86));
  const bars: number[] = [];
  for (let i = 0; i < r.rows.length; i += step) bars.push(Math.max(0, r.rows[i].value));
  const hatched = Math.min(6, r.noData.length);
  return (
    <div aria-hidden className="hidden pb-1 lg:block">
      <div className="flex h-[56px] items-end gap-[2px]">
        {bars.map((v, i) => (
          <div
            key={i}
            className="w-[4px] flex-none bg-basalt"
            style={{ height: `${Math.max(3, Math.round((v / max) * 52))}px` }}
          />
        ))}
        {Array.from({ length: hatched }, (_, i) => (
          <div
            key={`h${i}`}
            className="w-[4px] flex-none"
            style={{
              height: "52px",
              background:
                "repeating-linear-gradient(45deg, var(--color-absent) 0 2px, var(--color-bone) 2px 5px)",
            }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[9px] text-umber">
        <div>RANK 001</div>
        <div>
          THE WHOLE WALL · {r.rows.length} OBSERVED
          {r.noData.length > 0 && ` + ${r.noData.length} HATCHED`}
        </div>
        <div>{String(r.rows.length).padStart(3, "0")}</div>
      </div>
    </div>
  );
}

/* ── the readout ledge island (P4 §3) ───────────────────────────────────────
   Enhancement only, ≥1024px: rows become buttons whose press lands the
   specimen on the ledge with the 320ms flip (a new selection re-flips); the
   row's in-place flip stands down while the island is live. Keyboard: rows
   take focus, Enter/Space lands the specimen; the landing is announced
   politely. No JavaScript → none of this exists and the page is the wall. */
const LEDGE_ISLAND = `(function () {
  var mq = window.matchMedia("(min-width: 64rem)");
  var root = document.getElementById("ledge");
  var wall = document.getElementById("wall");
  var scope = document.getElementById("wallscope");
  if (!root || !wall || !scope) return;
  var card = root.querySelector("[data-ledge-card]");
  var out = {
    rank: root.querySelector("[data-l-rank]"),
    name: root.querySelector("[data-l-name]"),
    value: root.querySelector("[data-l-value]"),
    year: root.querySelector("[data-l-year]")
  };
  var link = root.querySelector("[data-l-link]");
  var announce = root.querySelector("[data-l-announce]");
  var rows = Array.prototype.slice.call(wall.querySelectorAll("[data-wall-row]"));
  var current = null, t = null, enhanced = false;

  function land(row) {
    if (current) current.removeAttribute("data-on-ledge");
    current = row;
    row.setAttribute("data-on-ledge", "1");
    out.rank.textContent = row.getAttribute("data-rank");
    out.name.textContent = row.getAttribute("data-name");
    out.value.textContent = row.getAttribute("data-value");
    out.year.textContent = row.getAttribute("data-year");
    var a = row.querySelector("a");
    if (a && link) link.href = a.getAttribute("href");
    // re-flip: return, then turn the new specimen over (30ms re-arm)
    card.removeAttribute("data-flipped");
    clearTimeout(t);
    t = setTimeout(function () { card.setAttribute("data-flipped", "true"); }, 30);
    announce.textContent = "On the ledge: rank " + row.getAttribute("data-rank") + ", " +
      row.getAttribute("data-name") + ", " + row.getAttribute("data-value") +
      ", observed " + row.getAttribute("data-year");
  }

  function enhance() {
    if (enhanced || !mq.matches) return;
    enhanced = true;
    root.setAttribute("data-live", "1");
    scope.classList.add("wall-live");
    rows.forEach(function (row) {
      var scene = row.querySelector(".flip-scene");
      var a = row.querySelector("a");
      if (a) a.tabIndex = -1;
      scene.tabIndex = 0;
      scene.setAttribute("role", "button");
      // no aria-label: the accessible name is the row's own visible text
      // (rank, nation, value, plus the sr-only observation line)
      scene.addEventListener("click", function (e) {
        if (e.target && e.target.closest && e.target.closest("a")) return;
        land(row);
      });
      scene.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); land(row); }
      });
    });
  }

  enhance();
  if (mq.addEventListener) mq.addEventListener("change", enhance);
})();`;

/* ── pieces ───────────────────────────────────────────────────────────────── */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow text-umber">{label}</dt>
      <dd className="mt-1 font-mono text-[19px] leading-none tabular-nums">{value}</dd>
    </div>
  );
}
