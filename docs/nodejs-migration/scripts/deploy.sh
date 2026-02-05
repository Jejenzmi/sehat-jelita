#!/bin/bash

# ============================================
# SIMRS ZEN - Deployment Script
# Automated deployment for VPS/Cloud
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="simrs-zen"
APP_DIR="/opt/$APP_NAME"
BACKUP_DIR="/opt/backups/$APP_NAME"
LOG_DIR="/var/log/$APP_NAME"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   SIMRS ZEN Deployment Script${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root${NC}"
  exit 1
fi

# Parse arguments
ENVIRONMENT=${1:-production}
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"

# Create directories
echo -e "${YELLOW}Creating directories...${NC}"
mkdir -p $APP_DIR
mkdir -p $BACKUP_DIR
mkdir -p $LOG_DIR
mkdir -p $APP_DIR/uploads

# Backup current version
if [ -d "$APP_DIR/current" ]; then
  BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
  echo -e "${YELLOW}Backing up current version to $BACKUP_NAME...${NC}"
  cp -r $APP_DIR/current $BACKUP_DIR/$BACKUP_NAME
fi

# Pull latest code (if using git)
if [ -d "$APP_DIR/.git" ]; then
  echo -e "${YELLOW}Pulling latest code...${NC}"
  cd $APP_DIR
  git fetch origin
  git checkout main
  git pull origin main
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
cd $APP_DIR
npm ci --production

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
npx prisma migrate deploy

# Generate Prisma client
echo -e "${YELLOW}Generating Prisma client...${NC}"
npx prisma generate

# Build application (if needed)
# echo -e "${YELLOW}Building application...${NC}"
# npm run build

# Restart PM2 process
echo -e "${YELLOW}Restarting application...${NC}"
if pm2 describe $APP_NAME > /dev/null 2>&1; then
  pm2 reload $APP_NAME
else
  pm2 start src/app.js --name $APP_NAME \
    --instances 2 \
    --exec-mode cluster \
    --max-memory-restart 512M \
    --log $LOG_DIR/app.log \
    --error $LOG_DIR/error.log \
    --time
fi

# Save PM2 configuration
pm2 save

# Health check
echo -e "${YELLOW}Running health check...${NC}"
sleep 5
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)

if [ "$HEALTH_STATUS" == "200" ]; then
  echo -e "${GREEN}✓ Health check passed${NC}"
else
  echo -e "${RED}✗ Health check failed (HTTP $HEALTH_STATUS)${NC}"
  echo -e "${YELLOW}Rolling back...${NC}"
  
  # Rollback to previous version
  if [ -d "$BACKUP_DIR/$BACKUP_NAME" ]; then
    rm -rf $APP_DIR/current
    cp -r $BACKUP_DIR/$BACKUP_NAME $APP_DIR/current
    pm2 reload $APP_NAME
    echo -e "${RED}Rolled back to previous version${NC}"
  fi
  
  exit 1
fi

# Cleanup old backups (keep last 5)
echo -e "${YELLOW}Cleaning up old backups...${NC}"
cd $BACKUP_DIR
ls -t | tail -n +6 | xargs -r rm -rf

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Deployment completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"

# Show status
pm2 status $APP_NAME
