# Terralore — production image (Next.js 16 standalone output).
# Build-time SSG: data is baked into committed JSON, so there are no runtime
# secrets, no database, and no env vars to configure.
# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ── deps: install from the lockfile only (better layer caching) ──────────────
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ── build: compile the app + render the 379 static pages ─────────────────────
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── runner: minimal standalone server ────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

# Standalone server + the assets it serves.
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
