#!/bin/sh
# Entrypoint for the custom Veloura MinIO image (Dockerfile.minio).
#
# Runs as root briefly to ensure /data is writable by the minio user
# (uid 1000), then drops privileges via su-exec and execs the real
# minio binary.
#
# This is needed because Docker volumes default to root ownership on
# first creation. Without this fixup, MinIO running as a non-root user
# would fail to write to a fresh volume with:
#   "FATAL Unable to initialize backend: Unable to write to the backend"
#
# On subsequent restarts the chown is a no-op (files already owned by
# minio).

set -eu

if [ "$(id -u)" = "0" ]; then
  # Only chown if /data exists and isn't already owned by minio.
  if [ -d /data ]; then
    DATA_OWNER=$(stat -c '%u' /data 2>/dev/null || echo "0")
    if [ "$DATA_OWNER" != "1000" ]; then
      echo "[entrypoint] /data owned by uid $DATA_OWNER, fixing to minio (uid 1000)"
      chown -R minio:minio /data
    fi
  fi
  exec su-exec minio:minio /usr/bin/minio "$@"
fi

# Already running as a non-root user (e.g. compose `user:` override)
exec /usr/bin/minio "$@"
