# Terra Historica

An interactive globe and living archive of world history. Spin the globe, choose a
nation, read its basic facts, then open a long-form, **sourced** account of the path
it took to become a country — empires, ruptures, revolutions. Every claim is traceable
to a cited reference.

## What it does

- **The globe** — a 3D, antique-atlas globe (parchment landmasses on a deep-ocean
  sphere, brass atmosphere). Hover to highlight a country; click to select it.
- **The country card** — flag, capital, population, region, area, languages, currency,
  and an "Explore the history" button.
- **The time-journey** (`/country/[code]`) — the main product, and deliberately *not*
  an article. A full-screen, cinematic experience you **pilot** moment-by-moment
  (arrow keys, scroll, swipe, or click the timeline rail): intro → era "chapters" →
  individual events → a "today" outro. Each moment is a single focused card — a giant
  year, the event, its category, its sources. The full sourced prose lives in an
  opt-in parchment **"chapter drawer"** for depth without forcing reading. Nations not
  yet authored show a graceful "archive in progress" screen.
- **The index** (`/atlas`) — every nation, searchable, grouped by continent, with
  published archives featured.

Seeded with deep, verified histories for **29 nations across every inhabited
continent** — France, Egypt, Japan, Mexico, Germany, the United States, China, India,
the United Kingdom, Italy, Spain, Russia, Brazil, Greece, Turkey, Iran, South Korea,
Nigeria, Australia, Canada, Argentina, Indonesia, Vietnam, Saudi Arabia, Israel,
Ethiopia, South Africa, Poland and the Netherlands — each with 6 eras and ~20–30
sourced events. The archive is designed to scale to every country.

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
