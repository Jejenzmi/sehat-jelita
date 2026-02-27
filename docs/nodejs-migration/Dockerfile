# SIMRS ZEN - Node.js API Dockerfile
# Multi-stage build for optimized production image

# ==========================================
# Stage 1: Build
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install openssl required by Prisma on Alpine
RUN apk add --no-cache openssl

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# ==========================================
# Stage 2: Production
# ==========================================
FROM node:20-alpine AS production

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache curl openssl

# Create non-root user
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["node", "src/app.js"]
