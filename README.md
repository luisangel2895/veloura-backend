# Veloura — Backend (Medusa v2)

Server-side application for the Veloura luxury lingerie e-commerce platform. Built on [Medusa v2](https://docs.medusajs.com/) with a custom production stack tuned for a single-tenant VPS deployment.

---

## Tech Stack

| Layer            | Technology                                                                |
| ---------------- | ------------------------------------------------------------------------- |
| Commerce         | Medusa v2.13.5                                                            |
| Database         | PostgreSQL 16-alpine (custom tuning, scram-sha-256 auth)                  |
| Cache / Queue    | Redis 7-alpine (`appendfsync everysec`, `noeviction`, separate logical DBs) |
| Payments         | Stripe                                                                    |
| Object Storage   | MinIO (custom Alpine-based image — see Dockerfile.minio)                  |
| Reverse Proxy    | Caddy 2 (HTTP only until a domain is registered)                          |
| Containerization | Docker / Docker Compose                                                   |
| Auto-update      | Watchtower (`nickfedor/watchtower` fork)                                  |
| Language         | TypeScript / Node.js 20                                                   |
| Tests            | Vitest                                                                    |
| CI/CD            | GitHub Actions (lint, typecheck, build, test) + SSH deploy                |

---

## Project Structure

```
/
├── src/
│   ├── api/
│   │   └── middlewares.ts          # Request-id propagation + dev CORS debug
│   ├── scripts/
│   │   └── seed.ts                 # Demo data: 12 products, 4 categories, 3 regions
│   ├── subscribers/
│   │   └── order-placed.ts         # Stub handler for order.placed events
│   └── __tests__/                  # Vitest tests for the above
├── config/
│   └── postgres/
│       ├── postgresql.conf         # Tuned for 16 GB RAM / 6 vCPU host
│       └── pg_hba.conf             # scram-sha-256 only, no trust auth
├── scripts/
│   ├── backup-db.sh                # pg_dump → backups/*.sql.gz (rotates last 30)
│   ├── restore-db.sh               # gunzip → psql (with safety prompt)
│   └── backup-minio.sh             # mc mirror → backups/minio/*.tar.gz
├── .github/
│   └── workflows/
│       ├── ci.yml                  # lint + typecheck + test + build on PR/push
│       └── deploy.yml              # SSH-based deploy on push to main
├── Dockerfile                      # Production Medusa image (prebuild pattern, see below)
├── Dockerfile.minio                # Custom Alpine MinIO (works on legacy CPUs)
├── docker-compose.prod.yml         # 7-service production stack
├── docker-compose.yml              # Local-dev infra (postgres + redis only)
├── Caddyfile                       # HTTP-only path-based routing on :80
├── medusa-config.ts                # Medusa configuration (env-driven)
└── README.md                       # this file
```

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template
cp .env.example .env
# edit JWT_SECRET, COOKIE_SECRET, STRIPE_API_KEY...

# 3. Start postgres + redis
docker compose up -d

# 4. Set up the database
npm run db:setup

# 5. Seed initial data
npm run seed

# 6. Create an admin user
npx medusa user -e admin@veloura.com -p YourPassword

# 7. Start the dev server
npm run dev
```

Once running:
- **Storefront API** — http://localhost:9000/store
- **Admin API** — http://localhost:9000/admin
- **Admin UI** — http://localhost:9000/veloura

---

## Production Deployment

The production stack runs entirely inside Docker on a single VPS. Two non-obvious things to know:

### 1. Medusa is built ON THE HOST, not inside Docker

Running `npm ci` inside any Docker build container on the production VPS hangs indefinitely (libuv / kernel interaction we couldn't isolate). The `Dockerfile` therefore expects `node_modules/`, `dist/` and `.medusa/` to be **pre-built on the host** before `docker build` runs. The CI/CD pipeline handles this automatically — see `.github/workflows/deploy.yml`.

To deploy manually from the server:

```bash
cd /home/deploy/apps/veloura

# Pull latest from main
git fetch origin main && git reset --hard origin/main

# Pre-build artifacts (with the right backend URL baked in)
export MEDUSA_BACKEND_URL=http://161.132.40.176
rm -rf node_modules
npm ci --no-audit --no-fund
npm run build
rm -rf node_modules
npm ci --omit=dev --no-audit --no-fund

# Build the Docker image and recreate the containers
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build medusa medusa-worker

# Reload Caddy if the Caddyfile changed (it's bind-mounted from the host)
docker compose -f docker-compose.prod.yml --env-file .env.prod restart caddy

# Run migrations if there are new ones
docker compose -f docker-compose.prod.yml --env-file .env.prod \
  run --rm --no-deps medusa npx medusa db:migrate
```

### 2. MinIO uses a custom Alpine image

The official `minio/minio:*` images require a CPU with x86-64-v2 baseline (SSSE3, SSE4, POPCNT, etc.). The Elastika QEMU vCPU does not expose those instructions, so the upstream image crashes on startup with `Fatal glibc error: CPU does not support x86-64-v2`. We work around this with `Dockerfile.minio` which packages the official statically-linked Go binary on top of Alpine (musl libc, no x86-64-v2 requirement).

### Production stack

```
Internet → Caddy :80
   ├── /         → medusa:9000 (storefront + admin API)
   ├── /veloura  → medusa:9000/veloura (admin UI)
   └── /media/*  → minio:9000/* (with /media stripped)

Internal network only:
   medusa, medusa-worker → postgres:5432, redis:6379, minio:9000
   minio-init             → minio (one-shot bucket bootstrap)
   watchtower             → docker.sock (image auto-updates)
```

---

## Database Management

| Command                   | Description                                       |
| ------------------------- | ------------------------------------------------- |
| `npm run db:setup`        | Run all migrations and sync links (first run)    |
| `npm run db:migrate`      | Apply pending migrations                          |
| `npm run db:rollback`     | Roll back the last migration batch                |
| `npm run db:generate`     | Generate a new migration from model changes      |
| `npm run db:sync-links`   | Synchronize module link definitions               |
| `npm run seed`            | Seed dev DB with demo data (`.ts` source)        |
| `npm run seed:prod`       | Seed inside the production container (`.js`)     |
| `npm run user:create`     | Create an admin user                              |

---

## Backup & Restore

Three shell scripts under `scripts/` handle dump management. Backups land under `backups/` (gitignored) and rotate automatically.

```bash
# Database
./scripts/backup-db.sh docker            # → backups/veloura_medusa_<ts>.sql.gz
./scripts/restore-db.sh backups/<file>.sql.gz docker

# MinIO bucket (object store)
./scripts/backup-minio.sh                # → backups/minio/medusa-media_<ts>.tar.gz
```

The DB backup is wired into cron (3 AM daily) and into the deploy pipeline (pre-deploy snapshot).

⚠️ **Limitation**: backups currently live on the same disk as the database. Configure a remote sync (rclone, restic, etc.) for true off-site safety.

---

## Environment Variables

### Development (`.env`)

| Variable               | Description                                | Default                     |
| ---------------------- | ------------------------------------------ | --------------------------- |
| `DATABASE_URL`         | Postgres connection string                 | required                    |
| `DATABASE_LOGGING`     | Log every SQL statement (debugging)        | `false`                     |
| `REDIS_URL`            | Redis connection string                    | optional                    |
| `JWT_SECRET`           | JWT signing secret                         | `supersecret` (dev only)    |
| `COOKIE_SECRET`        | Cookie signing secret                      | `supersecret` (dev only)    |
| `JWT_EXPIRES_IN`       | JWT lifetime                               | `1h`                        |
| `COOKIE_SECURE`        | Set true once HTTPS is in front of Medusa  | `false`                     |
| `STORE_CORS`           | Allowed origins for storefront requests    | `http://localhost:3000`     |
| `ADMIN_CORS`           | Allowed origins for admin requests         | `http://localhost:9000`     |
| `AUTH_CORS`            | Allowed origins for auth requests          | STORE_CORS + ADMIN_CORS     |
| `STRIPE_API_KEY`       | Stripe secret key                          | optional                    |
| `STRIPE_WEBHOOK_SECRET`| Stripe webhook signing secret              | required if STRIPE_API_KEY  |
| `MEDUSA_BACKEND_URL`   | Public URL of the backend                  | `http://localhost:9000`     |
| `WORKER_MODE`          | `shared`, `server`, or `worker`            | `shared`                    |

### Production (`.env.prod`)

All of the above, plus:

| Variable               | Description                                |
| ---------------------- | ------------------------------------------ |
| `POSTGRES_PASSWORD`    | Postgres password (Docker container)       |
| `MINIO_ROOT_USER`      | MinIO admin username                       |
| `MINIO_ROOT_PASSWORD`  | MinIO admin password                       |
| `MINIO_BROWSER`        | `off` to disable the MinIO web console     |
| `S3_*`                 | MinIO S3 endpoint, bucket, region, file URL |

⚠️ **`MEDUSA_BACKEND_URL` is baked into the admin UI bundle at build time** (Vite replaces `__BACKEND_URL__`). When this value changes (e.g. when you get a real domain), you must rebuild the medusa image.

---

## CI / CD

Two workflows live under `.github/workflows/`:

- **`ci.yml`** runs on every push and PR to `main` — lint, prettier, typecheck, vitest, docker build (validation only).
- **`deploy.yml`** runs on every push to `main` — SSH to the server, pull, pre-deploy backup, host prebuild, `docker compose up -d --build`, run migrations, restart Caddy, smoke-test `/health`.

GitHub secrets needed:
- `DEPLOY_HOST` — server IP
- `DEPLOY_USER` — SSH user (`deploy`)
- `DEPLOY_SSH_KEY` — private SSH key matching `~/.ssh/authorized_keys` on the server

---

## Production quirks (worth knowing)

| Quirk | Why |
| --- | --- |
| `npm ci` runs on the host, not in Docker | Pathological hang inside the build container on this kernel |
| MinIO uses `Dockerfile.minio` (Alpine + static binary) | Official image needs x86-64-v2, the QEMU vCPU does not have it |
| Watchtower is `nickfedor/watchtower`, not `containrrr` | Containrrr is archived; old Docker API client |
| Redis runs with `noeviction` and `appendfsync everysec` | Medusa requirement + slow disk on the VPS |
| Admin UI has `MEDUSA_BACKEND_URL` baked in at build time | Vite replaces `__BACKEND_URL__` at compile, not runtime |
| `picsum.photos` URLs in `seed.ts` include `/600/600` | Picsum returns 404 without explicit dimensions |

---

## License

Private — All rights reserved.
