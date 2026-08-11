# Deploy log

Ship records with verification results. Newest first. A deploy is not done
when the push succeeds — it is done when the live origin serves the new
build and the checks below say so.

---

## 2026-08-11 — GEO export layer (a65ddaf → 16d5695)

Four commits: 433 markdown twins (dossiers, chronicles, rankings,
commodities) + generator + byte-compare validator, `/llms.txt` +
`/llms-full.txt` indexes, `rel="alternate"` discovery wiring, and
`docs/geo-surface.md`.

- **16:16:45Z** pushed `main` (`16d5695`) to origin; Coolify webhook fired.
- **16:20:31Z** deploy landed — live `/country/FRA.md` first served 200
  (polled every 15 s from push).
- **16:21:30Z** verification battery, all green:
  - `/country/FRA.md` 200, `text/markdown; charset=UTF-8`, 6,182 bytes —
    **42 metric rows** across the nine domain tables (matches the dossier)
  - `/llms.txt` 200 — 509 distinct terralore.co URLs; **10 sampled links
    all 200** (dossier twins, chronicle twins, incl. SOL and TLS)
  - `/llms-full.txt` 200 — **526,775 bytes (~527 KB)**, header states its
    contents (53 rankings, 10 commodities, 186 nation summaries) and what
    it deliberately omits (the ~291k-word chronicle corpus, one fetch away
    at the chronicle twins)
  - `/rankings/gdp` HTML carries
    `<link rel="alternate" type="text/markdown" href="…/rankings/gdp.md"/>`
- No IndexNow ping for this deploy: the `.md` twins are alternates of
  canonical pages, not canonical pages (deliberately absent from the
  sitemap — see docs/geo-surface.md §5); no canonical URL changed.

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
