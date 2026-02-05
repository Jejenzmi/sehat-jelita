#!/bin/bash

# ============================================
# SIMRS ZEN - Database Backup Script
# Automated PostgreSQL backup with retention
# ============================================

set -e

# Configuration
DB_NAME="${DB_NAME:-simrs_zen}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/database}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
S3_BUCKET="${S3_BUCKET:-}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   SIMRS ZEN Database Backup${NC}"
echo -e "${GREEN}========================================${NC}"

# Create backup directory
mkdir -p $BACKUP_DIR

# Check PostgreSQL connection
echo -e "${YELLOW}Checking database connection...${NC}"
if ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER > /dev/null 2>&1; then
  echo -e "${RED}Cannot connect to database${NC}"
  exit 1
fi

# Create backup
echo -e "${YELLOW}Creating backup: $BACKUP_FILE${NC}"
PGPASSWORD=$DB_PASSWORD pg_dump \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  --format=custom \
  --no-owner \
  --no-privileges \
  --verbose \
  2>/dev/null | gzip > $BACKUP_FILE

# Verify backup
if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
  BACKUP_SIZE=$(du -h $BACKUP_FILE | cut -f1)
  echo -e "${GREEN}✓ Backup created successfully: $BACKUP_SIZE${NC}"
else
  echo -e "${RED}✗ Backup failed${NC}"
  exit 1
fi

# Upload to S3 if configured
if [ -n "$S3_BUCKET" ]; then
  echo -e "${YELLOW}Uploading to S3: s3://$S3_BUCKET/${NC}"
  aws s3 cp $BACKUP_FILE s3://$S3_BUCKET/database/
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Uploaded to S3${NC}"
  else
    echo -e "${RED}✗ S3 upload failed${NC}"
  fi
fi

# Cleanup old backups
echo -e "${YELLOW}Cleaning up backups older than $RETENTION_DAYS days...${NC}"
find $BACKUP_DIR -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null

# List recent backups
echo -e "${YELLOW}Recent backups:${NC}"
ls -lh $BACKUP_DIR/*.sql.gz 2>/dev/null | tail -5

# Create symlink to latest backup
ln -sf $BACKUP_FILE $BACKUP_DIR/latest.sql.gz

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Backup completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"

# Output for cron logging
echo "$(date): Backup completed - $BACKUP_FILE ($BACKUP_SIZE)"
