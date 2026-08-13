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
