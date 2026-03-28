# Veloura -- Backend (Medusa v2)

Server-side application for the Veloura luxury lingerie e-commerce platform. Built on [Medusa v2](https://docs.medusajs.com/), providing a headless commerce API, admin dashboard, and background worker infrastructure.

---

## Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Commerce       | Medusa v2                           |
| Database       | PostgreSQL 16                       |
| Cache / Queue  | Redis 7                             |
| Payments       | Stripe                              |
| Object Storage | MinIO (S3-compatible)               |
| Reverse Proxy  | Caddy (automatic HTTPS)             |
| Containerization | Docker / Docker Compose           |
| Language       | TypeScript / Node.js 20             |

---

## Prerequisites

- **Node.js** >= 20
- **PostgreSQL** 16 and **Redis** 7 (or **Docker** to run them as containers)

---

## Quick Start (Local Development)

```bash
# 1. Clone the repository
git clone <repo-url> && cd veloura-backend

# 2. Install dependencies
npm install

# 3. Copy the environment template and fill in values
cp .env.example .env

# 4. Start PostgreSQL and Redis via Docker
docker compose up -d

# 5. Set up the database (run migrations and sync links)
npm run db:setup

# 6. Seed initial data
npm run seed

# 7. Create an admin user
npx medusa user -e admin@veloura.com -p YourPassword

# 8. Start the development server
npm run dev
```

Once running:

- **API** -- http://localhost:9000
- **Admin Dashboard** -- http://localhost:9000/app

---

## Production Deployment

The production stack runs entirely inside Docker (Medusa, PostgreSQL, Redis, MinIO, Caddy).

```bash
# 1. Copy the production env template
cp .env.prod.example .env.prod

# 2. Generate secrets
openssl rand -hex 32   # use for JWT_SECRET
openssl rand -hex 32   # use for COOKIE_SECRET
openssl rand -hex 32   # use for POSTGRES_PASSWORD

# 3. Configure your domains in .env.prod
#    API_DOMAIN, ADMIN_DOMAIN, STORE_CORS, ADMIN_CORS, AUTH_CORS

# 4. Start all services
docker compose -f docker-compose.prod.yml up -d
```

Caddy handles TLS certificates automatically. See `Caddyfile` for routing configuration.

---

## Database Management

All database commands are available through npm scripts:

| Command              | Description                                    |
| -------------------- | ---------------------------------------------- |
| `npm run db:setup`   | Run all migrations and sync links (first run)  |
| `npm run db:migrate` | Apply pending migrations                       |
| `npm run db:rollback`| Roll back the last migration batch             |
| `npm run db:generate`| Generate a new migration from model changes    |
| `npm run db:sync-links` | Synchronize module link definitions         |
| `npm run seed`       | Seed the database with initial data            |
| `npm run user:create`| Create an admin user interactively             |

---

## Backup and Restore

Two shell scripts are provided under `scripts/` for PostgreSQL dump management.

### Create a backup

```bash
# Docker production environment (default)
./scripts/backup-db.sh docker

# Local PostgreSQL
./scripts/backup-db.sh local
```

Backups are saved as compressed SQL dumps to `backups/` (git-ignored). The script automatically prunes files older than the 30 most recent.

### Restore from backup

```bash
# Docker production environment (default)
./scripts/restore-db.sh backups/veloura_medusa_20260326_120000.sql.gz docker

# Local PostgreSQL
./scripts/restore-db.sh backups/veloura_medusa_20260326_120000.sql.gz local
```

The restore script will prompt for confirmation before overwriting the database.

### Make scripts executable

```bash
chmod +x scripts/backup-db.sh scripts/restore-db.sh
```

---

## Architecture

> **[View the full interactive architecture diagram →](https://luisangel2895.github.io/veloura/)**

---

## Project Structure

```
src/
  admin/
    routes/         # Custom admin UI routes
    widgets/        # Custom admin UI widgets
  api/
    admin/          # Admin API endpoints
    store/          # Storefront API endpoints
    middlewares/     # Custom middleware functions
    middlewares.ts   # Middleware configuration
  jobs/             # Background jobs
  links/            # Module link definitions
  modules/          # Custom modules
  scripts/
    seed.ts         # Database seed script
  subscribers/
    order-placed.ts # Event subscribers
  workflows/        # Custom workflows
```

---

## Environment Variables

### Development (`.env`)

| Variable               | Description                                | Default                     |
| ---------------------- | ------------------------------------------ | --------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string               | --                          |
| `REDIS_URL`            | Redis connection string                    | --                          |
| `JWT_SECRET`           | Secret for signing JWT tokens              | `supersecret` (dev only)    |
| `COOKIE_SECRET`        | Secret for signing cookies                 | `supersecret` (dev only)    |
| `STORE_CORS`           | Allowed origins for storefront requests    | `http://localhost:3000`     |
| `ADMIN_CORS`           | Allowed origins for admin requests         | `http://localhost:9000`     |
| `AUTH_CORS`            | Allowed origins for auth requests          | STORE_CORS + ADMIN_CORS     |
| `STRIPE_API_KEY`       | Stripe secret key                          | --                          |
| `STRIPE_WEBHOOK_SECRET`| Stripe webhook signing secret              | --                          |
| `MEDUSA_BACKEND_URL`   | Public URL of the backend                  | `http://localhost:9000`     |
| `WORKER_MODE`          | `shared`, `server`, or `worker`            | `shared`                    |

### Production (`.env.prod`)

All of the above, plus:

| Variable               | Description                                |
| ---------------------- | ------------------------------------------ |
| `POSTGRES_PASSWORD`    | PostgreSQL password for Docker container   |
| `MINIO_ROOT_USER`      | MinIO admin username                       |
| `MINIO_ROOT_PASSWORD`  | MinIO admin password                       |
| `API_DOMAIN`           | Domain for the API (Caddy routing)         |
| `ADMIN_DOMAIN`         | Domain for the admin panel (Caddy routing) |

---

## License

Private -- All rights reserved.
