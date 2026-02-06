#!/bin/bash

# ==========================================
# SIMRS ZEN - Rollback Script
# Rollback to previous database backup
# ==========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

DEPLOY_DIR="/opt/simrs-zen"
BACKUP_DIR="$DEPLOY_DIR/backups"

# Header
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              SIMRS ZEN - Database Rollback               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

cd $DEPLOY_DIR || exit 1

# List available backups
echo -e "${YELLOW}Available backups:${NC}"
echo ""
ls -lh $BACKUP_DIR/*.sql.gz 2>/dev/null || { echo "No backups found!"; exit 1; }
echo ""

# Get user input
read -p "Enter backup filename (e.g., backup_20240115_020000.sql.gz): " BACKUP_FILE

FULL_PATH="$BACKUP_DIR/$BACKUP_FILE"

if [ ! -f "$FULL_PATH" ]; then
    echo -e "${RED}Error: Backup file not found: $FULL_PATH${NC}"
    exit 1
fi

# Confirmation
echo ""
echo -e "${YELLOW}WARNING: This will restore the database from:${NC}"
echo "  $FULL_PATH"
echo ""
echo -e "${RED}ALL CURRENT DATA WILL BE LOST!${NC}"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Rollback cancelled."
    exit 0
fi

# Create backup of current state before rollback
echo ""
echo -e "${GREEN}Creating backup of current state...${NC}"
DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec -T postgres pg_dump -U simrs_admin simrs_zen_production | gzip > "$BACKUP_DIR/pre_rollback_$DATE.sql.gz"

# Stop API to prevent writes
echo -e "${GREEN}Stopping API...${NC}"
docker compose stop api

# Restore database
echo -e "${GREEN}Restoring database from backup...${NC}"
gunzip -c "$FULL_PATH" | docker compose exec -T postgres psql -U simrs_admin -d simrs_zen_production

# Start API
echo -e "${GREEN}Starting API...${NC}"
docker compose start api

# Wait for health
echo -e "${GREEN}Waiting for API to be healthy...${NC}"
sleep 10

if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    echo ""
    echo -e "${GREEN}✓ Rollback completed successfully!${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}✗ API health check failed. Check logs: docker compose logs api${NC}"
    echo ""
fi
