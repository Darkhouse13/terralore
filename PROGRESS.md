# Progress log

Phase-by-phase record of the Identity / Experience / Discoverability mission.
Each entry states what changed, what it was verified against, and what it left open.

---

## Baseline (before any work)

Measured against a clean production build of `f2b1445`:

| Check | Result |
|---|---|
| `npm run validate` | ✅ 0 errors — 183 history files, 6 domain files |
| `npx tsc --noEmit` | ✅ clean |
| `npm run build` | ✅ 1,054 static routes |
| Corpus | 184 nations, 1,085 eras, 4,471 events, 3,600 references, ~630k words |
| Sitemap | 1,054 URLs |
| CI | ❌ none |
| Page audit | ❌ none existed |

The corpus and the build were already sound. What was missing was any mechanical
guard on them, and any evidence about the *pages* as opposed to the data.

---

## Phase A — Trust & hygiene

### A1. Post-build page audit (`scripts/audit-pages.mjs`)

Written first, deliberately, because every later phase needed something to be
measured against. It crawls every URL in the sitemap on a running production server
and asserts seven things a build cannot catch:

1. 200 OK · 2. exactly one `<h1>` · 3. unique `<title>` · 4. present, unique meta
description · 5. JSON-LD that parses and carries `@type` + `@context` ·
6. self-referential canonical · 7. no orphans (every URL linked from another).

Runs the full 1,054 pages in ~3 seconds at concurrency 12.

**First run found real defects, on a site that built cleanly:**

| Defect | Count |
|---|---|
| Duplicate meta description — `/chronicle` and `/history` both emit `history.summary` verbatim | 184 |
| Meta descriptions far over the ~160-char budget (country pages ran 482–1,731 chars; the whole `summary` was being used as the description) | 184 |
| Theme/period descriptions over budget (176–254 chars) | ~370 |
| `/atlas` emits no JSON-LD at all | 1 |

No non-200s, no orphans, no duplicate titles, and every page had exactly one `<h1>` —
the structural work was already right. The metadata work was not. These are logged
here as the Phase D worklist rather than fixed now, so the fix and its verification
land together.

### A2. CI gate (`.github/workflows/ci.yml`)

`npm ci` → validate → `tsc --noEmit` → lint → build → start server → audit every
sitemap URL → upload the report. Pinned to Node 22 to match `node:22-alpine` in the
Dockerfile, so a build that passes CI cannot fail in the production image.
Citation integrity is now mechanically enforced on every push, not by convention.

### A3. Dead dependencies removed

`three`, `@types/three` and `react-globe.gl` were still installed although the globe
had already been rewritten as GlobeLite (canvas + OffscreenCanvas worker, no WebGL).
`components/GlobeScene.tsx` was the only file importing them, and nothing imported it
— it was being kept as a reference. Deleted; the retired implementation remains in
git history, which is the right place for it.

Runtime dependencies are now exactly four: `next`, `react`, `react-dom`, `motion`.

### A4. Documentation made accurate

- **`README.md`** rewritten. The old one described a "3D antique-atlas globe" built on
  react-globe.gl — an implementation that no longer existed — and quoted a 556-URL
  sitemap against an actual 1,054. Now documents the real GlobeLite architecture, the
  real four-dependency stack, verified corpus figures, and the audit/validate workflow.
- **`PLAN.md`** replaced. Its milestones were all complete; it now holds this mission.
- **`package.json`** renamed `new_project` → `terralore`. Added `refresh-domains`,
  `audit:pages`, `build-og` and a `ci` script that mirrors the pipeline.
- **`docs/refresh-domains.md`** written: the runbook, why builder order matters
  (`build-data` writes the country list every domain builder reconciles against), and
  what to look for in the diff — a metric that went to `null`, a value that swung on a
  rebasing, a changed source label.

### A5. Data vintage made visible

The vintage existed only in a sentence of italic prose at the bottom of the dossier
footer, which is close to not stating it. It is now a monospace stamp in the accent
colour, above the citations it summarises:

> `Data: World Bank WDI · ITU · UNESCO Institute for Statistics · SIPRI — 2026-06 vintage`

Publishers are de-duplicated across the "X / World Bank" redistribution pairs, so the
line names who *originated* the data rather than repeating the redistributor four
times. Derived from the `updated` field each builder writes, so it moves on its own.

**Verified:** `tsc --noEmit` clean · `npm run lint` clean · validators 0 errors.
