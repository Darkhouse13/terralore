# Terra Historica — Build Plan

An interactive 3D globe encyclopedia of world history. Click a country → basic
info card → "Explore History" → a deep, sourced, interactive history page.

## Pillars
1. **The Globe** — a real, beautiful interactive 3D globe. Hover highlights a
   country; click selects it and opens a basic-info card.
2. **The Country Card** — flag, capital, population, region, founding/independence,
   a one-paragraph orientation, and the "Explore History" button.
3. **The History Page** — the main product. A long-form, interactive,
   chapter-based encyclopedia of the nation's path to becoming a country.
   Eras, timeline, key figures, turning points — every claim sourced.
4. **Verified content** — structured schema with explicit `sources[]` on each
   era/event. Seed a few nations deeply rather than many shallowly.

## Stack
- Next.js (App Router) + TypeScript + Tailwind
- react-globe.gl (three-globe) for the globe, client-only
- Framer Motion for motion
- Content as typed data modules in /data with a strict schema in /lib/schema

## Design language (must NOT feel AI-generated)
- Editorial, archival feel: warm paper + deep ink, a single restrained accent.
- Real typographic hierarchy (serif display + clean sans body).
- Generous whitespace, asymmetry, deliberate motion. No generic gradient-purple SaaS.

## Milestones
- [ ] M1 Scaffold Next.js + Tailwind, design tokens, fonts
- [ ] M2 Globe with country polygons, hover/click, selection
- [ ] M3 Country basic-info card + REST data + routing
- [ ] M4 History page shell: schema, layout, timeline, eras, sources
- [ ] M5 Seed deep content for several nations (sourced)
- [ ] M6 Polish: motion, responsive, empty/loading states, accessibility
