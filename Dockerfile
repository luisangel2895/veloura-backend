FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl

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

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.medusa ./.medusa
COPY --from=build /app/medusa-config.ts ./medusa-config.ts
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/src ./src

EXPOSE 9000

CMD ["npx", "medusa", "start"]
