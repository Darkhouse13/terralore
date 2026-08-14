# Newsletter deliverability — the click-work, prefilled

Written 2026-08-14, with the Ledger Letter mission (Listmonk on Coolify,
`docs/newsletter-ops.md` is the operating runbook). This document is
**everything that needs a human with browser logins**, in order, with exact
values. State of the world when written: MX → Zoho ✓, SPF ✓, DKIM ✓ are
**already live** on terralore.co — the mail domain is in better shape than
expected, and only the four items below remain.

## 0. What already exists (verified 2026-08-14, no action)

| Record | Value found live | Status |
|---|---|---|
| MX | `mx.zoho.com` (10), `mx2.zoho.com` (20), `mx3.zoho.com` (50) | ✓ |
| SPF | `TXT terralore.co` → `v=spf1 include:zohomail.com ~all` | ✓ covers Zoho SMTP |
| DKIM | `TXT zmail._domainkey.terralore.co` → `v=DKIM1; k=rsa; p=MIGf…` | ✓ published |

Because Listmonk sends **through Zoho's SMTP**, Zoho signs with that DKIM key
and the existing SPF covers the sending IPs — no new SPF/DKIM work exists.

## 1. DNS at Namecheap (2 records)

1. **A record for the Listmonk admin** (same device as `postiz`):
   - Host: `listmonk` → IP: `178.104.196.36`
   - TLS then auto-issues via Coolify/Let's Encrypt (HTTP-01 — it cannot
     precede the record). Admin UI: `https://listmonk.terralore.co`.
   - ⚠ The `postiz` A record from the social mission (`postiz` →
     `178.104.196.36`) was still absent when this was written — add it in the
     same sitting if it hasn't been.
2. **DMARC** (start at monitor-only, per the plan of record):
   - Host: `_dmarc` → TXT:
     `v=DMARC1; p=none; rua=mailto:ledger@terralore.co`
   - `p=none` observes without rejecting; revisit toward `quarantine` after a
     few clean months of reports. No stricter start — the letters must land
     while the domain's sending reputation is young.

Note: **the capture form does not wait on DNS.** Subscription, confirmation
and unsubscribe all ride the apex (`terralore.co/subscription/…`) through the
proxy — only the *admin UI* needs the `listmonk` record. Until it resolves,
the admin is reachable by tunnel:
`ssh -L 9000:listmonk-j8lskiymw24mrby33bjcuduw:9000 hetzner` →
`http://localhost:9000/admin` (credentials in `/root/.listmonk-admin` on the
box).

## 2. Zoho: the sending identity `ledger@terralore.co`

The letter sends as **`The Terralore Ledger <ledger@terralore.co>`** (already
configured as Listmonk's from-address).

1. In Zoho Mail admin: add `ledger@terralore.co` — as an **alias** on the
   existing mailbox (free, simplest) or as its own user.
2. Generate an **app-specific password**: Zoho Accounts → Security →
   App Passwords → generate one for "Listmonk". (Ordinary account passwords
   do not work for SMTP when 2FA is on, and shouldn't be pasted into apps
   regardless.)
   - If `ledger@` is an alias: the SMTP **username is the primary mailbox
     address**, and Zoho must allow sending as the alias (Mail settings →
     Send mail as). The From header stays `ledger@terralore.co`.

## 3. Paste into Listmonk (one screen)

`https://listmonk.terralore.co/admin` → Settings → SMTP:

1. The **smtp.zoho.com** block is prefilled (host `smtp.zoho.com`, port
   `465`, TLS `SSL/TLS`, auth `LOGIN`, username `ledger@terralore.co`).
   Correct the username if `ledger@` ended up an alias (see above), paste the
   app password, tick **Enabled**.
2. **Disable** (untick) the `terralore-mailpit` block — the local preview
   sink that carried the deploy-time loop proof. Don't delete it: re-enabling
   it is how a future letter is previewed in a real mail client without
   sending anything (`ssh -L 8025:terralore-mailpit:8025 hetzner` →
   `http://localhost:8025`).
3. Save, then send yourself the test: subscribe at
   `https://terralore.co/subscription/form`, confirm from your real inbox.

## 4. Honest limits, and the path past them

**Zoho SMTP is the right tool up to roughly the low hundreds of recipients
per send** (Zoho meters daily sends per account/plan, and a shared-pool
consumer SMTP is not built for bulk). For a letter that goes out a handful of
times a year to a young list, that is comfortable — no action now.

When the list outgrows it, the upgrade path is a dedicated sending service or
relay (self-hosted or hosted — e.g. a transactional SMTP relay with its own
dedicated-domain DKIM), wired into the same Listmonk SMTP screen; the list,
templates, archive and capture surfaces all stay exactly as they are. That is
the point of owning the infrastructure: the sender is a config block, not the
product.
