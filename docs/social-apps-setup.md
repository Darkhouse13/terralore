# Social apps setup — the remaining click-work

Written 2026-08-11, at the end of the mission that deployed the publishing
infrastructure (Postiz on Coolify + the daily publisher — see
`docs/social-publishing.md` for how the machine works). Everything in this
file is work that needs a human in a browser: DNS at the registrar, and one
developer-app per platform. **The pipeline is already live around these
gaps** — it runs daily, skips unconnected platforms with a logged reason,
and picks each platform up the moment its OAuth connection lands. Nothing
else needs code.

The Postiz instance: **https://postiz.terralore.co** (once DNS exists, §0).
Login `hamza.bentaieb@verveq.com`; the password and the API key are in
`/root/.postiz-admin` on the Hetzner box (`ssh hetzner`). Self-registration
is disabled (`DISABLE_REGISTRATION=true`), so this account is the door.

Where platform app credentials go: Coolify (coolify.qalame.xyz) → project
**TERRA** → service **postiz** → *Environment Variables*. The variables
named below already exist as empty rows (the template created them) — fill,
save, **Restart** the service. Credentials never enter the repo.

---

## 0. DNS — one A record (do this first)

Namecheap → Domain List → `terralore.co` → **Advanced DNS** → Add New Record:

| Field | Value |
|---|---|
| Type | A Record |
| Host | `postiz` |
| Value | `178.104.196.36` |
| TTL | Automatic |

That's the whole step. Traefik already routes the hostname and will obtain
the Let's Encrypt certificate automatically on the first request after the
record propagates (HTTP-01 — it needs the DNS to point here first, which is
why this couldn't be automated away). Verify: `https://postiz.terralore.co`
shows the Postiz login with a valid certificate.

Everything below happens **after** this record exists — the OAuth redirect
URIs point at this hostname.

---

## 1. Meta app — Instagram publishing via the linked Page

What this unlocks: the two Instagram posts per day (`instagram:anchor`,
`instagram:carousel`). Postiz drives Instagram through the **Facebook Graph
API**, so the Instagram account must be a *Professional* account linked to
a Facebook Page, and the OAuth dance is Facebook's.

Prerequisites (once): the Terralore Instagram account set to Professional
(Instagram app → Settings → Account type), linked to a Facebook Page you
admin (Meta Business Suite → Settings → Linked accounts).

1. https://developers.facebook.com → **My Apps** → **Create App**.
   - Use case: **Other** → App type: **Business**.
   - Name: `Terralore Publisher`. Contact email: your address.
2. In the app dashboard → **Add Product** → **Facebook Login** → *Set Up*
   (the plain web flow; no code steps needed).
3. **Facebook Login → Settings** → *Valid OAuth Redirect URIs*, add exactly:
   ```
   https://postiz.terralore.co/integrations/social/instagram
   ```
4. **App settings → Basic**: copy *App ID* and *App Secret* into the postiz
   service env (Coolify, see header):
   - `SERVICE_FACEBOOK_ID` = App ID
   - `SERVICE_FACEBOOK_SECRET` = App Secret
   (Yes, the *Facebook* pair — Postiz's Instagram-via-Page provider reads
   `FACEBOOK_APP_ID/SECRET`. The separate `INSTAGRAM_APP_ID/SECRET` rows
   belong to the standalone-Instagram provider we don't use.)
5. **App roles → Roles**: add the Facebook accounts that own our Page as
   **Administrators** (accept the invite from each account).
6. Restart the postiz service in Coolify. In Postiz → *Add channel* →
   **Instagram** → complete the OAuth dialog, grant everything it asks
   (Postiz requests: `instagram_basic, pages_show_list,
   pages_read_engagement, business_management, instagram_content_publish,
   instagram_manage_comments, instagram_manage_insights`), pick the
   Terralore account.

**Dev mode is enough.** An app in Development mode has full API access for
users who hold a role on the app — that's exactly our situation (own
accounts, added as admins in step 5). No app review needed to publish.
What review ("Advanced Access" + Business verification) adds later:
publishing on behalf of accounts *without* an app role, and stable
insights access — relevant only if this ever posts for third parties.

---

## 2. Pinterest — trial access

What this unlocks: the two Pinterest posts per day (`pinterest:anchor`,
`pinterest:data`).

1. https://developers.pinterest.com → **My apps** → **Connect app** (log in
   with the Terralore Pinterest business account).
