#!/usr/bin/env bash
# ============================================================
# SIMRS ZEN - PostgreSQL Backup Script
# Creates a compressed pg_dump and prunes backups older than
# RETENTION_DAYS (default: 30).
#
# Required environment variables (or pass as positional args):
#   DATABASE_URL  – PostgreSQL connection string
#   BACKUP_DIR    – Directory to store backup files (default: /var/backups/simrs-zen)
#   RETENTION_DAYS – Number of days to retain backups (default: 30)
#
# Usage:
#   ./backup-db.sh
#   DATABASE_URL=postgresql://... ./backup-db.sh
# ============================================================

set -euo pipefail

DATABASE_URL="${DATABASE_URL:?DATABASE_URL must be set}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/simrs-zen}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/simrs_zen_${TIMESTAMP}.sql.gz"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

echo "[$(date -Iseconds)] Starting backup → ${BACKUP_FILE}"

# Perform dump and compress in a single pipeline
pg_dump "${DATABASE_URL}" \
  --no-owner \
  --no-acl \
  --format=plain \
  | gzip -9 > "${BACKUP_FILE}"

BACKUP_SIZE="$(du -sh "${BACKUP_FILE}" | cut -f1)"
echo "[$(date -Iseconds)] Backup complete – size: ${BACKUP_SIZE}"

# Prune old backups
echo "[$(date -Iseconds)] Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name 'simrs_zen_*.sql.gz' -mtime +"${RETENTION_DAYS}" -print -delete

echo "[$(date -Iseconds)] Done."
