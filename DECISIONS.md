# Decisions

Decisions that closed off an alternative worth considering. Each records what was
chosen, what was rejected, and why — so a later reader can reopen the question with
the original reasoning in hand rather than guessing at it.

---

## D1 — Write the page audit before doing any of the work it would verify

**Chosen:** build `scripts/audit-pages.mjs` as the first task of the mission, ahead of
the redesign and the SEO work it exists to check.

**Rejected:** build it in Phase D alongside the SEO fixes, which is where the mission
brief lists it.

**Why:** an audit written after the fix is a description of the fix. Written first, it
is a measurement — and it immediately paid for itself by finding 184 duplicate meta
descriptions and ~370 over-length ones on a site that built cleanly and had no
validator errors. Those defects were invisible to every check that existed. It also
means the redesign has a mechanical regression net under it from the start: if a new
layout drops an `<h1>` or breaks a canonical on 400 pages, the audit says so in three
seconds.

**Cost:** the Phase D checklist item was done out of order, and the errors it found sat
visible-but-unfixed through Phase A. Logged in `PROGRESS.md` rather than silently
carried.

---

## D2 — Delete `GlobeScene.tsx` rather than keep it as a reference

**Chosen:** `git rm components/GlobeScene.tsx` and uninstall `three`, `@types/three`,
`react-globe.gl`.

**Rejected:** keep the file (excluded from the build) as documentation of the retired
three.js implementation — which is explicitly why `CLAUDE.md` said it was being kept.

**Why:** the reference argument is real but git already serves it, and better: the file
at `f2b1445` is the working implementation with its full history, not a copy that
silently rots as the types around it change. Meanwhile the cost of keeping it was not
zero — it held three dependencies (~450 KB of `three` alone) in the lockfile and the
Docker image, and it was a live re-import hazard: any agent grepping for "globe" found
a plausible-looking component that would have dragged WebGL back into the landing
chunk. The architecture note in `CLAUDE.md` explains the design; the code does not need
to sit in the tree to do that.

**Reversal:** `git show f2b1445:components/GlobeScene.tsx`.

---

## D3 — Report missing data as a gap, never as an imputed value

**Chosen (pre-existing, reaffirmed):** a metric with no source renders "—", and the
dossier footer says so in prose.

**Rejected:** interpolate from neighbouring years, or estimate from regional peers, to
avoid visible holes in the grid.

**Why:** this is the same rule the history corpus obeys — every claim traceable to a
named source — applied to the data side. An imputed figure is indistinguishable from a
sourced one once it is rendered in the same card, which would make the entire dossier
un-citable: a reader could no longer tell which numbers carry provenance. The visible
gap is the honest output, and for contested and non-UN states (which is where most of
the gaps are) it is also the neutral one.

This is why Phase E populates Taiwan from a *named* alternative publisher rather than
from estimates, why North Korea's economy domain was left empty rather than filled
from a figure that could not be re-derived (see D8), and why the remaining six
Overview-only codes get a designed empty state instead of filled-in numbers.

---

## D4 — STRATUM over CHANCERY and TRANSIT

**Chosen:** an identity built on bathymetric and hypsometric atlas convention — the
world drawn in discrete bands of depth.

**Rejected:** CHANCERY (treaty paper, wax seals, flag silk) and TRANSIT (observatory
optics, brass instruments, reticles). Full reasoning in `DESIGN.md`.

**Why:** the deciding question was *what does the globe become?* The globe is the
hero and states the thesis in the first second. CHANCERY was the strongest of the
three for the chronicle and had nothing to say about a sphere — wax seals and ribbon
do not wrap onto a globe — so it would have left the globe wearing its old clothes,
which is exactly the two-sites-stapled-together failure the whole pass exists to fix.
TRANSIT was the incumbent in a hat: cool near-black plus a warm metallic accent is
what the site already did.

STRATUM was the only direction where the visual language and the subject are the same
thing, and where the palette is the information architecture — the product already
publishes at three *depths*.

---

## D5 — Three semantic tints instead of one accent

