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

This is why Phase E populates Taiwan and North Korea from *named* alternative
publishers rather than from estimates, and why the remaining six Overview-only codes
get a designed empty state instead of filled-in numbers.
