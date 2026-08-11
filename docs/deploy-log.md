# Deploy log

Ship records with verification results. Newest first. A deploy is not done
when the push succeeds — it is done when the live origin serves the new
build and the checks below say so.

---

## 2026-08-11 — brand codification + rankings surface (f328c3f → a65ddaf)

Twelve commits: the ZENITH brand codification (components, favicon set,
manifest, OG grammar v2, Literata wordmark subset) and the /rankings surface
(slug layer, 53 pages, SEO/OG/llms wiring, docs).

- **15:40:00Z** pushed `main` (`a65ddaf`) to origin; Coolify webhook fired.
- **15:42:06Z** deploy landed — live `/rankings` first served 200 (polled
  every 15 s from push).
- **15:42:55Z** verification battery, all green:
  - `/rankings` 200, carries "53" (rankings count)
  - `/rankings/rule-of-law` 200, carries the WGI "absolute 0–100 scores" note
  - `/rankings/gdp` 200, carries the "mixes vintages" note
  - `/commodities/copper` 200, carries "Rest of world"
  - `/rankings/life-expectancy/opengraph-image` 200, `image/png`, 70,731 bytes
  - `/manifest.webmanifest` 200, `application/manifest+json`
  - `/icon0.svg` 200, `image/svg+xml`, 428 bytes — the ZENITH compact cut
  - live `sitemap.xml` contains exactly **54** `/rankings…` URLs
- **15:43Z** IndexNow: 54 URLs (53 `/rankings/<slug>` + `/rankings`)
  submitted in one batch → **HTTP 200**. (Google needs no ping — the sitemap
  is registered in GSC and lastmod is honest.)
