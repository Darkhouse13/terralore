# Strata rebuild — deviations, extensions, and fusion decisions

The contract (`docs/design/p3-contract.html`) is law for tokens, type,
motion physics, absence marks, and taboos. This file logs (a) the
deviations the prototype itself recorded, (b) every extension made where
the contract is silent (desktop layouts, surfaces the prototype did not
cover), and (c) any collision between a contract taboo and an editorial
invariant — where the invariant wins by rule.

## A. Recorded in the prototype itself (inherited, binding)

1. The proof-flip keeps Folio's 320ms duration but takes Strata's mass
   curve `cubic-bezier(.32,.72,0,1)` and flips on the **X axis** — a
   specimen turned over on a table, not a page turned in a book. Its
   reverse is basalt, not vellum: the label is engraved on the stone.
2. Flip fires on **press**, returns on **release** (hold thresholds felt
   laggy).
3. Core pull: 0.5× resistance, 90px commit, 460ms extraction/return; the
   **header owns the gesture** so it never fights scroll.
4. "Proof view" (flip all) kept from Folio as an explicit control — it
   survived the fusion because it serves the same honesty rule.

## B. Extensions and translations (this rebuild)

- **E1 — Deep umber `#42301F` named as a token** (`--color-umber-deep`).
  The prototype uses it as secondary text on clay without naming it; it
  enters the token table as the eighth value because it is already in the
  contract's own pixels, not an invention.
- **E2 — Display face pinned to weight 800.** The contract renders
  Bricolage only at 800; the committed subset pins wght/wdth and keeps
  the opsz axis variable so browser optical sizing survives from 17px bed
  headers to the 96px desktop stamp.
- **E3 — Desktop scale.** The prototype is a 390–430px artifact. Desktop
  extends the type scale (§3 of DESIGN.md) and centers measured columns
  while beds stay full-bleed. Interaction physics are identical at every
  width — the proof-flip and press are not "mobile gestures".
