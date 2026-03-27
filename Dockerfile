FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nodejs

# ── Dependencies ──────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Build ─────────────────────────────────────────────────────────
FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Production ────────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production

COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodejs:nodejs /app/.medusa ./.medusa
COPY --from=build --chown=nodejs:nodejs /app/medusa-config.ts ./medusa-config.ts
COPY --from=build --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=build --chown=nodejs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=build --chown=nodejs:nodejs /app/src ./src

USER nodejs

EXPOSE 9000

CMD ["npx", "medusa", "start"]
