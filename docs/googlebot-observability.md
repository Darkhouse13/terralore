# Googlebot origin observability

## Historical limit (2026-08-22)

The Coolify Traefik proxy was not configured with access logging, and the
Terralore Next.js container only records startup and application errors. There
are no surviving proxy, nginx, Caddy, or prior-container access logs. Therefore
the origin cannot reconstruct Googlebot requests from the August 2026
impression decline. Search Console Crawl stats and URL Inspection are the only
available historical crawl evidence. Logging enabled later that day cannot
reconstruct requests made before that point.

## Enabled Traefik JSON access log

The `coolify-proxy` service now has these static arguments in
`/data/coolify/proxy/docker-compose.yml`:

```yaml
- --accesslog=true
- --accesslog.format=json
- --accesslog.filepath=/traefik/access.log
- --accesslog.fields.defaultmode=keep
- --accesslog.fields.headers.defaultmode=drop
- --accesslog.fields.headers.names.User-Agent=keep
```

The change was applied at 2026-08-22 15:51 UTC after validating the composed
configuration. The pre-change file is backed up as
`/data/coolify/proxy/docker-compose.yml.bak-accesslog-20260822T155140Z`.

The existing `/traefik` mount maps the log to
`/data/coolify/proxy/access.log` on the host. Header logging stays off except
for `User-Agent`; cookies, authorization, and other request headers are not
recorded. Client IP is retained because Google recommends reverse- then
forward-DNS verification of crawler IPs. The raw shared-proxy log stays on the
server. A dedicated systemd timer runs hourly and keeps 336 hourly rotations
(14 days), compressed after the newest rotation, with an early-rotation
threshold of 50 MB. Its configuration is
`/etc/terralore/logrotate-traefik-access`; the units are
`terralore-traefik-logrotate.service` and `.timer`.

A live non-crawler probe confirmed the expected Traefik 3.6 field name is
`request_User-Agent`, the Terralore host and path are present, and the request
status is recorded. The proxy returned healthy immediately after recreation
and `https://terralore.co/` continued to return HTTP 200.

## Analyze without copying raw logs off the server

Run the repository analyzer on the Hetzner host (or pipe the file to it):

```bash
npm run audit:googlebot -- /data/coolify/proxy/access.log --host terralore.co
```

For machine-readable output:

```bash
npm run audit:googlebot -- /data/coolify/proxy/access.log --host terralore.co --json
```

The analyzer prints aggregate dates, HTTP status classes, route families, and
top paths. It does not print raw records or IP addresses. A Googlebot user-agent
can be spoofed; add `--verify-dns` to verify each claimed crawler IP with the
Google-recommended reverse-DNS then forward-DNS check:

```bash
npm run audit:googlebot -- /data/coolify/proxy/access.log --host terralore.co --verify-dns
```

Collect at least 14 days so the report spans more than one crawl cycle. The
most useful comparison is successful Googlebot requests per day and per sitemap
family, especially `country-dossiers`, `country-chronicles`, `timelines`,
`themes`, and `comparisons`.
