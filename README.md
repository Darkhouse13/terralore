# Terralore

An interactive globe and living archive of world history. Spin the globe, choose a
nation, read its basic facts, then open a long-form, **sourced** account of the path
it took to become a country — empires, ruptures, revolutions. Every claim is traceable
to a cited reference.

## What it does

- **The globe** — a 3D, antique-atlas globe (parchment landmasses on a deep-ocean
  sphere, brass atmosphere). Hover to highlight a country; click to select it.
- **The country card** — flag, capital, population, region, area, languages, currency,
  and an "Explore the history" button.
- **The time-journey** (`/country/[code]/history`) — deliberately *not* an article.
  A full-screen, cinematic experience you **pilot** moment-by-moment (arrow keys,
  scroll, swipe, or click the timeline rail): intro → era "chapters" → individual
  events → a "today" outro. Each moment is a single focused card — a giant year, the
  event, its category, its sources. Nations not yet authored show a graceful
  "archive in progress" screen.
- **The chronicle** (`/country/[code]/chronicle`) — the reading depth, and the same
  verified material as one server-rendered document: every era, event, figure and
  reference in the initial HTML, no JavaScript required. The journey is the
  experience; the chronicle is the record you can read, quote and cite.
- **The chronology** (`/timeline`, `/themes`) — the archive read *across* nations
  rather than one at a time. Every sourced event grouped by period ("what was
  happening everywhere in the 15th century?") and by theme (independence,
  colonisation, catastrophe…).
- **The index** (`/atlas`) — every nation, searchable, grouped by continent, with
  published archives featured.

The archive currently holds verified histories for **184 nations across every
inhabited continent**, each with 5–6 eras and ~20–30 sourced events: **1,080 eras,
4,452 events and 3,583 references** — roughly 600,000 words of authored, sourced
prose. Every UN member state in the dataset has a published history.

## Three depths

The same subject meets a reader wherever they are, and the routes are built around
that rather than around one canonical page:

| Depth | Route | What it is |
|---|---|---|
| Glance | `/country/[code]` | The dossier — sourced indicators across six domains |
| Journey | `/country/[code]/history` | The cinematic, piloted time-journey |
| Read | `/country/[code]/chronicle` | The full sourced document, server-rendered |

## Machine visibility

The corpus exists to be cited, which means it has to be readable by something that
does not run JavaScript. That is a deliberate, load-bearing constraint here:

- Every chronicle, timeline and theme page is a **server component** — the full text
  is in the initial response.
- **JSON-LD** on every route (`lib/seo.ts`): `Article` carrying its complete
  `citation` list, `Dataset` for the dossier metrics, `Country`, `BreadcrumbList`.
  Citations name the *originating* publisher so an answer engine can attribute the
  chain rather than flattening it.
- `app/sitemap.ts` (556 URLs) and `app/robots.ts`, which names answer-engine
  crawlers as an explicit opt-in.
- Canonical URLs, OG/Twitter metadata and a generated social card.

`lib/seo.ts` is the single definition of the origin, the route shapes and the
structured data, so canonical tags, sitemap and JSON-LD cannot drift apart.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind v4** (CSS-based theme tokens)
- **react-globe.gl** / three.js for the globe (client-only)
- **motion** for animation
- Fonts: Fraunces (display), Newsreader (reading), Inter (UI), JetBrains Mono (labels)

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static-generates all country pages
```

## Data pipeline

Geographic + basic metadata are merged from open sources into clean app artifacts:

```bash
node scripts/build-data.mjs         # raw sources -> public/data + data/countries.json
node scripts/validate-histories.mjs # integrity-check authored histories
```

- `scripts/raw/` — Natural Earth country polygons + the mledoze/countries dataset.
- `public/data/countries.geo.json` — slim polygons (code + name) for the globe.
- `data/countries.json` — basic-info metadata keyed by ADM0_A3 code.

See `CLAUDE.md` for architecture notes and how to author a new nation.
