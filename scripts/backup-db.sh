#!/usr/bin/env bash
# Automated PostgreSQL backup for Veloura Medusa backend
# Usage: ./scripts/backup-db.sh [local|docker]
#
# Behavior:
#  - Dumps to backups/veloura_medusa_<timestamp>.sql.gz
#  - Uses --no-owner --clean --if-exists for portable restores
#  - Validates the dump is non-empty before keeping it (refuses to
#    rotate good backups in favor of a corrupted partial dump)
#  - Keeps last 30 backups
#  - Pipes through gzip -9 for max compression
#
# Restore with: ./scripts/restore-db.sh backups/<file>.sql.gz docker

set -euo pipefail

MODE="${1:-docker}"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="veloura_medusa_${TIMESTAMP}.sql.gz"
DEST="${BACKUP_DIR}/${FILENAME}"
TMP_DEST="${DEST}.partial"

mkdir -p "$BACKUP_DIR"

PGDUMP_FLAGS=(
  --no-owner
  --no-acl
  --clean
  --if-exists
  --quote-all-identifiers
  --format=plain
)

if [ "$MODE" = "docker" ]; then
  # Pass --env-file when .env.prod exists so `docker compose` doesn't
  # print noisy "variable not set" warnings while parsing the YAML.
  ENV_FILE_ARG=()
  [ -f .env.prod ] && ENV_FILE_ARG=(--env-file .env.prod)

  # Read POSTGRES_PASSWORD from .env.prod and pass it to pg_dump via
  # PGPASSWORD env var. Required since the postgres container now uses
  # scram-sha-256 auth (no more trust auth on local socket). Without
  # this, pg_dump fails with "fe_sendauth: no password supplied".
  if [ -z "${POSTGRES_PASSWORD:-}" ] && [ -f .env.prod ]; then
    POSTGRES_PASSWORD=$(grep -E '^POSTGRES_PASSWORD=' .env.prod | cut -d= -f2-)
  fi
  if [ -z "${POSTGRES_PASSWORD:-}" ]; then
    echo "Error: POSTGRES_PASSWORD not set and not found in .env.prod" >&2
    exit 5
  fi

  docker compose -f docker-compose.prod.yml "${ENV_FILE_ARG[@]}" exec -T \
    -e PGPASSWORD="$POSTGRES_PASSWORD" postgres \
    pg_dump "${PGDUMP_FLAGS[@]}" -U "${POSTGRES_USER:-veloura}" "${POSTGRES_DB:-veloura_medusa}" \
    | gzip -9 > "$TMP_DEST"
elif [ "$MODE" = "local" ]; then
  pg_dump "${PGDUMP_FLAGS[@]}" "${DATABASE_URL:-postgres://localhost:5432/veloura_medusa}" \
    | gzip -9 > "$TMP_DEST"
else
  echo "Error: unknown mode '$MODE'. Use 'docker' or 'local'." >&2
  exit 2
fi

# Validate the dump is non-empty and looks like a pg_dump file
SIZE_BYTES=$(stat -c%s "$TMP_DEST" 2>/dev/null || stat -f%z "$TMP_DEST" 2>/dev/null || echo 0)
if [ "$SIZE_BYTES" -lt 1024 ]; then
  echo "Error: backup file is suspiciously small (${SIZE_BYTES} bytes). Aborting." >&2
  rm -f "$TMP_DEST"
  exit 3
fi

if ! gunzip -t "$TMP_DEST" 2>/dev/null; then
  echo "Error: backup file failed gzip integrity check. Aborting." >&2
  rm -f "$TMP_DEST"
  exit 4
fi

# Atomically promote the temp file to its final name
mv "$TMP_DEST" "$DEST"

# Keep only the last 30 backups
ls -t "${BACKUP_DIR}"/veloura_medusa_*.sql.gz 2>/dev/null \
  | tail -n +31 \
  | xargs -r rm --

echo "Backup created: ${DEST}"
echo "Size: $(du -h "$DEST" | cut -f1)"
