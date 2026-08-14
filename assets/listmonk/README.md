# Listmonk static overlay — the Ledger Letter's transactional voice

The Listmonk service on the box (Coolify service `j8lskiymw24mrby33bjcuduw`,
admin at listmonk.terralore.co) runs with `--static-dir=/listmonk/static-custom`,
bind-mounted from `/data/terralore-letter/static` on the Hetzner box. That
directory is the **full** static tree extracted from the pinned listmonk
release (v6.2.0) with the files in this directory copied over it:

- `static/email-templates/base.html` — the system-email frame: bone ground,
  basalt ink, 2px rules, TERRALORE stamp, creed footer.
- `static/email-templates/subscriber-optin.html` — the double-opt-in
  confirmation, which deliberately carries the welcome voice too (listmonk has
  no post-confirmation autoresponder; one honest email beats two).
- `static/public/templates/index.html` — header/footer of the public
  subscription pages served first-party at `terralore.co/subscription/*`.
- `static/public/static/style.css` — Strata for those pages: seven pigments as
  hex, system faces, square corners, oxide focus rings.

**Sync after editing** (and after any listmonk version bump — re-extract the
new release's `static/` first, then overlay):

```
scp -r assets/listmonk/static/. hetzner:/data/terralore-letter/static/
ssh hetzner docker restart listmonk-j8lskiymw24mrby33bjcuduw
```

These files are Go templates from the listmonk project (AGPL); the overlay
keeps their template actions intact and only changes the frame and the voice.
See `docs/newsletter-ops.md` for the operating runbook.
