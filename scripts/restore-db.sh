#!/usr/bin/env bash
# Restore PostgreSQL backup for Veloura Medusa backend
# Usage: ./scripts/restore-db.sh <backup-file> [local|docker]

set -euo pipefail

BACKUP_FILE="${1:?Usage: restore-db.sh <backup-file> [local|docker]}"
MODE="${2:-docker}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "WARNING: This will overwrite the current database. Press Ctrl+C to cancel."
read -r -p "Continue? [y/N] " confirm
[[ "$confirm" =~ ^[Yy]$ ]] || exit 0

if [ "$MODE" = "docker" ]; then
  gunzip -c "$BACKUP_FILE" | docker compose -f docker-compose.prod.yml exec -T postgres \
    psql -U "${POSTGRES_USER:-veloura}" "${POSTGRES_DB:-veloura_medusa}"
elif [ "$MODE" = "local" ]; then
  gunzip -c "$BACKUP_FILE" | psql "${DATABASE_URL:-postgres://angel@localhost:5432/veloura_medusa}"
fi

echo "Database restored from: $BACKUP_FILE"