2. Fill the app form: name `Terralore Publisher`, describe the use
   ("scheduling our own editorial pins to our own boards via the
   self-hosted Postiz scheduler").
3. Request **Trial access** (the default tier for new apps). Trial is
   granted from the dashboard — typically instant to a few days — and
   allows full pin creation on the *app owner's own account*, rate-limited
   (plenty for 2/day). **Standard access** (posting at volume / for other
   users) is a later review with a business-use questionnaire; not needed
   to go live for our own boards.
4. App → *Configure*: Redirect URI, add exactly:
   ```
   https://postiz.terralore.co/integrations/social/pinterest
   ```
   Scopes Postiz will request: `boards:read, boards:write, pins:read,
   pins:write, user_accounts:read`.
5. Copy *App ID* and *App secret* into the postiz service env:
   - `SERVICE_PINTEREST_ID` = App ID
   - `SERVICE_PINTEREST_SECRET` = App secret
6. Restart postiz; Postiz → *Add channel* → **Pinterest** → OAuth.
7. **The board id** (the publisher must know which board to pin to):
   in Postiz, start composing any post, select the Pinterest channel, and
   open the board selector — with browser dev-tools' Network tab open, the
   settings request lists the boards with their numeric ids. Put the chosen
   id into the **runner** service env (Coolify → TERRA →
   terralore-social-runner → Environment Variables):
   - `POSTIZ_PINTEREST_BOARD` = the board id
   Until this is set, Pinterest posts are skipped with the logged reason
   `pinterest board not configured` even after OAuth lands.

---

## 3. TikTok — content posting API

What this unlocks: the TikTok carousel post (`tiktok:carousel`).

1. https://developers.tiktok.com → log in with the Terralore TikTok
   account → **Manage apps** → **Connect an app**.
   - Name: `Terralore Publisher`.
2. In the app: **Add products** → add **Login Kit** and
   **Content Posting API**.
3. Login Kit → Redirect URI, add exactly:
   ```
   https://postiz.terralore.co/integrations/social/tiktok
   ```
   Scopes Postiz will request: `user.info.basic, user.info.profile,
   video.publish, video.upload`. Enable them under the products' scope
   settings; add the Terralore TikTok account as a **target/test user** so
   the unreviewed app may act for it.
4. Copy *Client key* and *Client secret* into the postiz service env:
   - `SERVICE_TIKTOK_ID` = Client key
   - `SERVICE_TIKTOK_SECRET` = Client secret
5. Restart postiz; Postiz → *Add channel* → **TikTok** → OAuth.
6. **The private-post limitation, and the audit.** Until the app passes
   TikTok's Content Posting API **audit**, every API-created post is forced
   to private visibility regardless of requested settings. Our committed
   config already matches that reality: `data/social-publish.json` sets
   `privacy_level: "SELF_ONLY"`. Apply for the audit from the Content
   Posting API product page once one private post has gone through
   (expected wait: days to ~2 weeks). **After the audit passes**, flip
   `privacy_level` to `"PUBLIC_TO_EVERYONE"` in `data/social-publish.json`
   (one committed line) — that is the entire go-public switch.

---

## When each platform connects

Nothing to redeploy. The daily run (05:00 Casablanca) queries Postiz for
connected channels; the first run after a connection exists schedules that
platform's posts for the day. To backfill the *current* day immediately
instead of waiting for tomorrow's run:

```
ssh hetzner
docker exec $(docker ps -qf name=runner-v113) bash -c \
  'cd /work/repo && git pull --rebase origin main -q && bash scripts/social-runner-daily.sh'
```

(the same command the scheduled task runs; it is idempotent — already
scheduled posts are skipped by dedupe key).
