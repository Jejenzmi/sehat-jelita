#!/bin/bash
# SIMRS ZEN - Database Migration & Deployment Script
# Usage: ./scripts/deploy.sh [environment]
# Environments: development, production

set -e

ENVIRONMENT=${1:-"development"}
COMPOSE_FILE=""

echo "🚀 SIMRS ZEN - Deployment Script"
echo "================================="
echo ""
echo "📋 Environment: $ENVIRONMENT"
echo ""

# Determine compose file based on environment
case $ENVIRONMENT in
  production)
    COMPOSE_FILE="docker-compose.production.yml"
    ;;
  development)
    COMPOSE_FILE="docker-compose.yml"
    ;;
  *)
    echo "❌ Unknown environment: $ENVIRONMENT"
    echo "   Valid environments: development, production"
    exit 1
    ;;
esac

echo "📁 Docker Compose File: $COMPOSE_FILE"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Docker Compose file not found: $COMPOSE_FILE"
    exit 1
fi

# Check if .env.production exists for production
if [ "$ENVIRONMENT" = "production" ] && [ ! -f ".env.production" ]; then
    echo "❌ .env.production not found. Please create it first."
    echo "   Copy from .env.production.example and fill in your values:"
    echo "   cp .env.production.example .env.production"
    exit 1
fi

echo "🔧 Step 1: Building Docker images..."
echo ""
docker compose -f "$COMPOSE_FILE" build --no-cache

echo ""
echo "🗄️  Step 2: Running database migrations..."
echo ""
docker compose -f "$COMPOSE_FILE" run --rm api npx prisma migrate deploy || {
    echo "❌ Database migration failed!"
    exit 1
}

echo ""
echo "🌱 Step 3: Running database seed (first-run only)..."
echo ""
docker compose -f "$COMPOSE_FILE" run --rm api npm run db:seed || {
    echo "⚠️  Database seed failed or already seeded (this is normal for subsequent runs)"
}

echo ""
echo "🚀 Step 4: Starting all services..."
echo ""
docker compose -f "$COMPOSE_FILE" up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo ""
echo "🏥 Step 5: Checking service health..."
echo ""
docker compose -f "$COMPOSE_FILE" ps

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Service URLs:"
if [ "$ENVIRONMENT" = "production" ]; then
    echo "   - Frontend: https://localhost"
    echo "   - Backend API: https://localhost/api"
else
    echo "   - Frontend: http://localhost:8080"
    echo "   - Backend API: http://localhost:3000"
fi
echo ""
echo "📝 Useful commands:"
echo "   - View logs: docker compose -f $COMPOSE_FILE logs -f"
echo "   - Stop services: docker compose -f $COMPOSE_FILE down"
echo "   - Restart services: docker compose -f $COMPOSE_FILE restart"
echo "   - Run migrations: docker compose -f $COMPOSE_FILE run --rm api npx prisma migrate deploy"
echo "   - Database shell: docker compose -f $COMPOSE_FILE exec postgres psql -U simrs -d simrs_zen"
echo ""
