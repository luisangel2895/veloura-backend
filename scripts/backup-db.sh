#!/usr/bin/env bash
# Automated PostgreSQL backup for Veloura Medusa backend
# Usage: ./scripts/backup-db.sh [local|docker]

set -euo pipefail

MODE="${1:-docker}"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="veloura_medusa_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

if [ "$MODE" = "docker" ]; then
  docker compose -f docker-compose.prod.yml exec -T postgres \
    pg_dump -U "${POSTGRES_USER:-veloura}" "${POSTGRES_DB:-veloura_medusa}" \
    | gzip > "${BACKUP_DIR}/${FILENAME}"
elif [ "$MODE" = "local" ]; then
  pg_dump "${DATABASE_URL:-postgres://angel@localhost:5432/veloura_medusa}" \
    | gzip > "${BACKUP_DIR}/${FILENAME}"
fi

# Keep only last 30 backups
ls -t "${BACKUP_DIR}"/veloura_medusa_*.sql.gz 2>/dev/null | tail -n +31 | xargs -r rm --

echo "Backup created: ${BACKUP_DIR}/${FILENAME}"
echo "Size: $(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)"