**Chosen:** copper (*the surveyor's hand — you are here*), verdigris (*the measured*),
madder (*rupture only*), with the rule that a colour which cannot be justified by one
of those meanings is decoration and does not ship.

**Rejected:** keeping a single accent (as the brass build did) and letting hue variety
come from the category palette.

**Why:** one accent doing every job is why the old build's data visualisation had
nothing to work with — ranking bars, sparklines, the choropleth and the selection
state were all the same gold, so none of them meant anything. Making the tints
semantic immediately caught a real error the eye had accepted for months: the
dossier's rank bars were copper, which is to say every bar was wearing the selection
colour.

**Cost:** three tints is more to hold in your head than one, and it constrains future
additions. That constraint is the point.

---

## D6 — Contrast proven arithmetically, with a narrow `decor` exemption

**Chosen:** `scripts/check-contrast.mjs` declares every foreground/background pair
**with the role it plays** and fails under threshold. Roles: `body` ≥4.5, `large` ≥3,
`ui` ≥3, `decor` ≥1.25.

**Rejected:** checking contrast after the fact with an accessibility audit, and
alternatively holding *everything* to 3:1.

**Why:** an audit finds problems after a hundred components already depend on the
value. Declaring pairs up front found three genuine failures before a single component
was touched, and solved a constraint that is very hard by eye — the ten category
pigments must clear 3:1 against **both** grounds simultaneously, which confines them
to a narrow mid-dark luminance window. Four were solved numerically rather than
guessed.

The `decor` tier is the part worth defending. WCAG 1.4.11 covers graphics required to
understand content and visuals required to identify components and states. A rule
between two sections already distinguished by a heading is neither. Holding those to
3:1 makes an editorial page look like a spreadsheet. The discipline that keeps this
honest: anything carrying state — focus, selection, the active tab, the playhead — is
`ui`, and wanting to move something from `ui` to `decor` is the signal it was
load-bearing.

---

## D7 — Cross-talk as a table, not as curated pairs

**Chosen:** one table mapping each dossier domain to the event categories that can
plausibly move its indicators; every annotation derives from it.

**Rejected:** hand-curating notable (metric, event) pairs for major nations.

**Why:** curation would have produced better annotations for perhaps twenty countries
and nothing for the other 164, and it would rot — every history edit becomes a
curation task. The table produced 4,374 (metric, event) pairs across 152 of 183
nations with no per-nation work, and adding a domain or category changes one table.

**The cost, stated:** a derived rule is blunter than a curated one. It cannot know
that a 1997 crash matters more than a 1997 treaty. Mitigated by scoping annotations to
the metric's own series span, capping at four with an even spread, and — most
importantly — by wording that never claims causation. "In the archive during this
period", never "which caused this". The corpus asserts sourced events; the UI must not
assert more than the data does.

---

## D8 — Taiwan from the IMF; North Korea's economy left empty

**Chosen:** populate Taiwan from the IMF World Economic Outlook, capped at 2024.
Leave North Korea's economy domain empty and document why.

**Rejected:** filling North Korea's economy from Bank of Korea figures transcribed by
hand, or from any secondary aggregator republishing them.

**Why:** the WEO is a named, resolvable, queryable dataset, so Taiwan's figures are
reproducible — anyone can re-run the builder and get the same numbers. The Bank of
Korea's DPRK estimate is the genuine standard reference, but it is published as an
annual press release, which means the only way to get it into the repo is to type it
in. A hand-typed figure cannot be re-derived, cannot be refreshed by
`npm run refresh-domains`, and is indistinguishable on the page from one that can.
That is precisely the property (D3) says makes a dossier un-citable.

The 2024 cap matters as much as the source: WEO carries actuals, staff estimates and
projections in one continuous series with no flag distinguishing them, and the API
happily serves 2031. Publishing a projection as a current figure would have been a
fabrication introduced by a build script rather than by an author, which is worse, not
better.

---

## D9 — CShapes rejected on its license; existence shading built instead

**Chosen:** Phase 2 of the Time Globe shades today's borders by each nation's
*sourced founding year* — three states of existence (not yet / born this period /
existing), derived entirely from the corpus's own `founding` claims, with a
permanent caption ("today's borders · shaded by each nation's sourced founding
year") keeping the visualisation honest.

**Rejected:** ingesting CShapes 2.0 for true historical border geometries.

**Why:** the license gate, checked against the source before a byte was ingested.
The authors' page states verbatim: *"CShapes … is licensed under a Creative
Commons Attribution-NonCommercial-ShareAlike 4.0 International License."* NC
makes any future monetisation of the site a violation; SA would encumber every
derived border snapshot in the repo — precisely when the corpus should be heading
toward CC-BY publication as a citable dataset. The CRAN R package shows
`GPL-2 | GPL-3`, but that governs the package; relying on a licensing ambiguity
against the authors' explicit statement is a bet, not a decision.

**Also rejected:** crowd-compiled historical basemaps (provenance fails the
citation invariant) and hand-drawn borders (fabrication).

**What was gained by losing:** the replacement is arguably stronger. Historical
border geometries would have covered 1886–2019; the founding-year shading covers
the *whole* corpus span — the 10th millennium BCE renders an entirely unborn
world — uses only claims the archive already stands behind, and every shaded
state is one click from the sourced account of its becoming. The spectacle
(decolonisation sweeping Africa in copper through the 1960s) survived the
license failure intact.

**Reopening:** if the operator ever negotiates terms with the CShapes authors or
the site formalises non-commercial status, border geometry can layer *on top of*
existence shading; the two compose.

---

## D10 — Incomplete sovereignty is not sovereignty lost

**Chosen:** the `interruptions` field records only sovereignty that a state *had
and lost*. A polity that was never fully sovereign in the first place carries no
interruption; the limitation is described in `formation.detail` instead.

**Rejected:** treating every arrangement short of full sovereignty as an
interruption — which would have dimmed Canada, Australia, New Zealand and South
Africa from their federations until the Statute of Westminster, and Bhutan from
1910 to 2011.

**Why:** the field's grammar is loss and restoration. A dominion whose foreign
relations London held from the day it was created never lost anything; it had
not yet acquired it. Drawing that as "present but not sovereign" would make the
same mark mean two different things — Poland after 1795, which was erased, and
Australia in 1901, which was being assembled. Bhutan is the same shape from the
other direction: it was never colonised, and the Treaty of Punakha handed its
external affairs to an outside power while internal statehood continued
unbroken. The plan's §3.3 already excludes suzerainty that leaves internal
statehood intact; this extends the same reasoning to sovereignty that was
incomplete from the start.

**Cost, stated:** the globe shows Australia as fully limestone from 1901 and
Canada from 1867, which overstates their independence for two to six decades.
The detail on each block says so in words. The alternative overstated something
worse.

---

## D11 — An unrecognised annexation is judged by whether the state stopped

**Chosen:** Kuwait's annexation by Iraq (1990–91) is **not** an interruption.
Timor-Leste's by Indonesia (1975–2002) and the Baltic states' by the Soviet
Union (1940–91) **are**.

**Rejected:** a single rule keyed on international recognition, which would have
excluded all three; or one keyed on de-facto control, which would have included
all three.

**Why:** recognition alone is the wrong test, because it would erase fifty-one
years of Baltic history that most Western governments spent explicitly refusing
to recognise — the United States kept treating the Baltic legations as the
legitimate states throughout. De-facto control alone is also wrong, because it
would record a seven-month occupation that the Security Council declared null
and void and that ended with the same government restored.

What separates them is whether the state stopped functioning for long enough to
be a fact about the world rather than about a war. Kuwait's government continued
in exile and returned within the same conflict; Timor-Leste's did not exist for
twenty-four years and the territory had to be administered back into being by
the United Nations, and the country itself calls 20 May 2002 the *restoration*
of independence, as Estonia, Latvia and Lithuania call 1991.

**The visualisation makes this concrete rather than arbitrary.** The rail's
finest resolution is a decade. An interruption shorter than one cannot be drawn
at all, so recording Kuwait's would change no pixel while making a claim the
picture cannot support.

---

## D12 — Publish traditional founding dates with their status attached

**Chosen:** where a nation's own founding tradition is not what historians
accept, the `statehood` block carries the traditional date and says so in its
`detail`. Japan is anchored at 660 BCE with the note that most modern scholars
hold the founding of the imperial dynasty in that year to be a myth and Jimmu
legendary; San Marino at 301 with the note that the earliest evidence for a
community there is two centuries later; Burkina Faso at c. 1050 with the note
that oral tradition places the founding story anywhere between the eleventh and
fifteenth centuries; Norway at 872 with the note that historians dispute how
much of the country Harald actually held.

**Rejected:** silently substituting the scholarly date, and silently publishing
the traditional one.

**Why:** substituting would have contradicted `founding`, which is authored,
sourced and displayed on the dossier hero — the same nation would have carried
two different origin years with no explanation, which reads as a bug. Publishing
the traditional date bare would have made the corpus assert something its own
sources deny.

The corpus's standing rule is *describe, never adjudicate*, and it already
applies to contested sovereignty (Taiwan, Kosovo, Northern Cyprus, Somaliland).
A contested date is the same problem in a smaller frame. The block is the right
place for the caveat because it is where a reader meets the claim; a footnote
elsewhere would be a caveat nobody reads.
