# ── Veloura production image ──────────────────────────────────────
# IMPORTANT: this image expects `node_modules/`, `dist/` and `.medusa/`
# to be pre-built on the host BEFORE `docker build`. Build them with:
#
#   npm ci --no-audit --no-fund
#   MEDUSA_BACKEND_URL=http://<server-ip-or-domain> npm run build
#   rm -rf node_modules && npm ci --omit=dev --no-audit --no-fund
#
# Why: running `npm ci` inside a Docker build container on this VPS is
# pathologically slow (~6 lines/min in npm debug log, vs ~35s on the host)
# due to a libuv/kernel interaction we couldn't isolate. Building on the
# host and copying the artifacts is ~50x faster end-to-end.
#
# This Dockerfile is for the server only. CI/CD on GitHub Actions
# runners can use a multi-stage build because GitHub runners are not
# affected by the libuv hang.

FROM node:20-alpine

# Runtime-only deps:
#   wget     → for the HEALTHCHECK (smaller than curl)
#   ca-certs → outbound HTTPS (Stripe, etc.)
# (PID 1 / zombie reaping is handled by docker-compose `init: true`,
#  so we don't need tini in the image — having both causes a noisy
#  "Tini is not running as PID 1" warning on every startup.)
RUN apk add --no-cache wget ca-certificates && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nodejs && \
    mkdir -p /app && \
    chown nodejs:nodejs /app

WORKDIR /app

# Pre-built artifacts (host-built — see header comment).
# Order: most-stable first so cache is reused across builds.
COPY --chown=nodejs:nodejs node_modules ./node_modules
COPY --chown=nodejs:nodejs .medusa ./.medusa
COPY --chown=nodejs:nodejs dist/ ./

ENV NODE_ENV=production \
    NODE_OPTIONS="--enable-source-maps"

USER nodejs
EXPOSE 9000

# Container-level healthcheck so `docker run` standalone has health.
# Compose overrides with its own healthcheck definition for finer
# control over intervals.
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
    CMD wget -q -O- http://127.0.0.1:9000/health || exit 1

CMD ["npx", "medusa", "start"]
