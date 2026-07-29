# Mission — Identity, Experience, Discoverability

The build plan that used to live here is complete: the globe, the country card, the
history depth, and the verified-content schema all shipped. This is the current
mission.

Terralore is substantively complete as a product: 184 sourced national histories
(~630k words, 3,600 references), a three-depth architecture (dossier → journey →
chronicle), 1,054 static pages, and validators enforcing citation integrity. **The
mission is to make the world find it and be astonished by it.**

## The three objectives

1. **Discoverable** — every page indexable, citable by answer engines, and shareable.
   A person searching "history of Vietnam", or an AI engine answering that question,
   should be able to land here.
2. **Unforgettable** — the two minutes after arrival must feel unlike any other
   reference site. The depths must talk to each other; the journey must feel piloted,
   not scrolled.
3. **A new identity** — the navy/gold look reads as generic. Replace it end to end,
   globe included, with an art direction that is premium, editorial, and unmistakably
   Terralore.

## Non-negotiables

1. **Citation integrity is the product.** Validators pass on every commit. Never
   invent, alter or embellish a historical claim, figure, date or source. New data
   enters only with real, named, resolvable sources.
2. **No runtime fetching.** All data stays baked to committed JSON at build time.
3. **The chronicle stays server-rendered**, with every era, event and citation in the
   initial HTML. It is the SEO/GEO surface; nothing may move it behind JS.
4. **No regressions.** Every existing route keeps working. Lighthouse mobile ≥ 95 on
   performance / a11y / best-practices / SEO for the landing page, a dossier and a
   chronicle — measured on the production build, before *and* after the redesign.
5. Commit per work unit; log every phase to `PROGRESS.md`; decisions with their
   rejected alternatives go to `DECISIONS.md`.

## Phases

- **A — Trust & hygiene.** CI gate, dead deps removed, docs made accurate, data
  vintage visible in the UI.
- **B — Identity.** Three art directions brainstormed against the subject's own
  materials (cartography, archives, statecraft), known AI-default looks rejected
  outright, one chosen and documented in `DESIGN.md`, then applied everywhere. The
  globe is the hero and gets the deepest pass.
- **C — Unforgettable.** Dossier ↔ chronicle cross-talk modelled as data; journey
  entry as descent; cross-nation "meanwhile elsewhere"; designed empty states.
- **D — Discoverable.** Per-depth titles and descriptions, build-time per-country OG
  images, validated JSON-LD, full internal linking, `llms.txt`, IndexNow, and a
  post-deploy audit that runs in CI.
- **E — Data gaps (bounded).** Taiwan and North Korea populated from named non-WB
  sources. The other six Overview-only codes keep their designed empty state. The
  metric set does not grow.

Progress against each phase is logged in `PROGRESS.md`. The art direction and its
rationale are in `DESIGN.md`. When every item is done and verified against the running
production build, the outcome is written up in `FINAL_REPORT.md`.
