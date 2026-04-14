#!/bin/sh
set -e

echo "⏳ Running database migrations..."
node_modules/.bin/prisma migrate deploy

echo "🌱 Running database seed (first-run only)..."
node dist/scripts/seed.js || true

echo "🚀 Starting application..."
exec node dist/app.js
