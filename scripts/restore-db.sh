#!/usr/bin/env bash
# Restore PostgreSQL backup for Veloura Medusa backend
# Usage: ./scripts/restore-db.sh <backup-file> [local|docker] [--force]
#
# Safety:
#  - Pauses for confirmation unless --force is passed (so it can run
#    interactively from a tmux session OR from CI / cron)
#  - Validates the backup file exists and passes gzip integrity check
#  - Stops medusa + worker before restore (otherwise medusa holds
#    locks on tables and the restore fails midway)
#  - Restarts medusa + worker after restore

set -euo pipefail

usage() {
  echo "Usage: $0 <backup-file> [local|docker] [--force]" >&2
  exit 2
}

BACKUP_FILE="${1:-}"
MODE="${2:-docker}"
FORCE="${3:-}"

[ -z "$BACKUP_FILE" ] && usage

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

if ! gunzip -t "$BACKUP_FILE" 2>/dev/null; then
  echo "Error: Backup file failed gzip integrity check: $BACKUP_FILE" >&2
  exit 1
fi

if [ "$FORCE" != "--force" ]; then
  echo "WARNING: This will OVERWRITE the current database with $BACKUP_FILE."
  read -r -p "Continue? [y/N] " confirm
  [[ "$confirm" =~ ^[Yy]$ ]] || exit 0
fi

ENV_FILE_ARG=()
[ -f .env.prod ] && ENV_FILE_ARG=(--env-file .env.prod)

# Take a safety backup BEFORE restoring so an accidental restore is
# recoverable. Skipped only if SKIP_PRE_RESTORE_BACKUP=1 is exported,
# which exists for the case where this script is called as part of a
# disaster-recovery flow that just imported a fresh dump.
if [ "${SKIP_PRE_RESTORE_BACKUP:-0}" != "1" ] && [ "$MODE" = "docker" ]; then
  echo ">>> Taking pre-restore safety backup"
  ./scripts/backup-db.sh docker
fi

if [ "$MODE" = "docker" ]; then
  echo ">>> Stopping medusa + worker to release table locks"
  docker compose -f docker-compose.prod.yml "${ENV_FILE_ARG[@]}" stop medusa medusa-worker

  echo ">>> Restoring database"
  gunzip -c "$BACKUP_FILE" | docker compose -f docker-compose.prod.yml "${ENV_FILE_ARG[@]}" exec -T postgres \
    psql --set ON_ERROR_STOP=on -U "${POSTGRES_USER:-veloura}" -d "${POSTGRES_DB:-veloura_medusa}"

  echo ">>> Restarting medusa + worker"
  docker compose -f docker-compose.prod.yml "${ENV_FILE_ARG[@]}" start medusa medusa-worker
elif [ "$MODE" = "local" ]; then
  echo ">>> Restoring database (local)"
  gunzip -c "$BACKUP_FILE" | psql --set ON_ERROR_STOP=on \
    "${DATABASE_URL:-postgres://localhost:5432/veloura_medusa}"
else
  echo "Error: unknown mode '$MODE'. Use 'docker' or 'local'." >&2
  exit 2
fi

echo "Database restored from: $BACKUP_FILE"
