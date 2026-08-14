# Newsletter ops — the Ledger Letter runbook

Written 2026-08-14 (the Ledger Letter mission). Companion docs:
`docs/newsletter-deliverability.md` (the human click-work, prefilled) and
`assets/listmonk/README.md` (the template overlay). The stance throughout is
the recorder's: **building is not sending** — the letter is built, reviewed
and committed like a ledger entry, and the send is one deliberate command,
exactly as recording is.

## 0. The pieces

- **Listmonk** (Coolify service `j8lskiymw24mrby33bjcuduw`, project TERRA):
  `listmonk/listmonk:v6.2.0` + postgres 18-alpine, capped 1.0 CPU / 512M
  (app) and 0.5 CPU / 256M (postgres). Admin `https://listmonk.terralore.co`
  (A record pending — until then:
  `ssh -L 9000:listmonk-j8lskiymw24mrby33bjcuduw:9000 hetzner`). Admin
  credentials + API token: `/root/.listmonk-admin` on the box (0600), never
  the repo. Registration: listmonk has no public registration; the admin
  account and the `terralore-runner` API user are the only principals.
- **The list**: "The Ledger" (id 3, uuid `70011fd6-…c76f`) — **double
  opt-in**, non-negotiable. Confirmation email and public pages are the
  strata overlay in `assets/listmonk/static/` (the confirmation deliberately
  carries the welcome voice — listmonk has no post-confirm autoresponder, and
  one honest email beats two).
- **Capture**: first-party on the apex. The proxy file
  `/data/coolify/proxy/dynamic/terralore-letter-capture.yaml` routes
  `terralore.co/subscription/*` (+ `/public/`, `/link/`, `/campaign/`,
  `/api/public/`) to the listmonk container at priority 1000. The site's
  capture bed (`components/strata/CaptureBed.tsx`) POSTs there with no JS.
- **Mailpit** (`terralore-mailpit`, capped 0.25 CPU / 128M, coolify network):
  the local SMTP sink. While Zoho's app password is pending it is the enabled
  SMTP block, and afterwards it stays as the preview tool — enable its block,
  send, read at `ssh -L 8025:terralore-mailpit:8025 hetzner` →
  http://localhost:8025, then re-enable Zoho. Nothing sent to mailpit leaves
  the box.
- **Runner env** (`terralore-social-runner` service): `LISTMONK_URL`,
  `LISTMONK_API_USER`, `LISTMONK_API_TOKEN`, `LISTMONK_LEDGER_LIST_ID` —
  applied to the container on its next Coolify restart.

## 1. Build a letter (with, or after, a recorded refresh)

After the ledger entry `NNNN` exists and the seal is cut (the letter cites
the entry's `corpus.after` version, so the seal archive must already hold it):

```
npm run build-letter -- --entry NNNN
```

writes the four artifacts — `public/ledger/letter/NNNN.{html,txt}` (the
archived, served copies; the .html is byte-for-byte the email) and
`data/letters/NNNN.campaign.{html,txt}` (what the send uploads; carries
`{{ UnsubscribeURL }}`). Deterministic: entry + seal + countries in, same
bytes out — `validate-letters.mjs` (in `npm run validate`) regenerates and
byte-compares, enforces the ledger's language law on the letter, and asserts
the no-tracking promise the privacy page makes.

**Read the letter before committing** — the builder picks the lead
(withdrawals first, else the largest revision) and 3–5 notable changes by
arithmetic; the operator's judgment is the review, not the generation.
Letter artifacts are sealed corpus files (`scripts/lib/corpus-files.mjs`), so
commit letter + reseal together: `npm run build-integrity` after building.

The letter is then also a page: `/ledger/letter/NNNN` (auto-discovered — no
registry edit), in the sitemap, linked from its entry, noted in the entry's
markdown twin.

## 2. Send it — the one command

From the box (the admin API is deliberately not on the apex):

```
ssh hetzner docker exec runner-v113yzpn4rzcv32nqam70td2 sh -c \
  'cd /work/repo && git pull -q origin main && \
   node scripts/send-letter.mjs --entry NNNN'
```

`--dry-run` first if in doubt — it prints the list, count and subject and
creates nothing. The send is idempotent: campaigns are named
`ledger-letter-NNNN` and an existing campaign is never re-sent, so a re-run
after a network hiccup is safe. The command reads the **committed** campaign
artifacts — it never regenerates, so what lands in inboxes is exactly what
was reviewed.

Sending order of operations, in full: recorded refresh → entry committed →
seal cut → `build-letter` → read it → commit + reseal → deploy → **send**.
The deploy comes before the send so the letter's archive page and the claim
links it carries are live when the letter lands.

## 3. When the list outgrows the setup

Covered honestly in `docs/newsletter-deliverability.md` §4 — Zoho SMTP to
the low hundreds per send, then a dedicated relay in the same SMTP screen.
Listmonk versions are pinned in the service compose; on a bump, re-extract
the release's `static/` to `/data/terralore-letter/static` and re-overlay
(`assets/listmonk/README.md`).
