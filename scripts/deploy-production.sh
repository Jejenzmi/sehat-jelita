#!/bin/bash

# Production deployment script
echo "Starting production deployment..."

# Pull the latest changes from the repository
git pull origin main

# Build the application
npm install
npm run build

# Restart the server
pm start

echo "Production deployment completed successfully."