#!/bin/sh
set -e

echo "⏳ Running database migrations..."
npx prisma migrate deploy

echo "🌱 Running database seed (first-run only)..."
node src/scripts/seed.js || true

echo "🚀 Starting application..."
exec node src/app.js
