# ── Veloura production image ──────────────────────────────────────
# IMPORTANT: this image expects `node_modules/`, `dist/` and `.medusa/`
# to be pre-built on the host BEFORE `docker build`. Build them with:
#
#   npm ci --no-audit --no-fund
#   npm run build
#   rm -rf node_modules && npm ci --omit=dev --no-audit --no-fund
#
# Why: running `npm ci` inside a Docker build container on this VPS is
# pathologically slow (~6 lines/min in npm debug log, vs ~35s on the host)
# due to a libuv/kernel interaction we couldn't isolate. Building on the
# host and copying the artifacts is ~50x faster end-to-end.
#
# This Dockerfile is for the server only. CI/CD (GitHub Actions) can
# still use a multi-stage build because GitHub runners don't have the issue.

FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache curl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nodejs

# Production-only node_modules (host-built)
COPY --chown=nodejs:nodejs node_modules ./node_modules
# Compiled backend output (medusa-config.js, src/, public/, package.json)
COPY --chown=nodejs:nodejs dist/ ./
# Compiled admin UI client (.medusa/client) and types (.medusa/types)
COPY --chown=nodejs:nodejs .medusa ./.medusa

ENV NODE_ENV=production
USER nodejs
EXPOSE 9000

CMD ["npx", "medusa", "start"]
