# Googlebot origin observability

## Current state (2026-08-22)

The Coolify Traefik proxy was not configured with access logging, and the
Terralore Next.js container only records startup and application errors. There
are no surviving proxy, nginx, Caddy, or prior-container access logs. Therefore
the origin cannot reconstruct Googlebot requests from the August 2026
impression decline. Search Console Crawl stats and URL Inspection are the only
available historical crawl evidence.

No production configuration was changed during this investigation.

## Enable a privacy-minimal Traefik JSON access log

Add these static arguments to the `coolify-proxy` service in
`/data/coolify/proxy/docker-compose.yml`:

```yaml
- --accesslog=true
- --accesslog.format=json
- --accesslog.filepath=/traefik/access.log
- --accesslog.fields.defaultmode=keep
- --accesslog.fields.headers.defaultmode=drop
- --accesslog.fields.headers.names.User-Agent=keep
```

The existing `/traefik` mount maps this to
`/data/coolify/proxy/access.log` on the host. Header logging stays off except
for `User-Agent`; do not enable cookies, authorization, or other request
headers. Add host-side log rotation before leaving the log enabled for more
than a short diagnostic window. After restarting the proxy, confirm the exact
field names from one JSON line because Traefik versions can name the retained
user-agent field differently.

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
