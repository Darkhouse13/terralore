import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import StrataPattern from "@/components/brand/StrataPattern";
import { allComparePages, compareTitle, type ComparePage } from "@/lib/compare";
import { getCountry } from "@/lib/countries";
import {
  breadcrumbLd,
  collectionLd,
  compareHubDescription,
  routes,
  siteOgImages,
  SITE_NAME,
} from "@/lib/seo";

/**
 * The compare hub — THE JUNCTION FINDER (deviations E13).
 *
 * 504 published pairs were an undifferentiated alphabetical scroll; the fix
 * is structure, not rows. The tray at the top takes two specimens and cuts
 * the junction (or says honestly that the set holds no cut for that pair);
 * below it the same rows, unchanged in anatomy, are browsable three ways:
 * BY NEIGHBOURHOOD (continent bed-headers walking the section cut's
 * palette), MOST ENTANGLED (crossed-events count, descending) and THE G20.
 *
 * The tray and the dig-to-filter are one small vanilla-JS island inlined on
 * this page only — enhancements, hidden until the script runs, so the page
 * without JavaScript is still the whole index. The view tabs are native
 * radios driven by CSS (the .proof-toggle pattern family, zero hydration).
 * The pair set itself stays committed data (data/compare-pairs.json), gated
 * and validated — this page assembles, it never decides membership.
 */

export function generateMetadata(): Metadata {
  const pages = allComparePages();
  const events = pages.reduce((n, p) => n + p.sharedEvents.length, 0);
  const description = compareHubDescription(pages.length, events);
  const title = "Compare — nations side by side";
  return {
    title,
    description,
    alternates: { canonical: routes.compare() },
    openGraph: {
      type: "website",
      title,
      description,
      url: routes.compare(),
      siteName: SITE_NAME,
      images: siteOgImages(),
    },
    twitter: { card: "summary_large_image", title, description, images: siteOgImages() },
  };
}

/* ── the beds of the neighbourhood view — the section cut's own walk ──────── */

const BEDS: { name: string; bg: string; title: string; sub: string }[] = [
  { name: "Africa", bg: "var(--color-sand)", title: "var(--color-basalt)", sub: "var(--color-umber)" },
  { name: "Asia", bg: "var(--color-clay)", title: "var(--color-basalt)", sub: "var(--color-basalt)" },
  { name: "Europe", bg: "var(--color-oxide)", title: "var(--color-bone)", sub: "var(--color-sand)" },
  { name: "North America", bg: "var(--color-umber)", title: "var(--color-bone)", sub: "var(--color-sand)" },
  { name: "South America", bg: "var(--color-umber-deep)", title: "var(--color-bone)", sub: "var(--color-sand)" },
  { name: "Oceania", bg: "var(--color-basalt)", title: "var(--color-bone)", sub: "var(--color-clay)" },
];
const CROSS = { name: "Between continents", bg: "var(--color-bone)", title: "var(--color-basalt)", sub: "var(--color-umber)" };

// The G20's nation members — same list as scripts/build-compare-pairs.mjs
// (the EU and AU seats are not nations). The tier field can't serve here:
// first-tier-wins means a G20 pair that is also a land border is tier 1.
const G20 = new Set("ARG AUS BRA CAN CHN DEU FRA GBR IDN IND ITA JPN KOR MEX RUS SAU TUR USA ZAF".split(" "));

const slugOf = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

function continentOf(page: ComparePage): string {
  const a = getCountry(page.a.code)?.continent;
  const b = getCountry(page.b.code)?.continent;
  return a && a === b ? a : CROSS.name;
}

