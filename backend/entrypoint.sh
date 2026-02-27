#!/bin/sh
set -e

echo "⏳ Syncing database schema with Prisma..."
npx prisma db push --skip-generate

echo "🌱 Running database seed..."
node src/scripts/seed.js

echo "🚀 Starting application..."
exec node src/app.js
