#!/bin/bash

# ==========================================
# SIMRS ZEN - Production Deployment Script
# ==========================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_DIR="/opt/simrs-zen"
BACKUP_DIR="$DEPLOY_DIR/backups"
LOG_FILE="/var/log/simrs-deploy.log"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
    exit 1
}

# Header
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║           SIMRS ZEN - Production Deployment              ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check if running as correct user
if [ "$EUID" -eq 0 ]; then
    warn "Running as root. Consider using a non-root user."
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    error "Docker is not installed. Please install Docker first."
fi

if ! command -v docker compose &> /dev/null; then
    error "Docker Compose is not installed. Please install Docker Compose first."
fi

# Navigate to deploy directory
cd $DEPLOY_DIR || error "Deployment directory not found: $DEPLOY_DIR"

log "Starting deployment..."

# ==========================================
# Step 1: Pull latest code
# ==========================================
log "Step 1: Pulling latest code..."

if [ -d ".git" ]; then
    git fetch origin main
    git reset --hard origin/main
    log "Code updated from repository"
else
    warn "Not a git repository. Skipping git pull."
fi

# ==========================================
# Step 2: Check environment file
# ==========================================
log "Step 2: Checking environment configuration..."

if [ ! -f ".env" ]; then
    error ".env file not found. Please create it from .env.example"
fi

# Validate required environment variables
REQUIRED_VARS=("DB_PASSWORD" "JWT_SECRET" "FRONTEND_URL")
for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^$var=" .env; then
        error "Required environment variable $var is not set in .env"
    fi
done

log "Environment configuration validated"

# ==========================================
# Step 3: Create backup
# ==========================================
log "Step 3: Creating database backup..."

mkdir -p $BACKUP_DIR

if docker compose ps postgres | grep -q "Up"; then
    DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/pre_deploy_$DATE.sql.gz"
    
    docker compose exec -T postgres pg_dump -U simrs_admin simrs_zen_production | gzip > $BACKUP_FILE
    log "Backup created: $BACKUP_FILE"
else
    warn "Database container not running. Skipping backup."
fi

# ==========================================
# Step 4: Build new images
# ==========================================
log "Step 4: Building new Docker images..."

docker compose -f docker-compose.production.yml build --no-cache api

log "Docker images built successfully"

# ==========================================
# Step 5: Stop current containers
# ==========================================
log "Step 5: Stopping current containers..."

docker compose -f docker-compose.production.yml down --remove-orphans

log "Containers stopped"

# ==========================================
# Step 6: Start new containers
# ==========================================
log "Step 6: Starting new containers..."

docker compose -f docker-compose.production.yml up -d

log "Containers started"

# ==========================================
# Step 7: Wait for services to be healthy
# ==========================================
log "Step 7: Waiting for services to be healthy..."

MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        log "API is healthy!"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    error "API failed to become healthy. Check logs with: docker compose logs api"
fi

# ==========================================
# Step 8: Run database migrations
# ==========================================
log "Step 8: Running database migrations..."

docker compose -f docker-compose.production.yml exec -T api npx prisma migrate deploy

log "Database migrations completed"

# ==========================================
# Step 9: Cleanup
# ==========================================
log "Step 9: Cleaning up old Docker resources..."

docker image prune -f
docker volume prune -f

# Keep only last 5 backups
cd $BACKUP_DIR
ls -t *.sql.gz 2>/dev/null | tail -n +6 | xargs -r rm --

log "Cleanup completed"

# ==========================================
# Final Status
# ==========================================
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              Deployment Completed Successfully!           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

log "Deployment completed at $(date)"

# Show container status
echo ""
echo -e "${BLUE}Container Status:${NC}"
docker compose -f docker-compose.production.yml ps

echo ""
echo -e "${GREEN}API Health Check:${NC}"
curl -s http://localhost:3000/health | jq . 2>/dev/null || curl -s http://localhost:3000/health

echo ""
log "All services are running!"