export default function CompareHubPage() {
  const pages = [...allComparePages()].sort((x, y) =>
    compareTitle(x).localeCompare(compareTitle(y)),
  );
  const events = pages.reduce((n, p) => n + p.sharedEvents.length, 0);
  const nationCodes = new Set(pages.flatMap((p) => [p.a.code, p.b.code]));

  // BY NEIGHBOURHOOD: continent groups in the cut's order, cross-bed last.
  const byContinent = new Map<string, ComparePage[]>();
  for (const p of pages) {
    const k = continentOf(p);
    const list = byContinent.get(k);
    if (list) list.push(p);
    else byContinent.set(k, [p]);
  }
  const neighbourhoods = [...BEDS, CROSS]
    .map((bed) => ({ ...bed, items: byContinent.get(bed.name) ?? [] }))
    .filter((bed) => bed.items.length > 0);

  // MOST ENTANGLED: only pairs whose archives actually cross — the honest
  // number, already computed; the rest are stated as a count, not padded.
  const entangled = [...pages]
    .filter((p) => p.sharedEvents.length > 0)
    .sort(
      (x, y) =>
        y.sharedEvents.length - x.sharedEvents.length ||
        compareTitle(x).localeCompare(compareTitle(y)),
    );
  const untangled = pages.length - entangled.length;

  // THE G20: membership, not tier — see the note on G20 above.
  const g20 = pages.filter((p) => G20.has(p.a.code) && G20.has(p.b.code));

  // The island's working set: every nation in the pair set + every slug.
  const islandData = JSON.stringify({
    nations: [...nationCodes]
      .map((code) => [code, getCountry(code)?.name ?? code])
      .sort((a, b) => a[1].localeCompare(b[1])),
    pairs: pages.map((p) => p.slug),
  });

  return (
    <>
      <JsonLd
        data={[
          collectionLd({
            name: "Compare — nations side by side",
            description: compareHubDescription(pages.length, events),
            path: routes.compare(),
            items: pages.map((p) => ({ name: compareTitle(p), path: routes.comparePair(p.slug) })),
            total: pages.length,
          }),
          breadcrumbLd([
            { name: SITE_NAME, path: routes.home() },
            { name: "Compare", path: routes.compare() },
          ]),
        ]}
      />
      <main className="min-h-screen bg-bone">
        <div className="mount mx-auto max-w-5xl px-5 pt-4 pb-16">
          <span aria-hidden className="mount-rail" />
          <nav aria-label="Breadcrumb" className="font-mono text-[10px] tracking-[0.16em] uppercase">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="text-oxide">
                  ← Terralore
                </Link>
              </li>
              <li aria-hidden="true" className="text-oxide">
                ·
              </li>
              <li aria-current="page" className="text-umber">
                Compare
              </li>
            </ol>
          </nav>

          <header className="settle relative mt-3 pb-4">
            <span aria-hidden className="mount-tick">
              <span>
                THE JUNCTIONS
                <br />
                {pages.length} CUTS
              </span>
            </span>
            <p className="eyebrow text-umber">Side by side</p>
            <h1 className="mt-3 max-w-[16ch] font-display text-[42px] leading-none font-extrabold tracking-tight uppercase md:text-[64px]">
              Compared
            </h1>
            <p className="mt-3 font-mono text-[11px] text-oxide uppercase">
              {pages.length} pairs · {events.toLocaleString("en")} crossed events
            </p>
            <p className="mt-3 max-w-2xl font-sans text-[14px] leading-relaxed text-umber">
              {pages.length}{" "}
              pairs — every land-border neighbourhood, the G20, and
              a curated set of entangled histories. Each page sets two sourced
              records beside each other: the figures both nations publish, and
              the events each chronicle records of the other. Compared, never
              graded.
            </p>
            <StrataPattern seed="compare" className="mt-5" blocks={28} />

            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:max-w-[46rem]">
              <Stat label="Pairs" value={String(pages.length)} />
              <Stat label="Crossed events" value={events.toLocaleString("en")} />
              <Stat label="Nations" value={String(nationCodes.size)} />
            </dl>
          </header>

          {/* ── THE TRAY — slot two specimens, cut the junction ──
              An enhancement: hidden until the island below runs, so the
              no-JavaScript page is simply the whole index. */}
          <section data-js hidden aria-label="The tray" className="relative mt-4">
            <span aria-hidden className="mount-tick">
              <span>THE TRAY</span>
            </span>
            <div className="border-2 border-basalt">
              <div className="grid sm:grid-cols-2">
                <TraySlot slot="a" label="Specimen A" />
                <TraySlot slot="b" label="Specimen B" divide />
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t-2 border-basalt px-4 py-3">
                <button
                  type="button"
                  id="jcompare"
                  className="pressable border-2 border-basalt bg-basalt px-5 py-2.5 font-mono text-[11px] tracking-[0.1em] text-bone uppercase"
                >
                  Cut the junction →
                </button>
                <p id="jverdict" aria-live="polite" className="min-w-0 font-mono text-[10px] leading-relaxed tracking-[0.08em] text-umber uppercase"></p>
              </div>
              <p id="jcuts" hidden className="flex flex-wrap gap-x-4 gap-y-1.5 border-t-2 border-basalt px-4 py-3 font-mono text-[11px]"></p>
            </div>
          </section>

          {/* ── the browse views ── */}
          <section className="relative mt-8">
            {/* dig-to-filter — the same island; hidden without it */}
            <div data-js hidden className="mb-4 flex items-center justify-between border-2 border-basalt px-4 py-[11px] lg:max-w-[46rem]">
              <input
                id="jfilter"
                type="text"
                autoComplete="off"
                spellCheck={false}
                aria-label="Filter pairs by nation name or code"
                placeholder="Dig through the junctions — nation or code…"
                className="w-full bg-transparent font-sans text-[15px] text-basalt placeholder:text-umber focus:outline-none"
              />
              <span id="jcount" className="font-mono text-xs text-oxide" aria-hidden></span>
            </div>

            <input type="radio" name="jview" id="jv-nb" className="sr-only" defaultChecked />
            <input type="radio" name="jview" id="jv-me" className="sr-only" />
            <input type="radio" name="jview" id="jv-g20" className="sr-only" />

            <div className="jtabs flex flex-wrap gap-2 border-b-2 border-basalt pb-3">
              <label
                htmlFor="jv-nb"
                className="pressable cursor-pointer border-2 border-basalt px-3.5 py-1.5 font-mono text-[10px] tracking-[0.1em] text-basalt uppercase select-none"
              >
                By neighbourhood
              </label>
              <label
                htmlFor="jv-me"
                className="pressable cursor-pointer border-2 border-basalt px-3.5 py-1.5 font-mono text-[10px] tracking-[0.1em] text-basalt uppercase select-none"
              >
                Most entangled
              </label>
              <label
                htmlFor="jv-g20"
                className="pressable cursor-pointer border-2 border-basalt px-3.5 py-1.5 font-mono text-[10px] tracking-[0.1em] text-basalt uppercase select-none"
              >
                The G20
              </label>
            </div>

            {/* ── BY NEIGHBOURHOOD — continents as beds, junctions as seams ── */}
            <div className="jview jview-nb">
              <nav aria-label="Neighbourhoods" className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px]">
                {neighbourhoods.map((bed) => (
                  <a key={bed.name} href={`#j-${slugOf(bed.name)}`} className="text-oxide">
                    {bed.name.toUpperCase()} ↓
                  </a>
                ))}
              </nav>
              {neighbourhoods.map((bed) => (
                <section
                  key={bed.name}
                  id={`j-${slugOf(bed.name)}`}
                  data-pair-group
                  aria-labelledby={`jh-${slugOf(bed.name)}`}
                  className="relative mt-6 scroll-mt-4"
                >
                  <span aria-hidden className="mount-tick">
                    <span>{bed.name}</span>
                  </span>
                  <div
                    className="bed flex items-baseline justify-between gap-3 px-4 py-3"
                    style={{ background: bed.bg }}
                  >
                    <h2
                      id={`jh-${slugOf(bed.name)}`}
                      className="font-display text-[17px] font-extrabold tracking-tight uppercase md:text-[19px]"
                      style={{ color: bed.title }}
                    >
                      {bed.name}
                    </h2>
                    <span className="font-mono text-[10px]" style={{ color: bed.sub }}>
                      {bed.items.length} {bed.items.length === 1 ? "JUNCTION" : "JUNCTIONS"}
                    </span>
                  </div>
                  <ul className="grid gap-x-8 sm:grid-cols-2">
                    {bed.items.map((p) => (
                      <PairRow key={p.slug} p={p} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            {/* ── MOST ENTANGLED — crossed events, descending ── */}
            <div className="jview jview-me">
              <div data-pair-group className="relative mt-6">
                <span aria-hidden className="mount-tick">
                  <span>ENTANGLED · {entangled.length}</span>
                </span>
                <p className="max-w-2xl font-sans text-[13.5px] leading-relaxed text-umber">
                  {entangled.length}{" "}pairs whose sourced chronicles actually
                  cross, ordered by how often — the count is found in the
                  records, never written for this page. The other{" "}
                  {untangled}{" "}published pairs record no crossed event; they
                  are all in the neighbourhood view.
                </p>
                <ul className="mt-4 grid gap-x-8 border-t-2 border-basalt sm:grid-cols-2">
                  {entangled.map((p) => (
                    <PairRow key={p.slug} p={p} />
                  ))}
                </ul>
              </div>
            </div>

            {/* ── THE G20 — the tier as its own section ── */}
            <div className="jview jview-g20">
              <div data-pair-group className="relative mt-6">
                <span aria-hidden className="mount-tick">
                  <span>G20 · {g20.length}</span>
                </span>
                <p className="max-w-2xl font-sans text-[13.5px] leading-relaxed text-umber">
                  Every pair within the G20&rsquo;s nineteen nation members
                  (the EU and AU hold seats but are not nations) —{" "}
                  {g20.length}{" "}junctions, including the members that also
                  share a land border.
                </p>
                <ul className="mt-4 grid gap-x-8 border-t-2 border-basalt sm:grid-cols-2">
                  {g20.map((p) => (
                    <PairRow key={p.slug} p={p} />
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <footer className="relative mt-14 border-t-2 border-basalt pt-5">
            <span aria-hidden className="mount-tick">
              <span>THE SET</span>
            </span>
            <p className="max-w-2xl font-sans text-[13.5px] leading-relaxed text-umber">
              The pair set is derived, committed and validated — not generated on
              request: neighbour pairs from the atlas&rsquo;s border data,
              spot-checked against known boundary lists; a thin-content gate
              drops any pair whose two nations share too few published figures
              to compare honestly. Absences on any page render as
              &ldquo;—&rdquo;, never as zero.
            </p>
          </footer>
        </div>

        {/* the island's working set + the island itself (E13) */}
        <script id="junction-data" type="application/json" dangerouslySetInnerHTML={{ __html: islandData }} />
        <script dangerouslySetInnerHTML={{ __html: ISLAND }} />
      </main>
    </>
  );
}

/* ── pieces ───────────────────────────────────────────────────────────────── */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow text-umber">{label}</dt>
      <dd className="mt-1 font-mono text-[19px] leading-none tabular-nums">{value}</dd>
    </div>
  );
}

/** One junction row — anatomy unchanged from the shipped index. */
function PairRow({ p }: { p: ComparePage }) {
  const crossed = p.sharedEvents.length;
  return (
    <li
      data-pair-row
      data-n={`${p.a.name} ${p.b.name} ${p.a.code} ${p.b.code}`.toLowerCase()}
      className="border-b-2 border-basalt"
    >
      <Link href={routes.comparePair(p.slug)} prefetch={false} className="pressable block py-2.5">
        <span className="block font-sans text-[14px] font-medium leading-snug text-basalt">
          {compareTitle(p)}
        </span>
        <span className="mt-0.5 block font-mono text-[10.5px] tabular-nums text-umber">
          {p.bothCount} shared indicators
          {crossed > 0 && ` · ${crossed} crossed ${crossed === 1 ? "event" : "events"}`}
        </span>
      </Link>
    </li>
  );
}

function TraySlot({ slot, label, divide }: { slot: string; label: string; divide?: boolean }) {
  return (
    <div
      data-slot={slot}
      className={`relative px-4 py-3.5 ${divide ? "border-t-2 border-basalt sm:border-t-0 sm:border-l-2" : ""}`}
    >
      <div className="eyebrow text-umber">{label}</div>
      <input
        type="text"
        autoComplete="off"
        spellCheck={false}
        aria-label={`Dig for ${label.toLowerCase()} — name or code`}
        placeholder="Dig — name or code…"
        className="mt-2 w-full border-2 border-basalt bg-transparent px-3 py-2 font-sans text-[15px] text-basalt placeholder:text-umber focus:outline-none"
      />
      <div data-chip hidden className="mt-2 flex items-center justify-between gap-3 border-2 border-basalt bg-sand px-3 py-2">
        <span data-chip-name className="min-w-0 truncate font-sans text-[15px] font-medium text-basalt"></span>
        <span className="flex flex-none items-center gap-2.5">
          <span data-chip-code className="font-mono text-[11px] text-umber"></span>
          <button
            type="button"
            data-clear
            aria-label={`Remove ${label.toLowerCase()}`}
            className="pressable border-2 border-basalt px-2 py-0.5 font-mono text-[12px] text-basalt"
          >
            ×
          </button>
        </span>
      </div>
      <ul data-results hidden className="absolute inset-x-4 z-10 mt-1 border-2 border-basalt bg-bone"></ul>
    </div>
  );
}

/* ── the island — vanilla, inline, this page only (E13) ─────────────────────
   Enhances the tray and the filter; reveals every [data-js] block. No
   framework, no hydration, no listeners outside this page's own DOM. */
const ISLAND = `(function () {
  var dataEl = document.getElementById("junction-data");
  if (!dataEl) return;
  var data = JSON.parse(dataEl.textContent);
  var nameOf = {};
  data.nations.forEach(function (n) { nameOf[n[0]] = n[1]; });
  var pairSet = {};
  var adj = {};
  data.pairs.forEach(function (slug) {
    pairSet[slug] = true;
    var m = slug.split("-vs-");
    var a = m[0].toUpperCase(), b = m[1].toUpperCase();
    (adj[a] = adj[a] || []).push(b);
    (adj[b] = adj[b] || []).push(a);
  });
  var slugFor = function (a, b) {
    var s = [a, b].sort();
    return s[0].toLowerCase() + "-vs-" + s[1].toLowerCase();
  };

  // the enhanced controls exist only once the island does
  document.querySelectorAll("[data-js]").forEach(function (el) { el.hidden = false; });

  // ── the tray ──
  var verdict = document.getElementById("jverdict");
  var cutsEl = document.getElementById("jcuts");
  function say(msg) { verdict.textContent = msg; cutsEl.hidden = true; cutsEl.innerHTML = ""; }

  function makeSlot(root) {
    var input = root.querySelector("input");
    var results = root.querySelector("[data-results]");
    var chip = root.querySelector("[data-chip]");
    var state = { code: null };
    function close() { results.hidden = true; results.innerHTML = ""; }
    function select(code) {
      state.code = code;
      chip.querySelector("[data-chip-name]").textContent = nameOf[code];
      chip.querySelector("[data-chip-code]").textContent = code;
      chip.hidden = false;
      input.hidden = true;
      input.value = "";
      close();
      say("");
    }
    root.querySelector("[data-clear]").addEventListener("click", function () {
      state.code = null;
      chip.hidden = true;
      input.hidden = false;
      say("");
      input.focus();
    });
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      close();
      if (!q) return;
      var hits = data.nations.filter(function (n) {
        return n[1].toLowerCase().indexOf(q) >= 0 || n[0].toLowerCase().indexOf(q) === 0;
      }).slice(0, 8);
      if (!hits.length) {
        var li = document.createElement("li");
        li.className = "px-3 py-2 font-mono text-[10px] tracking-[0.08em] text-umber uppercase";
        li.textContent = "NOT IN THE PAIR SET";
        results.appendChild(li);
      }
      hits.forEach(function (n) {
        var li = document.createElement("li");
        li.className = "border-t-2 border-basalt first:border-t-0";
        var b = document.createElement("button");
        b.type = "button";
        b.className = "pressable flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left";
        var name = document.createElement("span");
        name.className = "font-sans text-[14px] font-medium text-basalt";
        name.textContent = n[1];
        var code = document.createElement("span");
        code.className = "font-mono text-[10px] text-umber";
        code.textContent = n[0] + " \\u00b7 " + (adj[n[0]] || []).length + " CUTS";
        b.appendChild(name);
        b.appendChild(code);
        b.addEventListener("click", function () { select(n[0]); });
        li.appendChild(b);
        results.appendChild(li);
      });
      results.hidden = false;
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") {
        var first = results.querySelector("button");
        if (first) { first.focus(); e.preventDefault(); }
      } else if (e.key === "Escape") close();
      else if (e.key === "Enter") {
        var only = results.querySelectorAll("button");
        if (only.length === 1) { e.preventDefault(); only[0].click(); }
      }
    });
    results.addEventListener("keydown", function (e) {
      var items = Array.prototype.slice.call(results.querySelectorAll("button"));
      var i = items.indexOf(document.activeElement);
      if (e.key === "ArrowDown" && i > -1 && i < items.length - 1) { items[i + 1].focus(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { (i > 0 ? items[i - 1] : input).focus(); e.preventDefault(); }
      else if (e.key === "Escape") { close(); input.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (!root.contains(e.target)) close();
    });
    return state;
  }

  var slotA = makeSlot(document.querySelector('[data-slot="a"]'));
  var slotB = makeSlot(document.querySelector('[data-slot="b"]'));

  document.getElementById("jcompare").addEventListener("click", function () {
    var a = slotA.code, b = slotB.code;
    if (!a || !b) { say("SLOT BOTH SPECIMENS FIRST"); return; }
    if (a === b) { say("ONE NATION CANNOT MEET ITSELF"); return; }
    var slug = slugFor(a, b);
    if (pairSet[slug]) { window.location.href = "/compare/" + slug; return; }
    var cuts = (adj[a] || []).slice().sort(function (x, y) {
      return nameOf[x].localeCompare(nameOf[y]);
    });
    say("NO JUNCTION CUT FOR " + nameOf[a].toUpperCase() + " \\u00d7 " + nameOf[b].toUpperCase() +
      " \\u2014 THE SET HOLDS " + cuts.length + " CUTS THROUGH " + nameOf[a].toUpperCase() + ":");
    cutsEl.innerHTML = "";
    cuts.forEach(function (c) {
      var link = document.createElement("a");
      link.href = "/compare/" + slugFor(a, c);
      link.className = "text-oxide";
      link.textContent = nameOf[c].toUpperCase();
      cutsEl.appendChild(link);
    });
    cutsEl.hidden = false;
  });

  // ── dig-to-filter — live-filters the visible rows in every view ──
  var filter = document.getElementById("jfilter");
  var count = document.getElementById("jcount");
  var rows = Array.prototype.slice.call(document.querySelectorAll("[data-pair-row]"));
  var groups = Array.prototype.slice.call(document.querySelectorAll("[data-pair-group]"));
  filter.addEventListener("input", function () {
    var q = filter.value.trim().toLowerCase();
    rows.forEach(function (row) {
      row.hidden = !!q && row.getAttribute("data-n").indexOf(q) < 0;
    });
    groups.forEach(function (g) {
      g.hidden = !g.querySelector("[data-pair-row]:not([hidden])");
    });
    count.textContent = q
      ? String(document.querySelectorAll(".jview-nb [data-pair-row]:not([hidden])").length)
      : "";
  });
})();`;
