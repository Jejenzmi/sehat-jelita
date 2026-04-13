# Stage 1: deps + prisma generate
FROM node:20-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl libssl3 ca-certificates \
 && rm -rf /var/lib/apt/lists/*

ENV PRISMA_SKIP_ENGINE_CHECK=1

COPY package*.json ./
RUN npm ci

# Copy schema before generating so the correct binaryTargets are used,
# and so that schema changes bust only the prisma-generate layer (not all of src).
COPY prisma ./prisma
RUN npx prisma generate

COPY . .

# Stage 2: production runtime
FROM node:20-bookworm-slim AS production
WORKDIR /app

# Link this image to the source repository so that GITHUB_TOKEN can manage
# the GHCR package visibility (private → public) without needing a PAT.
LABEL org.opencontainers.image.source=https://github.com/Jejenzmi/sehat-jelita

RUN apt-get update && apt-get install -y --no-install-recommends openssl libssl3 ca-certificates curl \
 && rm -rf /var/lib/apt/lists/*

# optional non-root
RUN useradd -m nodejs

COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/entrypoint.sh ./entrypoint.sh

# Set execute permission as root before switching to non-root user
RUN chmod +x /app/entrypoint.sh

USER nodejs

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 CMD curl -f http://localhost:3000/health || exit 1
CMD ["/app/entrypoint.sh"]