- **E4 — Category pigments retained.** The ten event-category pigments
  (v1's mineral set: ochre, madder, indigo, verdigris…) are kept
  unchanged as data encoding on bone grounds. They are earth pigments
  already — recoloring them into the seven-pigment strata palette would
  collapse ten categories into seven and break the committed social/OG
  history. Fusion decision, not an oversight.
- **E5 — The wordmark becomes the stamp.** "Terralore." in Literata (v1)
  is retired with Literata itself; the wordmark is now TERRALORE in
  Bricolage 800. The terminal stop is dropped: it was the voice of the
  serif reference-work persona, and a stamped formation name does not
  punctuate itself. The ZENITH mark geometry is untouched.
- **E6 — The specimen pill radius (9px) is the one sanctioned radius**,
  inherited from the prototype's own year/source tags. Everything else is
  cut square.
- **E7 — Focus ring.** The contract is silent on keyboard focus. A 2px
  oxide ring (offset 2px) on every interactive element — 2px per the
  rule weight law, oxide because focus is a live label.

- **E8 — The journey is parked, not shipped off-brand.** The cinematic
  time-journey (`/country/<code>/history`) could not meet the language +
  performance bar inside this rebuild (it is built on the retired deep
  palette, the motion library, and a continuous full-screen stage). Per
  the mission's own escape hatch it stays live behind its URL — content,
  metadata and sitemap entry untouched — but no surface links to it. The
  chronicle is the linked depth. Revisit as its own mission.
- **E9 — CSS-only proof-flip on server surfaces.** Rankings, compares
  and commodities are server-rendered with no client JS; their specimens
  flip with `:active` (press = flip, release = return — the same
  physics, zero hydration) and the surface-level PROOF VIEW is a native
  checkbox driving the flip in CSS. The reverse face is aria-hidden and
  its facts are also present as visually-hidden text, so screen readers
  lose nothing.
- **E10 — Dual-dating realized as the record's own label.** The event
  screen shows the authored `yearLabel` (the record's own precision) as
  the primary date with the numeric year beneath only where the two
  differ. Printing a second, more precise date everywhere would either
  duplicate the label or fabricate precision the record does not carry
  (the statehood precision-ledger rule).

- **E11 — Small labels on clay are basalt.** The contract's text-on-clay
  pair (deep umber on clay) measures 4.33:1 — fine for the large display
  text the prototype set in it, below AA for the 10–11px mono sublabels
  the production surfaces need. The tokens don't move; the usage does:
  micro-labels on clay are basalt, deep-umber-on-clay stays sanctioned at
  display sizes. Proven in `scripts/check-contrast-strata.mjs`.

- **E12 — The mounted core (desktop ≥1024px).** The contract is a
  390–430px artifact and E3 only said "extend the scale"; stretched to a
  wide screen the phone layout read barren. The resolution is the
  metaphor's own: a core sample is a narrow vertical thing, and a wide
  screen doesn't widen the core — it **mounts** it, like a specimen in a
  tray or a geologist's core log. Concretely: content locks to a bounded
  column (46rem reading measure; data tables may fill to ~52rem) set
  **left-of-center** inside each page's max-width container — asymmetric
  because a core log is (depth scale left of the core, annotation space
  right); the assembly stays centered as a whole so both margins are
  designed. The freed left margin carries the apparatus: a 2px depth
  rail at the container's former text edge, with mono ticks that read
  like the log's depth scale — **era years** on a nation's cut and its
  chronicle (sticky: the current bed's years ride the rail while that
  bed passes, pure `position: sticky`, no scroll JS), **rank decades**
  printed at every tenth row on a ranking, **section names** on the
  front door, **calendar years** on a chronology period page. Labels
  that stacked under titles on the phone (bed sublines, era periods,
  bed eyebrows) move into the margin at desktop and become `sr-only`
  in-flow — the ticks are aria-hidden apparatus, so screen readers keep
  the original reading order. Rails on coloured beds take the bed's
  proven title colour (the seam-rule precedent from the section cut);
  ticks take the bed's proven sub colour. The front door's beds keep
  full-bleed pigment with content locked to the mounted column, and the
  Overture choreography is untouched. The section cut is the one
  surface that uses width honestly instead of mounting: a wider face
  shows more seams per row (4 columns ≥1280px), never taller rows.

- **E13 — The junction finder (the compare index as wayfinding).** 504
  alphabetical pairs were an undifferentiated scroll — structure, not
  rows, was the defect. The index becomes a finder in the language: THE
  TRAY at the top — two specimen slots, dig for each nation, press
  COMPARE; a published pair navigates, an unpublished one says so
  honestly ("no junction cut for this pair") and lists the cuts the
  set does hold through nation A. The tray and the dig-to-filter field
  are one small vanilla-JS island served inline on this page only —
  they are enhancements, hidden until the script runs, so the page
  without JavaScript is still the whole index. Below, three browse
  views tabbed in mono on native radios (the `.proof-toggle` pattern
  family, zero hydration): BY NEIGHBOURHOOD (default — pairs grouped
  under continent bed-headers walking the section cut's palette, with
  cross-continent junctions as their own group), MOST ENTANGLED (pairs
  with crossed events, count descending — an honest number already
  computed; pairs with none are stated as a count, not padded), and THE
  G20 (that tier as its own section). Row anatomy is unchanged from the
  shipped index.

## C. Invariant collisions

*(none yet — log here if a taboo ever collides with an editorial
invariant; the invariant wins and the design routes around it.)*

## D. Removals (the Chanel rule ledger)

- The globe (runtime renderer, worker, still, builder) — replaced by the
  section cut; the front door ships zero client components.
- Emoji flags, everywhere — codes are the mark; the type system carries
  no emoji by construction.
- The paper-grain overlay — a transparency effect (taboo) doing mood
  work the pigments now do.
- The dossier's "How X compares" bars — the rankings surface owns
  cross-nation reading; the dossier links there per metric.
- Metric-card sparklines — the specimen row carries the observation; the
  series lives one press away in the window, where it has room.
- The atlas card's duplicate chronicle link — one link per seam; the
  chronicle affordance lives on the nation page.
- The serif voice entirely (Literata, italics, the dropcap, the
  wordmark's terminal stop) — three faces, no exceptions.
