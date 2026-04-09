#!/usr/bin/env bash
# Backup the MinIO `medusa-media` bucket to a tar.gz archive in
# backups/minio/. Designed to run alongside backup-db.sh from cron.
#
# Usage: ./scripts/backup-minio.sh
#
# This snapshot is local — for true off-site safety, mirror the
# resulting tarball to an external destination (e.g. rclone, restic,
# AWS S3 Glacier, Backblaze B2, etc).

set -euo pipefail

BACKUP_DIR="./backups/minio"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="medusa-media_${TIMESTAMP}.tar.gz"
DEST="${BACKUP_DIR}/${FILENAME}"
TMP_DEST="${DEST}.partial"

mkdir -p "$BACKUP_DIR"

ENV_FILE_ARG=()
[ -f .env.prod ] && ENV_FILE_ARG=(--env-file .env.prod)

# Use mc inside the running minio container to mirror the bucket to a
# tmp folder, then tar+gzip it. We don't tar /data directly because
# MinIO writes its metadata sidecar files mixed with object data.
docker compose -f docker-compose.prod.yml "${ENV_FILE_ARG[@]}" exec -T minio \
  sh -c '
    set -eu
    rm -rf /tmp/backup
    mkdir -p /tmp/backup
    mc mirror --quiet local/medusa-media /tmp/backup/medusa-media
    tar -czf - -C /tmp/backup medusa-media
    rm -rf /tmp/backup
  ' > "$TMP_DEST"

# Validate non-empty + valid gzip
SIZE_BYTES=$(stat -c%s "$TMP_DEST" 2>/dev/null || stat -f%z "$TMP_DEST" 2>/dev/null || echo 0)
if [ "$SIZE_BYTES" -lt 64 ]; then
  echo "Error: minio backup is empty (${SIZE_BYTES} bytes). Aborting." >&2
  rm -f "$TMP_DEST"
  exit 3
fi

if ! gunzip -t "$TMP_DEST" 2>/dev/null; then
  echo "Error: minio backup failed gzip integrity check. Aborting." >&2
  rm -f "$TMP_DEST"
  exit 4
fi

mv "$TMP_DEST" "$DEST"

# Keep only the last 14 minio backups (objects are bigger than DB dumps,
# so the retention is shorter to save disk).
ls -t "${BACKUP_DIR}"/medusa-media_*.tar.gz 2>/dev/null \
  | tail -n +15 \
  | xargs -r rm --

echo "MinIO backup created: ${DEST}"
echo "Size: $(du -h "$DEST" | cut -f1)"
