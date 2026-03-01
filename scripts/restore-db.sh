#!/usr/bin/env bash
# ============================================================
# SIMRS ZEN - PostgreSQL Restore Script
# Restores a compressed backup produced by backup-db.sh.
#
# Required environment variables:
#   DATABASE_URL  – PostgreSQL connection string to restore into
#
# Usage:
#   ./restore-db.sh /var/backups/simrs-zen/simrs_zen_20240101_120000.sql.gz
# ============================================================

set -euo pipefail

DATABASE_URL="${DATABASE_URL:?DATABASE_URL must be set}"
BACKUP_FILE="${1:?Usage: $0 <backup-file.sql.gz>}"

if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "ERROR: Backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

echo "[$(date -Iseconds)] Starting restore from ${BACKUP_FILE}"

# Confirm before destructive operation
read -rp "WARNING: This will overwrite the target database. Continue? [y/N] " CONFIRM
if [[ "${CONFIRM}" != "y" && "${CONFIRM}" != "Y" ]]; then
  echo "Restore cancelled."
  exit 0
fi

# Decompress and pipe into psql
gunzip -c "${BACKUP_FILE}" | psql "${DATABASE_URL}"

echo "[$(date -Iseconds)] Restore complete."
