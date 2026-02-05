#!/bin/bash

# ============================================
# SIMRS ZEN - Database Restore Script
# Restore PostgreSQL from backup
# ============================================

set -e

# Configuration
DB_NAME="${DB_NAME:-simrs_zen}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/database}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   SIMRS ZEN Database Restore${NC}"
echo -e "${GREEN}========================================${NC}"

# Check for backup file argument
BACKUP_FILE=${1:-"$BACKUP_DIR/latest.sql.gz"}

if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}Backup file not found: $BACKUP_FILE${NC}"
  echo ""
  echo "Usage: $0 [backup_file]"
  echo ""
  echo "Available backups:"
  ls -lh $BACKUP_DIR/*.sql.gz 2>/dev/null | tail -10
  exit 1
fi

echo -e "${YELLOW}Backup file: $BACKUP_FILE${NC}"
echo -e "${YELLOW}Target database: $DB_NAME${NC}"
echo ""

# Confirmation
read -p "This will OVERWRITE the database. Are you sure? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo -e "${YELLOW}Restore cancelled${NC}"
  exit 0
fi

# Check PostgreSQL connection
echo -e "${YELLOW}Checking database connection...${NC}"
if ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER > /dev/null 2>&1; then
  echo -e "${RED}Cannot connect to database${NC}"
  exit 1
fi

# Terminate existing connections
echo -e "${YELLOW}Terminating existing connections...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();
" 2>/dev/null

# Drop and recreate database
echo -e "${YELLOW}Recreating database...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null

# Restore from backup
echo -e "${YELLOW}Restoring database...${NC}"
if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c $BACKUP_FILE | PGPASSWORD=$DB_PASSWORD pg_restore \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    --no-owner \
    --no-privileges \
    --verbose \
    2>/dev/null
else
  PGPASSWORD=$DB_PASSWORD pg_restore \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    --no-owner \
    --no-privileges \
    --verbose \
    -f $BACKUP_FILE \
    2>/dev/null
fi

# Verify restore
echo -e "${YELLOW}Verifying restore...${NC}"
TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')

if [ "$TABLE_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓ Restore completed successfully${NC}"
  echo -e "${GREEN}  Tables restored: $TABLE_COUNT${NC}"
else
  echo -e "${RED}✗ Restore may have failed (no tables found)${NC}"
  exit 1
fi

# Run any pending migrations
echo -e "${YELLOW}Running pending migrations...${NC}"
cd /opt/simrs-zen
npx prisma migrate deploy 2>/dev/null || true

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Restore completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
