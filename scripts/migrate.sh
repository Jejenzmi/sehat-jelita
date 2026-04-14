#!/bin/bash
# SIMRS ZEN - Database Migration Script
# Usage: ./scripts/migrate.sh [action]
# Actions: generate, deploy, reset, seed

set -e

ACTION=${1:-"deploy"}
BACKEND_DIR="./backend"

echo "🗄️  SIMRS ZEN - Database Migration Tool"
echo "========================================="
echo ""

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Backend directory not found: $BACKEND_DIR"
    exit 1
fi

# Check if .env exists
if [ ! -f "$BACKEND_DIR/.env" ] && [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it first."
    exit 1
fi

cd "$BACKEND_DIR"

case $ACTION in
  generate)
    echo "📝 Generating new migration..."
    echo ""
    read -p "Enter migration name: " MIGRATION_NAME
    if [ -z "$MIGRATION_NAME" ]; then
        echo "❌ Migration name cannot be empty"
        exit 1
    fi
    npx prisma migrate dev --name "$MIGRATION_NAME"
    echo ""
    echo "✅ Migration generated successfully!"
    ;;
  
  deploy)
    echo "🚀 Deploying migrations..."
    echo ""
    npx prisma migrate deploy
    echo ""
    echo "✅ Migrations deployed successfully!"
    ;;
  
  reset)
    echo "⚠️  WARNING: This will reset the database and remove all data!"
    echo ""
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Database reset cancelled."
        exit 0
    fi
    echo ""
    npx prisma migrate reset --force
    echo ""
    echo "✅ Database reset successfully!"
    ;;
  
  seed)
    echo "🌱 Running database seed..."
    echo ""
    npm run db:seed || {
        echo "⚠️  Database seed failed or already seeded (this is normal for subsequent runs)"
    }
    echo ""
    echo "✅ Database seed completed!"
    ;;
  
  status)
    echo "📊 Migration status:"
    echo ""
    npx prisma migrate status
    ;;
  
  studio)
    echo "🔍 Opening Prisma Studio..."
    echo ""
    npx prisma studio
    ;;
  
  *)
    echo "❌ Unknown action: $ACTION"
    echo ""
    echo "Available actions:"
    echo "  generate  - Generate a new migration"
    echo "  deploy    - Deploy pending migrations"
    echo "  reset     - Reset database and run all migrations"
    echo "  seed      - Run database seed"
    echo "  status    - Show migration status"
    echo "  studio    - Open Prisma Studio"
    exit 1
    ;;
esac

echo ""
echo "📝 Useful commands:"
echo "  - View schema: cat prisma/schema.prisma"
echo "  - View migrations: ls prisma/migrations/"
echo "  - Database shell: psql -U simrs -d simrs_zen"
echo ""
